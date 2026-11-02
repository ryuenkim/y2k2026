const Product = require('../models/product');
const Order = require('../models/order');
const { cloudinary, configured: cloudinaryConfigured } = require('../config/cloudinary');
const APIFeatures = require('../utils/apiFeatures');
const hasDeliveredPurchase = require('../utils/reviewEligibility');
const { maskProfanity } = require('../utils/reviewModeration');

const reviewAttempts = new Map();

const uploadProductImages = async (files) => {
    if (!files?.length) return [];
    if (!cloudinaryConfigured) throw Object.assign(new Error('Product image uploads are not configured on the server'), { statusCode: 503 });
    const uploaded = [];
    try {
        for (const file of files) {
            const image = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    folder: 'products',
                    resource_type: 'image',
                    transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
                }, (error, result) => error ? reject(error) : resolve(result));
                stream.end(file.buffer);
            });
            uploaded.push({ public_id: image.public_id, url: image.secure_url });
        }
        return uploaded;
    } catch (error) {
        await Promise.allSettled(uploaded.map((image) => cloudinary.uploader.destroy(image.public_id)));
        throw error;
    }
};

const deleteProductImages = async (images = []) => {
    if (!cloudinaryConfigured) return;
    await Promise.allSettled(images
        .filter((image) => image?.public_id && !image.public_id.startsWith('mock-'))
        .map((image) => cloudinary.uploader.destroy(image.public_id)));
};

const parseExistingImages = (value, fallback = []) => {
    if (value === undefined) return fallback;
    try {
        const images = typeof value === 'string' ? JSON.parse(value) : value;
        if (!Array.isArray(images)) throw new Error('Existing images must be an array');
        return images.filter((image) => image?.public_id && image?.url);
    } catch {
        throw Object.assign(new Error('Invalid existing product images'), { statusCode: 400 });
    }
};

const validateReviewComment = (value) => {
    const comment = typeof value === 'string' ? value.trim() : '';
    if (comment.length < 5 || comment.length > 500) return 'Review must be between 5 and 500 characters';
    if (/<[^>]*>|javascript\s*:|data\s*:/i.test(comment)) return 'Review cannot contain HTML, scripts, or embedded content';
    if (/(https?:\/\/|www\.|<script|on\w+\s*=)/i.test(comment)) return 'Links and suspicious markup are not allowed in reviews';
    if (/(.)\1{5,}/u.test(comment)) return 'Avoid excessive repeated characters';
    return null;
};

const markVerifiedPurchases = async (reviews, productId) => Promise.all(reviews.map(async (review) => ({
    ...review.toObject(),
    verifiedPurchase: review.verifiedPurchase || Boolean(await Order.exists({
        user: review.user,
        orderStatus: 'Delivered',
        'orderItems.product': productId
    }))
})));

// Create new product => /api/v1/admin/product/new
exports.newProduct = async (req, res, next) => {
    let images = [];
    try {
        images = await uploadProductImages(req.files);
        const product = await Product.create({ ...req.body, images, user: req.user._id });

        return res.status(201).json({
            success: true,
            product
        });
    } catch (error) {
        await deleteProductImages(images);
        return next(error);
    }
};

// Get all products => /api/v1/products
exports.getProducts = async (req, res, next) => {
    try {
        const requestedLimit = Number(req.query.limit) || 12;
        const limit = Math.min(Math.max(requestedLimit, 1), 50);
        const apiFeatures = new APIFeatures(Product.find(), req.query)
            .search()
            .filter()
            .sort()
            .pagination(limit);
        const [products, productsCount, filteredProductsCount] = await Promise.all([
            apiFeatures.query,
            Product.countDocuments(),
            Product.countDocuments(apiFeatures.filters)
        ]);

        res.status(200).json({
            success: true,
            count: products.length,
            productsCount,
            filteredProductsCount,
            resPerPage: limit,
            currentPage: apiFeatures.currentPage,
            products
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get single product details => /api/v1/product/:id
exports.getSingleProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const reviewSorts = {
            newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
            highest: (a, b) => b.rating - a.rating,
            lowest: (a, b) => a.rating - b.rating,
            verified: (a, b) => Number(b.verifiedPurchase) - Number(a.verifiedPurchase)
        };
        product.reviews = await markVerifiedPurchases(product.reviews, product._id);
        product.reviews.sort(reviewSorts[req.query.reviewSort] || reviewSorts.newest);
        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.canReviewProduct = async (req, res) => {
    const product = await Product.findById(req.params.id).select('_id');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const canReview = Boolean(await hasDeliveredPurchase(Order, req.user._id, product._id));
    return res.status(200).json({ success: true, canReview });
};

exports.getAdminProducts = async (req, res) => {
    const filter = req.query.keyword ? { name: { $regex: req.query.keyword, $options: 'i' } } : {};
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, products, total: products.length });
};

exports.bulkDeleteProducts = async (req, res) => {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Select at least one product' });
    const products = await Product.find({ _id: { $in: ids } }).select('images');
    const result = await Product.deleteMany({ _id: { $in: ids } });
    await deleteProductImages(products.flatMap((product) => product.images));
    res.status(200).json({ success: true, deletedCount: result.deletedCount });
};

exports.seedMockProducts = async (req, res) => {
    const seeds = [
        ['Chrome Flip Phone', 2499, 'Cell Phones', 'A reflective Y2K flip phone for everyday calls.'],
        ['Pixel Pop Headphones', 1599, 'Headphones', 'Compact wired headphones with retro color blocking.'],
        ['Cyber Compact Camera', 3299, 'Cameras', 'A pocket camera for flash-heavy memories.'],
        ['Translucent Game Pad', 1199, 'Gaming', 'A clear-shell controller inspired by classic consoles.'],
        ['Silver Star Laptop Sleeve', 899, 'Accessories', 'A padded metallic sleeve for your daily device.']
    ];
    const products = seeds.map(([name, price, category, description], index) => ({
        name, price, category, description, seller: 'Y2K Tech Shop', stock: 20,
        images: [{ public_id: `mock-${index + 1}`, url: `https://images.unsplash.com/photo-${['1511707171634-5f897ff02aa9', '1505740420928-5e560c06d30e', '1516035069371-29a1b244cc32', '1542751371-adc38448a05e', '1526170375885-4d8ecf77b99f'][index]}?auto=format&fit=crop&w=800&q=80` }],
        user: req.user._id
    }));
    res.status(201).json({ success: true, products: await Product.insertMany(products) });
};

exports.updateProduct = async (req, res) => {
    const current = await Product.findById(req.params.id);
    if (!current) return res.status(404).json({ success: false, message: 'Product not found' });
    let newImages = [];
    let product;
    try {
        const keepImages = parseExistingImages(req.body.existingImages, current.images);
        newImages = await uploadProductImages(req.files);
        const nextImages = [...keepImages, ...newImages];
        const { existingImages, ...productFields } = req.body;
        product = await Product.findByIdAndUpdate(req.params.id, { ...productFields, images: nextImages }, {
            new: true,
            runValidators: true
        });
        const retainedIds = new Set(nextImages.map((image) => image.public_id));
        await deleteProductImages(current.images.filter((image) => !retainedIds.has(image.public_id)));
    } catch (error) {
        await deleteProductImages(newImages);
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, product });
};

exports.deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await deleteProductImages(product.images);
    res.status(200).json({ success: true });
};

exports.createProductReview = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const purchased = await hasDeliveredPurchase(Order, req.user._id, product._id);
    if (!purchased) {
        return res.status(403).json({ success: false, message: 'You can review products only after a delivered order' });
    }
    const numericRating = Number(rating);
    const commentError = validateReviewComment(comment);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: 'A whole-number rating from 1 to 5 is required' });
    }
    if (commentError) return res.status(400).json({ success: false, message: commentError });
    const attemptKey = `${req.user._id}:${product._id}`;
    const lastAttempt = reviewAttempts.get(attemptKey) || 0;
    if (Date.now() - lastAttempt < 10000) {
        return res.status(429).json({ success: false, message: 'Please wait before submitting this review again' });
    }
    reviewAttempts.set(attemptKey, Date.now());
    const cleanedComment = maskProfanity(comment.trim());
    const existing = product.reviews.find((review) => String(review.user) === String(req.user._id));
    if (existing) {
        existing.rating = numericRating;
        existing.comment = cleanedComment;
        existing.verifiedPurchase = true;
        existing.updatedAt = new Date();
    } else {
        product.reviews.push({
            user: req.user._id,
            name: req.user.name,
            rating: numericRating,
            comment: cleanedComment,
            verifiedPurchase: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    product.numOfReviews = product.reviews.length;
    product.ratings = product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numOfReviews;
    await product.save();
    res.status(200).json({ success: true, product });
};

exports.getProductReviews = async (req, res) => {
    const product = await Product.findById(req.query.id).select('reviews');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const sorters = {
        newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        highest: (a, b) => b.rating - a.rating,
        lowest: (a, b) => a.rating - b.rating,
        verified: (a, b) => Number(b.verifiedPurchase) - Number(a.verifiedPurchase)
    };
    const reviews = await markVerifiedPurchases(product.reviews, product._id);
    reviews.sort(sorters[req.query.sort] || sorters.newest);
    res.status(200).json({ success: true, reviews });
};

exports.deleteReview = async (req, res) => {
    const product = await Product.findById(req.query.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.reviews = product.reviews.filter((review) => String(review._id) !== String(req.query.id));
    product.numOfReviews = product.reviews.length;
    product.ratings = product.numOfReviews
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numOfReviews
        : 0;
    await product.save();
    res.status(200).json({ success: true });
};
