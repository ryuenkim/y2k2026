const cloudinary = require('cloudinary').v2;
const trim = (value) => typeof value === 'string' ? value.trim() : '';
const cloudName = trim(process.env.CLOUDINARY_CLOUD_NAME);
const apiKey = trim(process.env.CLOUDINARY_API_KEY);
const apiSecret = trim(process.env.CLOUDINARY_API_SECRET);

const configured = Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    !['your_cloud_name', 'your_api_key', 'your_api_secret'].some((value) => [
        cloudName,
        apiKey,
        apiSecret
    ].includes(value))
);

if (configured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true
    });
}

module.exports = { cloudinary, configured };
