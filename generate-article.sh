#!/bin/bash

# EPL News Hub - Article Generator with Grok
# ==========================================

echo "🚀 EPL News Hub - Grok Article Generator"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Grok API key is set
if [ -z "$GROK_API_KEY" ]; then
    echo "⚠️  Warning: GROK_API_KEY environment variable not set."
    echo "You can set it using: export GROK_API_KEY='your-api-key'"
    echo ""
fi

# Run the article generator
node grok-article-generator.js

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "✅ Article generation complete!"
    
    # Optionally commit and push changes
    read -p "Do you want to commit and push changes to git? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add articles/*.html main_headline.html main_subheadline*.html
        git commit -m "Add new article generated with Grok AI"
        git push
        echo "✅ Changes pushed to repository!"
    fi
else
    echo "❌ Article generation failed. Please check the error messages above."
fi