const hasVerifiedSocialEmail = (identity) => Boolean(
    typeof identity?.email === 'string'
    && identity.email.trim()
    && identity.email_verified === true
);

module.exports = { hasVerifiedSocialEmail };
