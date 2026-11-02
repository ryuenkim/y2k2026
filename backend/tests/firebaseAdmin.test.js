const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const admin = require('firebase-admin');
const getFirebaseAdmin = require('../config/firebaseAdmin');

test('Firebase Admin config returns the modular Auth service', async () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' }
    });
    const previousEnv = {
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    };
    process.env.FIREBASE_PROJECT_ID = 'y2k-auth-test';
    process.env.FIREBASE_CLIENT_EMAIL = 'firebase-admin@y2k-auth-test.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = privateKey;

    try {
        const auth = getFirebaseAdmin();
        assert.equal(typeof auth.verifyIdToken, 'function');
    } finally {
        await Promise.all(admin.getApps().map((app) => admin.deleteApp(app)));
        Object.entries(previousEnv).forEach(([name, value]) => {
            if (value === undefined) delete process.env[name];
            else process.env[name] = value;
        });
    }
});
