const test = require('node:test');
const assert = require('node:assert/strict');
const {
    ORDER_STATUSES,
    TRANSACTION_STATUSES,
    isValidStatusTransition
} = require('../utils/orderLifecycle');

test('order lifecycle starts pending and payment has only pending or paid states', () => {
    assert.deepEqual(ORDER_STATUSES, ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']);
    assert.deepEqual(TRANSACTION_STATUSES, ['pending', 'paid']);
});

test('order lifecycle only advances one step at a time', () => {
    assert.equal(isValidStatusTransition('Pending', 'Processing'), true);
    assert.equal(isValidStatusTransition('Processing', 'Shipped'), true);
    assert.equal(isValidStatusTransition('Shipped', 'Delivered'), true);
    assert.equal(isValidStatusTransition('Pending', 'Shipped'), false);
    assert.equal(isValidStatusTransition('Delivered', 'Shipped'), false);
});

test('orders can be cancelled before delivery', () => {
    assert.equal(isValidStatusTransition('Pending', 'Cancelled'), true);
    assert.equal(isValidStatusTransition('Processing', 'Cancelled'), true);
    assert.equal(isValidStatusTransition('Shipped', 'Cancelled'), true);
    assert.equal(isValidStatusTransition('Delivered', 'Cancelled'), false);
});
