const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    shippingInfo: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        phoneNo: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    idempotencyKey: { type: String },
    idempotencyFingerprint: { type: String },
    orderItems: [
        {
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            image: { type: String, required: true },
            images: [{ type: String }],
            price: { type: Number, required: true },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Product'
            }
        }
    ],
    paymentInfo: {
        id: { type: String },
        status: { type: String, enum: ['pending', 'paid', 'refunded', 'failed', 'voided'], default: 'pending' },
        provider: { type: String, default: 'simulation' },
        label: { type: String, default: 'Simulated payment' }
    },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'ONLINE' },
    transactionStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed', 'voided'],
        default: 'pending'
    },
    paidAt: { type: Date },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    orderStatus: {
        type: String,
        enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
        required: true,
        default: 'Processing'
    },
    stockReserved: { type: Boolean, default: false },
    stockRestoredAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String, maxlength: 500 },
    receiptEmailSentAt: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

orderSchema.index(
    { user: 1, idempotencyKey: 1 },
    { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

module.exports = mongoose.model('Order', orderSchema);
