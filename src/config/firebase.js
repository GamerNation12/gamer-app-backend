const admin = require('firebase-admin');

try {
  console.log('Starting Firebase initialization...');
  
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT environment variable');
  }
  
  if (!process.env.FIREBASE_DATABASE_URL) {
    throw new Error('Missing FIREBASE_DATABASE_URL environment variable');
  }

  // Parse the service account JSON from environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log('Service account parsed successfully');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });

  console.log('Firebase initialized successfully');
  
  // Test database connection
  const db = admin.database();
  console.log('Database connection established');

} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

module.exports = admin;