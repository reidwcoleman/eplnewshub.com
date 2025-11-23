#!/bin/bash

# Create Mobile Article Versions Script
# Converts all desktop articles to mobile-optimized versions
# UltraThink Mobile Optimization System

echo "📱 Creating mobile versions of all articles..."

# Counter
count=0

# Copy all articles to mobile/articles/
for article in articles/*.html; do
    if [ -f "$article" ]; then
        filename=$(basename "$article")
        mobile_article="mobile/articles/$filename"

        # Copy article
        cp "$article" "$mobile_article"

        # Update links in the mobile article
        # Update article links
        sed -i 's|href="/articles/|href="/mobile/articles/|g' "$mobile_article"
        sed -i 's|href="articles/|href="mobile/articles/|g' "$mobile_article"
        sed -i 's|href="../articles/|href="../mobile/articles/|g' "$mobile_article"

        # Update root page links
        sed -i 's|href="/index.html"|href="/mobile/index.html"|g' "$mobile_article"
        sed -i 's|href="index.html"|href="/mobile/index.html"|g' "$mobile_article"
        sed -i 's|href="../index.html"|href="../mobile/index.html"|g' "$mobile_article"
        sed -i 's|href="/news.html"|href="/mobile/news.html"|g' "$mobile_article"
        sed -i 's|href="/fpl.html"|href="/mobile/fpl.html"|g' "$mobile_article"
        sed -i 's|href="/polls.html"|href="/mobile/polls.html"|g' "$mobile_article"
        sed -i 's|href="/transfer-center.html"|href="/mobile/transfer-center.html"|g' "$mobile_article"

        # Add desktop redirect script after <head> tag
        sed -i '/<head>/a\    <!-- Desktop Redirect Script -->\n    <script src="/desktop-redirect.js"></script>' "$mobile_article"

        # Update viewport for mobile optimization (if not already optimal)
        sed -i 's|<meta name="viewport" content="width=device-width, initial-scale=1.0">|<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">|g' "$mobile_article"

        # Add mobile-optimized meta tag
        if ! grep -q 'name="mobile-optimized"' "$mobile_article"; then
            sed -i '/<meta name="viewport"/a\    <meta name="mobile-optimized" content="true">' "$mobile_article"
        fi

        # Update title to indicate mobile version
        sed -i 's|</title>| (Mobile)</title>|g' "$mobile_article"

        # Add mobile-optimized CSS for touch targets and responsive design
        sed -i '/<\/head>/i\    <style>\n        /* Mobile Optimization - UltraThink */\n        @media (max-width: 768px) {\n            body { font-size: 16px; line-height: 1.6; }\n            .article-headline { font-size: 32px !important; line-height: 1.15 !important; }\n            .article-standfirst { font-size: 16px !important; }\n            .article-body p { font-size: 16px !important; }\n            img { max-width: 100%; height: auto; }\n            button, a { min-height: 44px; min-width: 44px; }\n            * { -webkit-tap-highlight-color: rgba(0,0,0,0.1); }\n        }\n    </style>' "$mobile_article"

        ((count++))
        echo "✅ Created: $mobile_article"
    fi
done

echo "✨ Created $count mobile article versions!"
