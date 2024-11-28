const admin = require('../config/firebase');
const express = require('express');
const router = express.Router();

router.post('/messages', async (req, res) => {
  try {
    console.log('Received full request body:', req.body);
    console.log('Request body type:', typeof req.body);

    // Extract message text properly
    const messageText = typeof req.body === 'string' ? req.body : req.body.text;

    // Create message object
    const message = {
      text: messageText,
      userId: 'MGN',  // Hardcoded for now
      timestamp: Date.now()
    };

    console.log('Attempting to save message:', message);

    // Validate the message
    if (!message.text) {
      console.log('Message validation failed - text is missing');
      return res.status(400).json({
        success: false,
        error: 'Message text is required'
      });
    }

    // Reference to your messages collection
    const messagesRef = admin.database().ref('messages');
    
    // Push to Firebase
    const result = await messagesRef.push({
      text: String(message.text),  // Ensure text is a string
      userId: String(message.userId),  // Ensure userId is a string
      timestamp: Number(message.timestamp)  // Ensure timestamp is a number
    });

    console.log('Message successfully saved with ID:', result.key);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message saved successfully',
      messageId: result.key,
      savedMessage: message
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Failed to save message to database'
    });
  }
});

module.exports = router;