# EPL News Hub - Account Creation Setup

This guide explains how to set up and run the account creation functionality for EPL News Hub.

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Access the Website**
   - Open your browser and go to `http://localhost:3000`
   - Navigate to the "Create Account" page

## Features

### Account Creation
- **Frontend Features:**
  - Real-time password strength validation
  - Email format validation
  - Form field validation with error messages
  - Team preference selection
  - Newsletter subscription option
  - Responsive design

- **Backend Features:**
  - Secure password hashing with bcrypt
  - Email uniqueness validation
  - User data storage in JSON file
  - Newsletter subscription integration
  - Comprehensive error handling

### API Endpoints

#### POST `/api/create-account`
Creates a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "country": "UK",
  "favoriteTeams": ["Arsenal", "Liverpool"],
  "newsletter": true
}
```

**Response (Success):**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "generated-user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "country": "UK",
    "favoriteTeams": ["Arsenal", "Liverpool"],
    "newsletter": true,
    "createdAt": "2025-01-22T..."
  }
}
```

#### GET `/api/admin/stats`
Returns user statistics (for admin use).

**Response:**
```json
{
  "totalUsers": 10,
  "totalSubscriptions": 15,
  "verifiedUsers": 8,
  "activeUsers": 10,
  "usersByCountry": {
    "UK": 5,
    "US": 3,
    "CA": 2
  },
  "usersWithNewsletter": 7
}
```

## File Structure

```
├── server.js              # Express server with API endpoints
├── package.json           # Node.js dependencies
├── users.json             # User data storage (auto-created)
├── subscriptions.json     # Newsletter subscriptions (auto-created)
├── create-account.html    # Account creation form
└── SETUP.md              # This setup guide
```

## Security Features

- **Password Hashing:** Uses bcrypt with 12 salt rounds
- **Email Validation:** Server-side email format validation
- **Input Sanitization:** Trims whitespace and validates input lengths
- **Unique Email Enforcement:** Prevents duplicate accounts
- **Error Handling:** Comprehensive error messages without exposing sensitive data

## Data Storage

User data is stored in `users.json` with the following structure:
```json
{
  "id": "unique-user-id",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "hashed-password",
  "country": "UK",
  "favoriteTeams": ["Arsenal", "Liverpool"],
  "newsletter": true,
  "createdAt": "2025-01-22T...",
  "verified": false,
  "verificationToken": "random-token",
  "lastLogin": null,
  "isActive": true
}
```

## Testing

1. Start the server: `npm start`
2. Open `http://localhost:3000/create-account.html`
3. Fill out the form with valid data
4. Submit the form
5. Check `users.json` for the new user entry

## Troubleshooting

- **Port 3000 in use:** Change the PORT variable in server.js
- **Permission errors:** Ensure write permissions for the project directory
- **Dependencies missing:** Run `npm install` to install required packages

## Next Steps

To extend this functionality:
- Add email verification
- Implement user authentication/login
- Add password reset functionality
- Integrate with a proper database (MongoDB, PostgreSQL, etc.)
- Add user profile management
- Implement session management