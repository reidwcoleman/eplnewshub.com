// Advanced Performance Optimization for EPL News Hub
// Implements comprehensive speed improvements and Core Web Vitals enhancements

(function() {
    'use strict';

    // Configuration
    const config = {
        lazyLoadOffset: 50, // pixels before viewport
        imagePlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3C/svg%3E',
        criticalImages: 3, // Number of images to load immediately
        cacheVersion: 'v1.0',
        compressionQuality: 0.85
    };

    // 1. Advanced Image Lazy Loading with WebP Support
    class ImageOptimizer {
        constructor() {
            this.observer = null;
            this.processedImages = new Set();
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver(
                    (entries) => this.handleIntersection(entries),
                    {
                        rootMargin: `${config.lazyLoadOffset}px`,
                        threshold: 0.01
                    }
                );
                this.optimizeAllImages();
            } else {
                // Fallback for older browsers
                this.loadAllImages();
            }
        }

        optimizeAllImages() {
            const images = document.querySelectorAll('img');
            images.forEach((img, index) => {
                if (index < config.criticalImages) {
                    // Load critical images immediately
                    this.loadImage(img);
                } else {
                    // Set up lazy loading
                    this.setupLazyLoad(img);
                }
            });
        }

        setupLazyLoad(img) {
            if (!img.dataset.src && img.src) {
                // Store original src in data attribute
                img.dataset.src = img.src;
                // Replace with placeholder
                img.src = config.imagePlaceholder;
                img.classList.add('lazy-image');
            }
            
            // Add loading attribute
            img.loading = 'lazy';
            
            // Observe for lazy loading
            if (this.observer && !this.processedImages.has(img)) {
                this.observer.observe(img);
                this.processedImages.add(img);
            }
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }

        loadImage(img) {
            if (img.dataset.src) {
                // Check for WebP support and load appropriate format
                this.loadOptimalFormat(img);
            }
        }

        loadOptimalFormat(img) {
            const originalSrc = img.dataset.src || img.src;
            
            // Check WebP support
            const webpSupport = this.checkWebPSupport();
            
            if (webpSupport && !originalSrc.includes('.webp')) {
                // Try to load WebP version
                const webpSrc = this.getWebPUrl(originalSrc);
                this.preloadImage(webpSrc)
                    .then(() => {
                        img.src = webpSrc;
                        img.classList.remove('lazy-image');
                        img.classList.add('loaded');
                    })
                    .catch(() => {
                        // Fallback to original
                        img.src = originalSrc;
                        img.classList.remove('lazy-image');
                        img.classList.add('loaded');
                    });
            } else {
                img.src = originalSrc;
                img.classList.remove('lazy-image');
                img.classList.add('loaded');
            }
        }

        getWebPUrl(url) {
            // Convert image URLs to WebP format
            const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
            let webpUrl = url;
            
            extensions.forEach(ext => {
                if (url.toLowerCase().includes(ext)) {
                    webpUrl = url.replace(new RegExp(ext + '$', 'i'), '.webp');
                }
            });
            
            return webpUrl;
        }

        preloadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = src;
            });
        }

        checkWebPSupport() {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
        }

        loadAllImages() {
            // Fallback for browsers without IntersectionObserver
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy-image');
                img.classList.add('loaded');
            });
        }
    }

    // 2. JavaScript Optimization and Code Splitting
    class ScriptOptimizer {
        constructor() {
            this.deferredScripts = [];
            this.init();
        }

        init() {
            this.deferNonCriticalScripts();
            this.implementCodeSplitting();
            this.optimizeEventListeners();
        }

        deferNonCriticalScripts() {
            // Find all scripts marked for deferring
            const scripts = document.querySelectorAll('script[data-defer], script[src*="ads"], script[src*="analytics"]');
            
            scripts.forEach(script => {
                if (!script.hasAttribute('async') && !script.hasAttribute('defer')) {
                    this.deferredScripts.push({
                        src: script.src,
                        innerHTML: script.innerHTML,
                        attributes: Array.from(script.attributes)
                    });
                    script.remove();
                }
            });

            // Load deferred scripts after main content
            if (document.readyState === 'complete') {
                this.loadDeferredScripts();
            } else {
                window.addEventListener('load', () => this.loadDeferredScripts());
            }
        }

        loadDeferredScripts() {
            // Load scripts with a slight delay to prioritize content
            setTimeout(() => {
                this.deferredScripts.forEach(scriptData => {
                    const script = document.createElement('script');
                    
                    scriptData.attributes.forEach(attr => {
                        if (attr.name !== 'data-defer') {
                            script.setAttribute(attr.name, attr.value);
                        }
                    });
                    
                    if (scriptData.innerHTML) {
                        script.innerHTML = scriptData.innerHTML;
                    }
                    
                    document.body.appendChild(script);
                });
            }, 1000);
        }

        implementCodeSplitting() {
            // Implement route-based code splitting
            const currentPage = window.location.pathname;
            
            // Load page-specific scripts only when needed
            const pageScripts = {
                '/fpl.html': ['fpl-api-optimized.js', 'fpl-data-service.js'],
                '/articles.html': ['article-enhancer.js', 'article-side-ads.js'],
                '/transfer-hub.html': ['transfer-simulator.js'],
                '/premium.html': ['premium-access-control.js']
            };

            if (pageScripts[currentPage]) {
                pageScripts[currentPage].forEach(script => {
                    this.loadScript(script);
                });
            }
        }

        loadScript(src) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            document.body.appendChild(script);
        }

        optimizeEventListeners() {
            // Implement passive event listeners for better scrolling performance
            const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
            
            passiveEvents.forEach(eventType => {
                document.addEventListener(eventType, () => {}, { passive: true });
            });
        }
    }

    // 3. CSS Optimization
    class StyleOptimizer {
        constructor() {
            this.init();
        }

        init() {
            this.injectCriticalCSS();
            this.optimizeStylesheets();
            this.removeUnusedCSS();
        }

        injectCriticalCSS() {
            // Critical CSS for above-the-fold content
            const criticalCSS = `
                /* Optimized Critical CSS */
                * { box-sizing: border-box; }
                body { margin: 0; font-family: Georgia, serif; line-height: 1.6; color: #000; background: #fff; }
                .header { background: #262627; color: #fff; padding: 15px 0; position: relative; z-index: 100; }
                .main-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
                .article-grid { display: grid; gap: 20px; }
                h1, h2, h3 { font-weight: 700; line-height: 1.2; margin: 0 0 15px; }
                img { max-width: 100%; height: auto; display: block; }
                .lazy-image { opacity: 0; transition: opacity 0.3s; background: #f0f0f0; }
                .lazy-image.loaded { opacity: 1; }
                @media (max-width: 768px) {
                    .main-container { padding: 10px; }
                    h1 { font-size: 1.75rem; }
                }
            `;

            if (!document.getElementById('critical-css')) {
                const style = document.createElement('style');
                style.id = 'critical-css';
                style.innerHTML = criticalCSS;
                document.head.insertBefore(style, document.head.firstChild);
            }
        }

        optimizeStylesheets() {
            // Load non-critical CSS asynchronously
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            
            stylesheets.forEach(link => {
                if (!link.href.includes('styles.css') && !link.href.includes('enhanced-homepage')) {
                    // Convert to preload and load asynchronously
                    const preload = document.createElement('link');
                    preload.rel = 'preload';
                    preload.as = 'style';
                    preload.href = link.href;
                    preload.onload = function() {
                        this.onload = null;
                        this.rel = 'stylesheet';
                    };
                    
                    link.parentNode.replaceChild(preload, link);
                }
            });
        }

        removeUnusedCSS() {
            // Remove unused CSS rules (simplified version)
            requestIdleCallback(() => {
                const stylesheets = document.styleSheets;
                const usedSelectors = new Set();
                
                // Collect all used selectors
                document.querySelectorAll('*').forEach(element => {
                    if (element.id) usedSelectors.add('#' + element.id);
                    if (element.className) {
                        element.classList.forEach(cls => usedSelectors.add('.' + cls));
                    }
                    usedSelectors.add(element.tagName.toLowerCase());
                });

                // This is a simplified approach - in production, use tools like PurgeCSS
            });
        }
    }

    // 4. Resource Hints and Prefetching
    class ResourceOptimizer {
        constructor() {
            this.init();
        }

        init() {
            this.addResourceHints();
            this.prefetchNextPageResources();
            this.implementResourcePriorities();
        }

        addResourceHints() {
            const hints = [
                { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
                { rel: 'dns-prefetch', href: '//www.googletagmanager.com' },
                { rel: 'dns-prefetch', href: '//pagead2.googlesyndication.com' },
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true }
            ];

            hints.forEach(hint => {
                if (!document.querySelector(`link[rel="${hint.rel}"][href="${hint.href}"]`)) {
                    const link = document.createElement('link');
                    link.rel = hint.rel;
                    link.href = hint.href;
                    if (hint.crossorigin) link.crossOrigin = 'anonymous';
                    document.head.appendChild(link);
                }
            });
        }

        prefetchNextPageResources() {
            // Prefetch likely next navigation resources
            const links = document.querySelectorAll('a[href^="/articles/"]');
            const prefetchedUrls = new Set();
            
            links.forEach(link => {
                if (!prefetchedUrls.has(link.href) && prefetchedUrls.size < 3) {
                    const prefetch = document.createElement('link');
                    prefetch.rel = 'prefetch';
                    prefetch.href = link.href;
                    document.head.appendChild(prefetch);
                    prefetchedUrls.add(link.href);
                }
            });
        }

        implementResourcePriorities() {
            // Set fetchpriority for critical resources
            const criticalImages = document.querySelectorAll('img:first-of-type, .hero-image, .main-image');
            criticalImages.forEach(img => {
                img.fetchPriority = 'high';
            });

            // Lower priority for below-the-fold images
            const belowFoldImages = document.querySelectorAll('.sidebar img, footer img');
            belowFoldImages.forEach(img => {
                img.fetchPriority = 'low';
            });
        }
    }

    // 5. Cache Management
    class CacheManager {
        constructor() {
            this.cacheName = 'epl-news-cache-' + config.cacheVersion;
            this.init();
        }

        init() {
            if ('serviceWorker' in navigator) {
                this.registerServiceWorker();
            }
            this.implementBrowserCaching();
        }

        registerServiceWorker() {
            // Enhanced service worker registration
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registered');
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'activated') {
                                    // New service worker activated, clear old caches
                                    this.clearOldCaches();
                                }
                            });
                        });
                    })
                    .catch(error => {
                        console.error('ServiceWorker registration failed:', error);
                    });
            });
        }

        clearOldCaches() {
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames
                            .filter(name => name.startsWith('epl-news-cache-') && name !== this.cacheName)
                            .map(name => caches.delete(name))
                    );
                });
            }
        }

        implementBrowserCaching() {
            // Store frequently accessed data in localStorage
            const cacheableData = {
                'navigation': document.querySelector('.header')?.innerHTML,
                'footer': document.querySelector('.site-footer')?.innerHTML,
                'lastVisit': Date.now()
            };

            Object.entries(cacheableData).forEach(([key, value]) => {
                if (value) {
                    try {
                        localStorage.setItem(`epl-cache-${key}`, JSON.stringify(value));
                    } catch (e) {
                        // Handle storage quota exceeded
                        console.warn('LocalStorage full, clearing old data');
                        this.clearOldLocalStorage();
                    }
                }
            });
        }

        clearOldLocalStorage() {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('epl-cache-')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.timestamp && data.timestamp < oneWeekAgo) {
                            localStorage.removeItem(key);
                        }
                    } catch (e) {
                        localStorage.removeItem(key);
                    }
                }
            });
        }
    }

    // 6. Performance Monitoring
    class PerformanceMonitor {
        constructor() {
            this.metrics = {};
            this.init();
        }

        init() {
            this.measureCoreWebVitals();
            this.trackResourceTiming();
            this.monitorLongTasks();
        }

        measureCoreWebVitals() {
            // Largest Contentful Paint (LCP)
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
                this.reportMetric('LCP', this.metrics.lcp);
            }).observe({ type: 'largest-contentful-paint', buffered: true });

            // First Input Delay (FID)
            new PerformanceObserver((entryList) => {
                const firstInput = entryList.getEntries()[0];
                this.metrics.fid = firstInput.processingStart - firstInput.startTime;
                this.reportMetric('FID', this.metrics.fid);
            }).observe({ type: 'first-input', buffered: true });

            // Cumulative Layout Shift (CLS)
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.metrics.cls = clsValue;
                this.reportMetric('CLS', this.metrics.cls);
            }).observe({ type: 'layout-shift', buffered: true });

            // Time to First Byte (TTFB)
            const navigationTiming = performance.getEntriesByType('navigation')[0];
            if (navigationTiming) {
                this.metrics.ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
                this.reportMetric('TTFB', this.metrics.ttfb);
            }
        }

        trackResourceTiming() {
            window.addEventListener('load', () => {
                const resources = performance.getEntriesByType('resource');
                const slowResources = resources
                    .filter(r => r.duration > 500)
                    .sort((a, b) => b.duration - a.duration)
                    .slice(0, 5);

                if (slowResources.length > 0) {
                    console.log('Slow resources detected:', slowResources.map(r => ({
                        name: r.name,
                        duration: Math.round(r.duration) + 'ms',
                        type: r.initiatorType
                    })));
                }
            });
        }

        monitorLongTasks() {
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) {
                                console.warn('Long task detected:', {
                                    duration: Math.round(entry.duration) + 'ms',
                                    startTime: Math.round(entry.startTime) + 'ms'
                                });
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    // Long task API might not be supported
                }
            }
        }

        reportMetric(name, value) {
            // Send to analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', name, {
                    event_category: 'Web Vitals',
                    value: Math.round(value),
                    non_interaction: true
                });
            }
            
            // Log for debugging
            console.log(`Performance Metric - ${name}: ${Math.round(value)}ms`);
        }
    }

    // 7. Main Initialization
    class PerformanceBoost {
        constructor() {
            this.modules = {};
            this.init();
        }

        init() {
            // Initialize modules based on priority
            this.initializeCritical();
            
            // Defer non-critical initializations
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeDeferred());
            } else {
                this.initializeDeferred();
            }
        }

        initializeCritical() {
            // Critical optimizations that must run immediately
            this.modules.styles = new StyleOptimizer();
            this.modules.resources = new ResourceOptimizer();
        }

        initializeDeferred() {
            // Run after DOM is ready
            requestIdleCallback(() => {
                this.modules.images = new ImageOptimizer();
                this.modules.scripts = new ScriptOptimizer();
                this.modules.cache = new CacheManager();
                this.modules.monitor = new PerformanceMonitor();
            });
        }
    }

    // Start performance optimization
    const performanceBoost = new PerformanceBoost();

    // Export for debugging
    window.EPLPerformanceBoost = performanceBoost;

})();