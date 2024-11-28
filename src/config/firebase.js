const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      databaseURL: process.env.DATABASE_URL
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

module.exports = admin;