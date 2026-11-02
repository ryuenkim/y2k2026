const express = require('express');
const router = express.Router();
const {
    newOrder,
    myOrders,
    getSingleOrder,
    allOrders,
    updateOrder,
    deleteOrder,
    salesAnalytics,
    cancelMyOrder,
    downloadOrderReceipt,
    resendOrderReceipt
} = require('../controllers/orderController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');

router.post('/order/new', isAuthenticatedUser, newOrder);
router.get('/orders/me', isAuthenticatedUser, myOrders);
router.post('/order/:id/cancel', isAuthenticatedUser, cancelMyOrder);
router.get('/order/:id', isAuthenticatedUser, getSingleOrder);
router.get('/order/:id/receipt', isAuthenticatedUser, downloadOrderReceipt);
router.post('/order/:id/receipt/email', isAuthenticatedUser, resendOrderReceipt);
router.get('/admin/orders', isAuthenticatedUser, authorizeRoles('admin'), allOrders);
router.get('/admin/analytics/sales', isAuthenticatedUser, authorizeRoles('admin'), salesAnalytics);
router.route('/admin/order/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateOrder)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteOrder);

module.exports = router;
