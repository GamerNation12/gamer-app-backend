const admin = require('../config/firebase');
const express = require('express');
const router = express.Router();  // Define router first

router.post('/messages', async (req, res) => {
  try {
    const { text, userId, timestamp } = req.body;
    console.log('Received message:', { text, userId, timestamp });

    // Reference to your messages collection
    const messagesRef = admin.database().ref('messages');
    
    // Create new message
    const newMessage = {
      text,
      userId,
      timestamp: timestamp || Date.now(),
    };
    
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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;