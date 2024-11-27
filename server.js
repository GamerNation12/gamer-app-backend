require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// In-memory storage
const messages = [];
const bannedUsers = new Map();
let maintenanceMode = { enabled: false };

// Admin credentials
const ADMIN_USERNAME = 'MGN';
const ADMIN_PASSWORD = 'MGN';

console.log('Starting server...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// API Router
const apiRouter = express.Router();

// Login endpoint with admin check
apiRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check if admin login
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return res.json({ success: true, username, isAdmin: true });
    }
    
    // Regular user login
    if (bannedUsers.has(username)) {
        return res.status(403).json(bannedUsers.get(username));
    }
    res.json({ success: true, username, isAdmin: false });
});

// Messages endpoints
apiRouter.get('/messages', (req, res) => {
    res.json(messages);
});

apiRouter.post('/messages', (req, res) => {
    const message = req.body;
    messages.push(message);
    io.emit('newMessage', message);
    res.json({ success: true });
});

// Admin endpoints
apiRouter.post('/admin/clear-messages', (req, res) => {
    const { username } = req.body;
    if (username === ADMIN_USERNAME) {
        messages.length = 0;
        io.emit('messagesCleared');
        res.json({ success: true });
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
});

// Ban/Unban endpoints (admin only)
apiRouter.post('/users/ban', (req, res) => {
    const { username, reason, bannedBy } = req.body;
    if (bannedBy === ADMIN_USERNAME) {
        bannedUsers.set(username, { reason, bannedBy, bannedAt: Date.now() });
        io.emit('userBanned', { username, reason, bannedBy });
        res.json({ success: true });
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
});

apiRouter.delete('/users/ban/:username', (req, res) => {
    const { adminUsername } = req.body;
    if (adminUsername === ADMIN_USERNAME) {
        bannedUsers.delete(req.params.username);
        io.emit('userUnbanned', req.params.username);
        res.json({ success: true });
    } else {
        res.status(403).json({ error: 'Unauthorized' });
    }
});

// Mount API routes
app.use('/api', apiRouter);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected');
    
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