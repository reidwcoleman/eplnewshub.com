#!/bin/bash

# Script to add ads to all articles
echo "Adding ads to all articles..."

# Find all article HTML files (excluding backups)
for file in /home/reidwcoleman/articles/*.html; do
    # Skip backup files
    if [[ $file == *.backup ]]; then
        continue
    fi
    
    echo "Processing $file"
    
    # Add in-article ad after first paragraph
    if ! grep -q "article-ad.html" "$file"; then
        # Add first ad after first paragraph
        sed -i '/<\/p>/a\
            \
            <!-- Mid-Article Ad -->\
            <div include="../article-ad.html"></div>' "$file"
    fi
    
    # Add second ad after approximately middle of content
    if ! grep -q "Mid-Article Ad 2" "$file"; then
        # Find approximate middle and add second ad
        line_count=$(grep -c "h2>" "$file")
        if [ "$line_count" -gt 3 ]; then
            # Add second ad after 3rd h2 tag
            sed -i '0,/<\/h2>/{s/<\/h2>/&\
            \
            <!-- Mid-Article Ad 2 -->\
            <div include="..\/article-ad.html"><\/div>/3}' "$file"
        fi
    fi
    
    # Add final ad before conclusion
    if ! grep -q "Final Article Ad" "$file"; then
        # Add ad before the last few paragraphs
        sed -i '/<!-- Read Next Section -->/i\
            \
            <!-- Final Article Ad -->\
            <div include="../article-ad.html"></div>\
            ' "$file"
    fi
    
done

echo "Ads added to all articles!"