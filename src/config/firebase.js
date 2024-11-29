// Location: gamer-app-backend/src/config/firebase.js
// Firebase admin configuration for the backend
const admin = require('firebase-admin');

try {
  // Check if Firebase is already initialized
  if (!admin.apps.length) {
    // Parse the service account JSON from environment variable
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }
    if (!process.env.FIREBASE_DATABASE_URL) {
      throw new Error('FIREBASE_DATABASE_URL environment variable is not set');
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://gamer-app-10a85-default-rtdb.firebaseio.com" // Updated URL
    });

    console.log('Firebase initialized successfully');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Don't throw here, let the routes handle the error
}

module.exports = admin;