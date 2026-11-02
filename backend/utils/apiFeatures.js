const sortOptions = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { ratings: -1, createdAt: -1 },
    reviews: { numOfReviews: -1, createdAt: -1 }
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const bracketQueryValue = (query, field, operator) => (
    query[`${field}[${operator}]`] ?? query[field]?.[operator]
);

const parseNumber = (value, label, { integer = false, min = -Infinity, max = Infinity } = {}) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw Object.assign(new Error(`${label} must be a valid number`), { statusCode: 400 });
    }

    const number = Number(value);
    if (!Number.isFinite(number) || (integer && !Number.isInteger(number)) || number < min || number > max) {
        throw Object.assign(new Error(`${label} is out of range`), { statusCode: 400 });
    }
    return number;
};

class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
        this.filters = {};
    }

    search() {
        if (this.queryStr.keyword) {
            if (typeof this.queryStr.keyword !== 'string') {
                throw Object.assign(new Error('Keyword must be a string'), { statusCode: 400 });
            }
            this.filters.name = { $regex: escapeRegex(this.queryStr.keyword), $options: 'i' };
        }
        return this;
    }

    filter() {
        const { category, ...queryFilters } = this.queryStr;
        if (category !== undefined) {
            if (typeof category !== 'string') {
                throw Object.assign(new Error('Category must be a string'), { statusCode: 400 });
            }
            this.filters.category = category;
        }

        const minPrice = bracketQueryValue(queryFilters, 'price', 'gte');
        const maxPrice = bracketQueryValue(queryFilters, 'price', 'lte');
        if (minPrice !== undefined || maxPrice !== undefined) {
            this.filters.price = {};
            if (minPrice !== undefined) this.filters.price.$gte = parseNumber(minPrice, 'Minimum price');
            if (maxPrice !== undefined) this.filters.price.$lte = parseNumber(maxPrice, 'Maximum price');
        }

        const minRating = bracketQueryValue(queryFilters, 'ratings', 'gte');
        if (minRating !== undefined) {
            this.filters.ratings = { $gte: parseNumber(minRating, 'Minimum rating', { min: 0, max: 5 }) };
        }

        this.query = this.query.find(this.filters);
        return this;
    }

    sort() {
        this.query = this.query.sort(sortOptions[this.queryStr.sort] || sortOptions.newest);
        return this;
    }

    pagination(resPerPage) {
        const currentPage = this.queryStr.page === undefined || this.queryStr.page === ''
            ? 1
            : parseNumber(this.queryStr.page, 'Page', { integer: true, min: 1 });
        this.currentPage = currentPage;
        this.resPerPage = resPerPage;
        this.query = this.query.skip((currentPage - 1) * resPerPage).limit(resPerPage);
        return this;
    }
}

module.exports = APIFeatures;
