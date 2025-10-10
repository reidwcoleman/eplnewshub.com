#!/bin/bash

# Script to fix duplicate read next sections
# Keep only the HTML include version, remove JavaScript version

count=0
echo "Fixing duplicate Read Next sections..."

for file in articles/*.html; do
    echo "Processing $file..."
    
    # Check if file has both implementations
    if grep -q "read-next\.js" "$file" && grep -q "read-next\.html" "$file"; then
        echo "  - Found duplicate read next sections, fixing..."
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Remove the JavaScript version lines
        sed -i '/<!-- Read Next Section -->/,/^    <script src="\.\.\/read-next\.js"><\/script>$/c\
    <!-- Read Next Section -->\
    <div include="../read-next.html"></div>' "$file"
        
        # Clean up any remaining duplicate comments or empty div
        sed -i '/^    <div class="read-next"><\/div>$/d' "$file"
        sed -i '/^    <!-- Read Next Section -->$/{N;s/<!-- Read Next Section -->\n    <!-- Read Next Section -->/<!-- Read Next Section -->/}' "$file"
        
        rm "$file.backup"
        count=$((count + 1))
        echo "  - Fixed $file"
    else
        echo "  - No duplicates found in $file"
    fi
done

echo "Completed! Fixed $count articles with duplicate read next sections."