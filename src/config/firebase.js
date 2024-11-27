const admin = require('firebase-admin');

try {
  console.log('Starting Firebase initialization...');
  
  // Log environment variables (without exposing sensitive data)
  console.log('Checking environment variables...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
  console.log('FIREBASE_CLIENT_EMAIL exists:', !!process.env.FIREBASE_CLIENT_EMAIL);
  console.log('FIREBASE_PROJECT_ID exists:', !!process.env.FIREBASE_PROJECT_ID);

  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  };

  console.log('Initializing Firebase with project ID:', serviceAccount.projectId);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DATABASE_URL
  });

  console.log('Firebase initialized successfully');
  
  // Test database connection
  const db = admin.database();
  console.log('Database connection established');

} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Error stack:', error.stack);
  throw error;
}

module.exports = admin;