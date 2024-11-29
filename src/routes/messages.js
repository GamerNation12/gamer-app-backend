const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');

// ... keep GET route the same ...

router.post('/', async (req, res) => {
  try {
    console.log('Received message:', req.body);
    console.log('Firebase apps length:', admin.apps.length);

    // Validate the incoming message
    if (!req.body || !req.body.content) {
      console.log('Message content is empty');
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }

    // Create message object using the incoming format
    const message = {
      id: req.body.id,
      sender: req.body.sender,
      content: req.body.content,
      timestamp: req.body.timestamp,
      platform: req.body.platform
    };

    console.log('Attempting to save message:', message);

    // Save to Firebase if initialized
    if (admin.apps.length) {
      console.log('Firebase is initialized, saving message...');
      const messagesRef = admin.database().ref('messages');
      try {
        const result = await messagesRef.push(message);
        console.log('Message saved successfully with key:', result.key);
        return res.status(200).json({ 
          success: true,
          messageId: result.key
        });
      } catch (dbError) {
        console.error('Database operation error:', dbError);
        throw dbError;
      }
    } else {
      console.log('Firebase is not initialized');
      return res.status(200).json({ 
        success: true,
        message: 'Message received (Firebase not initialized)'
      });
    }
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;