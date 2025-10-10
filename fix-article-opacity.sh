#!/bin/bash

echo "Fixing article opacity issues..."

for file in articles/*.html; do
    if [ -f "$file" ]; then
        # Fix body opacity - remove opacity: 0 or set it to 1
        sed -i 's/opacity: 0;/opacity: 1;/g' "$file"
        
        # Fix empty animation keyframes - add opacity: 1
        sed -i '/@keyframes fadeIn {/,/}/ {
            s/to {$/to { opacity: 1;/
        }' "$file"
        
        # Fix slideUp animation
        sed -i '/@keyframes slideUp {/,/}/ {
            s/to {$/to { opacity: 1;/
        }' "$file"
        
        echo "Fixed: $(basename "$file")"
    fi
done

echo "Opacity fixes complete!"
