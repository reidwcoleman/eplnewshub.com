#!/bin/bash

echo "Fixing article visibility issues..."

for file in articles/*.html; do
    if [ -f "$file" ]; then
        # Remove initial opacity: 0 from body and article elements that aren't part of animations
        sed -i '/<style>/,/<\/style>/ {
            # Fix body opacity issue
            s/body {[^}]*opacity: 0;[^}]*}/body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }/g
            
            # Fix article opacity without breaking animations
            s/\.nyt-article {[^}]*opacity: 0;[^}]*}/\.nyt-article {/g
            
            # Ensure visibility is not hidden
            s/visibility: hidden;//g
        }' "$file"
        
        echo "Fixed: $(basename "$file")"
    fi
done

echo "Visibility fixes complete!"
