const test = require('node:test');
const assert = require('node:assert/strict');
const APIFeatures = require('../utils/apiFeatures');

const queryStub = () => ({
    filters: null,
    sortOrder: null,
    offset: null,
    limitValue: null,
    find(filters) {
        this.filters = filters;
        return this;
    },
    sort(sortOrder) {
        this.sortOrder = sortOrder;
        return this;
    },
    skip(offset) {
        this.offset = offset;
        return this;
    },
    limit(limitValue) {
        this.limitValue = limitValue;
        return this;
    }
});

test('catalog API features apply search, filters, sorting, and pagination', () => {
    const query = queryStub();
    const features = new APIFeatures(query, {
        keyword: 'phone(',
        category: 'Cell Phones',
        'price[gte]': '100',
        'ratings[gte]': '4',
        sort: 'reviews',
        page: '3'
    }).search().filter().sort().pagination(8);

    assert.deepEqual(features.filters, {
        name: { $regex: 'phone\\(', $options: 'i' },
        category: 'Cell Phones',
        price: { $gte: 100 },
        ratings: { $gte: 4 }
    });
    assert.deepEqual(query.sortOrder, { numOfReviews: -1, createdAt: -1 });
    assert.equal(query.offset, 16);
    assert.equal(query.limitValue, 8);
    assert.equal(features.currentPage, 3);
});

test('catalog API features accept Express extended bracket query parsing', () => {
    const query = queryStub();
    const features = new APIFeatures(query, {
        price: { gte: '100', lte: '500' },
        ratings: { gte: '4' }
    }).search().filter();

    assert.deepEqual(features.filters, {
        price: { $gte: 100, $lte: 500 },
        ratings: { $gte: 4 }
    });
});
