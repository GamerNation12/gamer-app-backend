require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const messagesRouter = require('./routes/messages');

const app = express();
const server = http.createServer(app);

// Update Socket.IO configuration to handle CORS
const io = require('socket.io')(server, {
    cors: {
        origin: ['https://gamer-app-10a85.web.app', 'https://gamer-app-backend.onrender.com'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// In-memory storage for users only
const bannedUsers = new Map();
let maintenanceMode = { enabled: false };

// Admin credentials
const ADMIN_USERNAME = 'MGN';
const ADMIN_PASSWORD = 'MGN';

console.log('Starting server...');

// Middleware first
app.use(cors({
    origin: ['https://gamer-app-10a85.web.app', 'https://gamer-app-backend.onrender.com'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// API Router
const apiRouter = express.Router();

// Login endpoint with admin check
apiRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return res.json({ success: true, username, isAdmin: true });
    }
    if (bannedUsers.has(username)) {
        return res.status(403).json(bannedUsers.get(username));
    }
    res.json({ success: true, username, isAdmin: false });
});

// Mount routers - Fix the paths
app.use('/api', apiRouter);
app.use('/api/messages', messagesRouter); // Mount messages router at specific path

// Socket.IO connection handling
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
    console.log(`API available at https://gamer-app-backend.onrender.com/api`);
});