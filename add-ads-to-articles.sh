#!/bin/bash

# Script to add 3 AdSense ads to all articles
# Each ad will be placed at strategic points in the article content

AD_CODE='<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6480210605786899"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-6480210605786899"
     data-ad-slot="2656767439"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>'

# Counter for tracking progress
count=0
total=$(ls articles/*.html | wc -l)

echo "Adding 3 AdSense ads to $total articles..."

for file in articles/*.html; do
    echo "Processing $file..."
    count=$((count + 1))
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Check if ads already exist to avoid duplicates
    if grep -q "data-ad-slot=\"2656767439\"" "$file"; then
        echo "  - Ads already exist in $file, skipping..."
        rm "$file.backup"
        continue
    fi
    
    # Find paragraph tags to insert ads after
    paragraph_lines=($(grep -n "</p>" "$file" | head -20 | cut -d: -f1))
    
    if [ ${#paragraph_lines[@]} -lt 6 ]; then
        echo "  - Not enough paragraphs in $file, skipping..."
        rm "$file.backup"
        continue
    fi
    
    # Calculate positions for 3 ads (after paragraphs 3, 7, and 12)
    pos1=${paragraph_lines[2]}  # After 3rd paragraph
    pos2=${paragraph_lines[6]}  # After 7th paragraph  
    pos3=${paragraph_lines[11]} # After 12th paragraph (if exists)
    
    # If we don't have a 12th paragraph, use the last available
    if [ -z "$pos3" ]; then
        pos3=${paragraph_lines[-1]}
    fi
    
    # Create temporary file with ads inserted
    temp_file=$(mktemp)
    line_num=1
    ads_inserted=0
    
    while IFS= read -r line; do
        echo "$line" >> "$temp_file"
        
        # Insert ads after specific paragraphs
        if [ "$line_num" -eq "$pos1" ] && [ "$ads_inserted" -eq 0 ]; then
            echo "" >> "$temp_file"
            echo "$AD_CODE" >> "$temp_file"
            echo "" >> "$temp_file"
            ads_inserted=1
            echo "  - Added ad 1 after line $pos1"
        elif [ "$line_num" -eq "$pos2" ] && [ "$ads_inserted" -eq 1 ]; then
            echo "" >> "$temp_file"
            echo "$AD_CODE" >> "$temp_file"
            echo "" >> "$temp_file"
            ads_inserted=2
            echo "  - Added ad 2 after line $pos2"
        elif [ "$line_num" -eq "$pos3" ] && [ "$ads_inserted" -eq 2 ]; then
            echo "" >> "$temp_file"
            echo "$AD_CODE" >> "$temp_file"
            echo "" >> "$temp_file"
            ads_inserted=3
            echo "  - Added ad 3 after line $pos3"
        fi
        
        line_num=$((line_num + 1))
    done < "$file"
    
    # Replace original file with updated version
    mv "$temp_file" "$file"
    rm "$file.backup"
    
    echo "  - Successfully added $ads_inserted ads to $file ($count/$total)"
done

echo "Completed! Added ads to all articles."