import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firebase Admin SDK configuration for server-side operations
 * Automatically connects to emulator in development or live Firebase in production
 */

// Track if settings have been applied
let settingsApplied = false;

// Initialize Firebase Admin (singleton pattern)
function initializeFirebaseAdmin() {
  const apps = getApps();
  
  if (apps.length > 0) {
    return apps[0];
  }

  // In development with emulator, we don't need credentials
  if (process.env.NODE_ENV === 'development' || process.env.USE_FIREBASE_EMULATOR === 'true') {
    console.log('🔧 Initializing Firebase Admin for EMULATOR');
    
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'oureasygame-internal-testing',
    });
  }

  // In production, use service account credentials
  console.log('🔧 Initializing Firebase Admin for PRODUCTION');
  
  // Check if we have service account credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || 'oureasygame-internal-testing',
    });
  }
  
  // Fallback: Initialize without credentials (will use Application Default Credentials)
  return initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'oureasygame-internal-testing',
  });
}

// Initialize the app
const adminApp = initializeFirebaseAdmin();

// Get Firestore instance
const db = getFirestore(adminApp);

// Connect to Firestore emulator if in development (only once)
if (!settingsApplied && (process.env.NODE_ENV === 'development' || process.env.USE_FIREBASE_EMULATOR === 'true')) {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  const [host, port] = firestoreHost.split(':');
  
  console.log(`📡 Connecting to Firestore Emulator at ${host}:${port}`);
  
  try {
    db.settings({
      host: firestoreHost,
      ssl: false,
    });
    settingsApplied = true;
  } catch (error) {
    // Settings already applied, ignore
    console.log('⚠️  Firestore settings already configured');
  }
}

export const adminDb = db;
export default adminApp;

