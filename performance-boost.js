// Performance Boost Script for EPL News Hub
// Optimizes image loading, resource management, and page performance

(function() {
    'use strict';
    
    // 1. Intersection Observer for truly lazy loading images
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                
                // Handle data-src attribute for lazy loading
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                
                // Add fade-in effect when image loads
                img.classList.add('loaded');
                
                // Stop observing this image
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01
    });
    
    // 2. Initialize lazy loading
    function initLazyLoading() {
        // Find all images with loading="lazy" or data-src
        const lazyImages = document.querySelectorAll('img[loading="lazy"], img[data-src]');
        
        lazyImages.forEach(img => {
            // Add loading placeholder
            if (!img.complete) {
                img.classList.add('loading');
            }
            
            // Observe for intersection
            imageObserver.observe(img);
            
            // Remove loading class when image loads
            img.addEventListener('load', function() {
                this.classList.remove('loading');
                this.classList.add('loaded');
            });
            
            // Handle error cases
            img.addEventListener('error', function() {
                this.classList.remove('loading');
                this.classList.add('error');
                // Optional: Set a fallback image
                // this.src = '/placeholder-image.png';
            });
        });
    }
    
    // 3. Preload critical resources
    function preloadCriticalResources() {
        // Preload the main headline image since it's above the fold
        const mainImage = document.querySelector('.featured-image');
        if (mainImage && mainImage.src) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = mainImage.src;
            document.head.appendChild(link);
        }
    }
    
    // 4. Resource hints for faster subsequent navigation
    function addResourceHints() {
        // Prefetch articles that user might click
        const articleLinks = document.querySelectorAll('a[href*="/articles/"]');
        const uniqueUrls = new Set();
        
        articleLinks.forEach(link => {
            uniqueUrls.add(link.href);
        });
        
        // Only prefetch top 3 articles to avoid bandwidth waste
        Array.from(uniqueUrls).slice(0, 3).forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    
    // 5. Optimize third-party scripts
    function optimizeThirdPartyScripts() {
        // Delay non-critical third-party scripts
        setTimeout(() => {
            // Load Google Fonts with font-display: swap
            const fontLink = document.querySelector('link[href*="fonts.googleapis"]');
            if (fontLink) {
                fontLink.href = fontLink.href + '&display=swap';
            }
        }, 100);
    }
    
    // 6. Progressive Enhancement for includes
    function optimizeIncludes() {
        const includeElements = document.querySelectorAll('[include]');
        
        includeElements.forEach(element => {
            // Add loading state
            element.classList.add('include-loading');
            
            // Use MutationObserver to detect when content is loaded
            const observer = new MutationObserver((mutations) => {
                if (element.children.length > 0) {
                    element.classList.remove('include-loading');
                    element.classList.add('include-loaded');
                    observer.disconnect();
                    
                    // Re-initialize lazy loading for new content
                    initLazyLoading();
                }
            });
            
            observer.observe(element, { childList: true });
        });
    }
    
    // 7. Memory management
    function setupMemoryManagement() {
        // Clean up observers when elements are removed from DOM
        const cleanup = () => {
            const images = document.querySelectorAll('img.loaded');
            images.forEach(img => {
                if (!img.isConnected) {
                    imageObserver.unobserve(img);
                }
            });
        };
        
        // Run cleanup periodically
        setInterval(cleanup, 30000); // Every 30 seconds
    }
    
    // 8. Network-aware loading
    function setupNetworkAwareLoading() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // Adjust loading strategy based on connection
            if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Reduce image quality for slow connections
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && img.src.includes('.jpg')) {
                        // Could implement quality reduction here
                        img.loading = 'lazy';
                    }
                });
            }
        }
    }
    
    // 9. Smooth scroll with performance
    function optimizeScrolling() {
        // Use passive listeners for better scroll performance
        document.addEventListener('scroll', () => {
            // Throttle scroll events
            if (!window.scrollTimeout) {
                window.scrollTimeout = setTimeout(() => {
                    window.scrollTimeout = null;
                    // Handle scroll-based operations here
                }, 100);
            }
        }, { passive: true });
    }
    
    // 10. Initialize everything when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        // Core optimizations
        initLazyLoading();
        preloadCriticalResources();
        optimizeIncludes();
        
        // Additional optimizations after initial load
        requestIdleCallback(() => {
            addResourceHints();
            optimizeThirdPartyScripts();
            setupMemoryManagement();
            setupNetworkAwareLoading();
            optimizeScrolling();
        });
    }
    
    // Expose API for other scripts
    window.PerformanceBoost = {
        reinitLazyLoading: initLazyLoading,
        preloadResource: (url, type) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = type || 'fetch';
            link.href = url;
            document.head.appendChild(link);
        }
    };
})();

// CSS for loading states
const style = document.createElement('style');
style.textContent = `
    img.loading {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    img.loaded {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .include-loading {
        min-height: 100px;
        position: relative;
    }
    
    .include-loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 30px;
        height: 30px;
        border: 3px solid #f0f0f0;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        to { transform: translate(-50%, -50%) rotate(360deg); }
    }
`;
document.head.appendChild(style);