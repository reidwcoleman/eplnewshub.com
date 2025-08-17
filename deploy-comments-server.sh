#!/bin/bash

echo "EPL News Hub Comments Server Deployment Helper"
echo "=============================================="
echo ""
echo "Choose your deployment platform:"
echo ""
echo "1) Deploy to Render (Recommended - Free tier available)"
echo "2) Deploy to Railway (Simple GitHub integration)"
echo "3) Deploy to Vercel (Serverless function)"
echo "4) Deploy to Heroku (If you have an account)"
echo "5) Run locally for testing"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "=== Deploy to Render ==="
        echo ""
        echo "Steps to deploy on Render:"
        echo "1. Go to https://render.com"
        echo "2. Sign up/login with GitHub"
        echo "3. Click 'New +' → 'Web Service'"
        echo "4. Connect your GitHub repository"
        echo "5. Select the eplnewshub.com repository"
        echo "6. Use these settings:"
        echo "   - Name: eplnewshub-comments"
        echo "   - Runtime: Node"
        echo "   - Build Command: npm install"
        echo "   - Start Command: node comments-server.js"
        echo "7. Click 'Create Web Service'"
        echo "8. Once deployed, copy the URL (e.g., https://eplnewshub-comments.onrender.com)"
        echo "9. Update comments-system-api.js with the new URL"
        echo ""
        echo "The render.yaml file has been created for automatic configuration."
        ;;
        
    2)
        echo ""
        echo "=== Deploy to Railway ==="
        echo ""
        echo "Steps to deploy on Railway:"
        echo "1. Go to https://railway.app"
        echo "2. Sign in with GitHub"
        echo "3. Click 'New Project'"
        echo "4. Select 'Deploy from GitHub repo'"
        echo "5. Choose your eplnewshub.com repository"
        echo "6. Railway will auto-detect the Node.js app"
        echo "7. Once deployed, go to Settings → Domains"
        echo "8. Generate a domain (e.g., eplnewshub-comments.up.railway.app)"
        echo "9. Update comments-system-api.js with the new URL"
        echo ""
        echo "The railway.json file has been created for configuration."
        ;;
        
    3)
        echo ""
        echo "=== Deploy to Vercel ==="
        echo ""
        echo "Using Vercel CLI (already installed locally):"
        echo ""
        echo "Run: npx vercel"
        echo ""
        echo "Or manually:"
        echo "1. Go to https://vercel.com"
        echo "2. Sign in with GitHub"
        echo "3. Import your repository"
        echo "4. Vercel will use the vercel.json configuration"
        echo "5. Get your deployment URL"
        echo "6. Update comments-system-api.js with the new URL"
        echo ""
        echo "The vercel.json file has been created."
        ;;
        
    4)
        echo ""
        echo "=== Deploy to Heroku ==="
        echo ""
        echo "If you have Heroku CLI installed:"
        echo "1. heroku create eplnewshub-comments"
        echo "2. git push heroku main"
        echo "3. Update comments-system-api.js with your Heroku URL"
        echo ""
        echo "Or use the Heroku dashboard to connect to GitHub."
        ;;
        
    5)
        echo ""
        echo "Starting local comments server..."
        echo ""
        npm run comments
        ;;
        
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "=== Important Next Steps ==="
echo ""
echo "After deployment:"
echo "1. Get your production URL from the platform"
echo "2. Update comments-system-api.js line 2:"
echo "   Change the API_BASE_URL to your production URL"
echo "3. Commit and push the changes"
echo "4. Test by posting a comment on any article"
echo ""
echo "Need help? Check COMMENTS_DEPLOYMENT.md for detailed instructions."