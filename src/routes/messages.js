const admin = require('../config/firebase');
const express = require('express');
const router = express.Router();

router.post('/messages', async (req, res) => {
  try {
    const { text, userId, timestamp } = req.body;
    console.log('Received message body:', req.body); // Log the entire request body

    // Validate required fields
    if (!text || !userId) {
      console.log('Missing required fields:', { text, userId });
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: text and userId are required' 
      });
    }

    // Reference to your messages collection
    const messagesRef = admin.database().ref('messages');
    
    // Create new message with validation
    const newMessage = {
      text: String(text),
      userId: String(userId),
      timestamp: timestamp || Date.now(),
    };
    
    console.log('Attempting to save message:', newMessage);
    
    // Push to Firebase
    const result = await messagesRef.push(newMessage);
    console.log('Message saved with ID:', result.key);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message saved successfully',
      messageId: result.key 
    });
  } catch (error) {
    console.error('Error saving message:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Server error while saving message'
    });
  }
});

// Add GET route for messages
router.get('/messages', async (req, res) => {
  try {
    const messagesRef = admin.database().ref('messages');
    const snapshot = await messagesRef.once('value');
    const messages = snapshot.val() || {};
    res.status(200).json(Object.values(messages));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;