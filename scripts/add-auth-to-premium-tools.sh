#!/bin/bash

# Script to add authentication to premium tool pages

echo "Adding authentication to premium tools..."

# List of premium tool HTML files
PREMIUM_TOOLS=(
    "transfer-simulator-pro.html"
    "team-analyzer.html"
    "player-predictor.html"
    "fpl-player-analyzer.html"
    "fpl-player-analyzer-ultra.html"
)

for file in "${PREMIUM_TOOLS[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        
        # Check if user-auth-manager.js is already included
        if ! grep -q "user-auth-manager.js" "$file"; then
            # Add the script before the closing body tag or after index.js
            if grep -q "index.js" "$file"; then
                # Add after index.js
                sed -i 's|<script src="index.js"></script>|<script src="index.js"></script>\n    <script src="user-auth-manager.js"></script>|' "$file"
                echo "  ✓ Added user-auth-manager.js to $file"
            elif grep -q "</body>" "$file"; then
                # Add before closing body tag
                sed -i 's|</body>|    <script src="user-auth-manager.js"></script>\n</body>|' "$file"
                echo "  ✓ Added user-auth-manager.js to $file"
            else
                echo "  ⚠ Could not find appropriate location in $file"
            fi
        else
            echo "  → user-auth-manager.js already included in $file"
        fi
        
        # Add data-premium attribute to main container if not present
        if ! grep -q 'data-premium="true"' "$file"; then
            # Try to add to the main container div
            sed -i 's|<div class="container">|<div class="container" data-premium="true">|' "$file"
            
            # Also try with id="container"
            sed -i 's|<div id="container">|<div id="container" data-premium="true">|' "$file"
            
            echo "  ✓ Added data-premium attribute to $file"
        fi
    else
        echo "  ⚠ File not found: $file"
    fi
done

echo ""
echo "✅ Authentication setup complete!"
echo ""
echo "Premium tools will now:"
echo "  1. Check if user is signed in"
echo "  2. Verify premium membership status"
echo "  3. Show upgrade prompt if not premium"
echo ""
echo "To test:"
echo "  1. Open browser console"
echo "  2. Load test-premium-access.js"
echo "  3. Run: testPremiumSignIn()"
echo "  4. Visit any premium tool page"