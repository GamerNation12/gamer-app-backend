const admin = require('../config/firebase');
const express = require('express');
const router = express.Router();

// GET messages route
router.get('/', async (req, res) => {
  try {
    const messagesRef = admin.database().ref('messages');
    const snapshot = await messagesRef.once('value');
    const messages = snapshot.val() || {};
    res.status(200).json(Object.values(messages));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST message route
router.post('/', async (req, res) => {
  try {
    console.log('Received request body:', req.body);

    // Create message object
    const message = {
      text: req.body.text || req.body,
      userId: req.body.userId || 'MGN',
      timestamp: Date.now()
    };

    console.log('Processing message:', message);

    // Validate message
    if (!message.text) {
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    // Save to Firebase
    const messagesRef = admin.database().ref('messages');
    const result = await messagesRef.push(message);

    console.log('Message saved with ID:', result.key);
    
    res.status(200).json({ 
      success: true, 
      messageId: result.key
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;