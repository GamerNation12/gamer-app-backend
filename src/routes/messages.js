const express = require('express');
const router = express.Router();

// Get messages
router.get('/messages', async (req, res) => {
  try {
    // Return messages in the expected array format
    res.status(200).json({
      messages: [] // This will be populated with actual messages
    });
  } catch (error) {
    console.error('Error loading messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/messages', async (req, res) => {
  try {
    const { id, sender, content, timestamp, platform } = req.body;
    
    // Validate message format
    if (!sender || !content) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    const message = {
      id: id || Date.now().toString(),
      sender,
      content,
      timestamp: timestamp || Date.now(),
      platform: platform || 'Web'
    };

    // TODO: Save message to database
    
    res.status(200).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;