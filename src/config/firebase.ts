import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || 'oureasygame-internal-testing',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connect to emulators in development (only if explicitly enabled)
if (process.env.NODE_ENV === 'development' && 
    typeof window !== 'undefined' && 
    process.env.USE_FIREBASE_EMULATOR === 'true') {
  
  // Only connect to emulators if explicitly enabled
  if (!auth.emulatorConfig) {
    console.log('Connecting to Auth emulator');
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
  
  // Connect to Firestore emulator
  try {
    console.log('Connecting to Firestore emulator');

    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error: any) {
    console.log('Firestore emulator connection:', error?.message || 'Already connected');
  }
}

export default app;
