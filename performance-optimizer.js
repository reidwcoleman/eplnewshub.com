// Performance Optimization Script for EPL News Hub
// Implements Core Web Vitals improvements and speed optimizations

(function() {
    'use strict';

    // 1. Lazy Loading for Images
    function initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }

    // 2. Preload Critical Resources
    function preloadCriticalResources() {
        const criticalResources = [
            { href: '/styles.css', as: 'style' },
            { href: '/reidsnbest.webp', as: 'image' },
            { href: '/header.html', as: 'fetch' },
            { href: '/footer.html', as: 'fetch' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.as === 'fetch') {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }

    // 3. Resource Hints for External Domains
    function addResourceHints() {
        const domains = [
            'www.googletagmanager.com',
            'pagead2.googlesyndication.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];

        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
    }

    // 4. Optimize Third-Party Scripts
    function optimizeThirdPartyScripts() {
        // Delay non-critical scripts until user interaction
        const scripts = document.querySelectorAll('script[data-delay]');
        
        const loadDelayedScripts = () => {
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    if (attr.name !== 'data-delay') {
                        newScript.setAttribute(attr.name, attr.value);
                    }
                });
                newScript.textContent = script.textContent;
                script.parentNode.replaceChild(newScript, script);
            });
        };

        // Load delayed scripts on first user interaction
        const events = ['click', 'scroll', 'keydown', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, loadDelayedScripts, { once: true, passive: true });
        });

        // Fallback: load after 5 seconds
        setTimeout(loadDelayedScripts, 5000);
    }

    // 5. Critical CSS Inline Optimization
    function optimizeCriticalCSS() {
        const criticalCSS = `
            /* Critical CSS for above-the-fold content */
            body { margin: 0; font-family: Georgia, serif; }
            .header { background: #262627; color: white; }
            .nyt-article { max-width: 800px; margin: 0 auto; padding: 20px; }
            .nyt-article h1 { font-size: 2.5rem; line-height: 1.2; margin-bottom: 20px; }
            .byline { color: #666; margin-bottom: 20px; }
            .loading { display: flex; justify-content: center; align-items: center; min-height: 200px; }
        `;

        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.insertBefore(style, document.head.firstChild);
    }

    // 6. Image Optimization
    function optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" to images below the fold
            if (!img.hasAttribute('loading')) {
                const rect = img.getBoundingClientRect();
                if (rect.top > window.innerHeight) {
                    img.loading = 'lazy';
                }
            }

            // Add responsive images with srcset if not present
            if (!img.hasAttribute('srcset') && img.src) {
                const src = img.src;
                const ext = src.split('.').pop();
                const baseName = src.replace(`.${ext}`, '');
                
                // Generate WebP alternatives
                img.setAttribute('srcset', 
                    `${baseName}.webp 800w, ${baseName}-mobile.webp 400w`
                );
                img.setAttribute('sizes', 
                    '(max-width: 768px) 400px, 800px'
                );
            }
        });
    }

    // 7. Service Worker for Caching
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }

    // 8. Web Vitals Monitoring
    function initWebVitalsMonitoring() {
        // Core Web Vitals polyfill
        function getCLS(onPerfEntry) {
            if (typeof PerformanceObserver !== 'undefined') {
                const observer = new PerformanceObserver((entryList) => {
                    let cumulativeLayoutShift = 0;
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            cumulativeLayoutShift += entry.value;
                        }
                    }
                    onPerfEntry({ name: 'CLS', value: cumulativeLayoutShift });
                });
                observer.observe({ type: 'layout-shift', buffered: true });
            }
        }

        function getFID(onPerfEntry) {
            if (typeof PerformanceObserver !== 'undefined') {
                const observer = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        onPerfEntry({ name: 'FID', value: entry.processingStart - entry.startTime });
                    }
                });
                observer.observe({ type: 'first-input', buffered: true });
            }
        }

        function getLCP(onPerfEntry) {
            if (typeof PerformanceObserver !== 'undefined') {
                const observer = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    onPerfEntry({ name: 'LCP', value: lastEntry.startTime });
                });
                observer.observe({ type: 'largest-contentful-paint', buffered: true });
            }
        }

        // Report metrics (in production, send to analytics)
        function reportMetric(metric) {
            console.log(`${metric.name}: ${metric.value}`);
            // In production: send to Google Analytics or other monitoring service
            if (typeof gtag !== 'undefined') {
                gtag('event', metric.name, {
                    event_category: 'Web Vitals',
                    value: Math.round(metric.value),
                    non_interaction: true,
                });
            }
        }

        getCLS(reportMetric);
        getFID(reportMetric);
        getLCP(reportMetric);
    }

    // 9. Font Loading Optimization
    function optimizeFontLoading() {
        // Preload critical fonts
        const criticalFonts = [
            '/fonts/georgia-regular.woff2',
            '/fonts/helvetica-regular.woff2'
        ];

        criticalFonts.forEach(font => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = font;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });

        // Add font-display: swap to existing fonts
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'Georgia';
                font-display: swap;
            }
            @font-face {
                font-family: 'Helvetica';
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
    }

    // 10. Connection Optimization
    function optimizeConnections() {
        // Add preconnect for external domains
        const preconnectDomains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.googletagmanager.com'
        ];

        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }

    // Initialize all optimizations
    function init() {
        // Critical optimizations (run immediately)
        optimizeCriticalCSS();
        addResourceHints();
        optimizeConnections();
        optimizeFontLoading();

        // Defer non-critical optimizations
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    initLazyLoading();
                    optimizeImages();
                    optimizeThirdPartyScripts();
                    initWebVitalsMonitoring();
                    registerServiceWorker();
                }, 100);
            });
        } else {
            setTimeout(() => {
                initLazyLoading();
                optimizeImages();
                optimizeThirdPartyScripts();
                initWebVitalsMonitoring();
                registerServiceWorker();
            }, 100);
        }
    }

    // Start optimization
    init();

    // Export for debugging
    window.EPLPerformance = {
        initLazyLoading,
        optimizeImages,
        initWebVitalsMonitoring
    };

})();