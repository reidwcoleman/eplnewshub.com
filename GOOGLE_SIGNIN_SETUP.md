# Google Sign-In Setup Guide for EPL News Hub

## Overview
This guide will help you set up Google Sign-In for your EPL News Hub website using Firebase Authentication.

## Prerequisites
- A Google account
- Access to Firebase Console
- Your website deployed or running locally

## Step 1: Enable Google Sign-In in Firebase Console

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project: `epl-news-hub-94c09`

2. **Navigate to Authentication**
   - In the left sidebar, click on "Authentication"
   - Click on the "Sign-in method" tab

3. **Enable Google Provider**
   - Find "Google" in the list of providers
   - Click on it to open settings
   - Toggle the "Enable" switch to ON
   - **Important**: Add a "Support email" (use your email address)
   - Click "Save"

## Step 2: Configure Authorized Domains

1. **In Firebase Console**
   - Go to Authentication → Settings
   - Scroll to "Authorized domains"
   - Add these domains:
     - `localhost` (already added by default)
     - `eplnewshub.com`
     - `www.eplnewshub.com`
     - Any other domains where your site is hosted

2. **Save Changes**
   - Click "Add domain" for each domain
   - Domains are automatically saved

## Step 3: Configure OAuth Consent Screen (if needed)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your Firebase project

2. **Navigate to OAuth Consent Screen**
   - In the left menu, go to "APIs & Services" → "OAuth consent screen"

3. **Configure Basic Information**
   - App name: EPL News Hub
   - User support email: Your email
   - App logo: Upload your logo (optional)
   - Application home page: https://eplnewshub.com
   - Application privacy policy link: https://eplnewshub.com/privacy
   - Application terms of service link: https://eplnewshub.com/terms
   - Authorized domains: Add eplnewshub.com

4. **Save and Continue**

## Step 4: Test Your Implementation

1. **Open the Test Page**
   - Navigate to: `/google-signin-test.html`
   - This page will show you the status of all Firebase components

2. **Check Status Indicators**
   - Firebase SDK: Should show "✓ Loaded"
   - Auth Service: Should show "✓ Initialized"
   - Google Provider: Should show "✓ Configured"

3. **Test Sign-In**
   - Click "Sign in with Google"
   - A popup should appear with Google sign-in
   - Select your Google account
   - You should see your user information displayed

## Step 5: Troubleshooting Common Issues

### Issue: "Popup was blocked"
**Solution:**
- Allow popups for your site in browser settings
- Chrome: Click the blocked popup icon in the address bar
- Firefox: Click "Options" in the yellow notification bar
- Safari: Safari → Preferences → Websites → Pop-up Windows

### Issue: "403: restricted_client"
**Solution:**
- Google provider is not enabled in Firebase Console
- Follow Step 1 to enable Google Sign-In

### Issue: "Invalid API key"
**Solution:**
- Check that the Firebase config in your code matches your project
- Verify in Firebase Console → Project Settings → General

### Issue: "This domain is not authorized"
**Solution:**
- Add your domain to authorized domains (Step 2)
- Wait a few minutes for changes to propagate

### Issue: "Sign-in popup closed by user"
**Solution:**
- This is normal if the user closes the popup
- No action needed, just try again

## Step 6: Production Deployment

1. **Update Firebase Config**
   - Ensure your production domain is in authorized domains
   - Test sign-in on your production URL

2. **Security Rules**
   - Set up Firebase Security Rules if using Firestore/Realtime Database
   - Configure appropriate read/write permissions

3. **Monitor Usage**
   - Check Firebase Console → Authentication → Users
   - View sign-in methods and user activity

## Current Implementation Files

The Google Sign-In is implemented in these files:
- `/signin.html` - Main sign-in page
- `/create-account.html` - Account creation page
- `/google-signin-test.html` - Test and debug page

## Firebase Configuration

Your Firebase project configuration:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCyOey0l27yQP68oybpoodMVcvayhIHt2I",
    authDomain: "epl-news-hub-94c09.firebaseapp.com",
    projectId: "epl-news-hub-94c09",
    storageBucket: "epl-news-hub-94c09.firebasestorage.app",
    messagingSenderId: "674703933278",
    appId: "1:674703933278:web:90c6dd4aa9f1ace73099cf",
    measurementId: "G-ECM6BCQCS8"
};
```

## User Data Storage

When a user signs in, their data is stored in localStorage:
```javascript
{
    uid: "unique_user_id",
    email: "user@example.com",
    displayName: "User Name",
    photoURL: "profile_photo_url",
    signedInAt: "2024-01-01T00:00:00.000Z"
}
```

## Next Steps

1. **Enable Email/Password Sign-In** (Optional)
   - In Firebase Console, enable Email/Password provider
   - Already implemented in your code

2. **Add More Social Providers** (Optional)
   - Facebook, Twitter, GitHub, etc.
   - Each requires separate configuration

3. **Implement User Profiles**
   - Store additional user data in Firestore
   - Create user profile pages

4. **Add Role-Based Access**
   - Implement admin users
   - Restrict certain content to signed-in users

## Support

If you encounter issues:
1. Check the browser console for errors
2. Use the test page (`/google-signin-test.html`) for debugging
3. Verify all steps in this guide are completed
4. Check Firebase Console for any warnings or errors

## Security Notes

- Never expose sensitive Firebase configuration in public repositories
- Use Firebase Security Rules to protect user data
- Implement proper session management
- Consider implementing two-factor authentication for sensitive operations

---

Last Updated: January 2025