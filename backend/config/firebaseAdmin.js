const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');

const getFirebaseAdmin = () => {
    const app = admin.getApps().length ? admin.getApp() : null;
    if (app) return getAuth(app);

    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw Object.assign(new Error('Google sign-in is not configured on the server'), { statusCode: 503 });
    }

    const initializedApp = admin.initializeApp({
        credential: admin.cert({
            projectId: FIREBASE_PROJECT_ID,
            clientEmail: FIREBASE_CLIENT_EMAIL,
            privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        }),
        projectId: FIREBASE_PROJECT_ID
    });

    return getAuth(initializedApp);
};

module.exports = getFirebaseAdmin;
