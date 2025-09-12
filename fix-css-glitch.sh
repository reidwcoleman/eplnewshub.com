#!/bin/bash

# Fix CSS loading glitches in all article pages

echo "Fixing CSS loading glitches in all articles..."

for file in articles/*.html; do
    if [ -f "$file" ]; then
        # Remove conflicting visibility hidden styles
        sed -i 's/<style>body { visibility: hidden; opacity: 0; }<\/style>//g' "$file"
        
        # Remove animation that causes flicker
        sed -i 's/animation: fadeIn 0.3s ease-in forwards;//g' "$file"
        
        # Fix visibility conflicts
        sed -i 's/visibility: visible;//g' "$file"
        sed -i 's/opacity: 1;//g' "$file"
        
        echo "Fixed: $(basename "$file")"
    fi
done

echo "CSS glitch fixes complete!"