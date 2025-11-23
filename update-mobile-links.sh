#!/bin/bash

# Update Mobile Links Script
# Converts all article links in mobile directory to point to mobile versions
# UltraThink Mobile Optimization System

echo "🔧 Updating mobile component links..."

# Update all HTML files in mobile directory
for file in mobile/*.html; do
    if [ -f "$file" ]; then
        # Update article links: /articles/ -> /mobile/articles/
        sed -i 's|href="/articles/|href="/mobile/articles/|g' "$file"
        sed -i 's|href="articles/|href="mobile/articles/|g' "$file"
        sed -i 's|href="./articles/|href="./mobile/articles/|g' "$file"

        # Update root page links to mobile versions
        sed -i 's|href="/index.html"|href="/mobile/index.html"|g' "$file"
        sed -i 's|href="index.html"|href="mobile/index.html"|g' "$file"
        sed -i 's|href="/news.html"|href="/mobile/news.html"|g' "$file"
        sed -i 's|href="/fpl.html"|href="/mobile/fpl.html"|g' "$file"
        sed -i 's|href="/polls.html"|href="/mobile/polls.html"|g' "$file"
        sed -i 's|href="/transfer-center.html"|href="/mobile/transfer-center.html"|g' "$file"

        echo "✅ Updated: $file"
    fi
done

echo "✨ Mobile links updated successfully!"
