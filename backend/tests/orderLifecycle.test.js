const test = require('node:test');
const assert = require('node:assert/strict');
const {
    ORDER_STATUSES,
    TRANSACTION_STATUSES,
    isValidStatusTransition
} = require('../utils/orderLifecycle');

test('order lifecycle exposes the professor-style statuses', () => {
    assert.deepEqual(ORDER_STATUSES, ['Processing', 'Shipped', 'Delivered', 'Cancelled']);
    assert.deepEqual(TRANSACTION_STATUSES, ['pending', 'paid', 'refunded', 'failed', 'voided']);
});

test('order lifecycle only advances one step at a time', () => {
    assert.equal(isValidStatusTransition('Processing', 'Shipped'), true);
    assert.equal(isValidStatusTransition('Shipped', 'Delivered'), true);
    assert.equal(isValidStatusTransition('Processing', 'Delivered'), false);
    assert.equal(isValidStatusTransition('Delivered', 'Shipped'), false);
});

test('orders can be cancelled before delivery', () => {
    assert.equal(isValidStatusTransition('Processing', 'Cancelled'), true);
    assert.equal(isValidStatusTransition('Shipped', 'Cancelled'), true);
    assert.equal(isValidStatusTransition('Delivered', 'Cancelled'), false);
});
