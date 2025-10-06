// Ultra-Fast Page Loader for EPL News Hub
// This script optimizes page loading to achieve ~2 second load times

(function() {
    'use strict';
    
    // 1. Defer non-critical resources
    function deferResource(src, type = 'script', timeout = 1000) {
        setTimeout(() => {
            if (type === 'script') {
                const script = document.createElement('script');
                script.async = true;
                script.src = src;
                document.body.appendChild(script);
            } else if (type === 'stylesheet') {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = src;
                document.head.appendChild(link);
            }
        }, timeout);
    }
    
    // 2. Optimize image loading
    function optimizeImages() {
        // Convert all images to lazy loading except first 3
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (index > 2 && !img.loading) {
                img.loading = 'lazy';
                img.decoding = 'async';
            }
        });
        
        // Use IntersectionObserver for better lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src && !img.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    // 3. Optimize include loading
    async function fastInclude() {
        const includes = document.querySelectorAll('[include]');
        
        // Priority order for includes
        const priority = {
            './header.html': 1,
            './main_headline.html': 2,
            './main_subheadline1.html': 3,
            './main_subheadline2.html': 3,
            './main_subheadline3.html': 3,
            './secondary_subheadline1.html': 4,
            './secondary_subheadline2.html': 4,
            './footer.html': 5
        };
        
        // Sort includes by priority
        const sortedIncludes = Array.from(includes).sort((a, b) => {
            const aPriority = priority[a.getAttribute('include')] || 99;
            const bPriority = priority[b.getAttribute('include')] || 99;
            return aPriority - bPriority;
        });
        
        // Load critical includes first (priority 1-2)
        const critical = sortedIncludes.filter(el => {
            const p = priority[el.getAttribute('include')] || 99;
            return p <= 2;
        });
        
        await Promise.all(critical.map(loadInclude));
        
        // Then load the rest
        sortedIncludes.filter(el => !critical.includes(el)).forEach(el => {
            requestIdleCallback(() => loadInclude(el), { timeout: 2000 });
        });
    }
    
    async function loadInclude(element) {
        const url = element.getAttribute('include');
        if (!url) return;
        
        try {
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                element.innerHTML = html;
                element.removeAttribute('include');
                
                // Process any scripts in the loaded content
                const scripts = element.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    Array.from(script.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    newScript.textContent = script.textContent;
                    script.parentNode.replaceChild(newScript, script);
                });
            }
        } catch (error) {
            console.error('Failed to load include:', url);
        }
    }
    
    // 4. Defer non-critical CSS
    function deferStyles() {
        const nonCriticalStyles = [
            'enhanced-homepage-v2.css',
            'featured-article-cards.css',
            'mobile-optimization.css',
            'polished-articles.css',
            'secondary-final-perfect.css'
        ];
        
        nonCriticalStyles.forEach((href, index) => {
            setTimeout(() => {
                const link = document.querySelector(`link[href*="${href}"]`);
                if (link) {
                    link.media = 'print';
                    link.onload = function() { this.media = 'all'; };
                }
            }, index * 100);
        });
    }
    
    // 5. Optimize third-party scripts
    function deferThirdParty() {
        // Defer Google Analytics
        const gtag = document.querySelector('script[src*="googletagmanager"]');
        if (gtag) {
            gtag.remove();
            deferResource('https://www.googletagmanager.com/gtag/js?id=G-TVPLGM5QY9', 'script', 3000);
        }
        
        // Defer AdSense
        const adsense = document.querySelector('script[src*="pagead2"]');
        if (adsense) {
            adsense.remove();
            deferResource('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6480210605786899', 'script', 5000);
        }
        
        // Defer Font Awesome
        const fa = document.querySelector('link[href*="font-awesome"]');
        if (fa) {
            fa.remove();
            deferResource('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css', 'stylesheet', 2000);
        }
    }
    
    // 6. Resource hints
    function addResourceHints() {
        // Add preconnect for critical domains
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.googletagmanager.com',
            'https://pagead2.googlesyndication.com'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            if (domain.includes('fonts')) {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }
    
    // 7. Clean up and optimize DOM
    function optimizeDOM() {
        // Remove empty elements
        document.querySelectorAll('*:empty:not(img):not(input):not(br):not(hr)').forEach(el => {
            if (!el.hasAttribute('include')) {
                el.remove();
            }
        });
        
        // Defer iframes
        document.querySelectorAll('iframe').forEach(iframe => {
            if (!iframe.src && iframe.dataset.src) {
                setTimeout(() => {
                    iframe.src = iframe.dataset.src;
                }, 3000);
            }
        });
    }
    
    // 8. Service Worker for caching
    function registerServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    }
    
    // Initialize optimizations
    function init() {
        // Run immediately
        addResourceHints();
        optimizeImages();
        deferStyles();
        
        // Run on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                fastInclude();
                deferThirdParty();
                optimizeDOM();
            });
        } else {
            fastInclude();
            deferThirdParty();
            optimizeDOM();
        }
        
        // Run after load
        window.addEventListener('load', () => {
            setTimeout(registerServiceWorker, 1000);
        });
    }
    
    init();
})();

// Performance monitoring
window.addEventListener('load', () => {
    if (performance && performance.timing) {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);
        
        // Send to analytics if needed
        if (window.gtag && loadTime) {
            window.gtag('event', 'page_load_time', {
                value: loadTime,
                page_path: window.location.pathname
            });
        }
    }
});