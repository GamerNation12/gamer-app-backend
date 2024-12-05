// Location: gamer-app-backend/src/server.js
// Main server file that sets up Express and Socket.IO
// Handles:
// - Express server setup
// - Socket.IO configuration
// - CORS settings
// - API routes mounting
// - User authentication
// - Real-time message broadcasting
// - Admin functionality
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';
import authRouter from './routes/auth.js';
import messagesRouter from './routes/messages.js';

dotenv.config();

// Initialize Firebase Admin
let db;
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin...');
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
    
    db = admin.firestore();
    
    // Test Firebase connection with better error handling
    const testDoc = db.collection('test').doc('connection-test');
    await testDoc.set({
      test: 'test',
      timestamp: Date.now()
    }, { merge: true })
    .then(() => {
      console.log('Firebase connection test successful');
    })
    .catch((error) => {
      console.error('Firebase connection test failed:', error.code, error.message);
    });
  } catch (error) {
    console.error('Failed to initialize Firebase:', error.code, error.message);
    db = admin.firestore();
  }
} else {
  db = admin.firestore();
}

const messagesRef = db.collection('messages');
const app = express();
const httpServer = createServer(app);

// Initialize global messages array
global.messages = [];

// Load initial messages from Firebase
async function loadMessagesFromDB() {
  try {
    console.log('Starting to load messages from database...');
    
    // Verify database connection first
    const testRead = await messagesRef.limit(1).get();
    console.log('Database connection verified');
    
    const snapshot = await messagesRef.orderBy('timestamp', 'desc').limit(100).get();
    console.log('Got snapshot from database:', snapshot.size, 'documents');
    
    if (snapshot.empty) {
      console.log('No messages found in database');
      return [];
    }

    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      };
    }).reverse();
    
    global.messages = messages;
    console.log('Successfully loaded messages from database:', messages.length);
    return messages;
  } catch (error) {
    console.error('Error loading messages from DB:', {
      code: error.code,
      message: error.message,
      details: error.details
    });
    return [];
  }
}

// Add body parser middleware
app.use(express.json());

// Enable CORS for regular HTTP requests
app.use(cors({
  origin: 'https://gamer-app-10a85.web.app',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Initialize Socket.IO with CORS settings
const io = new Server(httpServer, {
  cors: {
    origin: "https://gamer-app-10a85.web.app",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Mount the routes
app.use('/api', authRouter);
app.use('/api', messagesRouter);

// Initialize server after loading messages
async function initializeServer() {
  console.log('Starting server initialization...');
  try {
    // Load messages first
    console.log('Loading messages...');
    const messages = await loadMessagesFromDB();
    console.log('Loaded messages:', messages.length);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      console.log('Current messages in memory:', global.messages.length);

      // Send existing messages to newly connected client
      socket.emit('receive_messages', { messages: global.messages });
      console.log('Sent initial messages to client:', global.messages.length);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      // Handle receiving a new message
      socket.on('send_message', async (data) => {
        try {
          console.log('Received message data:', data);
          
          const message = {
            id: data.id || Date.now().toString(),
            sender: data.sender,
            content: data.content,
            timestamp: data.timestamp || Date.now(),
            platform: data.platform || 'Web'
          };
          
          // Save to Firebase first
          await messagesRef.doc(message.id).set(message);
          console.log('Message saved to database:', message);
          
          // Add to global messages array
          global.messages.push(message);
          
          // Send the single new message to all clients
          io.emit('receive_message', message);
          
          // Also send the updated full messages array
          io.emit('receive_messages', { messages: global.messages });
          
          console.log('Message broadcasted:', message);
          console.log('Current messages array:', global.messages);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });
    });

    // Start server with Render's port
    const PORT = process.env.PORT || 10000;
    httpServer.listen(PORT, '0.0.0.0', () => { // Explicitly bind to all interfaces
      console.log(`Server running on port ${PORT}`);
      console.log('Messages loaded in memory:', global.messages.length);
    });
  } catch (error) {
    console.error('Error during server initialization:', error);
    throw error;
  }
}

// Start the server
initializeServer().catch(error => {
  console.error('Failed to initialize server:', error);
});