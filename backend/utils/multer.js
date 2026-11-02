const multer = require('multer');
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const allowedProfileTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const parser = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 8
    },
    fileFilter: (req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            return callback(Object.assign(new Error('Only image uploads are allowed'), { statusCode: 400 }));
        }
        return callback(null, true);
    }
});

const profileParser = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 8
    },
    fileFilter: (req, file, callback) => {
        if (!allowedProfileTypes.has(file.mimetype)) {
            return callback(Object.assign(new Error('Profile photos must be PNG, JPG, or WebP images'), { statusCode: 400 }));
        }
        return callback(null, true);
    }
});

const uploadProductImages = (req, res, next) => {
    parser.array('images', 8)(req, res, (error) => {
        if (error) {
            if (!error.statusCode) error.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return next(error);
        }
        return next();
    });
};

const uploadProfileImages = (req, res, next) => {
    profileParser.array('profileImages', 8)(req, res, (error) => {
        if (error) {
            if (!error.statusCode) error.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return next(error);
        }
        return next();
    });
};

module.exports = { uploadProductImages, uploadProfileImages };
