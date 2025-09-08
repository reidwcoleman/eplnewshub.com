// Performance Optimizer for EPL News Hub
// Implements lazy loading, resource optimization, and performance monitoring

(function() {
    'use strict';

    // Configuration
    const config = {
        lazyLoadOffset: 50,
        imagePlaceholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3Crect width="1" height="1" fill="%23f0f0f0"/%3E%3C/svg%3E',
        debounceDelay: 100,
        prefetchDelay: 2000
    };

    // Lazy Loading for Images
    class LazyLoader {
        constructor() {
            this.images = [];
            this.observer = null;
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
                this.observeImages();
            } else {
                // Fallback for older browsers
                this.loadAllImages();
            }
        }

        observeImages() {
            // Find all images that should be lazy loaded
            const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
            images.forEach(img => {
                // Add placeholder if not already set
                if (!img.src && !img.dataset.placeholder) {
                    img.src = config.imagePlaceholder;
                    img.dataset.placeholder = 'true';
                }
                
                // Store original src if using loading="lazy"
                if (img.loading === 'lazy' && img.src && !img.dataset.src) {
                    img.dataset.src = img.src;
                    img.src = config.imagePlaceholder;
                }
                
                this.observer.observe(img);
                this.images.push(img);
            });
        }

        handleIntersection(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    this.loadImage(img);
                    this.observer.unobserve(img);
                }
            });
        }

        loadImage(img) {
            const src = img.dataset.src || img.getAttribute('data-src');
            if (src) {
                // Create a new image to preload
                const tempImg = new Image();
                tempImg.onload = () => {
                    img.src = src;
                    img.classList.add('loaded');
                    delete img.dataset.placeholder;
                    
                    // Trigger fade-in animation
                    requestAnimationFrame(() => {
                        img.style.opacity = '0';
                        img.style.transition = 'opacity 0.3s ease-in-out';
                        requestAnimationFrame(() => {
                            img.style.opacity = '1';
                        });
                    });
                };
                tempImg.src = src;
            }
        }

        loadAllImages() {
            const images = document.querySelectorAll('img[data-src]');
            images.forEach(img => this.loadImage(img));
        }
    }

    // Defer Non-Critical CSS
    class CSSOptimizer {
        constructor() {
            this.deferredStyles = [];
            this.init();
        }

        init() {
            // Find and defer non-critical stylesheets
            const links = document.querySelectorAll('link[rel="stylesheet"][data-defer]');
            links.forEach(link => {
                this.deferStylesheet(link);
            });
        }

        deferStylesheet(link) {
            // Store the href
            const href = link.href;
            
            // Remove the stylesheet
            link.rel = 'preload';
            link.as = 'style';
            
            // Load it after page load
            link.onload = function() {
                this.rel = 'stylesheet';
            };
            
            // Fallback for browsers that don't support preload
            setTimeout(() => {
                if (link.rel !== 'stylesheet') {
                    link.rel = 'stylesheet';
                }
            }, 3000);
        }
    }

    // Optimize JavaScript Loading
    class ScriptOptimizer {
        constructor() {
            this.scripts = [];
            this.init();
        }

        init() {
            // Defer non-critical scripts
            this.deferScripts();
            
            // Preload critical scripts
            this.preloadCriticalScripts();
        }

        deferScripts() {
            // Find scripts that can be deferred
            const scripts = document.querySelectorAll('script:not([async]):not([defer]):not([type="module"])');
            scripts.forEach(script => {
                if (script.src && !this.isCritical(script.src)) {
                    script.defer = true;
                }
            });
        }

        preloadCriticalScripts() {
            // Add preload hints for critical scripts
            const criticalScripts = [
                './index.js',
                './enhanced-homepage-v2.js'
            ];

            criticalScripts.forEach(src => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'script';
                link.href = src;
                document.head.appendChild(link);
            });
        }

        isCritical(src) {
            const criticalPatterns = [
                'gtag',
                'googletagmanager',
                'mobile-detector'
            ];
            return criticalPatterns.some(pattern => src.includes(pattern));
        }
    }

    // Resource Prefetching
    class ResourcePrefetcher {
        constructor() {
            this.prefetched = new Set();
            this.init();
        }

        init() {
            // Start prefetching after page load
            if (document.readyState === 'complete') {
                this.startPrefetching();
            } else {
                window.addEventListener('load', () => {
                    setTimeout(() => this.startPrefetching(), config.prefetchDelay);
                });
            }
        }

        startPrefetching() {
            // Prefetch important pages
            this.prefetchPages();
            
            // Prefetch DNS for external resources
            this.prefetchDNS();
            
            // Add hover prefetching for links
            this.addHoverPrefetching();
        }

        prefetchPages() {
            const importantPages = [
                '/news.html',
                '/transfer-hub.html',
                '/stats.html'
            ];

            importantPages.forEach(page => {
                this.prefetchResource(page, 'document');
            });
        }

        prefetchDNS() {
            const domains = [
                'https://fonts.googleapis.com',
                'https://cdnjs.cloudflare.com'
            ];

            domains.forEach(domain => {
                const link = document.createElement('link');
                link.rel = 'dns-prefetch';
                link.href = domain;
                document.head.appendChild(link);
            });
        }

        addHoverPrefetching() {
            document.addEventListener('mouseover', (e) => {
                const link = e.target.closest('a');
                if (link && link.href && link.hostname === window.location.hostname) {
                    this.prefetchResource(link.href, 'document');
                }
            }, { passive: true });
        }

        prefetchResource(url, as = 'document') {
            if (!this.prefetched.has(url) && 'requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.as = as;
                    link.href = url;
                    document.head.appendChild(link);
                    this.prefetched.add(url);
                });
            }
        }
    }

    // Performance Monitoring
    class PerformanceMonitor {
        constructor() {
            this.metrics = {};
            this.init();
        }

        init() {
            if ('performance' in window && 'PerformanceObserver' in window) {
                this.observeMetrics();
                this.logMetrics();
            }
        }

        observeMetrics() {
            // Observe Largest Contentful Paint
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {
                // LCP not supported
            }

            // Observe First Input Delay
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    if (entries.length > 0) {
                        this.metrics.fid = entries[0].processingStart - entries[0].startTime;
                    }
                });
                fidObserver.observe({ type: 'first-input', buffered: true });
            } catch (e) {
                // FID not supported
            }

            // Calculate Cumulative Layout Shift
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                    this.metrics.cls = clsValue;
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
            } catch (e) {
                // CLS not supported
            }
        }

        logMetrics() {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    // Log page load time
                    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                    console.log(`Page Load Time: ${loadTime}ms`);

                    // Log Core Web Vitals if available
                    if (this.metrics.lcp) {
                        console.log(`LCP: ${this.metrics.lcp.toFixed(2)}ms`);
                    }
                    if (this.metrics.fid) {
                        console.log(`FID: ${this.metrics.fid.toFixed(2)}ms`);
                    }
                    if (this.metrics.cls) {
                        console.log(`CLS: ${this.metrics.cls.toFixed(4)}`);
                    }

                    // Send metrics to analytics if needed
                    if (window.gtag) {
                        window.gtag('event', 'performance', {
                            'event_category': 'Web Vitals',
                            'load_time': loadTime,
                            'lcp': this.metrics.lcp || 0,
                            'fid': this.metrics.fid || 0,
                            'cls': this.metrics.cls || 0
                        });
                    }
                }, 3000);
            });
        }
    }

    // Optimize Animations
    class AnimationOptimizer {
        constructor() {
            this.init();
        }

        init() {
            this.usePassiveListeners();
            this.optimizeScrolling();
            this.reducedMotion();
        }

        usePassiveListeners() {
            // Override addEventListener to use passive by default for touch and wheel events
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (typeof options === 'boolean') {
                    options = { capture: options };
                } else if (!options) {
                    options = {};
                }
                
                // Make touch and wheel events passive by default
                if (['touchstart', 'touchmove', 'wheel', 'mousewheel'].includes(type)) {
                    options.passive = true;
                }
                
                return originalAddEventListener.call(this, type, listener, options);
            };
        }

        optimizeScrolling() {
            let ticking = false;
            
            function updateScrolling() {
                // Your scroll handling code here
                ticking = false;
            }
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateScrolling);
                    ticking = true;
                }
            }, { passive: true });
        }

        reducedMotion() {
            // Check for reduced motion preference
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            if (prefersReducedMotion) {
                document.documentElement.classList.add('reduced-motion');
                
                // Add CSS to disable animations
                const style = document.createElement('style');
                style.textContent = `
                    .reduced-motion * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                        scroll-behavior: auto !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }

    // Initialize all optimizations
    function init() {
        // Wait for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initOptimizations);
        } else {
            initOptimizations();
        }
    }

    function initOptimizations() {
        new LazyLoader();
        new CSSOptimizer();
        new ScriptOptimizer();
        new ResourcePrefetcher();
        new PerformanceMonitor();
        new AnimationOptimizer();
        
        console.log('Performance optimizations loaded');
    }

    // Start initialization
    init();
})();