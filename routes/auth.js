const express = require('express');
const rateLimit = require('express-rate-limit');
const authService = require('../services/authService');
const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await authService.registerUser(username, email, password, confirmPassword);

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: user
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login route
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await authService.loginUser(username, password);

    if (user.two_fa_enabled) {
      // Store temporary user data for 2FA verification
      req.session.tempUser = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      return res.status(200).json({
        message: '2FA verification required',
        two_fa_required: true
      });
    }

    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.status(200).json({
      message: 'Login successful',
      user: user
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Setup 2FA route
router.post('/setup-2fa', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { secret, qrCode } = await authService.setup2FA(req.session.user.id);

    res.status(200).json({
      message: '2FA setup initiated',
      secret: secret,
      qrCode: qrCode
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify and enable 2FA route
router.post('/enable-2fa', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({ error: 'Secret and token are required' });
    }

    // Verify token before enabling
    const verified = await authService.verify2FAToken(req.session.user.id, token);

    if (verified.success) {
      await authService.enable2FA(req.session.user.id, secret);
      res.status(200).json({ message: '2FA enabled successfully' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Verify 2FA token route
router.post('/verify-2fa', async (req, res) => {
  try {
    if (!req.session.tempUser) {
      return res.status(401).json({ error: 'No pending 2FA verification' });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const verified = await authService.verify2FAToken(req.session.tempUser.id, token);

    if (verified.success) {
      // Move tempUser to authenticated session
      req.session.user = req.session.tempUser;
      delete req.session.tempUser;

      res.status(200).json({
        message: '2FA verification successful',
        user: req.session.user
      });
    }
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Disable 2FA route
router.post('/disable-2fa', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await authService.disable2FA(req.session.user.id);

    res.status(200).json({ message: '2FA disabled successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
