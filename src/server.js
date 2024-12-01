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

const app = express();
const httpServer = createServer(app);

// Initialize global messages array
global.messages = [];

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle request for messages
  socket.on('request_messages', () => {
    socket.emit('receive_messages', { 
      messages: Array.isArray(global.messages) ? global.messages : [] 
    });
    console.log('Sent messages on request:', global.messages);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle receiving a new message
  socket.on('send_message', (data) => {
    try {
      if (!data || !data.content) {
        console.error('Invalid message data received:', data);
        return;
      }

      const message = {
        id: data.id || Date.now().toString(),
        sender: data.sender || 'Anonymous',
        content: data.content,
        timestamp: data.timestamp || Date.now(),
        platform: data.platform || 'Web'
      };
      
      // Ensure messages is an array
      if (!Array.isArray(global.messages)) {
        global.messages = [];
      }
      
      global.messages.push(message);
      
      // Broadcast to all clients
      io.emit('receive_messages', { 
        messages: global.messages 
      });
      
      console.log('Message broadcasted, current messages:', global.messages);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});