#!/bin/bash

# Script to fix critical article loading issues
# Applies same fixes as used for FPL Gameweek 4 article

echo "Fixing critical article loading issues..."

# List of critical articles with global CSS resets
CRITICAL_ARTICLES=(
    "alexander-isak-transfer-liverpool-125m-2025-09-03.html"
    "pep-guardiola-downfall-worst-start-2025-09-01.html"
    "man-utd-struggling-relegation-fears-2025-08-31.html"
)

for article in "${CRITICAL_ARTICLES[@]}"; do
    echo "Processing: $article"
    
    # Full path to the article
    ARTICLE_PATH="/home/reidwcoleman/articles/$article"
    
    if [ -f "$ARTICLE_PATH" ]; then
        echo "  - Adding featured-article-cards.css include"
        # Add the CSS include after styles.css
        sed -i '/href="..\/styles\.css"/a\    <link rel="stylesheet" href="../featured-article-cards.css">' "$ARTICLE_PATH"
        
        echo "  - Removing article-enhancer.js (conflicts with custom styling)"
        # Remove article-enhancer.js line
        sed -i '/src="..\/article-enhancer\.js"/d' "$ARTICLE_PATH"
        
        echo "  - Fixing problematic CSS"
        # Replace global resets and body styling with scoped wrapper
        sed -i '/<style>/,/<\/style>/{
            # Replace the opening of style block
            /<style>/{
                r /dev/stdin
                d
            }
        }' "$ARTICLE_PATH" << 'EOF'
    <style>
        /* Article container background for this specific article */
        .main-content-wrapper {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 20px 0;
            min-height: 60vh;
        }
EOF
        
        # Remove everything up to .modern-article class, then continue
        sed -i '/<style>/,/\.modern-article/{
            /<style>/b
            /\.modern-article/b
            d
        }' "$ARTICLE_PATH"
        
        # Fix slideUp animation and backdrop-filter issues
        sed -i 's/animation: slideUp 0\.6s ease-out;/transition: opacity 0.3s ease;/' "$ARTICLE_PATH"
        sed -i 's/backdrop-filter: blur(10px);//' "$ARTICLE_PATH"
        sed -i '/^[[:space:]]*@keyframes slideUp/,/^[[:space:]]*}$/d' "$ARTICLE_PATH"
        
        # Fix box-shadow to be simpler
        sed -i 's/0 20px 60px rgba(0, 0, 0, 0\.3),.*0 0 100px rgba(120, 40, 200, 0\.1);/0 20px 60px rgba(0, 0, 0, 0.15);/' "$ARTICLE_PATH"
        
        echo "  - Fixed $article successfully"
    else
        echo "  - ERROR: $article not found"
    fi
    echo ""
done

echo "Critical article fixes completed!"