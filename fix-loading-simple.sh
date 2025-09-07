#!/bin/bash

# Simple script to add loading optimization to all articles

echo "Adding loading optimization to all articles..."
count=0

for file in articles/*.html; do
    echo "Processing $file..."
    count=$((count + 1))
    
    # Check if already optimized
    if grep -q "Loading Optimization" "$file"; then
        echo "  - Already optimized, skipping..."
        continue
    fi
    
    # Create temp file for processing
    temp_file=$(mktemp)
    
    # Process line by line
    while IFS= read -r line; do
        echo "$line" >> "$temp_file"
        
        # Add preloads after viewport meta tag
        if [[ "$line" == *'<meta name="viewport"'* ]]; then
            cat >> "$temp_file" << 'EOF'
    
    <!-- Critical Resource Preloading -->
    <link rel="preload" href="../styles.css" as="style">
    <link rel="preload" href="/eplnewshubnewlogo.png" as="image">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://pagead2.googlesyndication.com">
    <link rel="preconnect" href="https://www.googletagmanager.com">
EOF
        fi
        
        # Add loading optimization before </head>
        if [[ "$line" == *"</head>"* ]]; then
            cat >> "$temp_file" << 'EOF'
    
    <!-- Loading Optimization -->
    <style>
        /* Prevent Flash of Unstyled Content (FOUC) */
        html { visibility: visible !important; }
        body { opacity: 0; transition: opacity 0.3s ease-in; }
        body.loaded { opacity: 1; }
        
        /* Prevent layout shifts during include loading */
        [include] { min-height: 20px; transition: all 0.3s ease; }
        .header[include] { 
            min-height: 80px; 
            background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
            background-size: 200% 100%; animation: shimmer 1.5s infinite; 
        }
        .footer[include] { 
            min-height: 60px; 
            background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
            background-size: 200% 100%; animation: shimmer 1.5s infinite; 
        }
        
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .header:not(:empty), .footer:not(:empty) { background: none !important; animation: none !important; }
        
        /* Smooth image loading */
        img { opacity: 0; transition: opacity 0.3s ease-in; }
        img.loaded { opacity: 1; }
        
        /* AdSense container stabilization */
        .adsbygoogle { min-height: 250px; display: block; background: #f8f9fa; border-radius: 8px; position: relative; }
        .adsbygoogle:before { 
            content: "Advertisement"; position: absolute; top: 50%; left: 50%; 
            transform: translate(-50%, -50%); color: #6c757d; font-size: 14px; 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
        }
        .adsbygoogle[data-ad-status="filled"]:before { display: none; }
    </style>
    
    <script>
        document.documentElement.style.visibility = "visible";
        function optimizeImageLoading() {
            const images = document.querySelectorAll("img");
            images.forEach(img => {
                if (img.complete) { img.classList.add("loaded"); } 
                else {
                    img.addEventListener("load", function() { this.classList.add("loaded"); });
                    img.addEventListener("error", function() { this.classList.add("loaded"); });
                }
            });
        }
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function() {
                document.body.classList.add("loaded"); optimizeImageLoading();
            });
        } else { document.body.classList.add("loaded"); optimizeImageLoading(); }
        setTimeout(function() {
            document.body.classList.add("loaded");
            document.documentElement.style.visibility = "visible";
        }, 2000);
    </script>
EOF
        fi
    done < "$file"
    
    # Replace original with optimized version
    mv "$temp_file" "$file"
    echo "  - Optimized $file ($count)"
done

echo "Completed! Optimized $count articles."