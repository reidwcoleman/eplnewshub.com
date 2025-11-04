# Authentication System Setup Guide

## Overview

This is a complete authentication system for EPL News Hub with:
- User registration and login
- Secure password hashing with bcrypt
- Session-based authentication
- Premium access for all authenticated users
- Modern UI with glassmorphism design

## Quick Start

### 1. Start the Authentication Server

```bash
node auth-server.js
```

The server will start on port 3001 (or the PORT specified in .env)

### 2. Access the System

- **Sign In**: http://localhost:3001/signin.html
- **Create Account**: http://localhost:3001/create-account.html
- **Account Dashboard**: http://localhost:3001/account.html (requires authentication)

## Features

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/status` | Check authentication status |
| GET | `/api/auth/profile` | Get user profile (protected) |
| PUT | `/api/auth/profile` | Update user profile (protected) |
| GET | `/api/health` | Health check |

### User Data Structure

```json
{
  "id": "unique-user-id",
  "email": "user@example.com",
  "name": "User Name",
  "password": "hashed-password",
  "createdAt": "2025-11-04T...",
  "lastLogin": "2025-11-04T...",
  "hasPremium": true,
  "tier": "premium"
}
```

### Security Features

- **Password Hashing**: bcrypt with salt rounds of 10
- **Session Management**: Secure HTTP-only cookies
- **Email Validation**: Server-side email format validation
- **Password Requirements**: Minimum 8 characters
- **Protected Routes**: Middleware to check authentication

## Protected Routes

To protect any page, add this script tag:

```html
<script src="/auth-check.js"></script>
```

The script will:
1. Check if the user is authenticated
2. Redirect to sign-in if not authenticated
3. Store the current page URL for redirect after login
4. Make user info available globally via `window.currentUser`

### Example Protected Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>Protected Page</title>
</head>
<body>
    <h1>Premium Content</h1>

    <!-- This will redirect to sign-in if not authenticated -->
    <script src="/auth-check.js"></script>

    <script>
        // Listen for authentication event
        window.addEventListener('userAuthenticated', (e) => {
            console.log('User:', e.detail);
            // Display user-specific content
        });
    </script>
</body>
</html>
```

## Pages

### 1. Sign In Page (`/signin.html`)
- Email and password form
- Client-side validation
- Error handling
- "Forgot password" link (placeholder)
- Link to create account

### 2. Create Account Page (`/create-account.html`)
- Full name (optional), email, password fields
- Password confirmation
- Password strength indicator
- Premium badge showing free access
- Client-side validation

### 3. Account Dashboard (`/account.html`)
- Profile information display
- Membership status (Premium)
- Quick links to:
  - FPL Premium Tools
  - Trading Portfolio
  - Latest News
  - Transfer Center
- Sign out button
- Protected route (requires authentication)

## Configuration

### Environment Variables (.env)

```bash
# Session Secret (auto-generated if not provided)
SESSION_SECRET=your-secret-key-here

# Server Port (default: 3001)
PORT=3001

# Node Environment
NODE_ENV=development
```

### Data Storage

User data is stored in `/data/users.json`:
- Automatically created on first run
- JSON format for easy reading/editing
- Should be added to .gitignore for security

## API Usage Examples

### Create Account

```javascript
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securepassword123'
    })
});

const data = await response.json();
// Returns: { success: true, user: {...} }
```

### Sign In

```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'john@example.com',
        password: 'securepassword123'
    })
});

const data = await response.json();
// Returns: { success: true, user: {...} }
```

### Check Authentication Status

```javascript
const response = await fetch('/api/auth/status');
const data = await response.json();

if (data.authenticated) {
    console.log('User:', data.user);
} else {
    console.log('Not authenticated');
}
```

### Sign Out

```javascript
const response = await fetch('/api/auth/logout', {
    method: 'POST'
});

const data = await response.json();
// Returns: { success: true }
```

## Premium Access

All authenticated users automatically get:
- `hasPremium: true`
- `tier: 'premium'`
- Access to all premium content
- Access to trading portfolio

## Styling

The authentication pages use:
- **Modern glassmorphism design** with backdrop blur
- **Purple gradient buttons** (#8b5cf6 to #6d28d9)
- **Dark theme** with gradient background
- **Responsive design** for mobile/desktop
- **Smooth animations** and transitions
- **Form validation** with visual feedback

## Next Steps

1. **Add to Protected Routes**: Add `<script src="/auth-check.js"></script>` to any page that should require authentication

2. **Integrate with Existing Features**: Update FPL tools, trading portfolio, and other premium features to check authentication

3. **Production Deployment**:
   - Set `NODE_ENV=production` in .env
   - Use strong `SESSION_SECRET`
   - Consider using a real database (MongoDB, PostgreSQL)
   - Enable HTTPS for secure cookies
   - Add rate limiting for API endpoints

4. **Optional Enhancements**:
   - Password reset functionality
   - Email verification
   - OAuth providers (Google, Facebook)
   - Two-factor authentication
   - Profile picture uploads
   - Account deletion

## Troubleshooting

### Users not persisting after server restart
- Make sure the `/data` directory exists
- Check file permissions on `users.json`

### Session not persisting
- Ensure `SESSION_SECRET` is set in .env
- Check cookie settings in browser
- Verify `express-session` is installed

### Cannot access protected routes
- Make sure `auth-check.js` is loaded before other scripts
- Check browser console for errors
- Verify server is running

## Support

For issues or questions, check:
- Server logs in terminal
- Browser console for client-side errors
- `/api/health` endpoint for server status

---

**Built with:**
- Express.js
- bcrypt
- express-session
- Modern ES6+ JavaScript
- Glassmorphism UI design
