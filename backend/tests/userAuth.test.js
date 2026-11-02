const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/user');

const userDetails = {
    name: 'Y2K Customer',
    email: 'customer@example.com'
};

test('Google-authenticated users do not need a local password', async () => {
    const user = new User({ ...userDetails, authProvider: 'google', googleId: 'firebase-user-id' });
    await assert.doesNotReject(user.validate());
});

test('Facebook-authenticated users do not need a local password', async () => {
    const user = new User({ ...userDetails, authProvider: 'facebook', facebookId: 'firebase-facebook-user-id' });
    await assert.doesNotReject(user.validate());
});

test('Facebook-authenticated users can sign in without an email address', async () => {
    const user = new User({ name: 'Facebook User', authProvider: 'facebook', facebookId: 'facebook-user-without-email' });
    await assert.doesNotReject(user.validate());
});

test('Google-authenticated users still require an email address', async () => {
    const user = new User({ name: 'Google User', authProvider: 'google', googleId: 'google-user-without-email' });
    await assert.rejects(user.validate(), /Please enter your email/);
});

test('Facebook email addresses are validated when supplied', async () => {
    const user = new User({ name: 'Facebook User', email: 'not-an-email', authProvider: 'facebook', facebookId: 'facebook-user-invalid-email' });
    await assert.rejects(user.validate(), /Please enter valid email address/);
});

test('users can have up to eight profile images', async () => {
    const user = new User({
        ...userDetails,
        authProvider: 'facebook',
        facebookId: 'facebook-profile-gallery-user',
        profileImages: Array.from({ length: 8 }, (_, index) => ({
            public_id: `profile-image-${index}`,
            url: `https://example.com/profile-${index}.jpg`
        }))
    });
    await assert.doesNotReject(user.validate());
    user.profileImages.push({ public_id: 'profile-image-9', url: 'https://example.com/profile-9.jpg' });
    await assert.rejects(user.validate(), /A profile can have up to 8 images/);
});

test('email addresses remain unique while email-less accounts are allowed', () => {
    const emailIndex = User.schema.indexes().find(([keys]) => keys.email === 1);
    assert.deepEqual(emailIndex?.[1], { unique: true, sparse: true });
});

test('local users still require a password', async () => {
    const user = new User({ ...userDetails, authProvider: 'local' });
    await assert.rejects(user.validate(), /Please enter your password/);
});
