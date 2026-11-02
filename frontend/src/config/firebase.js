import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig';

export const getFirebaseAuth = () => {
    if (!isFirebaseConfigured) {
        throw new Error('Google sign-in is not configured. Add the Firebase web app settings to the frontend environment.');
    }

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return getAuth(app);
};
