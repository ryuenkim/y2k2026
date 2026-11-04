const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const { createReceiptPdf, createOrderEmailMessage, createOrderEmailHtml } = require('../utils/orderReceipt');
const { ORDER_STATUSES, TRANSACTION_STATUSES, isValidStatusTransition } = require('../utils/orderLifecycle');
const { isValidIdempotencyKey, createOrderFingerprint } = require('../utils/orderIdempotency');

const restoreReservedStock = async (order, session) => {
    if (!order.stockReserved || order.stockRestoredAt) return false;
    for (const item of order.orderItems) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
    }
    order.stockRestoredAt = new Date();
    return true;
};

const reserveStock = async (items, session) => {
    for (const item of items) {
        const product = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true, session }
        );
        if (!product) throw new Error(`Insufficient stock for ${item.name}`);
    }
    return true;
};

const emailOrderReceipt = async (order, statusUpdate = false) => {
    try {
        const user = await User.findById(order.user).select('email name');
        if (!user?.email) {
            console.warn(`Receipt email skipped for order ${order._id}: customer has no email address`);
            return false;
        }
        const pdf = createReceiptPdf(order);
        await sendEmail({
            email: user.email,
            subject: `Y2K Tech Shop order ${statusUpdate ? 'update' : 'confirmation'} ${order._id}`,
            message: createOrderEmailMessage(order, user.name, statusUpdate),
            html: createOrderEmailHtml(order, user.name, statusUpdate),
            attachments: [{ filename: `y2k-receipt-${order._id}.pdf`, content: pdf, contentType: 'application/pdf' }]
        });
        await Order.updateOne({ _id: order._id }, { $set: { receiptEmailSentAt: new Date() } });
        return true;
    } catch (error) {
        console.error(`Receipt email failed for order ${order._id}:`, error.message);
        return false;
    }
};

exports.newOrder = async (req, res) => {
    const { orderItems, shippingInfo, paymentMethod, idempotencyKey } = req.body;
    if (!isValidIdempotencyKey(idempotencyKey)) {
        return res.status(400).json({ success: false, message: 'A valid checkout request key is required. Refresh checkout and try again.' });
    }
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }
    if (!['COD', 'ONLINE'].includes(paymentMethod)) {
        return res.status(400).json({ success: false, message: 'Choose Cash on Delivery or Online payment' });
    }

    const idempotencyFingerprint = createOrderFingerprint({ orderItems, shippingInfo, paymentMethod });
    const existingOrder = await Order.findOne({ user: req.user._id, idempotencyKey });
    if (existingOrder) {
        if (existingOrder.idempotencyFingerprint !== idempotencyFingerprint) {
            return res.status(409).json({ success: false, message: 'A previous order is associated with this checkout request. Check your order history before placing another order.' });
        }
        return res.status(200).json({ success: true, order: existingOrder, receiptEmailSent: Boolean(existingOrder.receiptEmailSentAt), idempotentReplay: true });
    }

    const productIds = orderItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const byId = new Map(products.map((product) => [String(product._id), product]));
    const requestedQuantities = new Map();
    for (const item of orderItems) {
        const quantity = Number(item.quantity);
        const product = byId.get(String(item.product));
        if (!product || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: `Invalid quantity for ${byId.get(String(item.product))?.name || 'product'}` });
        }
        if (!Number.isFinite(Number(item.price))) {
            return res.status(400).json({ success: false, message: `Refresh the price for ${product.name} and review your order again` });
        }
        if (Number(item.price) !== Number(product.price)) {
            return res.status(409).json({
                success: false,
                code: 'PRICE_CHANGED',
                message: `${product.name}'s price changed. Review the current price before placing your order.`,
                currentProduct: { id: String(product._id), name: product.name, price: product.price, stock: product.stock }
            });
        }
        if (!Number.isFinite(product.price) || product.price < 0 || !Number.isInteger(product.stock) || product.stock < 0) {
            return res.status(400).json({ success: false, message: `${product.name} has invalid price or stock data` });
        }
        requestedQuantities.set(String(item.product), (requestedQuantities.get(String(item.product)) || 0) + quantity);
    }
    for (const [productId, quantity] of requestedQuantities) {
        if (quantity > byId.get(productId).stock) {
            return res.status(400).json({ success: false, message: `Insufficient stock for ${byId.get(productId).name}` });
        }
    }

    const verifiedItems = orderItems.map((item) => {
        const product = byId.get(String(item.product));
        return {
            product: product._id,
            name: product.name,
            image: product.images[0]?.url || '',
            images: (product.images || []).map((image) => image.url).filter(Boolean),
            price: product.price,
            quantity: Number(item.quantity)
        };
    });
    const itemsPrice = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingPrice = itemsPrice > 200 ? 0 : 25;
    const taxPrice = Number((itemsPrice * 0.05).toFixed(2));
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));
    const isPaid = paymentMethod === 'ONLINE';
    const orderData = {
        orderItems: verifiedItems,
        shippingInfo,
        paymentInfo: {
            id: `${paymentMethod}-${Date.now()}`,
            status: isPaid ? 'paid' : 'pending',
            provider: paymentMethod === 'COD' ? 'cash-on-delivery' : 'online',
            label: paymentMethod === 'COD' ? 'Payment due on delivery' : 'Paid online'
        },
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        transactionStatus: isPaid ? 'paid' : 'pending',
        ...(isPaid ? { paidAt: new Date() } : {}),
        orderStatus: 'Pending',
        stockReserved: false,
        idempotencyKey,
        idempotencyFingerprint,
        user: req.user._id
    };
    const session = await mongoose.startSession();
    let order;
    try {
        await session.withTransaction(async () => {
            [order] = await Order.create([orderData], { session });
        });
        const receiptEmailSent = await emailOrderReceipt(order);
        return res.status(201).json({ success: true, order, receiptEmailSent });
    } catch (error) {
        if (error.code === 11000) {
            const replayedOrder = await Order.findOne({ user: req.user._id, idempotencyKey });
            if (replayedOrder) {
                if (replayedOrder.idempotencyFingerprint !== idempotencyFingerprint) {
                    return res.status(409).json({ success: false, message: 'A previous order is associated with this checkout request. Check your order history before placing another order.' });
                }
                return res.status(200).json({ success: true, order: replayedOrder, receiptEmailSent: Boolean(replayedOrder.receiptEmailSentAt), idempotentReplay: true });
            }
        }
        return res.status(400).json({ success: false, message: error.message || 'Unable to place order' });
    } finally {
        await session.endSession();
    }
};

exports.myOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
};

exports.getSingleOrder = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, order });
};

exports.downloadOrderReceipt = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const pdf = createReceiptPdf(order);
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="y2k-receipt-${order._id}.pdf"`,
        'Content-Length': pdf.length
    });
    return res.send(pdf);
};

exports.resendOrderReceipt = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const recipient = await User.findById(order.user).select('email');
    if (!recipient?.email) {
        return res.status(422).json({ success: false, message: 'Add an email address to your profile before requesting a receipt email.' });
    }
    const receiptEmailSent = await emailOrderReceipt(order);
    if (!receiptEmailSent) return res.status(503).json({ success: false, message: 'Receipt email could not be sent. Please try again later.' });
    return res.status(200).json({ success: true, message: 'Receipt email sent' });
};

exports.cancelMyOrder = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        let order;
        await session.withTransaction(async () => {
            order = await Order.findOne({ _id: req.params.id, user: req.user._id }).session(session);
            if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
            if (!['Pending', 'Processing', 'Shipped'].includes(order.orderStatus)) throw Object.assign(new Error('Customers can cancel orders only before delivery'), { statusCode: 400 });
            order.orderStatus = 'Cancelled';
            order.cancelledAt = new Date();
            order.cancellationReason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : 'Cancelled by customer';
            await restoreReservedStock(order, session);
            await order.save({ session });
        });
        return res.status(200).json({ success: true, order });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    } finally {
        await session.endSession();
    }
};

exports.allOrders = async (req, res) => {
    const orders = await Order.find().populate('user', 'name email avatar').sort({ createdAt: -1 });
    const totalAmount = orders.reduce((total, order) => total + order.totalPrice, 0);
    res.status(200).json({ success: true, totalAmount, orders });
};

exports.updateOrder = async (req, res) => {
    const { status, transactionStatus } = req.body;
    if (status && !ORDER_STATUSES.includes(status)) return res.status(400).json({ success: false, message: 'Invalid order status' });
    if (transactionStatus && !TRANSACTION_STATUSES.includes(transactionStatus)) return res.status(400).json({ success: false, message: 'Invalid transaction status' });
    const session = await mongoose.startSession();
    let orderStatusChanged = false;
    let transactionStatusChanged = false;
    try {
        let order;
        await session.withTransaction(async () => {
            order = await Order.findById(req.params.id).session(session);
            if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
            const previousOrderStatus = order.orderStatus;
            const previousTransactionStatus = order.transactionStatus;
            order.paymentInfo = order.paymentInfo || {};
            if (status && status !== order.orderStatus && !isValidStatusTransition(order.orderStatus, status)) {
                throw Object.assign(new Error(`Cannot change order status from ${order.orderStatus} to ${status}`), { statusCode: 400 });
            }
            const nextOrderStatus = status || order.orderStatus;
            if (order.paymentMethod === 'COD' && transactionStatus === 'paid' && nextOrderStatus !== 'Delivered') {
                throw Object.assign(new Error('COD payment can only be marked paid when the order is delivered'), { statusCode: 400 });
            }
            if (transactionStatus && transactionStatus !== order.transactionStatus) {
                if (order.transactionStatus === 'paid') throw Object.assign(new Error('Paid transactions cannot change payment status'), { statusCode: 400 });
                if (transactionStatus !== 'paid') throw Object.assign(new Error('Payment can only advance from pending to paid'), { statusCode: 400 });
                if (order.paymentMethod !== 'COD' || nextOrderStatus !== 'Delivered') {
                    throw Object.assign(new Error('COD payment can only be marked paid when the order is delivered'), { statusCode: 400 });
                }
            }
            if (order.orderStatus === 'Cancelled' && (status || transactionStatus)) {
                throw Object.assign(new Error('Cancelled orders cannot change status or payment'), { statusCode: 400 });
            }
            if (status === 'Cancelled') {
                if (order.orderStatus === 'Delivered') throw Object.assign(new Error('Delivered orders cannot be cancelled'), { statusCode: 400 });
                await restoreReservedStock(order, session);
                order.orderStatus = 'Cancelled';
                order.cancelledAt = order.cancelledAt || new Date();
                order.cancellationReason = String(req.body.reason || 'Cancelled by administrator').slice(0, 500);
            }
            if (status && status !== 'Cancelled') {
                if (status === 'Processing' && !order.stockReserved) {
                    await reserveStock(order.orderItems, session);
                    order.stockReserved = true;
                }
                order.orderStatus = status;
                if (status === 'Delivered') {
                    order.deliveredAt = new Date();
                    if (order.paymentMethod === 'COD' && order.transactionStatus === 'pending') {
                        order.transactionStatus = 'paid';
                        order.paymentInfo.status = 'paid';
                        order.paidAt = new Date();
                    }
                }
            }
            if (transactionStatus && transactionStatus !== order.transactionStatus) {
                order.transactionStatus = transactionStatus;
                order.paymentInfo.status = transactionStatus;
                if (transactionStatus === 'paid') order.paidAt = order.paidAt || new Date();
            }
            await order.save({ session });
            orderStatusChanged = order.orderStatus !== previousOrderStatus;
            transactionStatusChanged = order.transactionStatus !== previousTransactionStatus;
        });
        const shouldEmailUpdate = orderStatusChanged || transactionStatusChanged;
        const receiptEmailSent = shouldEmailUpdate ? await emailOrderReceipt(order, true) : undefined;
        return res.status(200).json({ success: true, order, ...(receiptEmailSent !== undefined ? { receiptEmailSent } : {}) });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    } finally {
        await session.endSession();
    }
};

exports.salesAnalytics = async (req, res) => {
    const from = req.query.from ? new Date(`${req.query.from}T00:00:00.000Z`) : new Date(Date.now() - 30 * 86400000);
    const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : new Date();
    const orders = await Order.find({
        createdAt: { $gte: from, $lte: to },
        transactionStatus: 'paid',
        orderStatus: { $ne: 'Cancelled' }
    }).select('createdAt totalPrice');
    const totals = new Map();
    orders.forEach((order) => {
        const date = order.createdAt.toISOString().slice(0, 10);
        totals.set(date, (totals.get(date) || 0) + order.totalPrice);
    });
    const sales = [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total: Number(total.toFixed(2)) }));
    res.status(200).json({ success: true, sales, totalSales: Number(orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)), orderCount: orders.length });
};

exports.deleteOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Delivered') {
        return res.status(400).json({ success: false, message: 'Cancel or deliver an order before deleting it' });
    }
    await order.deleteOne();
    res.status(200).json({ success: true });
};
