import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as yup from 'yup';
import { createOrder } from '../actions/detailActions';
import api from '../api';
import CheckoutSteps from './CheckoutSteps';
import Shipping from './Shipping';
import ConfirmOrder from './ConfirmOrder';
import Payment from './Payment';
import OrderSuccess from './OrderSuccess';
import { useDialog } from './dialogContext';

const shippingSchema = yup.object({
    address: yup.string().trim().min(5, 'Enter a complete street address').required('Street address is required'),
    city: yup.string().trim().min(2, 'Enter a valid city').required('City is required'),
    phoneNo: yup.string().trim().required('Phone number is required').test(
        'phone-digits',
        'Enter a valid phone number with 10 to 13 digits',
        (value) => {
            const digits = (value || '').replace(/\D/g, '');
            return digits.length >= 10 && digits.length <= 13;
        }
    ),
    postalCode: yup.string().trim().matches(/^\d{4,10}$/, 'Enter a valid postal code').required('Postal code is required'),
    country: yup.string().trim().required('Country is required')
});

const getCheckoutIdempotencyKey = () => {
    try {
        const existingKey = sessionStorage.getItem('y2k-checkout-idempotency-key');
        if (existingKey) return existingKey;
    } catch {
        // Continue with an in-memory key when browser storage is unavailable.
    }
    const key = globalThis.crypto.randomUUID();
    try {
        sessionStorage.setItem('y2k-checkout-idempotency-key', key);
    } catch {
        // The current checkout can still safely retry while this page remains open.
    }
    return key;
};

const Checkout = ({ items, user, clearCart }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { notify } = useDialog();
    const [step, setStep] = useState(1);
    const [shippingInfo, setShippingInfo] = useState({ address: '', city: '', phoneNo: '', postalCode: '', country: 'Philippines' });
    const [shippingErrors, setShippingErrors] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const submitLock = useRef(false);
    const [currentItems, setCurrentItems] = useState([]);
    const [inventoryCheck, setInventoryCheck] = useState({ checking: true, blocking: true, needsReview: false, message: 'Checking current prices and stock…' });
    const [createdOrder, setCreatedOrder] = useState(null);
    const [receiptEmailSent, setReceiptEmailSent] = useState(false);
    const orderError = useSelector((state) => state.newOrder.error);
    const buyNowItems = location.state?.buyNowItems;
    const selectedCartItems = location.state?.checkoutItems;
    const checkoutItems = Array.isArray(buyNowItems) && buyNowItems.length
        ? buyNowItems
        : Array.isArray(selectedCartItems) ? selectedCartItems : items;
    const isBuyNow = Array.isArray(buyNowItems) && buyNowItems.length > 0;
    const isCartSelection = location.state?.checkoutSource === 'cart' && Array.isArray(selectedCartItems);
    const idempotencyKey = useRef(getCheckoutIdempotencyKey());

    const checkCurrentProducts = async (itemsToCheck) => {
        setInventoryCheck({ checking: true, blocking: true, needsReview: false, message: 'Checking current prices and stock…' });
        const checks = await Promise.all(itemsToCheck.map(async (item) => {
            try {
                const { data } = await api.get(`/product/${item.product}`);
                const product = data.product;
                const updated = {
                    ...item,
                    name: product.name,
                    price: Number(product.price),
                    image: product.images?.[0]?.url || item.image || '',
                    stock: Number(product.stock)
                };
                const changed = updated.name !== item.name
                    || updated.price !== Number(item.price)
                    || updated.stock !== Number(item.stock)
                    || updated.image !== (item.image || '');
                return {
                    item: updated,
                    changed,
                    unavailable: updated.stock < item.quantity,
                    message: updated.stock < item.quantity
                        ? `${product.name} has only ${updated.stock} in stock; your requested quantity is ${item.quantity}.`
                        : changed ? `${product.name} details changed. Review the current price and stock before continuing.` : ''
                };
            } catch (requestError) {
                const unavailable = requestError.response?.status === 404;
                return {
                    item,
                    changed: false,
                    unavailable: true,
                    message: unavailable
                        ? `${item.name} is no longer available. Remove it from your cart and try again.`
                        : `Could not verify ${item.name}. Check your connection and retry.`
                };
            }
        }));
        const updatedItems = checks.map((check) => check.item);
        const messages = [...new Set(checks.filter((check) => check.message).map((check) => check.message))];
        const changed = checks.some((check) => check.changed);
        const blocking = checks.some((check) => check.unavailable);
        setCurrentItems(updatedItems);
        setInventoryCheck({
            checking: false,
            blocking,
            needsReview: changed,
            message: messages.join(' ')
        });
        return { changed, blocking, message: messages.join(' ') };
    };

    useEffect(() => {
        let active = true;
        const validateOnOpen = async () => {
            const result = await checkCurrentProducts(checkoutItems);
            if (!active) return;
            if (result.message) {
                setError(result.message);
            } else {
                setError('');
            }
        };
        validateOnOpen();
        return () => { active = false; };
    // Checkout selections are fixed for the lifetime of this checkout page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const itemsPrice = currentItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const prices = {
        itemsPrice,
        shippingPrice: itemsPrice > 200 ? 0 : 25,
        taxPrice: Number((itemsPrice * 0.05).toFixed(2)),
        totalPrice: 0
    };
    prices.totalPrice = prices.itemsPrice + prices.shippingPrice + prices.taxPrice;

    if (!user) {
        navigate('/login', { state: { from: '/checkout' } });
        return null;
    }
    if (!user.email) {
        navigate('/profile', { replace: true });
        return null;
    }
    if (!checkoutItems.length) return <main className="form-page"><h1>Your cart is empty</h1><button className="view-btn" onClick={() => navigate('/shop')}>Browse the shop</button></main>;
    if (step === 4) return <main className="checkout-page"><OrderSuccess order={createdOrder} receiptEmailSent={receiptEmailSent} /></main>;

    const submitOrder = async (event, payment) => {
        event.preventDefault();
        if (submitLock.current || submitting) return;
        submitLock.current = true;
        setSubmitting(true);
        setError('');
        try {
            const inventory = await checkCurrentProducts(currentItems);
            if (inventory.blocking || inventory.changed) {
                const message = inventory.message || 'Product details changed. Review your order before continuing.';
                setError(message);
                setStep(2);
                notify(message, 'info');
                return;
            }
            const result = await dispatch(createOrder({
                orderItems: currentItems.map(({ product, name, price, image, quantity }) => ({ product, name, price, image, quantity })),
                shippingInfo,
                paymentMethod: payment.paymentMethod,
                paymentSimulation: payment.paymentSimulation,
                idempotencyKey: idempotencyKey.current
            }));
            try {
                sessionStorage.removeItem('y2k-checkout-idempotency-key');
            } catch {
                // The key remains scoped to the current component if storage is unavailable.
            }
            setCreatedOrder(result.order);
            setReceiptEmailSent(Boolean(result.receiptEmailSent));
            if (isCartSelection) currentItems.forEach((item) => clearCart(item.product));
            else if (!isBuyNow) clearCart();
            notify(payment.paymentMethod === 'COD'
                ? 'COD order placed. Payment is due when it arrives.'
                : 'Simulated payment approved. Your order is confirmed.');
            setStep(4);
        } catch (requestError) {
            const message = requestError.response?.data?.message || orderError || 'Unable to place order';
            if (requestError.response?.data?.code === 'PRICE_CHANGED' || /insufficient stock/i.test(message)) {
                const inventory = await checkCurrentProducts(currentItems);
                setStep(2);
                setError(inventory.message || message);
            } else {
                setError(message);
            }
            notify(message, 'error');
        } finally {
            submitLock.current = false;
            setSubmitting(false);
        }
    };

    const continueShipping = async (event) => {
        event.preventDefault();
        setShippingErrors({});
        try {
            await shippingSchema.validate(shippingInfo, { abortEarly: false });
            setError('');
            setStep(2);
        } catch (validationError) {
            const fieldErrors = Object.fromEntries((validationError.inner || []).map((item) => [item.path, item.message]));
            setShippingErrors(fieldErrors);
            const firstError = Object.values(fieldErrors)[0] || 'Check your shipping information and try again.';
            setError(firstError);
            notify(firstError, 'error');
        }
    };

    return (
        <main className="checkout-page">
            <CheckoutSteps step={step} />
            {step === 1 && (
                <Shipping
                    shippingInfo={shippingInfo}
                    setShippingInfo={setShippingInfo}
                    fieldErrors={shippingErrors}
                    setFieldErrors={setShippingErrors}
                    error={error}
                    onNext={continueShipping}
                />
            )}
            {step === 2 && <ConfirmOrder items={currentItems} shippingInfo={shippingInfo} prices={prices} inventoryCheck={inventoryCheck} error={error} onBack={() => setStep(1)} onNext={() => {
                if (!inventoryCheck.blocking && !inventoryCheck.checking) {
                    setError('');
                    setInventoryCheck((current) => ({ ...current, needsReview: false, message: '' }));
                    setStep(3);
                }
            }} onReturnToCart={() => navigate('/cart')} onRetryInventory={() => checkCurrentProducts(currentItems)} />}
            {step === 3 && <Payment totalPrice={prices.totalPrice} onBack={() => setStep(2)} onSubmit={submitOrder} submitting={submitting} disabled={inventoryCheck.checking || inventoryCheck.blocking} error={error || inventoryCheck.message} />}
        </main>
    );
};

export default Checkout;
