import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useDialog } from './dialogContext';

const OrderSuccess = ({ order, receiptEmailSent }) => {
    const navigate = useNavigate();
    const { notify } = useDialog();
    const [emailSent, setEmailSent] = useState(receiptEmailSent);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const downloadReceipt = async () => {
        setBusy(true);
        setError('');
        try {
            const { data } = await api.get(`/order/${order._id}/receipt`, { responseType: 'blob' });
            const url = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `y2k-receipt-${order._id}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            setError('Unable to download the PDF receipt. You can find it in your order details.');
            notify('Unable to download the PDF receipt.', 'error');
        } finally {
            setBusy(false);
        }
    };

    const resendReceipt = async () => {
        setBusy(true);
        setError('');
        try {
            await api.post(`/order/${order._id}/receipt/email`);
            setEmailSent(true);
            notify('Receipt email sent.');
        } catch (requestError) {
            const message = requestError.response?.data?.message || 'Receipt email could not be sent.';
            setError(message);
            notify(message, 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="checkout-card order-success">
            <p className="eyebrow">ORDER CONFIRMED</p>
            <h1>Thanks for your order.</h1>
            <p>Order #{order?._id?.slice(-8)} is {order?.orderStatus || 'Pending'}.</p>
            <p>{order?.paymentMethod === 'COD'
                ? 'Cash on Delivery selected. Payment is due when your order arrives.'
                : 'Your online payment was recorded as paid.'}</p>
            <p>{emailSent ? 'A PDF receipt was sent to your account email.' : 'Receipt email is not available yet. You can retry sending it.'}</p>
            {error && <p className="error-state" role="alert">{error}</p>}
            <div className="checkout-actions receipt-actions">
                <button className="view-btn" type="button" onClick={downloadReceipt} disabled={busy}>Download PDF receipt</button>
                {!emailSent && <button className="text-btn" type="button" onClick={resendReceipt} disabled={busy}>Email receipt</button>}
                <button className="text-btn" type="button" onClick={() => navigate('/orders')}>View my orders</button>
            </div>
        </section>
    );
};

export default OrderSuccess;
