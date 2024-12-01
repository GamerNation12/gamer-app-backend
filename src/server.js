// Load initial messages from Firebase
async function loadMessagesFromDB() {
  try {
    console.log('Starting to load messages from database...');
    const snapshot = await messagesRef.orderBy('timestamp', 'desc').limit(100).get();
    console.log('Got snapshot from database:', snapshot.size, 'documents');
    
    if (snapshot.empty) {
      console.log('No messages found in database');
      return [];
    }

    global.messages = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Loading message:', data);
      return {
        id: doc.id,
        ...data
      };
    }).reverse();
    
    console.log('Successfully loaded messages from database:', global.messages.length);
    return global.messages;
  } catch (error) {
    console.error('Error loading messages from DB:', error);
    console.error('Error details:', error.message, error.code);
    return [];
  }
}

// Initialize server after loading messages
async function initializeServer() {
  console.log('Starting server initialization...');
  try {
    // Load messages first
    console.log('Loading messages...');
    const messages = await loadMessagesFromDB();
    console.log('Loaded messages:', messages.length);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      console.log('Current messages in memory:', global.messages.length);

      // Send existing messages to newly connected client
      socket.emit('receive_messages', { messages: global.messages });
      console.log('Sent initial messages to client:', global.messages.length);

      // ... rest of the socket handling code ...
    });

    // Start server
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Messages loaded in memory:', global.messages.length);
    });
  } catch (error) {
    console.error('Error during server initialization:', error);
    throw error;
  }
}