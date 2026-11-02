const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../models/order');
const { isValidIdempotencyKey, createOrderFingerprint } = require('../utils/orderIdempotency');

const checkout = {
    orderItems: [
        { product: 'product-b', quantity: 2, price: 250 },
        { product: 'product-a', quantity: 1, price: 90 }
    ],
    shippingInfo: { address: '123 Main Street', city: 'Manila' },
    paymentMethod: 'ONLINE',
    paymentSimulation: 'approved'
};

test('checkout idempotency keys are bounded safe identifiers', () => {
    assert.equal(isValidIdempotencyKey('checkout-123456'), true);
    assert.equal(isValidIdempotencyKey('short'), false);
    assert.equal(isValidIdempotencyKey('bad key value'), false);
});

test('checkout fingerprint is order-independent but changes with requested products', () => {
    const fingerprint = createOrderFingerprint(checkout);
    assert.equal(createOrderFingerprint({ ...checkout, orderItems: [...checkout.orderItems].reverse() }), fingerprint);
    assert.notEqual(createOrderFingerprint({
        ...checkout,
        orderItems: checkout.orderItems.map((item) => ({ ...item, quantity: item.quantity + 1 }))
    }), fingerprint);
});

test('orders enforce one idempotency key per customer', () => {
    const idempotencyIndex = Order.schema.indexes().find(([keys]) => keys.idempotencyKey === 1);
    assert.deepEqual(idempotencyIndex[0], { user: 1, idempotencyKey: 1 });
    assert.equal(idempotencyIndex[1].unique, true);
});
