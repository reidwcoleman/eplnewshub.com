// Ultra Performance Optimization for EPL News Hub
// Maximum speed optimizations for instant loading

(function() {
    'use strict';
    
    // 1. CRITICAL: Implement Progressive Image Loading with Blur-Up Effect
    class BlurUpImageLoader {
        constructor() {
            this.queue = [];
            this.loading = false;
            this.observer = null;
            this.init();
        }
        
        init() {
            // Create intersection observer with aggressive settings
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.queue.push(entry.target);
                        this.processQueue();
                    }
                });
            }, {
                rootMargin: '100px 0px', // Load 100px before viewport
                threshold: 0.001
            });
            
            // Find all images and set up blur-up loading
            this.setupImages();
        }
        
        setupImages() {
            const images = document.querySelectorAll('img');
            
            images.forEach(img => {
                if (!img.dataset.processed) {
                    // Create tiny placeholder
                    const placeholder = this.createPlaceholder(img);
                    
                    // Wrap image for blur effect
                    const wrapper = document.createElement('div');
                    wrapper.className = 'blur-up-wrapper';
                    wrapper.style.position = 'relative';
                    wrapper.style.overflow = 'hidden';
                    
                    if (img.parentNode) {
                        img.parentNode.insertBefore(wrapper, img);
                        wrapper.appendChild(placeholder);
                        wrapper.appendChild(img);
                    }
                    
                    // Mark as processed
                    img.dataset.processed = 'true';
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.3s ease-out';
                    
                    // Observe this image
                    this.observer.observe(img);
                }
            });
        }
        
        createPlaceholder(img) {
            const placeholder = document.createElement('div');
            placeholder.className = 'blur-placeholder';
            placeholder.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
                filter: blur(20px);
                transform: scale(1.1);
                z-index: 1;
            `;
            return placeholder;
        }
        
        processQueue() {
            if (this.loading || this.queue.length === 0) return;
            
            this.loading = true;
            const img = this.queue.shift();
            
            // Load image with priority
            this.loadImage(img).then(() => {
                this.loading = false;
                this.processQueue();
            });
        }
        
        loadImage(img) {
            return new Promise((resolve) => {
                // Skip if already loaded
                if (img.complete && img.naturalHeight !== 0) {
                    this.revealImage(img);
                    resolve();
                    return;
                }
                
                // Create new image for preloading
                const tempImg = new Image();
                tempImg.onload = () => {
                    this.revealImage(img);
                    resolve();
                };
                tempImg.onerror = resolve;
                
                // Set loading priority
                if ('loading' in tempImg) {
                    tempImg.loading = 'eager';
                }
                
                // Start loading
                tempImg.src = img.src || img.dataset.src;
                
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        }
        
        revealImage(img) {
            const wrapper = img.closest('.blur-up-wrapper');
            const placeholder = wrapper?.querySelector('.blur-placeholder');
            
            // Fade in image
            img.style.opacity = '1';
            img.style.position = 'relative';
            img.style.zIndex = '2';
            
            // Fade out placeholder
            if (placeholder) {
                placeholder.style.transition = 'opacity 0.3s ease-out';
                placeholder.style.opacity = '0';
                setTimeout(() => placeholder.remove(), 300);
            }
            
            // Stop observing
            this.observer.unobserve(img);
        }
    }
    
    // 2. Implement Request Idle Callback Queue for Non-Critical Tasks
    class IdleTaskQueue {
        constructor() {
            this.tasks = [];
            this.processing = false;
        }
        
        add(task, priority = 'low') {
            this.tasks.push({ task, priority });
            this.process();
        }
        
        process() {
            if (this.processing || this.tasks.length === 0) return;
            
            this.processing = true;
            
            // Sort by priority
            this.tasks.sort((a, b) => {
                const priorities = { high: 3, medium: 2, low: 1 };
                return priorities[b.priority] - priorities[a.priority];
            });
            
            const task = this.tasks.shift();
            
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    task.task();
                    this.processing = false;
                    this.process();
                }, { timeout: 100 });
            } else {
                setTimeout(() => {
                    task.task();
                    this.processing = false;
                    this.process();
                }, 1);
            }
        }
    }
    
    // 3. Implement Skeleton Loading
    function addSkeletonLoading() {
        const includeElements = document.querySelectorAll('[include]:not(.skeleton-processed)');
        
        includeElements.forEach(element => {
            element.classList.add('skeleton-processed');
            
            // Add skeleton based on element type
            if (element.classList.contains('header')) {
                element.innerHTML = `
                    <div class="skeleton-header">
                        <div class="skeleton-nav"></div>
                    </div>
                `;
            } else if (element.classList.contains('main_headline')) {
                element.innerHTML = `
                    <div class="skeleton-article">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-title"></div>
                        <div class="skeleton-text"></div>
                    </div>
                `;
            }
        });
    }
    
    // 4. Resource Priority Manager
    class ResourcePriorityManager {
        constructor() {
            this.criticalResources = [];
            this.deferredResources = [];
        }
        
        prioritizeResources() {
            // Identify critical resources
            const critical = [
                'styles.css',
                'index.js',
                'saka.png' // Main headline image
            ];
            
            critical.forEach(resource => {
                this.preloadResource(resource);
            });
            
            // Defer non-critical resources
            this.deferNonCritical();
        }
        
        preloadResource(url) {
            const link = document.createElement('link');
            link.rel = 'preload';
            
            if (url.endsWith('.css')) {
                link.as = 'style';
            } else if (url.endsWith('.js')) {
                link.as = 'script';
            } else if (url.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                link.as = 'image';
            }
            
            link.href = url;
            document.head.appendChild(link);
        }
        
        deferNonCritical() {
            // Defer font loading
            const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis"]');
            fontLinks.forEach(link => {
                link.media = 'print';
                link.onload = function() { this.media = 'all'; };
            });
            
            // Defer third-party scripts
            const thirdPartyScripts = document.querySelectorAll('script[src*="googlesyndication"], script[src*="googletagmanager"]');
            thirdPartyScripts.forEach(script => {
                script.defer = true;
            });
        }
    }
    
    // 5. Connection-Aware Loading Strategy
    class ConnectionAwareLoader {
        constructor() {
            this.connectionType = this.getConnectionType();
            this.applyStrategy();
        }
        
        getConnectionType() {
            if (!navigator.connection) return 'unknown';
            
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            
            if (connection.saveData) return 'save-data';
            if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
            if (effectiveType === '3g') return 'medium';
            return 'fast';
        }
        
        applyStrategy() {
            switch(this.connectionType) {
                case 'save-data':
                case 'slow':
                    this.applyLowBandwidthStrategy();
                    break;
                case 'medium':
                    this.applyMediumBandwidthStrategy();
                    break;
                default:
                    this.applyHighBandwidthStrategy();
            }
        }
        
        applyLowBandwidthStrategy() {
            // Disable autoplay
            document.querySelectorAll('video').forEach(v => v.pause());
            
            // Use lower quality images
            document.querySelectorAll('img').forEach(img => {
                if (img.src && img.src.includes('.jpg')) {
                    // Could implement quality reduction
                    img.loading = 'lazy';
                }
            });
            
            // Limit concurrent requests
            window.maxConcurrentRequests = 2;
        }
        
        applyMediumBandwidthStrategy() {
            // Standard lazy loading
            window.maxConcurrentRequests = 4;
        }
        
        applyHighBandwidthStrategy() {
            // Aggressive prefetching
            window.maxConcurrentRequests = 6;
            
            // Prefetch next likely navigation
            setTimeout(() => {
                const links = document.querySelectorAll('a[href*="/articles/"]');
                const topLinks = Array.from(links).slice(0, 5);
                
                topLinks.forEach(link => {
                    const prefetch = document.createElement('link');
                    prefetch.rel = 'prefetch';
                    prefetch.href = link.href;
                    document.head.appendChild(prefetch);
                });
            }, 2000);
        }
    }
    
    // 6. Performance Metrics Tracker
    class PerformanceTracker {
        constructor() {
            this.metrics = {};
            this.track();
        }
        
        track() {
            // Track key metrics
            if (window.performance && performance.timing) {
                const timing = performance.timing;
                
                this.metrics = {
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    loadComplete: timing.loadEventEnd - timing.navigationStart,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint()
                };
                
                // Log to console in dev mode
                if (window.location.hostname === 'localhost') {
                    console.table(this.metrics);
                }
                
                // Send to analytics if needed
                this.reportMetrics();
            }
        }
        
        getFirstPaint() {
            if (window.performance && performance.getEntriesByType) {
                const paintEntries = performance.getEntriesByType('paint');
                const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
                return firstPaint ? firstPaint.startTime : 0;
            }
            return 0;
        }
        
        getFirstContentfulPaint() {
            if (window.performance && performance.getEntriesByType) {
                const paintEntries = performance.getEntriesByType('paint');
                const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
                return fcp ? fcp.startTime : 0;
            }
            return 0;
        }
        
        reportMetrics() {
            // Report to analytics if available
            if (window.gtag) {
                window.gtag('event', 'performance', {
                    event_category: 'Web Vitals',
                    event_label: 'Page Load',
                    value: Math.round(this.metrics.loadComplete),
                    non_interaction: true
                });
            }
        }
    }
    
    // 7. Initialize Everything
    const idleQueue = new IdleTaskQueue();
    
    // Critical tasks - run immediately
    function initCritical() {
        // Add skeleton loading
        addSkeletonLoading();
        
        // Initialize blur-up image loader
        new BlurUpImageLoader();
        
        // Set up resource priorities
        new ResourcePriorityManager().prioritizeResources();
    }
    
    // Non-critical tasks - run when idle
    function initNonCritical() {
        idleQueue.add(() => new ConnectionAwareLoader(), 'medium');
        idleQueue.add(() => new PerformanceTracker(), 'low');
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        // Critical CSS for skeleton loading
        const style = document.createElement('style');
        style.textContent = `
            /* Skeleton Loading Styles */
            .skeleton-header, .skeleton-article, .skeleton-image, 
            .skeleton-title, .skeleton-text, .skeleton-nav {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
                border-radius: 4px;
            }
            
            @keyframes skeleton-loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            .skeleton-header { height: 60px; margin-bottom: 20px; }
            .skeleton-nav { height: 40px; width: 80%; margin: 10px auto; }
            .skeleton-article { padding: 20px; }
            .skeleton-image { height: 300px; margin-bottom: 15px; }
            .skeleton-title { height: 30px; width: 70%; margin-bottom: 10px; }
            .skeleton-text { height: 20px; width: 90%; }
            
            /* Blur-up effect */
            .blur-up-wrapper { position: relative; overflow: hidden; }
            .blur-placeholder { will-change: opacity, filter; }
        `;
        document.head.insertBefore(style, document.head.firstChild);
        
        document.addEventListener('DOMContentLoaded', initCritical);
        window.addEventListener('load', initNonCritical);
    } else {
        initCritical();
        initNonCritical();
    }
    
    // Expose API
    window.UltraPerformance = {
        idleQueue,
        reprocessImages: () => new BlurUpImageLoader()
    };
})();