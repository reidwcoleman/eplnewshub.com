# Comments System Deployment Guide

## Overview
The EPL News Hub comments system uses a Node.js backend server to store and retrieve comments that are shared across all users.

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Comments Server
```bash
# Development mode (with auto-reload)
npm run comments-dev

# Production mode
npm run comments
```

The server will run on `http://localhost:3001`

### 3. Test the System
- Open any article page on your local site
- Post a comment
- Open the same article in another browser/incognito window
- You should see the same comments

## Production Deployment Options

### Option 1: Deploy to Heroku (Free Tier Available)

1. Create a Heroku account at https://heroku.com
2. Install Heroku CLI
3. Create a new Heroku app:
```bash
heroku create eplnewshub-comments
```

4. Deploy the server:
```bash
git add .
git commit -m "Add comments server"
git push heroku main
```

5. Update `comments-system-api.js` with your Heroku URL:
```javascript
const API_BASE_URL = 'https://eplnewshub-comments.herokuapp.com/api';
```

### Option 2: Deploy to Vercel (Recommended - Free)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "comments-server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "comments-server.js"
    }
  ]
}
```

3. Deploy:
```bash
vercel
```

4. Update the API URL in `comments-system-api.js`

### Option 3: Deploy to Railway (Simple & Free)

1. Go to https://railway.app
2. Connect your GitHub repository
3. Railway will auto-detect Node.js and deploy
4. Get your production URL and update `comments-system-api.js`

### Option 4: Use Firebase Realtime Database (No Server Needed)

For a serverless solution, you can modify the system to use Firebase:

1. Create a Firebase project
2. Enable Realtime Database
3. Update `comments-system-api.js` to use Firebase SDK instead of fetch API
4. No server deployment needed!

## Environment Variables

Create a `.env` file for production:
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://eplnewshub.com
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/comments/:articleId` - Get comments for an article
- `POST /api/comments/:articleId` - Post a new comment
- `POST /api/comments/:articleId/:commentId/like` - Like/unlike a comment
- `PUT /api/comments/:articleId/:commentId` - Edit a comment
- `DELETE /api/comments/:articleId/:commentId` - Delete a comment
- `POST /api/comments/:articleId/:commentId/reply` - Reply to a comment

## Data Storage

Comments are stored in `comments-data.json` file. In production, you should:
1. Use a proper database (MongoDB, PostgreSQL, etc.)
2. Or use a cloud storage service (Firebase, AWS S3, etc.)
3. Make regular backups of the comments data

## Security Considerations

1. Add rate limiting to prevent spam
2. Implement content moderation
3. Add user authentication for better accountability
4. Sanitize HTML input to prevent XSS attacks
5. Use HTTPS in production

## Monitoring

Monitor your comments server with:
- Server logs
- Error tracking (Sentry, LogRocket)
- Uptime monitoring (UptimeRobot, Pingdom)

## Quick Start for GitHub Pages

Since GitHub Pages only serves static files, you need to deploy the comments server separately:

1. Keep your site on GitHub Pages
2. Deploy comments server to Vercel/Railway/Heroku
3. Update the API URL in your frontend code
4. Comments will now be shared across all users!

## Support

For issues or questions, check:
- Server logs: `npm run comments` will show real-time logs
- Comments data: Check `comments-data.json` for stored comments
- Network tab: Check browser DevTools for API calls