#!/bin/bash

# Script to add Read Next include to all articles
echo "Adding Read Next section to all articles..."

# Counter for processed files
count=0

# Process all HTML files in articles directory (excluding backups)
for file in articles/*.html; do
    # Skip backup files
    if [[ "$file" == *.backup ]]; then
        continue
    fi
    
    # Check if file exists
    if [ -f "$file" ]; then
        # Check if the file already has the read-next include
        if grep -q "read-next.html" "$file"; then
            echo "✓ $file already has Read Next section"
        else
            # Add the include before the closing main tag or before footer
            if grep -q "</main>" "$file"; then
                # Add before </main>
                sed -i '/<\/main>/i\    <!-- Read Next Section -->\n    <div include="../read-next.html"></div>\n' "$file"
                echo "✓ Added Read Next to $file (before </main>)"
                ((count++))
            elif grep -q "footer.html" "$file"; then
                # Add before footer include
                sed -i '/footer.html/i\    <!-- Read Next Section -->\n    <div include="../read-next.html"></div>\n' "$file"
                echo "✓ Added Read Next to $file (before footer)"
                ((count++))
            else
                # Add at the end of body, before </body>
                sed -i '/<\/body>/i\    <!-- Read Next Section -->\n    <div include="../read-next.html"></div>\n' "$file"
                echo "✓ Added Read Next to $file (before </body>)"
                ((count++))
            fi
        fi
    fi
done

echo ""
echo "✅ Complete! Added Read Next section to $count articles."
echo "The Read Next section will be loaded by your HTML injection system."