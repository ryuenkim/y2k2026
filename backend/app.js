const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// Middleware
// Product image bytes are multipart uploads; keep JSON small while allowing 2MB profile avatars.
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ limit: '3mb', extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
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
