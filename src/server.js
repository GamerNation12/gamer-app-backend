// Location: gamer-app-backend/src/server.js
require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO first
const io = new Server(httpServer, {
  cors: {
    origin: "https://gamer-app-10a85.web.app",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Helper function for broadcasting logs
function broadcastLog(type, message, data = null) {
  const logEntry = {
    timestamp: Date.now(),
    type: type,
    message: message,
    data: data
  };
  
  console.log(`[${type}] ${message}`, data || '');
  
  // Broadcast to all connected clients if io is initialized
  if (io) {
    io.emit('server_log', logEntry);
  }
}

// Initialize Firebase Admin
let db;
if (!admin.apps.length) {
  try {
    broadcastLog('Firebase', 'Starting initialization...');
    const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    broadcastLog('Firebase', 'Service account parsed successfully');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
    broadcastLog('Firebase', 'Admin initialized with project:', serviceAccount.project_id);
    
    db = admin.firestore();
    broadcastLog('Firebase', 'Firestore instance created');
    
    await db.collection('messages').get()
      .then(() => {
        broadcastLog('Firebase', 'Connection test successful');
      })
      .catch((error) => {
        broadcastLog('Error', 'Firebase connection test failed', { code: error.code, message: error.message });
      });
  } catch (error) {
    broadcastLog('Error', 'Firebase initialization failed', { code: error.code, message: error.message });
    throw error;
  }
} else {
  db = admin.firestore();
}

const messagesRef = db.collection('messages');

// Initialize global messages array
global.messages = [];

// Load initial messages from Firebase
async function loadMessagesFromDB() {
  try {
    broadcastLog('Messages', 'Starting to load messages from database...');
    
    const snapshot = await messagesRef
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    if (snapshot.empty) {
      broadcastLog('Messages', 'No messages found in database');
      return [];
    }

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    global.messages = messages;
    broadcastLog('Messages', `Successfully loaded ${messages.length} messages from database`);
    return messages;
  } catch (error) {
    broadcastLog('Error', 'Error loading messages from DB', error);
    global.messages = [];
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

// Add status endpoint
app.get('/mobile/status', async (req, res) => {
  broadcastLog('Status', 'Received status check request');
  try {
    const dbStatus = await db.collection('messages').limit(1).get()
      .then(() => {
        broadcastLog('Status', 'Database connection verified');
        return 'connected';
      })
      .catch((error) => {
        broadcastLog('Error', 'Database check failed', { code: error.code, message: error.message });
        return 'error';
      });

    const statusResponse = {
      status: 'ok',
      message: 'Server is ready',
      maintenance: false,
      timestamp: Date.now(),
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage().heapUsed,
        connections: io.engine.clientsCount || 0
      },
      database: {
        status: dbStatus,
        messages: global.messages.length
      }
    };
    
    broadcastLog('Status', 'Sending response', statusResponse);
    res.status(200).json(statusResponse);
  } catch (error) {
    broadcastLog('Error', 'Error handling status check', error.message);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      maintenance: true,
      timestamp: Date.now(),
      error: error.message
    });
  }
});

// Mount the routes
const authRouter = require('./routes/auth');
const messagesRouter = require('./routes/messages');
app.use('/api', authRouter);
app.use('/api', messagesRouter);

// Initialize server after loading messages
async function initializeServer() {
  broadcastLog('Server', 'Starting initialization...');
  try {
    // Load messages first
    broadcastLog('Server', 'Loading messages...');
    const messages = await loadMessagesFromDB();
    broadcastLog('Server', 'Loaded messages:', messages.length);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      broadcastLog('Socket', 'Client connected', socket.id);
      broadcastLog('Socket', 'Current messages in memory:', global.messages.length);

      // Send existing messages to newly connected client
      socket.emit('receive_messages', { messages: global.messages });
      broadcastLog('Socket', 'Sent initial messages to client:', global.messages.length);

      socket.on('disconnect', () => {
        broadcastLog('Socket', 'Client disconnected', socket.id);
      });

      // Handle receiving a new message
      socket.on('send_message', async (data) => {
        try {
          broadcastLog('Socket', 'Received message data', data);
          
          const message = {
            id: data.id || Date.now().toString(),
            sender: data.sender,
            content: data.content,
            timestamp: data.timestamp || Date.now(),
            platform: data.platform || 'Web'
          };
          
          // Save to Firebase first
          await messagesRef.doc(message.id).set(message);
          broadcastLog('Socket', 'Message saved to database', message);
          
          // Add to global messages array
          global.messages.push(message);
          
          // Send the single new message to all clients
          io.emit('receive_message', message);
          
          // Also send the updated full messages array
          io.emit('receive_messages', { messages: global.messages });
          
          broadcastLog('Socket', 'Message broadcasted', message);
          broadcastLog('Socket', 'Current messages array', global.messages);
        } catch (error) {
          broadcastLog('Error', 'Error handling message', error);
        }
      });
    });

    // Start server with Render's port
    const PORT = process.env.PORT || 10000; // Render expects port from env
    httpServer.listen(PORT, '0.0.0.0', () => { // Explicitly bind to all interfaces
      broadcastLog('Server', 'Running on port', PORT);
      broadcastLog('Server', 'Messages loaded in memory:', global.messages.length);
    });
  } catch (error) {
    broadcastLog('Error', 'Error during initialization', error);
    throw error;
  }
}

// Start the server
initializeServer().catch(error => {
  broadcastLog('Error', 'Failed to initialize', error);
});