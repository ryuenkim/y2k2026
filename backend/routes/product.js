const express = require('express');
const router = express.Router();

const {
    getProducts,
    getAdminProducts,
    bulkDeleteProducts,
    seedMockProducts,
    getSingleProduct,
    newProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    canReviewProduct,
    getProductReviews,
    deleteReview
} = require('../controllers/productController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { uploadProductImages } = require('../utils/multer');

// Define API routes
router.route('/products').get(getProducts);
router.route('/product/:id').get(getSingleProduct);
router.route('/admin/product/new').post(isAuthenticatedUser, authorizeRoles('admin'), uploadProductImages, newProduct);
router.route('/admin/products').get(isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);
router.post('/admin/products/bulk-delete', isAuthenticatedUser, authorizeRoles('admin'), bulkDeleteProducts);
router.post('/admin/products/seed', isAuthenticatedUser, authorizeRoles('admin'), seedMockProducts);
router.route('/admin/product/:id')
    .put(isAuthenticatedUser, authorizeRoles('admin'), uploadProductImages, updateProduct)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.route('/review').put(isAuthenticatedUser, createProductReview);
router.route('/review/eligibility/:id').get(isAuthenticatedUser, canReviewProduct);
router.route('/reviews').get(getProductReviews).delete(isAuthenticatedUser, authorizeRoles('admin'), deleteReview);

module.exports = router;
