const admin = require('../config/firebase');
const router = require('express').Router();

// Add GET route for messages
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

// Existing POST route
router.post('/messages', async (req, res) => {
  try {
    const { text, userId, timestamp } = req.body;
    console.log('Received message:', { text, userId, timestamp });

    const messagesRef = admin.database().ref('messages');
    const newMessage = {
      text,
      userId,
      timestamp: timestamp || Date.now(),
    };
    
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