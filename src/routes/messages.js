router.post('/messages', async (req, res) => {
  try {
    const { text, userId, timestamp } = req.body;
    console.log('Received message:', { text, userId, timestamp });

    if (!text || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const messagesRef = admin.database().ref('messages');
    const newMessage = {
      text,
      userId,
      timestamp: timestamp || Date.now(),
    };
    
    console.log('Attempting to save message:', newMessage);
    const result = await messagesRef.push(newMessage);
    console.log('Message saved with ID:', result.key);
    
    res.status(200).json({ 
      success: true, 
      message: 'Message saved successfully',
      messageId: result.key 
    });
  } catch (error) {
    console.error('Error saving message:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});