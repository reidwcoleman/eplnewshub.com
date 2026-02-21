// Universal Fast Loading Script for EPL News Hub
// Apply to all pages for consistent performance
(function() {
    'use strict';
    
    // 1. Optimize all images on the page
    function optimizeImages() {
        const images = document.querySelectorAll('img');
        let aboveFoldCount = 0;
        
        images.forEach(img => {
            // Check if image is above the fold
            const rect = img.getBoundingClientRect();
            const isAboveFold = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (!img.hasAttribute('loading')) {
                if (isAboveFold && aboveFoldCount < 2) {
                    img.loading = 'eager';
                    if (aboveFoldCount === 0) {
                        img.fetchPriority = 'high';
                    }
                    aboveFoldCount++;
                } else {
                    img.loading = 'lazy';
                    img.decoding = 'async';
                }
            }
            
            // Add aspect ratio to prevent layout shift
            if (img.classList.contains('featured-image') || img.classList.contains('article-image')) {
                img.style.aspectRatio = '16/9';
                img.style.objectFit = 'cover';
                img.style.backgroundColor = '#f0f0f0';
            }
        });
    }
    
    // 2. Defer non-critical scripts
    function deferScripts() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            // Skip critical scripts
            if (script.src.includes('universal-fast-load') || 
                script.src.includes('index-fast') ||
                script.src.includes('googletagmanager')) {
                return;
            }
            
            // Make non-critical scripts defer
            if (!script.async && !script.defer) {
                script.defer = true;
            }
        });
    }
    
    // 3. Optimize CSS loading
    function optimizeCSS() {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach((link, index) => {
            // Keep first stylesheet as is (usually main styles)
            if (index === 0) return;
            
            // Defer other stylesheets
            if (!link.media || link.media === 'all') {
                link.media = 'print';
                link.onload = function() { this.media = 'all'; };
            }
        });
    }
    
    // 4. Preload next navigation
    function preloadNextLinks() {
        // Only preload on idle
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                const links = document.querySelectorAll('a[href*="/articles/"]');
                const firstTwoLinks = Array.from(links).slice(0, 2);
                
                firstTwoLinks.forEach(link => {
                    const preload = document.createElement('link');
                    preload.rel = 'prefetch';
                    preload.href = link.href;
                    document.head.appendChild(preload);
                });
            }, { timeout: 3000 });
        }
    }
    
    // 6. Remove unused JavaScript
    function cleanupScripts() {
        // Remove any performance monitoring scripts that might have been missed
        const performanceScripts = document.querySelectorAll(
            'script[src*="performance"], script[src*="optimize"], script[src*="mobile-opt"]'
        );
        performanceScripts.forEach(script => script.remove());
    }
    
    // Initialize based on document state
    if (document.readyState === 'loading') {
        // Run immediately
        deferScripts();
        optimizeCSS();
        cleanupScripts();
        
        // Run after DOM ready
        document.addEventListener('DOMContentLoaded', () => {
            optimizeImages();
            preloadNextLinks();
        });
    } else {
        // DOM already loaded
        deferScripts();
        optimizeCSS();
        cleanupScripts();
        optimizeImages();
        
        if (document.readyState === 'complete') {
            preloadNextLinks();
        } else {
            window.addEventListener('load', preloadNextLinks);
        }
    }
    
    // Re-optimize on dynamic content changes (debounced, auto-disconnect after 10s)
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(optimizeImages, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 10000);
    
    // Export for use by other scripts
    window.UniversalFastLoad = {
        optimizeImages,
        optimizeCSS
    };
})();