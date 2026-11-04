const getOrderPaymentDescription = (order) => {
    const status = order.transactionStatus || order.paymentInfo?.status || 'pending';

    if (order.orderStatus === 'Cancelled') return status === 'paid' ? 'Paid' : 'Cancelled; no payment is due';
    if (order.paymentMethod === 'COD' && status === 'pending') return 'Payment due on delivery';
    if (order.paymentMethod === 'COD' && status === 'paid') return 'Paid on delivery';
    if (status === 'paid') return 'Paid';
    return 'Payment pending';
};

module.exports = getOrderPaymentDescription;
