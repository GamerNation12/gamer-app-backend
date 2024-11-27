const admin = require('firebase-admin');

try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error('FIREBASE_SERVICE_ACCOUNT is missing');
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
  }

  if (!process.env.FIREBASE_DATABASE_URL) {
    console.error('FIREBASE_DATABASE_URL is missing');
    throw new Error('FIREBASE_DATABASE_URL environment variable is required');
  }

  console.log('Initializing Firebase...');
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
  throw error;
}

module.exports = admin;