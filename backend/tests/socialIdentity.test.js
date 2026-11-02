const test = require('node:test');
const assert = require('node:assert/strict');
const { hasVerifiedSocialEmail } = require('../utils/socialIdentity');

test('social email can be used to link an existing account only when verified', () => {
    assert.equal(hasVerifiedSocialEmail({ email: 'customer@example.com', email_verified: true }), true);
    assert.equal(hasVerifiedSocialEmail({ email: 'customer@example.com', email_verified: false }), false);
    assert.equal(hasVerifiedSocialEmail({ email: '', email_verified: true }), false);
    assert.equal(hasVerifiedSocialEmail({ email_verified: true }), false);
});
