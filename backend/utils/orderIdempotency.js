const crypto = require('crypto');

const isValidIdempotencyKey = (key) => (
    typeof key === 'string' && /^[a-zA-Z0-9._:-]{8,128}$/.test(key)
);

const createOrderFingerprint = ({ orderItems, shippingInfo, paymentMethod, paymentSimulation }) => crypto
    .createHash('sha256')
    .update(JSON.stringify({
        items: orderItems.map((item) => ({
            product: String(item.product),
            quantity: Number(item.quantity),
            price: Number(item.price)
        })).sort((left, right) => left.product.localeCompare(right.product)),
        shippingInfo,
        paymentMethod,
        paymentSimulation: paymentMethod === 'ONLINE' ? paymentSimulation : undefined
    }))
    .digest('hex');

module.exports = { isValidIdempotencyKey, createOrderFingerprint };
