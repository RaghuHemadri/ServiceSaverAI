import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/messaging';
import 'firebase/compat/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAoLBze8FSRcAAmNGwVyy83xJ5PfV2xEVA",
    authDomain: "servicesaver-ai.firebaseapp.com",
    projectId: "servicesaver-ai",
    storageBucket: "servicesaver-ai.firebasestorage.app",
    messagingSenderId: "973978973257",
    appId: "1:973978973257:web:e69c5e95b649a55a16fb98"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

// Initialize services with error handling
const messaging = firebase.messaging;
const auth = firebase.auth;

// Initialize Firestore with settings
const firestore = firebase.firestore;
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
});

// Enable offline persistence (optional)
try {
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence not available');
            }
        });
} catch (err) {
    console.warn('Firestore persistence setup failed:', err);
}

async function getFCMToken()
{
    // You need to get your VAPID key from Firebase Console -> Project Settings -> Cloud Messaging
    const vapidKey = 'BI2feHrmJ17huBUuyh9QYsQrEt1TPT2rEhmiEt8-1XRLKQmIrZIpXjR0cq2FiJfxZkbndCxElKla5Vn3PFxpnAo'; // Replace with your actual VAPID key
    try {
        return await messaging().getToken({ vapidKey });
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
}

export { firebase, auth, messaging, firestore, db, getFCMToken };