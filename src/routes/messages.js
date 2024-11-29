router.post('/', async (req, res) => {
  try {
    console.log('Received message:', req.body);

    const messageText = req.body.message || req.body;
    
    if (!messageText) {
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

    // Save to Firebase if initialized
    if (!admin.apps.length) {
      // If Firebase isn't initialized, just return success
      return res.status(200).json({ 
        success: true,
        message: 'Message received (Firebase not initialized)'
      });
    }

    const messagesRef = admin.database().ref('messages');
    const result = await messagesRef.push(message);
    
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