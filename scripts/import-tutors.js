const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp, connectFirestoreEmulator } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Read tutors data from JSON file
const tutorsDataPath = path.join(__dirname, 'tutors.json');
const tutorsData = JSON.parse(fs.readFileSync(tutorsDataPath, 'utf8'));

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

// Helper function to parse JSON strings or return arrays
function parseArrayField(field) {
  if (!field) return null;
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return null;
    }
  }
  return null;
}

// Helper function to parse numeric or string fields to arrays of numbers
function parseNumericArrayField(field) {
  if (!field) return null;
  if (Array.isArray(field)) return field;
  if (typeof field === 'number') return [field];
  if (typeof field === 'string') {
    const num = parseInt(field, 10);
    return isNaN(num) ? null : [num];
  }
  return null;
}

// Helper function to convert timestamps
function convertTimestamp(timestamp) {
  if (!timestamp) return null;
  
  // If it's already a Timestamp object with _seconds
  if (timestamp._seconds) {
    return new Timestamp(timestamp._seconds, timestamp._nanoseconds || 0);
  }
  
  // If it's a string date
  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      return Timestamp.fromDate(date);
    } catch {
      return null;
    }
  }
  
  return null;
}

async function importTutors() {
  try {
    console.log('Starting tutors import...');
    console.log(`Found ${tutorsData.length} tutors to import`);
    
    const tutorsRef = collection(db, 'tutors');
    let importedCount = 0;
    let errorCount = 0;
    
    for (const tutor of tutorsData) {
      try {
        // Convert the tutor data to match our Firestore schema
        const tutorData = {
          id: tutor.id,
          email: tutor.email || '',
          full_name: tutor.full_name || '',
          nickname: tutor.nickname || '',
          password: tutor.password || '',
          
          // Contact information
          phone: tutor.phone || null,
          phone_country_code: tutor.phone_country_code || null,
          whatsapp_phone: tutor.whatsapp_phone || null,
          whatsapp_country_code: tutor.whatsapp_country_code || null,
          
          // Location
          country: tutor.country || null,
          country_id: tutor.country_id || null,
          city: tutor.city || null,
          address: tutor.address || null,
          nationality: tutor.nationality || null,
          
          // Profile
          bio: tutor.bio || null,
          profile_image: tutor.profile_image || null,
          cover_letter: tutor.cover_letter || null,
          date_of_birth: tutor.date_of_birth || null,
          gender: tutor.gender || null,
          
          // Education
          university: parseArrayField(tutor.university),
          degree: parseArrayField(tutor.degree),
          major: tutor.major || null,
          another_university: tutor.another_university || null,
          another_degree: tutor.another_degree || null,
          field_id: tutor.field_id || null,
          
          // Professional
          experience_years: tutor.experience_years || null,
          skills: parseNumericArrayField(tutor.skills),
          subjects: parseNumericArrayField(tutor.subjects),
          languages: parseNumericArrayField(tutor.languages),
          
          // Files
          id_file_link: parseArrayField(tutor.id_file_link),
          certification_file_link: parseArrayField(tutor.certification_file_link),
          
          // Status flags
          locked: tutor.locked || '0',
          cancelled: tutor.cancelled || '0',
          version: tutor.version || '0',
          send_notifications: tutor.send_notifications || '1',
          verified: tutor.verified === '1' ? '2' : (tutor.verified || '0'),
          test_user: tutor.test_user || '0',
          
          // Timestamps
          created_at: convertTimestamp(tutor.created_at),
          updated_at: convertTimestamp(tutor.updated_at),
          deleted_at: tutor.deleted_at ? convertTimestamp(tutor.deleted_at) : null,
          
          // Authentication
          token: tutor.token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          google_id: tutor.google_id || null,
          facebook_id: tutor.facebook_id || null,
          
          // Technical
          platform: tutor.platform || null,
          device_token: tutor.device_token || null,
          cms_attributes: tutor.cms_attributes || null,
          
          // Stats
          request_count: tutor.request_count || 0,
          rating: tutor.rating || null,
        };
        
        // Use setDoc with the original tutor ID to preserve the ID
        const tutorDocRef = doc(tutorsRef, tutor.id);
        await setDoc(tutorDocRef, tutorData);
        importedCount++;
        
        if (importedCount % 5 === 0) {
          console.log(`✅ Imported ${importedCount}/${tutorsData.length} tutors...`);
        }
      } catch (error) {
        console.error(`❌ Error importing tutor ${tutor.id} (${tutor.full_name}):`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n========================================');
    console.log('Import completed!');
    console.log(`✅ Successfully imported: ${importedCount} tutors`);
    console.log(`❌ Errors: ${errorCount} tutors`);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importTutors().then(() => {
  console.log('Import process finished');
  process.exit(0);
}).catch((error) => {
  console.error('Import process failed:', error);
  process.exit(1);
});
