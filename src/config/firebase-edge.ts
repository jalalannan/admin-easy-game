import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Client SDK configuration for Edge Runtime
 * Compatible with Cloudflare Pages Edge Runtime
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
function initializeFirebase() {
  const apps = getApps();
  
  if (apps.length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

// Initialize the app
const app = initializeFirebase();

// Get Firestore instance
export const db = getFirestore(app);

export default app;

