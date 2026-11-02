const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    googleLogin,
    facebookLogin,
    logout,
    forgotPassword,
    resetPassword,
    getUserProfile,
    updatePassword,
    updateProfile,
    requestAccountDeletion,
    allUsers,
    getUserDetails,
    updateUser,
    deleteUser
} = require('../controllers/authController');

const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { uploadProfileImages } = require('../utils/multer');

// Public Auth Routes
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/google').post(googleLogin);
router.route('/facebook').post(facebookLogin);
router.route('/logout').get(logout);
router.route('/password/forgot').post(forgotPassword);
router.route('/password/reset/:token').put(resetPassword);

// User Profile Routes (Authenticated)
router.route('/me').get(isAuthenticatedUser, getUserProfile);
router.route('/me/update').put(isAuthenticatedUser, uploadProfileImages, updateProfile);
router.route('/password/update').put(isAuthenticatedUser, updatePassword);
router.route('/account/deletion-request').post(isAuthenticatedUser, requestAccountDeletion);

// Admin User Management Routes
router.route('/admin/users').get(isAuthenticatedUser, authorizeRoles('admin'), allUsers);
router.route('/admin/user/:id')
    .get(isAuthenticatedUser, authorizeRoles('admin'), getUserDetails)
    .put(isAuthenticatedUser, authorizeRoles('admin'), updateUser)
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteUser);

module.exports = router;