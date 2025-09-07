#!/bin/bash

# Script to optimize article loading and prevent glitches
# Adds FOUC prevention, preloading, and smooth animations

LOADING_CSS='
    <!-- Loading Optimization -->
    <style>
        /* Prevent Flash of Unstyled Content (FOUC) */
        html {
            visibility: visible !important;
        }
        
        body {
            opacity: 0;
            transition: opacity 0.3s ease-in;
        }
        
        body.loaded {
            opacity: 1;
        }
        
        /* Prevent layout shifts during include loading */
        [include] {
            min-height: 20px;
            transition: all 0.3s ease;
        }
        
        .header[include] {
            min-height: 80px;
            background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        
        .footer[include] {
            min-height: 60px;
            background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        
        /* Shimmer loading animation */
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
        
        /* Remove shimmer when content loads */
        .header:not(:empty), .footer:not(:empty) {
            background: none !important;
            animation: none !important;
        }
        
        /* Smooth image loading */
        img {
            opacity: 0;
            transition: opacity 0.3s ease-in;
        }
        
        img.loaded {
            opacity: 1;
        }
        
        /* AdSense container stabilization */
        .adsbygoogle {
            min-height: 250px;
            display: block;
            background: #f8f9fa;
            border-radius: 8px;
            position: relative;
        }
        
        .adsbygoogle:before {
            content: "Advertisement";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #6c757d;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        /* Hide placeholder when ad loads */
        .adsbygoogle[data-ad-status="filled"]:before {
            display: none;
        }
    </style>
    
    <!-- Loading Script -->
    <script>
        // Prevent FOUC by hiding body until ready
        document.documentElement.style.visibility = "visible";
        
        // Image loading optimization
        function optimizeImageLoading() {
            const images = document.querySelectorAll("img");
            images.forEach(img => {
                if (img.complete) {
                    img.classList.add("loaded");
                } else {
                    img.addEventListener("load", function() {
                        this.classList.add("loaded");
                    });
                    img.addEventListener("error", function() {
                        this.classList.add("loaded"); // Still fade in even if error
                    });
                }
            });
        }
        
        // Initialize when DOM is ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function() {
                document.body.classList.add("loaded");
                optimizeImageLoading();
            });
        } else {
            document.body.classList.add("loaded");
            optimizeImageLoading();
        }
        
        // Fallback: ensure page shows even if something goes wrong
        setTimeout(function() {
            document.body.classList.add("loaded");
            document.documentElement.style.visibility = "visible";
        }, 2000);
    </script>'

PRELOAD_SCRIPT='
    <!-- Critical Resource Preloading -->
    <link rel="preload" href="/styles.css" as="style">
    <link rel="preload" href="/eplnewshubnewlogo.png" as="image">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://pagead2.googlesyndication.com">
    <link rel="preconnect" href="https://www.googletagmanager.com">'

echo "Optimizing article loading to prevent glitches..."
count=0
total=$(find articles/ -name "*.html" | wc -l)

for file in articles/*.html; do
    echo "Processing $file..."
    count=$((count + 1))
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Check if already optimized
    if grep -q "Loading Optimization" "$file"; then
        echo "  - Already optimized, skipping..."
        rm "$file.backup"
        continue
    fi
    
    # Add preloading after meta tags
    if grep -q "<meta name=\"viewport\"" "$file"; then
        sed -i "/<meta name=\"viewport\".*>/a\\
$PRELOAD_SCRIPT" "$file"
    fi
    
    # Add loading optimization before </head>
    sed -i "s|</head>|$LOADING_CSS\
</head>|" "$file"
    
    # Ensure proper script loading order at end of body
    if ! grep -q "defer" "$file" | grep -q "index.js"; then
        sed -i 's|<script src="../index.js"></script>|<script src="../index.js" defer></script>|g' "$file"
        sed -i 's|<script src="../index.js" defer></script>|<script src="../index.js" defer></script>|g' "$file"
    fi
    
    rm "$file.backup"
    echo "  - Optimized $file ($count/$total)"
done

echo "Completed! Optimized loading for $count articles to prevent glitches."