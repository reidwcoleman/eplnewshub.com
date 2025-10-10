# Google OAuth Setup Guide

To enable Google Sign-In functionality, you need to set up Google OAuth credentials.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (Legacy) or Google Identity API

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "EPL News Hub"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes: email, profile, openid
5. Save and continue

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the name: "EPL News Hub Web Client"
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
   - `https://yourdomain.com/auth/google/callback` (for production)
6. Click "Create"
7. Copy the Client ID and Client Secret

## Step 4: Update Environment Variables

Edit your `.env` file and replace the placeholder values:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

## Step 5: Test the Integration

1. Restart your server: `npm start`
2. Navigate to `http://localhost:3000/signin.html`
3. The Google Sign-In button should now appear and work properly

## Troubleshooting

- **Error 401: invalid_client**: Your Client ID is incorrect or not set
- **Error 400: redirect_uri_mismatch**: Add the correct redirect URI in Google Cloud Console
- **Button not appearing**: Check browser console for configuration errors

## Production Deployment

For production deployment:
1. Add your production domain to authorized redirect URIs
2. Update the `GOOGLE_REDIRECT_URI` in your production `.env` file
3. Ensure HTTPS is enabled for your production site