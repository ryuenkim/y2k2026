// Create and send token and save in cookie
const sendToken = (user, statusCode, res) => {

    // Create JWT Token
    const token = user.getJwtToken();

    // Options for cookie
    const frontendUrl = process.env.FRONTEND_URL || '';
    const isProduction = process.env.NODE_ENV?.toLowerCase() === 'production'
        || frontendUrl.split(',')[0].trim().toLowerCase().startsWith('https://');
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        path: '/'
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user
    });
};

module.exports = sendToken;