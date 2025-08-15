#!/bin/bash

# SEO Elements Updater for EPL News Hub
# Automatically adds missing title tags, meta descriptions, and H1 headings

echo "========================================="
echo "SEO ELEMENTS UPDATER FOR EPL NEWS HUB"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for updated files
updated_files=0

# Function to extract filename for title generation
get_page_title() {
    local filepath="$1"
    local filename=$(basename "$filepath" .html)
    
    # Convert filename to title case and replace hyphens/underscores with spaces
    local title=$(echo "$filename" | sed 's/[-_]/ /g' | sed 's/\b\(.\)/\u\1/g')
    
    # Add site name suffix
    echo "$title | EPL News Hub"
}

# Function to generate meta description based on page name
get_meta_description() {
    local filepath="$1"
    local filename=$(basename "$filepath" .html)
    
    case "$filename" in
        "index")
            echo "Get the latest Premier League news, transfer rumors, match analysis, and league standings at EPL News Hub. Expert coverage of all 20 Premier League teams."
            ;;
        "articles")
            echo "Browse all Premier League articles, news, and analysis at EPL News Hub. Stay updated with comprehensive coverage of EPL matches, transfers, and team updates."
            ;;
        "fpl"|"fantasy")
            echo "Fantasy Premier League tools, tips, and strategies. Optimize your FPL team with our player predictor, budget optimizer, and expert analysis at EPL News Hub."
            ;;
        "epl-table"|"standings")
            echo "Live Premier League table and standings. Track team positions, points, goals, and complete statistics for all 20 EPL teams at EPL News Hub."
            ;;
        "transfer-hub"|"transfers")
            echo "Latest Premier League transfer news, rumors, and confirmed deals. Track all EPL transfer window activity and player movements at EPL News Hub."
            ;;
        "stats"|"statistics")
            echo "Comprehensive Premier League statistics including top scorers, assists, clean sheets, and team performance metrics at EPL News Hub."
            ;;
        "premium")
            echo "Premium FPL tools and exclusive content for serious Fantasy Premier League managers. Advanced analytics and predictions at EPL News Hub."
            ;;
        "signin"|"login"|"account")
            echo "Sign in to your EPL News Hub account to access premium features, save preferences, and get personalized Premier League content."
            ;;
        "polls")
            echo "Vote in Premier League polls and see fan opinions on EPL matches, players, and teams. Share your views at EPL News Hub."
            ;;
        "news")
            echo "Breaking Premier League news and updates. Latest EPL match reports, injury news, and team announcements at EPL News Hub."
            ;;
        *"ad"*|*"banner"*|*"sidebar"*)
            echo "EPL News Hub - Premier League news and analysis"
            ;;
        *)
            # Generic description for other pages
            echo "EPL News Hub provides comprehensive Premier League coverage including news, analysis, FPL tools, and live updates for all EPL teams."
            ;;
    esac
}

# Function to get H1 heading based on page
get_h1_heading() {
    local filepath="$1"
    local filename=$(basename "$filepath" .html)
    
    case "$filename" in
        "index")
            echo "Premier League News & Analysis Hub"
            ;;
        "articles")
            echo "All Premier League Articles"
            ;;
        "fpl"|"fantasy")
            echo "Fantasy Premier League Tools"
            ;;
        "epl-table"|"standings")
            echo "Premier League Table & Standings"
            ;;
        "transfer-hub"|"transfers")
            echo "Premier League Transfer Hub"
            ;;
        "stats"|"statistics")
            echo "Premier League Statistics"
            ;;
        "premium")
            echo "Premium FPL Tools & Features"
            ;;
        "signin"|"login")
            echo "Sign In to EPL News Hub"
            ;;
        "account")
            echo "My Account"
            ;;
        "polls")
            echo "Premier League Fan Polls"
            ;;
        "news")
            echo "Latest Premier League News"
            ;;
        *)
            # Convert filename to readable heading
            local heading=$(echo "$filename" | sed 's/[-_]/ /g' | sed 's/\b\(.\)/\u\1/g')
            echo "$heading"
            ;;
    esac
}

# Function to update HTML file with missing SEO elements
update_html_file() {
    local file="$1"
    local updated=false
    local temp_file="${file}.tmp"
    
    # Skip node_modules, dist, and component files
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]] || [[ "$file" == *".git"* ]] || [[ "$file" == *"ad-components"* ]]; then
        return
    fi
    
    echo "Processing: $file"
    
    # Check and add missing title tag
    if ! grep -q "<title>" "$file" 2>/dev/null; then
        local title=$(get_page_title "$file")
        
        # Check if there's a head section
        if grep -q "</head>" "$file"; then
            # Add title before closing head tag
            sed -i "/<\/head>/i\\    <title>$title</title>" "$file"
            echo -e "  ${GREEN}✓ Added title tag: $title${NC}"
            updated=true
        fi
    fi
    
    # Check and add missing meta description
    if ! grep -q 'name="description"' "$file" 2>/dev/null; then
        local description=$(get_meta_description "$file")
        
        # Check if there's a head section
        if grep -q "</head>" "$file"; then
            # Add meta description before closing head tag
            sed -i "/<\/head>/i\\    <meta name=\"description\" content=\"$description\">" "$file"
            echo -e "  ${GREEN}✓ Added meta description${NC}"
            updated=true
        fi
    fi
    
    # Check and add missing H1 tag (only for main pages, not components)
    if ! grep -q "<h1" "$file" 2>/dev/null; then
        # Don't add H1 to component files
        if [[ "$file" != *"components"* ]] && [[ "$file" != *"template"* ]] && [[ "$file" != *"header"* ]] && [[ "$file" != *"footer"* ]]; then
            local h1=$(get_h1_heading "$file")
            
            # Check if there's a body section
            if grep -q "<body" "$file"; then
                # Try to add H1 after body tag or main content div
                if grep -q '<main' "$file"; then
                    sed -i "/<main[^>]*>/a\\        <h1>$h1</h1>" "$file"
                elif grep -q '<div class="content' "$file"; then
                    sed -i '/<div class="content[^>]*>/a\\        <h1>'"$h1"'</h1>' "$file"
                elif grep -q '</body>' "$file"; then
                    # Find where body content starts and add H1
                    sed -i '/<body[^>]*>/a\\    <h1>'"$h1"'</h1>' "$file"
                fi
                echo -e "  ${GREEN}✓ Added H1 heading: $h1${NC}"
                updated=true
            fi
        fi
    fi
    
    if [ "$updated" = true ]; then
        ((updated_files++))
    else
        echo "  No updates needed"
    fi
}

# Process all HTML files
echo "Updating HTML files with missing SEO elements..."
echo ""

# Find and update all HTML files
while IFS= read -r file; do
    update_html_file "$file"
done < <(find . -name "*.html" -type f 2>/dev/null | grep -v node_modules | grep -v dist | sort)

echo ""
echo "========================================="
echo "UPDATE SUMMARY"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Updated $updated_files files with SEO elements${NC}"
echo ""
echo "Next steps:"
echo "1. Review the updated files to ensure content is appropriate"
echo "2. Customize meta descriptions to be unique and compelling (150-160 chars)"
echo "3. Ensure H1 headings accurately describe each page's content"
echo "4. Run ./seo-checker.sh to verify all elements are in place"
echo ""

# Create SEO best practices file
cat > seo-best-practices.txt << 'EOF'
SEO BEST PRACTICES FOR EPL NEWS HUB
====================================

TITLE TAGS:
- Keep under 60 characters
- Include primary keyword near the beginning
- Add brand name at the end (| EPL News Hub)
- Make each title unique and descriptive

META DESCRIPTIONS:
- Keep between 150-160 characters
- Include primary and secondary keywords naturally
- Write compelling copy that encourages clicks
- Include a call to action when appropriate
- Make each description unique

H1 HEADINGS:
- Use only one H1 per page
- Make it descriptive and keyword-rich
- Keep it different from the title tag
- Should clearly describe the page content

ADDITIONAL SEO RECOMMENDATIONS:
1. Add structured data (JSON-LD) for articles
2. Implement Open Graph tags for social sharing
3. Create an XML sitemap
4. Add canonical URLs to prevent duplicate content
5. Optimize image alt tags
6. Ensure fast page load times
7. Make all pages mobile-friendly
8. Use semantic HTML5 elements
9. Add internal linking between related content
10. Create unique, valuable content regularly

For articles:
- Add author information
- Include publish/update dates
- Use proper heading hierarchy (H1 > H2 > H3)
- Add relevant internal and external links
- Optimize images with descriptive filenames
EOF

echo "SEO best practices guide created: seo-best-practices.txt"