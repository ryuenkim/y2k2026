const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [30, 'Your name cannot exceed 30 characters']
    },
    email: {
        type: String,
        required: [function () {
            return this.authProvider !== 'facebook';
        }, 'Please enter your email'],
        unique: true,
        sparse: true,
        validate: {
            validator: (value) => !value || validator.isEmail(value),
            message: 'Please enter valid email address'
        }
    },
    password: {
        type: String,
        required: [function () {
            return !['google', 'facebook'].includes(this.authProvider);
        }, 'Please enter your password'],
        minlength: [6, 'Your password must be longer than 6 characters'],
        select: false
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
        select: false
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true,
        select: false
    },
    avatar: {
        public_id: {
            type: String,
            default: ''
        },
        url: {
            type: String,
            default: ''
        }
    },
    profileImages: {
        type: [{
            public_id: { type: String, default: '' },
            url: { type: String, required: true }
        }],
        default: [],
        validate: {
            validator: (images) => images.length <= 8,
            message: 'A profile can have up to 8 images'
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletionRequestedAt: Date,
    deletionReason: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
})
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10)
});

userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
}

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash and set to resetPasswordToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Set token expire time
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000

    return resetToken

}

module.exports = mongoose.model('User', userSchema);