const User = require('../models/user');
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        if (!token) {
            return res.status(401).json({ message: 'Login first to access this resource' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        if (!req.user) {
            return res.status(401).json({ message: 'User account no longer exists' });
        }
        if (req.user.isActive === false) {
            return res.status(403).json({ message: 'This account has been deactivated' });
        }
        next();
    } catch (error) {
        // JWT verification throws for invalid credentials; unexpected database errors continue to the API handler.
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired authentication token' });
        }
        return next(error);
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to acccess this resource` });
        }
        next();
    };
};