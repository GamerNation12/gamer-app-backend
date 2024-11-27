const admin = require('../config/firebase');
const router = require('express').Router();

router.post('/messages', async (req, res) => {
  try {
    const { text, userId, timestamp } = req.body;
    
    // Log the full request body
    console.log('Full request body:', req.body);
    
    if (!text || !userId) {
      throw new Error('Missing required fields: text and userId are required');
    }
    
    // Verify Firebase connection
    console.log('Checking Firebase connection...');
    const messagesRef = admin.database().ref('messages');
    
    const newMessage = {
      text,
      userId,
      timestamp: timestamp || Date.now(),
    };
    
    console.log('Attempting to save message:', newMessage);
    
    // Push to Firebase and wait for completion
    const result = await messagesRef.push(newMessage);
    console.log('Message saved with ID:', result.key);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message saved successfully',
      messageId: result.key,
      savedMessage: newMessage
    });
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;