#!/bin/bash

echo "Final cleanup of article files..."

for file in articles/*.html; do
    if [ -f "$file" ]; then
        # Remove empty script blocks
        sed -i '/<script>$/,/^<\/script>$/ {
            /^$/d
            /<script>$/N
            /<script>\n<\/script>/d
        }' "$file"
        
        # Clean up empty animation keyframes
        sed -i '/@keyframes fadeIn {/,/}/ {
            s/to { opacity: 1;$/to { opacity: 1; }/
        }' "$file"
        
        sed -i '/@keyframes slideUp {/,/}/ {
            s/to {$/to { opacity: 1;/
        }' "$file"
        
        sed -i '/@keyframes imageLoad {/,/}/ {
            s/to {$/to { opacity: 1;/
        }' "$file"
        
        sed -i '/@keyframes slideInLeft {/,/}/ {
            s/to {$/to { opacity: 1;/
        }' "$file"
        
        echo "Cleaned: $(basename "$file")"
    fi
done

echo "Final cleanup complete!"
