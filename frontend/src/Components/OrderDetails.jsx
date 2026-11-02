import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderDetails } from '../actions/detailActions';
import api from '../api';
import { useDialog } from './dialogContext';
import { getPaymentStatusLabel } from '../utils/paymentStatus';

const OrderDetails = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { order, error, loading } = useSelector((state) => state.orderDetails);
    const [receiptError, setReceiptError] = useState('');
    const [downloading, setDownloading] = useState(false);
    const { notify } = useDialog();

    useEffect(() => {
        dispatch(fetchOrderDetails(id)).catch(() => {});
    }, [dispatch, id]);

    if (error) return <main className="page-container"><p className="error-state" role="alert">{error}</p><Link className="view-btn" to="/orders">Back to orders</Link></main>;
    if (loading || !order) return <p className="loading-state">Loading order...</p>;

    const downloadReceipt = async () => {
        setDownloading(true);
        setReceiptError('');
        try {
            const { data } = await api.get(`/order/${order._id}/receipt`, { responseType: 'blob' });
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `y2k-receipt-${order._id}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            notify('Receipt downloaded.');
        } catch (requestError) {
            const message = requestError.response?.data?.message || 'Unable to download receipt.';
            setReceiptError(message);
            notify(message, 'error');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <main className="page-container">
            <Link className="back-link" to="/orders">← Back to orders</Link>
            <h1>Order #{order._id.slice(-8)}</h1>
            <p className="order-status">{order.orderStatus} · {getPaymentStatusLabel(order)}</p>
            <p className="admin-message">{order.paymentInfo?.label || 'Test payment only'}</p>
            <button className="view-btn" type="button" onClick={downloadReceipt} disabled={downloading}>{downloading ? 'Preparing receipt...' : 'Download PDF receipt'}</button>
            {receiptError && <p className="error-state" role="alert">{receiptError}</p>}
            <section className="order-card">
                <h2>Items</h2>
                {order.orderItems.map((item) => (
                    <div className="order-detail-item" key={item.product}>
                        <div className="order-item-gallery">{(item.images?.length ? item.images : [item.image]).filter(Boolean).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${item.name} ${index + 1}`} />)}</div>
                        <div className="order-item-description"><strong>{item.name}</strong><small>Qty {item.quantity} · ₱{Number(item.price).toFixed(2)} each</small></div>
                        <strong>₱{(item.price * item.quantity).toFixed(2)}</strong>
                    </div>
                ))}
                <div className="order-history-totals">
                    <span>Subtotal <strong>₱{Number(order.itemsPrice).toFixed(2)}</strong></span>
                    <span>Shipping <strong>₱{Number(order.shippingPrice).toFixed(2)}</strong></span>
                    <span>Tax <strong>₱{Number(order.taxPrice).toFixed(2)}</strong></span>
                    <span className="order-grand-total">Grand total <strong>₱{Number(order.totalPrice).toFixed(2)}</strong></span>
                </div>
            </section>
            <section className="order-card">
                <h2>Shipping information</h2>
                <p>{order.shippingInfo.address}, {order.shippingInfo.city}, {order.shippingInfo.postalCode}, {order.shippingInfo.country}</p>
                <p>{order.shippingInfo.phoneNo}</p>
            </section>
        </main>
    );
};

export default OrderDetails;
