# Secure Login System

A comprehensive secure login web application with hashed passwords, input validation, session management, and optional Two-Factor Authentication (2FA).

## Features

✅ **User Registration & Login** - Secure user authentication with bcrypt password hashing
✅ **Password Hashing** - Industry-standard bcrypt with configurable salt rounds
✅ **Input Validation** - Strict validation and sanitization to prevent SQL injection
✅ **Parameterized Queries** - All database queries use parameterized statements
✅ **Session Management** - Secure session handling with configurable expiration
✅ **Logout Feature** - Proper session destruction on logout
✅ **Two-Factor Authentication** - Optional 2FA using TOTP (Time-based One-Time Password)
✅ **Rate Limiting** - Protection against brute force attacks
✅ **Security Headers** - Helmet.js for HTTP security headers
✅ **Password Requirements** - Strong password enforcement (8+ chars, uppercase, lowercase, number, special char)

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Password Hashing**: bcrypt
- **2FA**: speakeasy & qrcode
- **Security**: helmet, express-rate-limit, express-session
- **Validation**: validator.js
- **Frontend**: EJS templates, vanilla JavaScript

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/crimsonvortex69/secure-login-system.git
   cd secure-login-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```
   NODE_ENV=development
   PORT=3000
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=secure_login_db
   SESSION_SECRET=generate-a-strong-random-string
   BCRYPT_ROUNDS=10
   ```

4. **Create PostgreSQL database**
   ```bash
   createdb secure_login_db
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:3000`

## API Endpoints

### Authentication Routes (`/auth`)

- **POST /auth/register** - Register new user
  ```json
  {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }
  ```

- **POST /auth/login** - Login user
  ```json
  {
    "username": "john_doe",
    "password": "SecurePass123!"
  }
  ```

- **POST /auth/setup-2fa** - Initialize 2FA setup
  
- **POST /auth/enable-2fa** - Enable 2FA with token verification
  ```json
  {
    "secret": "base32-encoded-secret",
    "token": "123456"
  }
  ```

- **POST /auth/verify-2fa** - Verify 2FA token during login
  ```json
  {
    "token": "123456"
  }
  ```

- **POST /auth/disable-2fa** - Disable 2FA

- **POST /auth/logout** - Logout user

### User Routes (`/user`)

- **GET /user/profile** - Get user profile (requires authentication)

- **PUT /user/email** - Update user email
  ```json
  {
    "email": "newemail@example.com"
  }
  ```

- **PUT /user/password** - Update password
  ```json
  {
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!",
    "confirmPassword": "NewSecurePass456!"
  }
  ```

## Security Features

### Password Security
- Hashed with bcrypt (10 salt rounds by default)
- Strong password requirements enforced
- Password validation on both client and server
- Secure password update mechanism

### Input Validation & Sanitization
- All user inputs are validated against strict rules
- HTML entity escaping to prevent XSS
- Email validation using industry standard
- Username format validation

### SQL Injection Prevention
- All database queries use parameterized statements
- No string concatenation in SQL queries
- Input sanitization before database operations

### Session Security
- HttpOnly cookies (prevents JavaScript access)
- Secure flag in production (HTTPS only)
- SameSite=strict to prevent CSRF
- Configurable session timeout (24 hours default)
- Automatic session destruction on logout

### Authentication Security
- Rate limiting on login endpoint (5 attempts per 15 minutes)
- Rate limiting on all endpoints (100 per 15 minutes)
- Helmet.js for security headers
- Parameterized queries for all DB operations

### Two-Factor Authentication
- TOTP-based 2FA using speakeasy
- QR code generation for authenticator apps
- Token window of 2 time periods for tolerance
- Optional but recommended for user accounts

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Password Requirements

Passwords must contain:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

Example: `MySecure@Pass123`

## Testing

Run tests with:
```bash
npm test
```

## Security Best Practices Implemented

1. ✅ Hash passwords with bcrypt (not plain text)
2. ✅ Use parameterized queries (prevent SQL injection)
3. ✅ Validate and sanitize all inputs
4. ✅ Secure session management (HttpOnly, Secure, SameSite)
5. ✅ Rate limiting (prevent brute force)
6. ✅ Security headers (Helmet.js)
7. ✅ Strong password requirements
8. ✅ Optional 2FA (TOTP)
9. ✅ Environment variables for secrets
10. ✅ CSRF protection through session management

## Production Deployment

Before deploying to production:

1. Set `NODE_ENV=production`
2. Generate a strong `SESSION_SECRET`
3. Use HTTPS (secure flag will be enabled)
4. Set strong database credentials
5. Configure proper CORS policies
6. Enable HSTS header
7. Use environment-specific database
8. Enable 2FA enforcement for admin accounts
9. Set up monitoring and logging
10. Regular security audits

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a pull request

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Disclaimer**: This is an educational project demonstrating security best practices. For production use, conduct security audits and penetration testing.
