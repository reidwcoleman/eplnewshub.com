# Quick Deployment Guide - Comments Server

Your comments system is ready to deploy! The server is configured and all files are in place.

## Option 1: Deploy to Render (Recommended - Free)
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo (eplnewshub.com)
5. It will auto-detect settings from render.yaml
6. Click "Create Web Service"
7. Get your URL (e.g., https://eplnewshub-comments.onrender.com)
8. Update line 2 in comments-system-api.js with your URL
9. Push the change

## Option 2: Deploy to Railway (Also Free)
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select eplnewshub.com
5. Get your domain from Settings → Domains
6. Update comments-system-api.js with the URL
7. Push the change

## Option 3: Use the Helper Script
Run this command:
```bash
./deploy-comments-server.sh
```

## Final Step
After deployment, update comments-system-api.js:
```javascript
// Change line 2 from:
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : 'https://eplnewshub-comments.herokuapp.com/api';

// To your production URL:
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api' 
    : 'https://YOUR-DEPLOYMENT-URL/api';
```

## Test Your Deployment
1. Visit any article on your site
2. Post a test comment
3. Open the same article in another browser
4. You should see the same comment!

That's it! Your comments will now be shared across all users.