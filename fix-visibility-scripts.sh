#!/bin/bash

echo "Fixing visibility scripts in all articles..."

for file in articles/*.html; do
    if [ -f "$file" ]; then
        # Remove the problematic visibility script
        sed -i '/<script>/,/<\/script>/ {
            /document.documentElement.style.visibility/d
        }' "$file"
        
        # Also ensure body has opacity: 1
        sed -i 's/body {[^}]*opacity: 0;/body {\n            opacity: 1;/g' "$file"
        
        echo "Fixed: $(basename "$file")"
    fi
done

echo "Visibility script fixes complete!"
