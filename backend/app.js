const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
// Product image bytes are multipart uploads; keep JSON small while allowing 2MB profile avatars.
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ limit: '3mb', extended: true }));
app.use(cookieParser());

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .map((origin) => origin.replace(/\/$/, ''))
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false
}));

// Import all routes
const products = require('./routes/product');
const auth = require('./routes/auth');
const orders = require('./routes/order');

// Mount routes with API prefix
app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', orders);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});

app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
});

module.exports = app;
