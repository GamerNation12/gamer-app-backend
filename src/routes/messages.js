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

// Anti-spam map: Tracks last message timestamp per username (or IP)
const rateLimitMap = new Map();
const COOLDOWN_MS = 2000; // 2 seconds
const MAX_LENGTH = 500; // 500 characters

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { id, sender, content, timestamp, platform } = req.body;
    
    // Validate message format
    if (!sender || !content) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    if (content.length > MAX_LENGTH) {
      return res.status(400).json({ error: `Message exceeds maximum length of ${MAX_LENGTH} characters` });
    }

    // Rate Limiting
    const now = Date.now();
    if (rateLimitMap.has(sender)) {
      const timeSinceLastMessage = now - rateLimitMap.get(sender);
      if (timeSinceLastMessage < COOLDOWN_MS) {
        return res.status(429).json({ error: 'Please wait before sending another message' });
      }
    }
    rateLimitMap.set(sender, now);


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

// Delete message
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Remove from global memory
    if (global.messages) {
      global.messages = global.messages.filter(msg => msg.id !== id);
    }

    // Remove from Firebase Realtime Database
    const admin = require('firebase-admin');
    if (admin.apps.length) {
      const db = admin.database();
      await db.ref('messages').child(id).remove();
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;