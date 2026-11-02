const hasDeliveredPurchase = (Order, userId, productId) => Order.exists({
    user: userId,
    orderStatus: 'Delivered',
    'orderItems.product': productId
});

module.exports = hasDeliveredPurchase;
