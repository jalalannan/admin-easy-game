const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp, connectFirestoreEmulator } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Read students data from JSON file
const studentsDataPath = path.join(__dirname, './students.json');
const studentsData = JSON.parse(fs.readFileSync(studentsDataPath, 'utf8'));

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

async function importStudents() {
  try {
    console.log('Starting students import...');
    
    const studentsRef = collection(db, 'students');
    let importedCount = 0;
    let errorCount = 0;
    
    for (const student of studentsData) {
      try {
        // Convert the student data to match our Firestore schema
        const studentData = {
          ...student,
          // Convert string dates to proper format
          created_at: student.created_at ? new Date(student.created_at) : serverTimestamp(),
          updated_at: student.updated_at ? new Date(student.updated_at) : serverTimestamp(),
          deleted_at: student.deleted_at ? new Date(student.deleted_at) : null,
          dob: student.dob && student.dob !== 'null' ? new Date(student.dob) : null,
          
          // Ensure required fields have default values
          locked: student.locked || '0',
          cancelled: student.cancelled || '0',
          version: student.version || '0',
          send_notifications: student.send_notifications || '1',
          verified: student.verified || '0',
          is_banned: student.is_banned || '0',
          test_user: student.test_user || '0',
          
          // Generate a new token if not present
          token: student.token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        };
        
        // Use setDoc with the original student ID to preserve the ID
        const studentDocRef = doc(studentsRef, student.id);
        await setDoc(studentDocRef, studentData);
        importedCount++;
        
        if (importedCount % 10 === 0) {
          console.log(`Imported ${importedCount} students...`);
        }
      } catch (error) {
        console.error(`Error importing student ${student.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Import completed!`);
    console.log(`Successfully imported: ${importedCount} students`);
    console.log(`Errors: ${errorCount} students`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importStudents().then(() => {
  console.log('Import process finished');
  process.exit(0);
}).catch((error) => {
  console.error('Import process failed:', error);
  process.exit(1);
});
