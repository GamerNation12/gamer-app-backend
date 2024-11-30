const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    // Basic login endpoint
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Login failed' });
  }
});

module.exports = router;