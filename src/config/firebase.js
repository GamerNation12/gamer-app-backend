const admin = require('firebase-admin');

try {
  console.log('Initializing Firebase...');
  
  // Check if environment variables exist
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is missing');
  }
  if (!process.env.FIREBASE_DATABASE_URL) {
    throw new Error('FIREBASE_DATABASE_URL environment variable is missing');
  }

  // Parse the service account JSON from environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  console.log('Firebase Database URL:', process.env.FIREBASE_DATABASE_URL);
  console.log('Service Account Project ID:', serviceAccount.project_id);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

module.exports = admin;