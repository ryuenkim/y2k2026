const test = require('node:test');
const assert = require('node:assert/strict');
const hasDeliveredPurchase = require('../utils/reviewEligibility');

test('review eligibility requires this user, product, and delivered status', async () => {
    let query;
    const Order = { exists: async (conditions) => { query = conditions; return true; } };
    const eligible = await hasDeliveredPurchase(Order, 'customer-1', 'product-1');

    assert.equal(eligible, true);
    assert.deepEqual(query, {
        user: 'customer-1',
        orderStatus: 'Delivered',
        'orderItems.product': 'product-1'
    });
});
