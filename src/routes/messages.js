const admin = require('../config/firebase');
const express = require('express');
const router = express.Router();

router.post('/messages', async (req, res) => {
  try {
    console.log('Received full request body:', req.body);

    // Extract message from the request body
    const message = {
      text: req.body.message || req.body.text,
      userId: req.body.userId,
      timestamp: req.body.timestamp || Date.now()
    };

    console.log('Processed message:', message);

    // Validate both text and userId
    if (!message.text || !message.userId) {
      return res.status(400).json({
        success: false,
        error: 'Both message text and userId are required'
      });
    }

    // Reference to your messages collection
    const messagesRef = admin.database().ref('messages');
    
    // Push to Firebase
    const result = await messagesRef.push(message);
    console.log('Message saved with ID:', result.key);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message saved successfully',
      messageId: result.key 
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Keep the GET route as is
router.get('/messages', async (req, res) => {
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

module.exports = router;