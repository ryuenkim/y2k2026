export const getPaymentStatusLabel = (order) => {
    const status = order.transactionStatus || order.paymentInfo?.status || 'pending';

    if (order.orderStatus === 'Cancelled') {
        if (status === 'refunded') return 'Refund status marked (simulation only; not confirmed)';
        if (status === 'voided') return 'Cancelled — no refund issued';
        return 'Cancelled — no payment due';
    }
    if (order.paymentMethod === 'COD' && status === 'pending') return 'Payment due on delivery';
    if (order.paymentMethod === 'COD' && status === 'paid') return 'Paid on delivery';
    if (status === 'paid' && order.paymentInfo?.provider === 'simulation') return 'Paid (simulation only)';
    if (status === 'paid') return 'Paid';
    if (status === 'refunded') return 'Refund status marked (simulation only; not confirmed)';
    if (status === 'failed') return 'Payment failed';
    return 'Payment pending';
};
