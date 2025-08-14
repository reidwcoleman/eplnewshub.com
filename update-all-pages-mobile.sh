#!/bin/bash

# Script to update all HTML pages with mobile optimization
echo "Updating all HTML pages with mobile optimization..."

# Function to update a single HTML file
update_html_file() {
    local file="$1"
    echo "Processing: $file"
    
    # Check if file already has unified mobile responsive CSS
    if ! grep -q "unified-mobile-responsive.css" "$file"; then
        # Add unified responsive CSS after styles.css if it exists
        if grep -q "styles.css" "$file"; then
            sed -i '/<link rel="stylesheet" href="[^"]*styles.css">/a\    <link rel="stylesheet" href="/unified-mobile-responsive.css">' "$file"
            echo "  ✓ Added unified-mobile-responsive.css"
        fi
    fi
    
    # Check if file already has unified mobile detector script
    if ! grep -q "unified-mobile-detector.js" "$file"; then
        # Add mobile detector script before closing head tag
        if grep -q "</head>" "$file"; then
            sed -i '/<\/head>/i\    <!-- Unified Mobile Detection Script -->\n    <script src="/unified-mobile-detector.js"></script>' "$file"
            echo "  ✓ Added unified-mobile-detector.js"
        fi
    fi
    
    # Ensure viewport meta tag is present and correct
    if ! grep -q 'name="viewport"' "$file"; then
        # Add viewport meta tag after charset if it doesn't exist
        if grep -q "<head>" "$file"; then
            sed -i '/<head>/a\    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">' "$file"
            echo "  ✓ Added viewport meta tag"
        fi
    else
        # Update existing viewport tag to ensure it's correct
        sed -i 's/<meta name="viewport"[^>]*>/<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">/' "$file"
        echo "  ✓ Updated viewport meta tag"
    fi
}

# Find all HTML files and update them
find . -name "*.html" -type f | while read -r file; do
    # Skip node_modules and other directories we don't want to modify
    if [[ "$file" != *"node_modules"* ]] && [[ "$file" != *".git"* ]] && [[ "$file" != *"dist"* ]]; then
        update_html_file "$file"
    fi
done

echo ""
echo "✅ Mobile optimization update complete!"
echo ""
echo "Summary of changes:"
echo "- Added unified-mobile-responsive.css to all pages"
echo "- Added unified-mobile-detector.js to all pages"
echo "- Ensured proper viewport meta tags on all pages"
echo ""
echo "Next steps:"
echo "1. Test the website on various mobile devices"
echo "2. Check that navigation works properly on mobile"
echo "3. Verify that all pages are responsive"
echo "4. Test touch interactions and mobile-specific features"