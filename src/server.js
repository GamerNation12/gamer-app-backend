// Replace the Firebase initialization and test section with:
let db;
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin...');
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add database URL
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
    
    db = admin.firestore();
    
    // Don't test with a write operation, just verify connection
    await db.collection('messages').get()
      .then(() => {
        console.log('Firebase connection test successful');
      })
      .catch((error) => {
        console.error('Firebase connection test failed:', error);
      });
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error; // Don't continue if initialization fails
  }
} else {
  db = admin.firestore();
}

// Replace the loadMessagesFromDB function with:
async function loadMessagesFromDB() {
  try {
    console.log('Starting to load messages from database...');
    
    const snapshot = await messagesRef
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    if (snapshot.empty) {
      console.log('No messages found in database');
      return [];
    }

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    global.messages = messages;
    console.log(`Successfully loaded ${messages.length} messages from database`);
    return messages;
  } catch (error) {
    console.error('Error loading messages from DB:', error);
    // Initialize empty array if loading fails
    global.messages = [];
    return [];
  }
}