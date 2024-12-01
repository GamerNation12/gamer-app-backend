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
require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const messagesRef = db.collection('messages');

const app = express();
const httpServer = createServer(app);

// Initialize global messages array
global.messages = [];

// Load initial messages from Firebase
async function loadMessagesFromDB() {
  try {
    const snapshot = await messagesRef.orderBy('timestamp', 'desc').limit(100).get();
    global.messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).reverse();
    console.log('Successfully loaded messages from database:', global.messages.length);
    return global.messages;
  } catch (error) {
    console.error('Error loading messages from DB:', error);
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
const authRouter = require('./routes/auth');
const messagesRouter = require('./routes/messages');
app.use('/api', authRouter);
app.use('/api', messagesRouter);

// Initialize server after loading messages
async function initializeServer() {
  // Load messages first
  await loadMessagesFromDB();

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send existing messages to newly connected client
    socket.emit('receive_messages', { messages: global.messages });
    console.log('Sent initial messages:', global.messages);

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

  // Start server
  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Start the server
initializeServer().catch(error => {
  console.error('Failed to initialize server:', error);
});