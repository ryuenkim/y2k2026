const User = require('../models/user');
const crypto = require('node:crypto');
const { cloudinary, configured: cloudinaryConfigured } = require('../config/cloudinary');
const getFirebaseAdmin = require('../config/firebaseAdmin');
const sendEmail = require('../utils/sendEmail');
const sendToken = require('../utils/jwtToken');
const { hasVerifiedSocialEmail } = require('../utils/socialIdentity');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const uploadProfileImageFiles = async (files) => {
    if (!files.length) return [];
    if (!cloudinaryConfigured) {
        throw Object.assign(new Error('Profile photo uploads are not configured on the server'), { statusCode: 503 });
    }

    const uploadedImages = [];
    try {
        for (const file of files) {
            const image = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({
                    folder: 'avatars',
                    resource_type: 'image',
                    transformation: [{ width: 600, height: 600, crop: 'limit' }]
                }, (error, result) => error ? reject(error) : resolve(result));
                stream.end(file.buffer);
            });
            uploadedImages.push({ public_id: image.public_id, url: image.secure_url });
        }
        return uploadedImages;
    } catch (error) {
        await deleteProfileImages(uploadedImages);
        throw error;
    }
};

const deleteProfileImages = async (images) => {
    if (!cloudinaryConfigured) return;
    const publicIds = [...new Set(images.map((image) => image?.public_id).filter(Boolean))];
    const results = await Promise.allSettled(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
    results.forEach((result) => {
        if (result.status === 'rejected') console.error('Unable to remove an old profile image:', result.reason?.message || result.reason);
    });
};

// Register User => /api/v1/register
exports.registerUser = async (req, res, next) => {
    try {
        let avatar = { public_id: '', url: '' };
        if (req.body.avatar) {
            if (!cloudinaryConfigured) return res.status(503).json({ success: false, message: 'Avatar uploads are not configured on the server' });
            const result = await cloudinary.uploader.upload(req.body.avatar, {
                folder: 'avatars',
                width: 150,
                crop: "scale"
            });
            avatar = { public_id: result.public_id, url: result.secure_url };
        }

        const { name, email, password } = req.body;

        const user = await User.create({
            name,
            email,
            password,
            avatar,
        });

        const token = user.getJwtToken();

        return sendToken(user, 200, res);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Login User => /api/v1/login
exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter email & password' });
        }

        let user = await User.findOne({ email }).select('+password');
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }
        if (user.isActive === false) {
            return res.status(403).json({ message: 'This account has been deactivated' });
        }

        const isPasswordMatched = await user.comparePassword(password);

        if (!isPasswordMatched) {
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }

        user = await User.findOne({ email });
        sendToken(user, 200, res);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const firebaseSocialLogin = async (req, res, provider) => {
    const providerId = provider === 'google' ? 'google.com' : 'facebook.com';
    const providerField = provider === 'google' ? 'googleId' : 'facebookId';
    const providerName = provider === 'google' ? 'Google' : 'Facebook';
    const { idToken } = req.body;
    if (typeof idToken !== 'string' || !idToken) {
        return res.status(400).json({ success: false, message: `A Firebase ${providerName} ID token is required` });
    }

    let firebaseAuth;
    try {
        firebaseAuth = getFirebaseAdmin();
    } catch (error) {
        console.error(`${providerName} sign-in configuration failed:`, error.message);
        return res.status(error.statusCode || 503).json({
            success: false,
            message: error.statusCode ? error.message : `${providerName} sign-in verifier is unavailable`
        });
    }

    let identity;
    try {
        identity = await firebaseAuth.verifyIdToken(idToken);
    } catch (error) {
        const invalidTokenCodes = new Set([
            'auth/argument-error',
            'auth/id-token-expired',
            'auth/invalid-credential',
            'auth/invalid-id-token'
        ]);
        if (invalidTokenCodes.has(error.code)) {
            return res.status(401).json({ success: false, message: `${providerName} sign-in token is invalid or expired` });
        }
        console.error(`${providerName} ID token verification failed:`, error.message);
        return res.status(503).json({ success: false, message: `${providerName} sign-in verification is temporarily unavailable` });
    }

    if (identity.firebase?.sign_in_provider !== providerId) {
        return res.status(401).json({ success: false, message: `A valid ${providerName} sign-in is required` });
    }
    if (provider === 'google' && !hasVerifiedSocialEmail(identity)) {
        return res.status(401).json({ success: false, message: 'A verified Google email address is required' });
    }

    try {
        const email = hasVerifiedSocialEmail(identity) ? identity.email.trim().toLowerCase() : '';
        let user = await User.findOne({ [providerField]: identity.uid }).select('+googleId +facebookId');
        if (!user) {
            if (email) {
                user = await User.findOne({
                    email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' }
                }).select('+googleId +facebookId');
            }
        }

        if (user?.isActive === false) {
            return res.status(403).json({ success: false, message: 'This account has been deactivated' });
        }
        if (user?.[providerField] && user[providerField] !== identity.uid) {
            return res.status(409).json({ success: false, message: `This email is already linked to another ${providerName} account` });
        }

        if (user) {
            user[providerField] = identity.uid;
            if (!user.email && email) user.email = email;
            if (!user.avatar?.url && identity.picture) user.avatar = { public_id: '', url: identity.picture };
            await user.save({ validateModifiedOnly: true });
        } else {
            const name = (identity.name || (email ? email.split('@')[0] : `${providerName} User`)).trim().slice(0, 30) || `${providerName} User`;
            user = await User.create({
                name,
                ...(email ? { email } : {}),
                authProvider: provider,
                [providerField]: identity.uid,
                avatar: { public_id: '', url: identity.picture || '' }
            });
        }

        const authenticatedUser = await User.findById(user._id);
        return sendToken(authenticatedUser, 200, res);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: `This ${providerName} account is already linked to another user` });
        }
        console.error(`${providerName} sign-in failed:`, error.message);
        return res.status(500).json({ success: false, message: `Unable to complete ${providerName} sign-in` });
    }
};

exports.googleLogin = (req, res) => firebaseSocialLogin(req, res, 'google');
exports.facebookLogin = (req, res) => firebaseSocialLogin(req, res, 'facebook');

// Forgot Password => /api/v1/password/forgot
exports.forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return res.status(404).json({ error: 'User not found with this email' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl.replace(/\/$/, '')}/password/reset/${resetToken}`;
    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;
    const html = `<!doctype html><html><body style="margin:0;background:#f4f4f6;font-family:Arial,sans-serif;color:#24252b;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;"><div style="background:#18191f;padding:28px 32px;border-radius:16px 16px 0 0;color:#fff;">
<div style="color:#f4a8c6;font-size:12px;font-weight:bold;letter-spacing:2px;">Y2K TECH SHOP</div><h1 style="margin:14px 0 0;font-size:26px;">Reset your password</h1></div>
<div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;"><p>We received a request to reset your password.</p>
<p style="margin:28px 0;"><a href="${resetUrl}" style="display:inline-block;background:#d94f83;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:bold;">Reset password</a></p>
<p style="color:#666a73;font-size:13px;">If you did not request this email, you can safely ignore it. This link will expire shortly.</p></div></div></body></html>`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT Password Recovery',
            message,
            html
        });

        res.status(200).json({
            success: true,
            message: `Email sent to: ${user.email}`
        });
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return res.status(500).json({ error: error.message });
    }
};

// Reset Password => /api/v1/password/reset/:token
exports.resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has been expired' });
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'Password does not match' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.getJwtToken();
    return res.status(201).json({
        success: true,
        token,
        user
    });
};

// Get current logged in user details => /api/v1/me
exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);

    return res.status(200).json({
        success: true,
        user
    });
};

// Update user profile / avatar => /api/v1/me/update
exports.updateProfile = async (req, res, next) => {
    let uploadedImages = [];
    let profileUpdateSaved = false;
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email
        };
        const existingUser = await User.findById(req.user.id);
        if (!existingUser) return res.status(401).json({ message: 'User Not Updated' });

        const hasGalleryUpdate = req.body.retainedProfileImages !== undefined || req.files?.length;
        if (hasGalleryUpdate) {
            let retainedImages;
            try {
                retainedImages = JSON.parse(req.body.retainedProfileImages || '[]');
            } catch {
                return res.status(400).json({ success: false, message: 'Invalid profile image selection' });
            }
            if (!Array.isArray(retainedImages)) {
                return res.status(400).json({ success: false, message: 'Invalid profile image selection' });
            }

            const currentImages = existingUser.profileImages?.length
                ? [...existingUser.profileImages]
                : existingUser.avatar?.url ? [existingUser.avatar] : [];
            const retainedKeys = new Set();
            const verifiedRetainedImages = [];
            for (const requestedImage of retainedImages) {
                const matchingImage = currentImages.find((image) => (
                    image.public_id === requestedImage?.public_id
                    && image.url === requestedImage?.url
                ));
                const key = matchingImage?.public_id || matchingImage?.url;
                if (!matchingImage || retainedKeys.has(key)) {
                    return res.status(400).json({ success: false, message: 'Invalid profile image selection' });
                }
                retainedKeys.add(key);
                verifiedRetainedImages.push({ public_id: matchingImage.public_id || '', url: matchingImage.url });
            }

            if (verifiedRetainedImages.length + (req.files?.length || 0) > 8) {
                return res.status(400).json({ success: false, message: 'A profile can have up to 8 images' });
            }
            uploadedImages = await uploadProfileImageFiles(req.files || []);
            const profileImages = [...verifiedRetainedImages, ...uploadedImages];
            newUserData.profileImages = profileImages;
            newUserData.avatar = profileImages[0] || { public_id: '', url: '' };
        } else if (req.body.avatar) {
            if (!cloudinaryConfigured) {
                return res.status(503).json({ success: false, message: 'Avatar uploads are not configured on the server' });
            }
            const result = await cloudinary.uploader.upload(req.body.avatar, {
                folder: 'avatars',
                width: 150,
                crop: 'scale'
            });
            uploadedImages = [{ public_id: result.public_id, url: result.secure_url }];
            newUserData.avatar = uploadedImages[0];
            newUserData.profileImages = uploadedImages;
        }

        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true
        });

        if (!user) {
            await deleteProfileImages(uploadedImages);
            return res.status(401).json({ message: 'User Not Updated' });
        }
        profileUpdateSaved = true;

        if (newUserData.profileImages) {
            const previousImages = [...(existingUser.profileImages || []), existingUser.avatar];
            const currentPublicIds = new Set(newUserData.profileImages.map((image) => image.public_id).filter(Boolean));
            await deleteProfileImages(previousImages.filter((image) => image?.public_id && !currentPublicIds.has(image.public_id)));
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        if (!profileUpdateSaved) await deleteProfileImages(uploadedImages);
        return next(error);
    }
};

// Update password => /api/v1/password/update
exports.updatePassword = async (req, res, next) => {
    const { oldPassword, password, confirmPassword } = req.body;
    if (!oldPassword || !password || password.length < 6) {
        return res.status(400).json({ message: 'Current password and a new password of at least 6 characters are required' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!user || !user.password) {
        return res.status(400).json({ message: 'Google accounts do not have a password to update' });
    }
    const isMatched = await user.comparePassword(oldPassword);

    if (!isMatched) {
        return res.status(400).json({ message: 'Old password is incorrect' });
    }

    user.password = password;
    await user.save();
    return sendToken(user, 200, res);

};

// Request account deletion without immediately removing order history.
exports.requestAccountDeletion = async (req, res) => {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    const user = await User.findByIdAndUpdate(req.user.id, {
        deletionRequestedAt: new Date(),
        deletionReason: reason
    }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User account not found' });
    return res.status(200).json({ success: true, message: 'Account deletion request submitted' });
};

// Admin: Get all users => /api/v1/admin/users
exports.allUsers = async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    });
};

// Admin: Delete user => /api/v1/admin/user/:id
exports.deleteUser = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(401).json({ message: `User does not found with id: ${req.params.id}` });
    }

    await User.findByIdAndDelete(req.params.id);
    await deleteProfileImages([...(user.profileImages || []), user.avatar]);

    return res.status(200).json({
        success: true,
    });
};

// Admin: Get specific user details => /api/v1/admin/user/:id
exports.getUserDetails = async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(400).json({ message: `User does not found with id: ${req.params.id}` });
    }

    res.status(200).json({
        success: true,
        user
    });
};

// Admin: Update user role / details => /api/v1/admin/user/:id
exports.updateUser = async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        isActive: req.body.isActive
    };

    await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
    });

    return res.status(200).json({
        success: true
    });
};

// Logout User => /api/v1/logout
exports.logout = async (req, res, next) => {
    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    return res.status(200).json({
        success: true,
        message: 'Logged out'
    });
};  