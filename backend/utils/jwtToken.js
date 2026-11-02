// Create and send token and save in cookie
const sendToken = (user, statusCode, res) => {

    // Create JWT Token
    const token = user.getJwtToken();

    // Options for cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user
    });
};

module.exports = sendToken;