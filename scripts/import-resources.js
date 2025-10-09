const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp, connectFirestoreEmulator } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Read resources data from JSON file
const resourcesDataPath = path.join(__dirname, './resources.json');
const resourcesData = JSON.parse(fs.readFileSync(resourcesDataPath, 'utf8'));

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'oureasygame-internal-testing',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to local emulator
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('🔗 Connected to local Firestore emulator on port 8080');
} catch (error) {
  console.log('⚠️  Already connected to emulator or using production');
}

async function importResources() {
  try {
    console.log('Starting resources import...');
    
    if (!resourcesData) {
      throw new Error('Invalid resources file format');
    }
    
    console.log('📄 Found resource collections:');
    console.log(`  - FAQs: ${resourcesData.faqs?.length || 0}`);
    console.log(`  - Languages: ${resourcesData.languages?.length || 0}`);
    console.log(`  - Socials: ${resourcesData.socials?.length || 0}`);
    console.log(`  - Sub Subjects: ${resourcesData.sub_subjects?.length || 0}`);
    console.log(`  - Subjects: ${resourcesData.subjects?.length || 0}`);
    
    // Create the main resources document with all collections as nested data
    console.log('\n📝 Creating resources document...');
    const resourcesRef = collection(db, 'resources');
    const dataDocRef = doc(resourcesRef, 'data');
    
    const resourcesDataDoc = {
      id: resourcesData.id || 'data',
      faqs: resourcesData.faqs || [],
      languages: resourcesData.languages || [],
      socials: resourcesData.socials || [],
      sub_subjects: resourcesData.sub_subjects || [],
      subjects: resourcesData.subjects || [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    await setDoc(dataDocRef, resourcesDataDoc);
    
    console.log('✅ Successfully created resources/data document');
    console.log(`📊 Document contains:`);
    console.log(`  - FAQs: ${resourcesDataDoc.faqs.length} items`);
    console.log(`  - Languages: ${resourcesDataDoc.languages.length} items`);
    console.log(`  - Socials: ${resourcesDataDoc.socials.length} items`);
    console.log(`  - Sub Subjects: ${resourcesDataDoc.sub_subjects.length} items`);
    console.log(`  - Subjects: ${resourcesDataDoc.subjects.length} items`);
    
    console.log('\nImport completed!');
    console.log(`Successfully imported resources into resources/data document`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importResources().then(() => {
  console.log('Import process finished');
  process.exit(0);
}).catch((error) => {
  console.error('Import process failed:', error);
  process.exit(1);
});
