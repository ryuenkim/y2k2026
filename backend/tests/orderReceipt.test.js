const test = require('node:test');
const assert = require('node:assert/strict');
const { createOrderEmailMessage, createReceiptPdf } = require('../utils/orderReceipt');

const order = {
    _id: 'order-123',
    orderStatus: 'Shipped',
    transactionStatus: 'paid',
    paymentMethod: 'ONLINE',
    orderItems: [
        { name: 'Chrome Flip Phone', quantity: 2, price: 250 }
    ],
    itemsPrice: 500,
    shippingPrice: 25,
    taxPrice: 25,
    totalPrice: 550
};

test('order update emails include items, subtotal, and grand total', () => {
    const message = createOrderEmailMessage(order, 'Customer', true);
    assert.match(message, /Your order has been updated/);
    assert.match(message, /2 x Chrome Flip Phone @ PHP 250\.00 = PHP 500\.00/);
    assert.match(message, /Subtotal: PHP 500\.00/);
    assert.match(message, /Grand total: PHP 550\.00/);
});

test('order emails describe paid cancelled orders without simulation language', () => {
    const message = createOrderEmailMessage({
        ...order,
        orderStatus: 'Cancelled',
        transactionStatus: 'paid'
    }, 'Customer', true);

    assert.match(message, /Payment status: Paid/);
    assert.doesNotMatch(message, /simulation/i);
});

test('COD order email states that payment is due on delivery', () => {
    const message = createOrderEmailMessage({
        ...order,
        paymentMethod: 'COD',
        transactionStatus: 'pending'
    }, 'Customer');

    assert.match(message, /Payment status: Payment due on delivery/);
});

test('confirmation email and receipt include order status for COD and online orders', () => {
    for (const payment of [
        { paymentMethod: 'COD', transactionStatus: 'pending', expectedPayment: 'Payment due on delivery' },
        { paymentMethod: 'ONLINE', transactionStatus: 'paid', expectedPayment: 'Paid' }
    ]) {
        const orderWithPayment = {
            ...order,
            orderStatus: 'Processing',
            paymentInfo: { provider: 'online' },
            ...payment
        };
        const message = createOrderEmailMessage(orderWithPayment, 'Customer');
        const pdf = createReceiptPdf(orderWithPayment).toString('ascii');

        assert.match(message, /Order status: Processing/);
        assert.match(message, new RegExp(`Payment status: ${payment.expectedPayment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        assert.match(pdf, /\(ORDER STATUS  Processing\) Tj/);
        assert.match(pdf, /\(PURCHASE RECEIPT\) Tj/);
        assert.match(pdf, /\(GRAND TOTAL\) Tj/);
    }
});

test('order receipt is generated as a PDF attachment payload', () => {
    const receipt = createReceiptPdf(order);
    const pdf = receipt.toString('ascii');
    assert.equal(pdf.slice(0, 8), '%PDF-1.4');
    assert.match(pdf, /\(Subtotal\) Tj/);
    assert.match(pdf, /\(PHP 500\.00\) Tj/);
    assert.match(pdf, /\(PURCHASE RECEIPT\) Tj/);
    assert.match(pdf, /\(GRAND TOTAL\) Tj/);
    const xrefOffset = Number(pdf.match(/startxref\n(\d+)/)?.[1]);
    assert.equal(pdf.slice(xrefOffset, xrefOffset + 4), 'xref');
});

test('long receipts paginate products without dropping line items', () => {
    const largeOrder = {
        ...order,
        orderItems: Array.from({ length: 19 }, (_, index) => ({
            name: `Product ${index + 1}`,
            quantity: 1,
            price: 10
        }))
    };
    const receipt = createReceiptPdf(largeOrder).toString('ascii');
    assert.match(receipt, /PAGE 1 OF 2/);
    assert.match(receipt, /PAGE 2 OF 2/);
    assert.match(receipt, /\(Product 19\) Tj/);
});
