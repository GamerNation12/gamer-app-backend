require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

// Add more logging
console.log('Starting server...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize Firebase Admin
console.log('Attempting to initialize Firebase Admin...');
try {
    const serviceAccount = require('./gamer-app-10a85-firebase-adminsdk-5t1bn-f31e3a1060.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.DATABASE_URL || 'https://gamer-app-10a85-default-rtdb.firebaseio.com'
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.error('Make sure you have the service account JSON file in the web directory');
    process.exit(1);
}

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Create API Router
const apiRouter = express.Router();

// Login endpoint
apiRouter.post('/login', async (req, res) => {
    try {
        const { username } = req.body;
        console.log('Login attempt:', username);

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const bannedRef = await admin.database().ref(`bannedUsers/${username}`).once('value');
        if (bannedRef.exists()) {
            return res.status(403).json(bannedRef.val());
        }
        
        res.json({ success: true, username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Messages endpoints
apiRouter.get('/messages', async (req, res) => {
    try {
        const snapshot = await admin.database().ref('messages').once('value');
        res.json(snapshot.val() || {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

apiRouter.post('/messages', async (req, res) => {
    try {
        const message = req.body;
        await admin.database().ref('messages').child(message.id).set(message);
        io.emit('newMessage', message);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Ban/Unban endpoints
apiRouter.post('/users/ban', async (req, res) => {
    try {
        const { username, reason, bannedBy } = req.body;
        await admin.database().ref(`bannedUsers/${username}`).set({
            reason,
            bannedBy,
            bannedAt: Date.now()
        });
        io.emit('userBanned', { username, reason, bannedBy });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to ban user' });
    }
});

apiRouter.delete('/users/ban/:username', async (req, res) => {
    try {
        await admin.database().ref(`bannedUsers/${req.params.username}`).remove();
        io.emit('userUnbanned', req.params.username);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unban user' });
    }
});

// Maintenance endpoints
apiRouter.get('/maintenance', async (req, res) => {
    try {
        const snapshot = await admin.database().ref('maintenance').once('value');
        res.json(snapshot.val() || { enabled: false });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get maintenance status' });
    }
});

apiRouter.post('/maintenance', async (req, res) => {
    try {
        const { enabled, message, updatedBy } = req.body;
        await admin.database().ref('maintenance').set({
            enabled,
            message,
            updatedAt: Date.now(),
            updatedBy
        });
        io.emit('maintenanceUpdated', { enabled, message });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update maintenance status' });
    }
});

// Mount API routes
app.use('/api', apiRouter);

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected');
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('error', (error) => {
        console.error('Socket.IO error:', error);
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

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
}); 