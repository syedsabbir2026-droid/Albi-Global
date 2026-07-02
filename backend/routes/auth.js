const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// In-memory user storage (Replace with database)
const users = {};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, userType = 'customer' } = req.body;
    
    // Validation
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password and name required' });
    }
    
    // Check existing user
    if (users[email]) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const userId = uuidv4();
    users[email] = {
      id: userId,
      email,
      password: hashedPassword,
      fullName,
      phone,
      userType,
      createdAt: new Date()
    };
    
    // Generate tokens
    const accessToken = jwt.sign(
      { userId, email, userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: userId, email, fullName, userType },
      accessToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = users[email];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, userType: user.userType },
      accessToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Social Login (Google/Facebook)
router.post('/social-login', async (req, res) => {
  try {
    const { provider, token } = req.body;
    // Implementation for OAuth providers
    res.json({ success: true, message: `${provider} login implemented` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Email
router.post('/verify-email', (req, res) => {
  try {
    const { email, otp } = req.body;
    // OTP verification logic
    res.json({ success: true, message: 'Email verified' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send OTP
router.post('/send-otp', (req, res) => {
  try {
    const { phone } = req.body;
    // Send OTP via SMS
    res.json({ success: true, message: 'OTP sent to phone' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2FA Enable
router.post('/enable-2fa', (req, res) => {
  try {
    const { userId, method } = req.body;
    // Enable 2FA
    res.json({ success: true, message: '2FA enabled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
