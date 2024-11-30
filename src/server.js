const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://gamer-app-10a85.web.app", // e.g., "http://localhost:3000"
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000, // Increase ping timeout to 60 seconds
  pingInterval: 25000 // Send ping every 25 seconds
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Add your other socket event handlers here
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});