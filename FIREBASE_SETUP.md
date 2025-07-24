# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for EPL News Hub.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "eplnewshub-auth")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Enable the following sign-in providers:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Google**: Click on it, toggle "Enable", and add your project's support email

## Step 3: Get Your Firebase Configuration

1. Click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon (`</>`) to add a web app
5. Register your app with a nickname (e.g., "EPL News Hub Web")
6. Copy the Firebase configuration object

## Step 4: Update Your Code

Replace the Firebase configuration in both `signin.html` and `create-account.html`:

### In signin.html (lines 31-38):
```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

### In create-account.html (lines 31-38):
```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## Step 5: Set Up Authorized Domains

1. In Firebase Console, go to Authentication > Settings
2. Scroll down to "Authorized domains"
3. Add your domains:
   - `localhost` (for local testing)
   - `eplnewshub.com` (your production domain)
   - Any other domains you'll use

## Step 6: Test Your Setup

1. Open your website locally or on your domain
2. Try creating a new account with email/password
3. Try signing in with the created account
4. Try signing in with Google

## Features Implemented

### ✅ Email/Password Authentication
- User registration with validation
- User sign-in with error handling
- Password strength checking
- Form validation and error messages

### ✅ Google Sign-In
- One-click Google authentication
- Automatic account creation
- Profile information retrieval

### ✅ User State Management
- User information stored in localStorage
- Automatic redirect if already signed in
- Persistent login state

### ✅ User Experience
- Loading states during authentication
- Clear error messages
- Success notifications
- Mobile-responsive design

## Security Features

- **Client-side validation**: Form validation before submission
- **Firebase security**: Built-in security rules and authentication
- **Password requirements**: Minimum 8 characters with strength checking
- **Error handling**: Proper error messages without exposing sensitive info

## Troubleshooting

### Common Issues:

1. **"Firebase not properly initialized" error**
   - Make sure you've replaced the placeholder Firebase config with your actual config

2. **Google Sign-In not working**
   - Ensure your domain is added to Authorized domains in Firebase Console
   - Check that Google sign-in is enabled in Authentication > Sign-in method

3. **"auth/operation-not-allowed" error**
   - Make sure Email/Password authentication is enabled in Firebase Console

4. **Localhost not working**
   - Add `localhost` to Authorized domains in Firebase Console

## Next Steps (Optional Enhancements)

1. **Email Verification**: Require users to verify their email
2. **Password Reset**: Implement forgot password functionality
3. **User Profile Management**: Allow users to update their profile
4. **Database Integration**: Store additional user data in Firestore
5. **Admin Panel**: Create an admin interface for user management

## Security Best Practices

- Never commit your Firebase config with sensitive keys to public repositories
- Use Firebase Security Rules to protect your data
- Implement proper client-side validation
- Consider implementing rate limiting for authentication attempts
- Monitor authentication logs in Firebase Console

---

**Need Help?**
- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web SDK Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Console](https://console.firebase.google.com/)