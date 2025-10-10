// EPL News Hub - Performance Optimizer & Speed Enhancement
// Optimizes Core Web Vitals and page load speed for better SEO

(function() {
    'use strict';
    
    // Lazy load images with Intersection Observer
    function setupLazyLoading() {
        // Add lazy loading styles
        const style = document.createElement('style');
        style.textContent = `
            .lazy-image {
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .lazy-image.loaded {
                opacity: 1;
            }
            
            .lazy-placeholder {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }
            
            @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Convert all images to lazy load
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            // Store original src
            if (img.src) {
                img.dataset.src = img.src;
                img.removeAttribute('src');
                img.classList.add('lazy-image', 'lazy-placeholder');
                img.loading = 'lazy';
            }
        });
        
        // Intersection Observer for images
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.onload = () => {
                            img.classList.add('loaded');
                            img.classList.remove('lazy-placeholder');
                        };
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // Observe all lazy images
        document.querySelectorAll('.lazy-image').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Preload critical resources
    function preloadCriticalResources() {
        const criticalResources = [
            { href: '/styles.css', as: 'style' },
            { href: '/eplnewshubnewlogo.png', as: 'image' },
            { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap', as: 'style' }
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            if (resource.as === 'font') {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        });
    }
    
    // Implement resource hints
    function addResourceHints() {
        // DNS prefetch for external domains
        const domains = [
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://pagead2.googlesyndication.com'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = domain;
            document.head.appendChild(link);
            
            // Also add preconnect for important domains
            if (domain.includes('google')) {
                const preconnect = document.createElement('link');
                preconnect.rel = 'preconnect';
                preconnect.href = domain;
                preconnect.crossOrigin = 'anonymous';
                document.head.appendChild(preconnect);
            }
        });
    }
    
    // Optimize JavaScript execution
    function deferNonCriticalScripts() {
        // Get all script tags
        const scripts = document.querySelectorAll('script[src]:not([defer]):not([async])');
        
        scripts.forEach(script => {
            // Skip critical scripts
            if (script.src.includes('gtag') || script.src.includes('analytics')) {
                script.async = true;
            } else {
                script.defer = true;
            }
        });
    }
    
    // Implement progressive rendering
    function setupProgressiveRendering() {
        // Create above-the-fold content placeholder
        if (document.readyState === 'loading') {
            const criticalCSS = `
                body {
                    margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-shimmer 1.5s infinite;
                }
                
                @keyframes skeleton-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                
                .skeleton-header {
                    height: 60px;
                    width: 100%;
                }
                
                .skeleton-content {
                    margin: 20px;
                }
                
                .skeleton-line {
                    height: 20px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }
                
                .skeleton-line.short {
                    width: 60%;
                }
                
                .skeleton-line.medium {
                    width: 80%;
                }
            `;
            
            const style = document.createElement('style');
            style.textContent = criticalCSS;
            document.head.appendChild(style);
        }
    }
    
    // Optimize Web Font loading
    function optimizeFonts() {
        // Add font-display swap to all font-face declarations
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
        
        // Preload primary fonts
        const primaryFont = document.createElement('link');
        primaryFont.rel = 'preload';
        primaryFont.as = 'font';
        primaryFont.type = 'font/woff2';
        primaryFont.href = 'https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2';
        primaryFont.crossOrigin = 'anonymous';
        document.head.appendChild(primaryFont);
    }
    
    // Cache API responses
    function setupCaching() {
        if ('caches' in window) {
            const CACHE_NAME = 'epl-news-v1';
            const urlsToCache = [
                '/',
                '/styles.css',
                '/scripts.js',
                '/index.js',
                '/eplnewshubnewlogo.png'
            ];
            
            // Cache critical resources
            caches.open(CACHE_NAME).then(cache => {
                cache.addAll(urlsToCache);
            });
            
            // Implement cache-first strategy for static assets
            if ('serviceWorker' in navigator) {
                const swCode = `
                    self.addEventListener('fetch', event => {
                        event.respondWith(
                            caches.match(event.request).then(response => {
                                return response || fetch(event.request);
                            })
                        );
                    });
                `;
                
                const blob = new Blob([swCode], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);
                
                navigator.serviceWorker.register(swUrl).catch(() => {
                    // Silently fail if service worker registration fails
                });
            }
        }
    }
    
    // Monitor Core Web Vitals
    function monitorWebVitals() {
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        let clsEntries = [];
        
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    clsEntries.push(entry);
                }
            }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            // Log LCP for monitoring
            console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
            
            // Send to analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'web_vitals', {
                    'event_category': 'performance',
                    'event_label': 'LCP',
                    'value': Math.round(lastEntry.renderTime || lastEntry.loadTime)
                });
            }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // First Input Delay (FID)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                const delay = entry.processingStart - entry.startTime;
                console.log('FID:', delay);
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'web_vitals', {
                        'event_category': 'performance',
                        'event_label': 'FID',
                        'value': Math.round(delay)
                    });
                }
            });
        }).observe({ type: 'first-input', buffered: true });
    }
    
    // Optimize third-party scripts
    function optimizeThirdPartyScripts() {
        // Delay non-essential third-party scripts
        setTimeout(() => {
            // Load Google AdSense after initial page load
            if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
                const adScript = document.createElement('script');
                adScript.async = true;
                adScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR-ID';
                adScript.crossOrigin = 'anonymous';
                document.head.appendChild(adScript);
            }
        }, 3000);
    }
    
    // Implement request idle callback for non-critical tasks
    function scheduleIdleTasks() {
        if ('requestIdleCallback' in window) {
            // Schedule analytics enhancement
            requestIdleCallback(() => {
                // Enhanced analytics tracking
                if (typeof gtag !== 'undefined') {
                    // Track scroll depth
                    let maxScroll = 0;
                    window.addEventListener('scroll', () => {
                        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
                        const rounded = Math.round(scrollPercent / 25) * 25;
                        
                        if (rounded > maxScroll) {
                            maxScroll = rounded;
                            gtag('event', 'scroll_depth', {
                                'event_category': 'engagement',
                                'event_label': rounded + '%'
                            });
                        }
                    });
                    
                    // Track time on page
                    let timeOnPage = 0;
                    setInterval(() => {
                        timeOnPage += 10;
                        if (timeOnPage % 30 === 0) { // Every 30 seconds
                            gtag('event', 'time_on_page', {
                                'event_category': 'engagement',
                                'value': timeOnPage
                            });
                        }
                    }, 10000);
                }
            });
        }
    }
    
    // Initialize all optimizations
    function init() {
        // Critical optimizations (run immediately)
        preloadCriticalResources();
        addResourceHints();
        setupProgressiveRendering();
        optimizeFonts();
        
        // Run after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setupLazyLoading();
                deferNonCriticalScripts();
                setupCaching();
                monitorWebVitals();
                scheduleIdleTasks();
                
                // Delayed optimizations
                setTimeout(optimizeThirdPartyScripts, 1000);
            });
        } else {
            setupLazyLoading();
            deferNonCriticalScripts();
            setupCaching();
            monitorWebVitals();
            scheduleIdleTasks();
            setTimeout(optimizeThirdPartyScripts, 1000);
        }
    }
    
    // Start optimization immediately
    init();
})();