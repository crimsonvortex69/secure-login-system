const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { query } = require('../config/database');
const { validateInputs, sanitizeInput } = require('../utils/validation');

// Register user
const registerUser = async (username, email, password, confirmPassword) => {
  // Validate inputs
  const validationErrors = validateInputs(username, email, password);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(', '));
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  // Sanitize inputs
  username = sanitizeInput(username);
  email = sanitizeInput(email);

  try {
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Username or email already exists');
    }

    // Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user into database
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, passwordHash]
    );

    return result.rows[0];
  } catch (err) {
    throw new Error(`Registration failed: ${err.message}`);
  }
};

// Login user
const loginUser = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  username = sanitizeInput(username);

  try {
    // Query user by username (parameterized query prevents SQL injection)
    const result = await query(
      'SELECT id, username, email, password_hash, two_fa_enabled FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid username or password');
    }

    const user = result.rows[0];

    // Compare password with hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Invalid username or password');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      two_fa_enabled: user.two_fa_enabled
    };
  } catch (err) {
    throw new Error(`Login failed: ${err.message}`);
  }
};

// Setup 2FA
const setup2FA = async (userId) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `SecureLoginApp (${userId})`,
      issuer: 'SecureLoginApp'
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCode
    };
  } catch (err) {
    throw new Error(`2FA setup failed: ${err.message}`);
  }
};

// Enable 2FA
const enable2FA = async (userId, secret) => {
  try {
    await query(
      'UPDATE users SET two_fa_enabled = true, two_fa_secret = $1 WHERE id = $2',
      [secret, userId]
    );

    return { success: true };
  } catch (err) {
    throw new Error(`Failed to enable 2FA: ${err.message}`);
  }
};

// Verify 2FA token
const verify2FAToken = async (userId, token) => {
  try {
    const result = await query(
      'SELECT two_fa_secret FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const secret = result.rows[0].two_fa_secret;

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      throw new Error('Invalid 2FA token');
    }

    return { success: true };
  } catch (err) {
    throw new Error(`2FA verification failed: ${err.message}`);
  }
};

// Disable 2FA
const disable2FA = async (userId) => {
  try {
    await query(
      'UPDATE users SET two_fa_enabled = false, two_fa_secret = NULL WHERE id = $1',
      [userId]
    );

    return { success: true };
  } catch (err) {
    throw new Error(`Failed to disable 2FA: ${err.message}`);
  }
};

module.exports = {
  registerUser,
  loginUser,
  setup2FA,
  enable2FA,
  verify2FAToken,
  disable2FA
};
