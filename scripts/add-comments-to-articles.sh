#!/bin/bash

# Add comments system to all article pages
echo "Adding comments system to all article pages..."

# Counter for modified files
count=0

# Find all HTML files in articles directory
for file in articles/*.html; do
    # Check if file exists
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Check if comments system is already added
    if grep -q "comments-system.js" "$file"; then
        echo "Skipping $file - comments system already added"
        continue
    fi
    
    # Add comments system script before </body> tag
    sed -i 's|</body>|    <script src="../comments-system-api.js"></script>\n</body>|' "$file"
    
    echo "Added comments system to $file"
    ((count++))
done

echo ""
echo "✅ Added comments system to $count article pages"
echo ""
echo "The comments system includes:"
echo "  • Comment posting for all users (guests and members)"
echo "  • Member badges (PRO/STARTER) for authenticated users"
echo "  • Like/unlike functionality"
echo "  • Comment sorting (newest, oldest, popular)"
echo "  • Local storage persistence"
echo "  • Responsive design"
echo ""
echo "Users can now comment on any article!"