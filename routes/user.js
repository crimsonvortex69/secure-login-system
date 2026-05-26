const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Get user profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, two_fa_enabled, created_at FROM users WHERE id = $1',
      [req.session.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Update user email
router.put('/email', isAuthenticated, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists
    const existingEmail = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, req.session.user.id]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    await query(
      'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [email, req.session.user.id]
    );

    req.session.user.email = email;

    res.status(200).json({ message: 'Email updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// Update password
router.put('/password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const bcrypt = require('bcrypt');
    const { validatePassword } = require('../utils/validation');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.session.user.id]
    );

    const passwordMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.session.user.id]
    );

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
