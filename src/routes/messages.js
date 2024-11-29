const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');

router.post('/', async (req, res) => {
  try {
    console.log('Received message:', req.body);
    console.log('Firebase apps length:', admin.apps.length); // Add this log

    const messageText = req.body.message || req.body;
    
    if (!messageText) {
      console.log('Message text is empty'); // Add this log
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const message = {
      text: messageText,
      userId: 'MGN',
      timestamp: Date.now()
    };

    console.log('Attempting to save message:', message); // Add this log

    // Save to Firebase if initialized
    if (admin.apps.length) {
      console.log('Firebase is initialized, saving message...'); // Add this log
      const messagesRef = admin.database().ref('messages');
      try {
        const result = await messagesRef.push(message);
        console.log('Message saved successfully with key:', result.key); // Add this log
        return res.status(200).json({ 
          success: true,
          messageId: result.key
        });
      } catch (dbError) {
        console.error('Database operation error:', dbError); // Add this log
        throw dbError;
      }
    } else {
      console.log('Firebase is not initialized'); // Add this log
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

// Keep the GET route as is
router.get('/', async (req, res) => {
  // ... existing get handler code ...
});

module.exports = router;