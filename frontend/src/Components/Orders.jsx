import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useDialog } from './dialogContext';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyOrders } from '../actions/orderActions';
import { getPaymentStatusLabel } from '../utils/paymentStatus';

const Orders = () => {
    const dispatch = useDispatch();
    const { orders, error, loading } = useSelector((state) => state.myOrders);
    const [actionId, setActionId] = useState('');
    const { confirm, notify } = useDialog();
    const cancelOrder = async (order) => {
        if (!await confirm('Cancel this order? Reserved stock will be restored if processing has started.', 'Cancel order?')) return;
        setActionId(order._id);
        try {
            await api.post(`/order/${order._id}/cancel`, { reason: 'Cancelled by customer' });
            notify('Your order was cancelled.', 'info');
            try {
                await dispatch(fetchMyOrders());
            } catch {
                notify('The order was cancelled, but the list could not be refreshed. Reload the page.', 'error');
            }
        } catch (requestError) {
            const message = requestError.response?.data?.message || 'Unable to cancel order';
            dispatch({ type: 'MY_ORDERS_FAIL', payload: message });
            notify(message, 'error');
        } finally {
            setActionId('');
        }
    };
    useEffect(() => {
        dispatch(fetchMyOrders()).catch(() => {});
    }, [dispatch]);
    return <main className="page-container"><p className="eyebrow">YOUR ACCOUNT</p><h1>My orders</h1>{loading && <p className="loading-state" role="status">Loading orders...</p>}{error && <p className="error-state" role="alert">{error}</p>}
        {orders.map((order) => <article className="order-card order-history-card" key={order._id}>
            <div className="order-history-heading"><div><p className="eyebrow">ORDER PLACED {new Date(order.createdAt).toLocaleDateString()}</p><h2>Order #{order._id.slice(-8)}</h2><p>{order.orderStatus} · {getPaymentStatusLabel(order)}</p>{order.paymentInfo?.label && <small>{order.paymentInfo.label}</small>}</div><Link to={`/orders/${order._id}`}>View order</Link></div>
            <div className="order-history-items">{order.orderItems?.map((item) => <div className="order-history-item" key={item.product}>
                <div className="order-item-gallery">{(item.images?.length ? item.images : [item.image]).filter(Boolean).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${item.name} ${index + 1}`} />)}</div>
                <div className="order-item-description"><strong>{item.name}</strong><small>Qty {item.quantity} · ₱{Number(item.price).toFixed(2)} each</small><small>Item total · ₱{(item.price * item.quantity).toFixed(2)}</small></div>
            </div>)}</div>
            <div className="order-history-totals"><span>Subtotal <strong>₱{Number(order.itemsPrice).toFixed(2)}</strong></span><span>Shipping <strong>₱{Number(order.shippingPrice).toFixed(2)}</strong></span><span>Tax <strong>₱{Number(order.taxPrice).toFixed(2)}</strong></span><span className="order-grand-total">Total <strong>₱{Number(order.totalPrice).toFixed(2)}</strong></span></div>
            {['Pending', 'Processing', 'Shipped'].includes(order.orderStatus) && <button className="danger-btn" type="button" disabled={actionId === order._id} onClick={() => cancelOrder(order)}>{actionId === order._id ? "Cancelling..." : "Cancel order"}</button>}
        </article>)}
        {!error && !loading && !orders.length && <section className="empty-state"><h2>No orders yet</h2><p>Your purchases will appear here with their status and receipt details.</p><Link className="view-btn" to="/shop">Browse products</Link></section>}
    </main>;
};

export default Orders;
