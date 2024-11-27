// Update Firebase Admin initialization
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        }),
        databaseURL: process.env.DATABASE_URL
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
}