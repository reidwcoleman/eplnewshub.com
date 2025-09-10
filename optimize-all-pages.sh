#!/bin/bash

# Script to add fast-loading optimizations to all HTML pages

echo "Optimizing all HTML pages for faster loading..."

# Add universal-fast-load.js to articles
for file in articles/*.html; do
    if [ -f "$file" ]; then
        # Check if already optimized
        if ! grep -q "universal-fast-load.js" "$file"; then
            # Add script before closing </head>
            sed -i 's|</head>|<script src="/universal-fast-load.js" async></script>\n</head>|' "$file"
            echo "✓ Optimized: $file"
        fi
    fi
done

# Optimize FPL page
if [ -f "fpl.html" ] && ! grep -q "universal-fast-load.js" "fpl.html"; then
    sed -i 's|</head>|<script src="/universal-fast-load.js" async></script>\n</head>|' "fpl.html"
    echo "✓ Optimized: fpl.html"
fi

# Optimize mobile page
if [ -f "mobile.html" ] && ! grep -q "universal-fast-load.js" "mobile.html"; then
    sed -i 's|</head>|<script src="/universal-fast-load.js" async></script>\n</head>|' "mobile.html"
    echo "✓ Optimized: mobile.html"
fi

# Optimize other key pages
for page in transfer-hub.html stats.html player-predictor.html team-analyzer.html; do
    if [ -f "$page" ] && ! grep -q "universal-fast-load.js" "$page"; then
        sed -i 's|</head>|<script src="/universal-fast-load.js" async></script>\n</head>|' "$page"
        echo "✓ Optimized: $page"
    fi
done

echo "Optimization complete!"