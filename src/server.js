const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const httpServer = createServer(app);

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Add your other socket event handlers here
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});