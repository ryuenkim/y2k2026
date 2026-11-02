const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Product = require('../models/product');

const createProduct = (overrides = {}) => new Product({
    name: 'Test product',
    price: 10,
    description: 'A valid product description',
    category: 'Gaming',
    seller: 'Y2K Tech Shop',
    stock: 1,
    images: [{ public_id: 'test-image', url: 'https://example.com/product.png' }],
    user: new mongoose.Types.ObjectId(),
    ...overrides
});

const getValidationError = async (product) => {
    try {
        await product.validate();
        return null;
    } catch (error) {
        return error;
    }
};

test('product model accepts zero price and stock', async () => {
    assert.equal(await getValidationError(createProduct({ price: 0, stock: 0 })), null);
});

test('product model rejects negative prices and stock', async () => {
    assert.ok((await getValidationError(createProduct({ price: -1 }))).errors.price);
    assert.ok((await getValidationError(createProduct({ stock: -1 }))).errors.stock);
});

test('product model rejects fractional stock', async () => {
    assert.ok((await getValidationError(createProduct({ stock: 1.5 }))).errors.stock);
});
