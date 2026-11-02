const getOrderPaymentDescription = (order) => {
    const status = order.transactionStatus || order.paymentInfo?.status || 'pending';

    if (order.orderStatus === 'Cancelled') {
        if (status === 'refunded') return 'Refund status marked (simulation only; no provider confirmation)';
        if (status === 'voided') return 'Cancelled; no refund was issued';
        return 'Cancelled; no payment is due';
    }
    if (order.paymentMethod === 'COD' && status === 'pending') return 'Payment due on delivery';
    if (order.paymentMethod === 'COD' && status === 'paid') return 'Paid on delivery';
    if (status === 'paid' && order.paymentInfo?.provider === 'simulation') return 'Paid (simulation only; no real payment processed)';
    if (status === 'paid') return 'Paid';
    if (status === 'refunded') return 'Refund status marked (simulation only; no provider confirmation)';
    if (status === 'failed') return 'Payment failed';
    return 'Payment pending';
};

module.exports = getOrderPaymentDescription;
