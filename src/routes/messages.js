// Location: gamer-app-backend/src/routes/messages.js
// API routes for handling messages
// Handles:
// - GET /api/messages: Retrieves all messages from Firebase
// - POST /api/messages: Saves new messages to Firebase
// - Message validation and error handling

const express = require('express');
const router = express.Router();


// Get messages
router.get('/messages', async (req, res) => {
  try {
    // Access the messages array from the global scope
    const messages = global.messages || [];
    res.status(200).json(messages); // Send as array instead of object

  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { id, sender, content, timestamp, platform } = req.body;
    
    // Validate message format
    if (!sender || !content) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    const message = {
      id: id || Date.now().toString(),
      sender,
      content,
      timestamp: timestamp || Date.now(),
      platform: platform || 'Web'
    };

    // Save to Firebase first
    const admin = require('firebase-admin');
    if (admin.apps.length) {
      const db = admin.database();
      await db.ref('messages').child(message.id).set(message);
    }


    // Add to global messages array
    if (!global.messages) global.messages = [];
    global.messages.push(message);
    
    res.status(200).json(message); // Send back success

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;