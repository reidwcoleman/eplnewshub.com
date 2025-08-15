#!/bin/bash

# SEO Checker Script for EPL News Hub
# Checks all HTML files for required SEO elements: title, meta description, H1

echo "========================================="
echo "SEO CHECKER FOR EPL NEWS HUB"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
total_files=0
files_missing_title=0
files_missing_description=0
files_missing_h1=0
files_perfect=0

# Arrays to store problematic files
declare -a missing_title
declare -a missing_description
declare -a missing_h1

echo "Checking all HTML files for SEO elements..."
echo ""

# Function to check a single HTML file
check_html_file() {
    local file="$1"
    local filename=$(basename "$file")
    local has_issues=false
    
    # Skip node_modules, dist, and other build directories
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]] || [[ "$file" == *".git"* ]]; then
        return
    fi
    
    ((total_files++))
    
    echo -n "Checking: $file ... "
    
    # Check for title tag
    if ! grep -q "<title>" "$file"; then
        missing_title+=("$file")
        ((files_missing_title++))
        has_issues=true
        echo -e "${RED}✗ Missing Title${NC}"
    fi
    
    # Check for meta description
    if ! grep -q 'name="description"' "$file"; then
        missing_description+=("$file")
        ((files_missing_description++))
        has_issues=true
        if [ "$has_issues" = true ]; then
            echo -e "                                        ${RED}✗ Missing Meta Description${NC}"
        else
            echo -e "${RED}✗ Missing Meta Description${NC}"
        fi
    fi
    
    # Check for H1 tag
    if ! grep -q "<h1" "$file"; then
        missing_h1+=("$file")
        ((files_missing_h1++))
        has_issues=true
        if [ "$has_issues" = true ]; then
            echo -e "                                        ${RED}✗ Missing H1${NC}"
        else
            echo -e "${RED}✗ Missing H1${NC}"
        fi
    fi
    
    # If no issues found
    if [ "$has_issues" = false ]; then
        ((files_perfect++))
        echo -e "${GREEN}✓ All SEO elements present${NC}"
    fi
}

# Find and check all HTML files
while IFS= read -r file; do
    check_html_file "$file"
done < <(find . -name "*.html" -type f 2>/dev/null | grep -v node_modules | grep -v dist | sort)

echo ""
echo "========================================="
echo "SEO CHECK SUMMARY"
echo "========================================="
echo ""
echo "Total HTML files checked: $total_files"
echo -e "${GREEN}Files with all SEO elements: $files_perfect${NC}"
echo -e "${RED}Files missing title tag: $files_missing_title${NC}"
echo -e "${RED}Files missing meta description: $files_missing_description${NC}"
echo -e "${RED}Files missing H1 heading: $files_missing_h1${NC}"

# Detailed report of files with issues
if [ ${#missing_title[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}FILES MISSING TITLE TAG:${NC}"
    for file in "${missing_title[@]}"; do
        echo "  - $file"
    done
fi

if [ ${#missing_description[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}FILES MISSING META DESCRIPTION:${NC}"
    for file in "${missing_description[@]}"; do
        echo "  - $file"
    done
fi

if [ ${#missing_h1[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}FILES MISSING H1 HEADING:${NC}"
    for file in "${missing_h1[@]}"; do
        echo "  - $file"
    done
fi

echo ""
echo "========================================="

# Create a CSV report
echo "Creating SEO report CSV file..."
echo "File Path,Has Title,Has Meta Description,Has H1" > seo-report.csv

# Re-check all files for CSV
while IFS= read -r file; do
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]] || [[ "$file" == *".git"* ]]; then
        continue
    fi
    
    has_title="No"
    has_description="No"
    has_h1="No"
    
    if grep -q "<title>" "$file"; then
        has_title="Yes"
    fi
    
    if grep -q 'name="description"' "$file"; then
        has_description="Yes"
    fi
    
    if grep -q "<h1" "$file"; then
        has_h1="Yes"
    fi
    
    echo "$file,$has_title,$has_description,$has_h1" >> seo-report.csv
done < <(find . -name "*.html" -type f 2>/dev/null | grep -v node_modules | grep -v dist | sort)

echo "SEO report saved to: seo-report.csv"
echo ""

# Provide recommendations
if [ $files_missing_title -gt 0 ] || [ $files_missing_description -gt 0 ] || [ $files_missing_h1 -gt 0 ]; then
    echo -e "${YELLOW}RECOMMENDATIONS:${NC}"
    echo "1. Run ./update-seo-elements.sh to automatically fix missing SEO elements"
    echo "2. Review and customize the generated content for each page"
    echo "3. Ensure meta descriptions are between 150-160 characters"
    echo "4. Make sure H1 tags are unique and descriptive for each page"
    echo "5. Keep title tags under 60 characters for optimal display"
else
    echo -e "${GREEN}✅ Excellent! All HTML files have proper SEO elements.${NC}"
fi