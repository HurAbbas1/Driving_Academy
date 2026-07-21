import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these with actual project credentials in production
// Expo loads variables starting with EXPO_PUBLIC_ automatically from .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "mock-api-key-for-dev",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "new-sunshine-academy.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "new-sunshine-academy",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "new-sunshine-academy.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// On web, standard getAuth() uses localStorage/sessionStorage persistence out-of-the-box
const auth = getAuth(app);

const db = getFirestore(app);

export { app, auth, db };
