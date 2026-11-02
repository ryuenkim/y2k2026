const dotenv = require('dotenv');
const path = require('node:path');
// 1. Load environment variables FIRST so they are available everywhere
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

const app = require('./app');
const connectDatabase = require('./config/database');

// 2. Connect to MongoDB database
connectDatabase();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Y2K Tech Shop server started on port: ${PORT} in ${process.env.NODE_ENV} mode`);
    const cloudinaryConfigured = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET &&
        ![process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET]
            .some((value) => ['your_cloud_name', 'your_api_key', 'your_api_secret'].includes(value))
    );
    if (!cloudinaryConfigured) {
        console.warn('Cloudinary is not configured; profile avatar uploads are disabled.');
    }
});