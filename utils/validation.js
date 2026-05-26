const validator = require('validator');

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

const validateUsername = (username) => {
  // 3-20 alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

const sanitizeInput = (input) => {
  return validator.escape(String(input).trim());
};

const validateInputs = (username, email, password) => {
  const errors = [];

  if (!validateUsername(username)) {
    errors.push('Username must be 3-20 characters and contain only letters, numbers, and underscores');
  }

  if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!validatePassword(password)) {
    errors.push('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  }

  return errors;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  sanitizeInput,
  validateInputs
};
