#!/bin/bash

# EPL News Hub Image Optimization Script
# This script optimizes images for faster page loading

echo "Starting image optimization for EPL News Hub..."

# Create optimized directory if it doesn't exist
mkdir -p optimized-images

# Function to convert and optimize images
optimize_image() {
    local input_file="$1"
    local output_dir="optimized-images"
    local filename=$(basename "$input_file")
    local name="${filename%.*}"
    local extension="${filename##*.}"
    
    echo "Processing: $filename"
    
    # Convert large PNG files to WebP
    if [[ "$extension" == "png" || "$extension" == "PNG" ]]; then
        # Check file size (if over 500KB, convert to WebP)
        filesize=$(stat -c%s "$input_file" 2>/dev/null || stat -f%z "$input_file" 2>/dev/null)
        if [ "$filesize" -gt 500000 ]; then
            echo "  Converting large PNG to WebP: $filename"
            # Note: Requires webp tools to be installed
            # For Ubuntu/Debian: sudo apt-get install webp
            # For Mac: brew install webp
            if command -v cwebp &> /dev/null; then
                cwebp -q 85 "$input_file" -o "$output_dir/${name}.webp"
                echo "  Created: ${name}.webp"
            else
                echo "  Warning: cwebp not installed. Install with: sudo apt-get install webp"
            fi
        fi
    fi
    
    # Convert JPEG/JPG files
    if [[ "$extension" == "jpg" || "$extension" == "jpeg" || "$extension" == "JPG" || "$extension" == "JPEG" ]]; then
        if command -v jpegoptim &> /dev/null; then
            cp "$input_file" "$output_dir/$filename"
            jpegoptim -m85 --strip-all "$output_dir/$filename"
            echo "  Optimized JPEG: $filename"
        else
            echo "  Warning: jpegoptim not installed. Install with: sudo apt-get install jpegoptim"
        fi
        
        # Also create WebP version
        if command -v cwebp &> /dev/null; then
            cwebp -q 85 "$input_file" -o "$output_dir/${name}.webp"
            echo "  Created WebP: ${name}.webp"
        fi
    fi
    
    # Handle JFIF files (convert to JPEG)
    if [[ "$extension" == "jfif" || "$extension" == "JFIF" ]]; then
        if command -v convert &> /dev/null; then
            convert "$input_file" -quality 85 "$output_dir/${name}.jpg"
            echo "  Converted JFIF to JPEG: ${name}.jpg"
            
            # Also create WebP version
            if command -v cwebp &> /dev/null; then
                cwebp -q 85 "$output_dir/${name}.jpg" -o "$output_dir/${name}.webp"
                echo "  Created WebP: ${name}.webp"
            fi
        else
            echo "  Warning: ImageMagick not installed. Install with: sudo apt-get install imagemagick"
        fi
    fi
    
    # Copy WebP files as-is (already optimized)
    if [[ "$extension" == "webp" || "$extension" == "WEBP" ]]; then
        cp "$input_file" "$output_dir/$filename"
        echo "  Copied WebP: $filename"
    fi
    
    # Handle AVIF files
    if [[ "$extension" == "avif" || "$extension" == "AVIF" ]]; then
        cp "$input_file" "$output_dir/$filename"
        echo "  Copied AVIF: $filename"
    fi
}

# Process all images in the root directory
echo ""
echo "Processing images in root directory..."
for img in *.{jpg,jpeg,png,gif,webp,avif,jfif,JPG,JPEG,PNG,GIF,WEBP,AVIF,JFIF} 2>/dev/null; do
    if [ -f "$img" ]; then
        optimize_image "$img"
    fi
done

# Process the particularly large files identified
echo ""
echo "Processing identified large files..."
large_files=(
    "upscalemedia-transformed.png"
    "ChatGPT Image May 24, 2025, 09_23_36 AM.png"
    "ChatGPT Image May 21, 2025, 07_34_00 PM.png"
    "May 25, 2025, 06_22_37 PM.png"
    "reidsnbest.webp"
)

for file in "${large_files[@]}"; do
    if [ -f "$file" ]; then
        echo ""
        echo "Special processing for large file: $file"
        optimize_image "$file"
    fi
done

echo ""
echo "Creating responsive image sizes..."
# Create multiple sizes for responsive images
for img in optimized-images/*.{jpg,jpeg,png,webp} 2>/dev/null; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        name="${filename%.*}"
        extension="${filename##*.}"
        
        # Create thumbnail (400px width)
        if command -v convert &> /dev/null; then
            convert "$img" -resize 400x\> "optimized-images/${name}-400w.${extension}"
            echo "Created thumbnail: ${name}-400w.${extension}"
            
            # Create medium size (800px width)
            convert "$img" -resize 800x\> "optimized-images/${name}-800w.${extension}"
            echo "Created medium: ${name}-800w.${extension}"
            
            # Create large size (1200px width)
            convert "$img" -resize 1200x\> "optimized-images/${name}-1200w.${extension}"
            echo "Created large: ${name}-1200w.${extension}"
        fi
    fi
done

echo ""
echo "=========================================="
echo "Image optimization complete!"
echo "Optimized images are in: optimized-images/"
echo ""
echo "To use optimized images:"
echo "1. Copy optimized images to your web directory"
echo "2. Update HTML to use WebP with fallbacks:"
echo '   <picture>'
echo '     <source srcset="image.webp" type="image/webp">'
echo '     <img src="image.jpg" alt="Description">'
echo '   </picture>'
echo ""
echo "For responsive images:"
echo '   <img srcset="image-400w.jpg 400w,'
echo '               image-800w.jpg 800w,'
echo '               image-1200w.jpg 1200w"'
echo '        sizes="(max-width: 600px) 400px,'
echo '               (max-width: 1000px) 800px,'
echo '               1200px"'
echo '        src="image.jpg" alt="Description">'
echo "=========================================="

# Check total size savings
if command -v du &> /dev/null; then
    echo ""
    original_size=$(du -sh . --exclude=optimized-images --exclude=node_modules --exclude=.git 2>/dev/null | cut -f1)
    optimized_size=$(du -sh optimized-images 2>/dev/null | cut -f1)
    echo "Original images size (approx): $original_size"
    echo "Optimized images size: $optimized_size"
fi