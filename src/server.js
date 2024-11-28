require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const messagesRouter = require('./routes/messages');

// In-memory storage
const messages = [];
const bannedUsers = new Map();
let maintenanceMode = { enabled: false };

// Admin credentials
const ADMIN_USERNAME = 'MGN';
const ADMIN_PASSWORD = 'MGN';

console.log('Starting server...');

// Middleware
app.use(cors({
    origin: 'https://gamer-app-10a85.web.app',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json()); // Add this line to parse JSON bodies

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// API Router
const apiRouter = express.Router();

// Use messages router
app.use('/api', messagesRouter);

// Rest of your routes...
// [Keep all the existing route definitions]

// Socket.IO connection handling - Combined version
io.on('connection', (socket) => {
    console.log('User connected');
    
    socket.on('typing', (username) => {
        socket.broadcast.emit('userTyping', username);
    });

    socket.on('stopTyping', (username) => {
        socket.broadcast.emit('userStopTyping', username);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});