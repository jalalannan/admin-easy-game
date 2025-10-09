const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'oureasygame-internal-testing',
  });
}

const db = admin.firestore();

async function importNotifications() {
  try {
    console.log('🚀 Starting notification import...');
    
    // Read the notification template file
    const templatePath = path.join(__dirname, '..', 'notification_template.json');
    const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    console.log(`📄 Found ${templateData.notifications.length} notifications to import`);
    
    const batch = db.batch();
    const collection = db.collection('notifications');
    
    // Process each notification
    for (const notification of templateData.notifications) {
      // Remove the numeric ID and let Firestore generate a new one
      const { id, ...notificationData } = notification;
      
      // Add timestamps
      const now = new Date().toISOString();
      const docData = {
        ...notificationData,
        createdAt: now,
        updatedAt: now,
      };
      
      // Add to batch
      const docRef = collection.doc();
      batch.set(docRef, docData);
      
      console.log(`✅ Prepared notification: ${notification.title}`);
    }
    
    // Commit the batch
    await batch.commit();
    
    console.log('🎉 Successfully imported all notifications!');
    
    // Verify import
    const snapshot = await collection.get();
    console.log(`📊 Total notifications in database: ${snapshot.size}`);
    
    // Show breakdown by user type
    const studentCount = await collection.where('userType', '==', 'STUDENT').get();
    const tutorCount = await collection.where('userType', '==', 'TUTOR').get();
    
    console.log(`👨‍🎓 Student notifications: ${studentCount.size}`);
    console.log(`👨‍🏫 Tutor notifications: ${tutorCount.size}`);
    
  } catch (error) {
    console.error('❌ Error importing notifications:', error);
    process.exit(1);
  }
}

// Run the import
importNotifications()
  .then(() => {
    console.log('✨ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Import failed:', error);
    process.exit(1);
  });
