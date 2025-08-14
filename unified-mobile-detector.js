// Unified Mobile Detection and Responsive Handler for EPL News Hub
(function() {
    'use strict';
    
    // Enhanced Mobile Detection System
    const MobileDetector = {
        // Comprehensive mobile device detection
        detectDevice() {
            const userAgent = navigator.userAgent.toLowerCase();
            const platform = navigator.platform.toLowerCase();
            
            // Check for mobile devices
            const mobileDevices = {
                android: /android/i.test(userAgent),
                ios: /iphone|ipad|ipod/i.test(userAgent),
                windows: /windows phone|iemobile/i.test(userAgent),
                blackberry: /blackberry/i.test(userAgent),
                opera: /opera mini|opera mobi/i.test(userAgent),
                firefox: /fennec/i.test(userAgent),
                generic: /mobile|tablet|phone/i.test(userAgent)
            };
            
            // Check screen characteristics
            const screenChecks = {
                width: window.innerWidth <= 768,
                height: window.innerHeight <= 900,
                touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
                orientation: window.orientation !== undefined,
                pixel: window.devicePixelRatio > 1
            };
            
            // Tablet detection
            const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
                            (screenChecks.width > 768 && screenChecks.width <= 1024 && screenChecks.touch);
            
            // Mobile detection
            const isMobile = Object.values(mobileDevices).some(v => v) || 
                           (screenChecks.width && screenChecks.touch && !isTablet);
            
            return {
                isMobile,
                isTablet,
                isDesktop: !isMobile && !isTablet,
                device: this.getDeviceType(mobileDevices),
                screen: screenChecks,
                userAgent: userAgent
            };
        },
        
        getDeviceType(devices) {
            for (const [type, detected] of Object.entries(devices)) {
                if (detected) return type;
            }
            return 'desktop';
        },
        
        // Get viewport information
        getViewport() {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
                orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
                pixelRatio: window.devicePixelRatio || 1
            };
        }
    };
    
    // Responsive Handler
    const ResponsiveHandler = {
        init() {
            this.deviceInfo = MobileDetector.detectDevice();
            this.viewport = MobileDetector.getViewport();
            
            // Apply initial setup
            this.setupViewport();
            this.applyDeviceClasses();
            this.initializeResponsiveFeatures();
            this.handleOrientationChanges();
            this.setupMobileMenu();
            
            // Monitor changes
            this.watchViewportChanges();
        },
        
        setupViewport() {
            // Ensure viewport meta tag exists and is properly configured
            let viewportMeta = document.querySelector('meta[name="viewport"]');
            if (!viewportMeta) {
                viewportMeta = document.createElement('meta');
                viewportMeta.name = 'viewport';
                document.head.appendChild(viewportMeta);
            }
            
            // Set optimal viewport for mobile devices
            if (this.deviceInfo.isMobile || this.deviceInfo.isTablet) {
                viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
            } else {
                viewportMeta.content = 'width=device-width, initial-scale=1.0';
            }
        },
        
        applyDeviceClasses() {
            const body = document.body;
            
            // Remove any existing device classes
            body.classList.remove('mobile-device', 'tablet-device', 'desktop-device', 
                                 'touch-device', 'no-touch', 'landscape', 'portrait');
            
            // Add appropriate classes
            if (this.deviceInfo.isMobile) {
                body.classList.add('mobile-device');
            } else if (this.deviceInfo.isTablet) {
                body.classList.add('tablet-device');
            } else {
                body.classList.add('desktop-device');
            }
            
            // Touch capability
            if (this.deviceInfo.screen.touch) {
                body.classList.add('touch-device');
            } else {
                body.classList.add('no-touch');
            }
            
            // Orientation
            body.classList.add(this.viewport.orientation);
            
            // Add data attributes for CSS targeting
            body.setAttribute('data-device', this.deviceInfo.device);
            body.setAttribute('data-viewport-width', this.viewport.width);
        },
        
        initializeResponsiveFeatures() {
            // Load unified responsive CSS if not already loaded
            if (!document.querySelector('link[href*="unified-mobile-responsive.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'unified-mobile-responsive.css';
                document.head.appendChild(link);
            }
            
            // Initialize mobile-specific features
            if (this.deviceInfo.isMobile || this.deviceInfo.isTablet) {
                this.initMobileOptimizations();
            }
            
            // Initialize touch events
            if (this.deviceInfo.screen.touch) {
                this.initTouchEvents();
            }
        },
        
        initMobileOptimizations() {
            // Optimize images for mobile
            this.optimizeImages();
            
            // Enable smooth scrolling
            this.enableSmoothScrolling();
            
            // Optimize tables for mobile
            this.optimizeTables();
            
            // Add mobile-friendly navigation
            this.enhanceNavigation();
            
            // Optimize forms for mobile
            this.optimizeForms();
        },
        
        optimizeImages() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                // Add lazy loading
                if (!img.hasAttribute('loading')) {
                    img.setAttribute('loading', 'lazy');
                }
                
                // Add responsive sizing
                if (!img.style.maxWidth) {
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                }
            });
        },
        
        enableSmoothScrolling() {
            // Add smooth scrolling to all internal links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        },
        
        optimizeTables() {
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
                // Wrap tables in scrollable container
                if (!table.parentElement.classList.contains('table-container')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-container';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
            });
        },
        
        enhanceNavigation() {
            const nav = document.querySelector('nav, .main-nav');
            if (nav && (this.deviceInfo.isMobile || this.viewport.width <= 768)) {
                // Add swipe support for navigation
                this.addSwipeSupport(nav);
                
                // Add breadcrumbs for better navigation
                this.addBreadcrumbs();
            }
        },
        
        optimizeForms() {
            // Set appropriate input types for better mobile keyboards
            const emailInputs = document.querySelectorAll('input[type="text"][name*="email"], input[placeholder*="email"]');
            emailInputs.forEach(input => {
                if (input.type === 'text') {
                    input.type = 'email';
                }
            });
            
            const telInputs = document.querySelectorAll('input[type="text"][name*="phone"], input[placeholder*="phone"]');
            telInputs.forEach(input => {
                if (input.type === 'text') {
                    input.type = 'tel';
                }
            });
            
            // Prevent zoom on input focus for iOS
            if (this.deviceInfo.device === 'ios') {
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    input.style.fontSize = '16px';
                });
            }
        },
        
        setupMobileMenu() {
            // Create mobile menu toggle if it doesn't exist
            let menuToggle = document.querySelector('.mobile-menu-toggle');
            if (!menuToggle && (this.deviceInfo.isMobile || this.viewport.width <= 768)) {
                const header = document.querySelector('.header-content, header');
                if (header) {
                    menuToggle = document.createElement('button');
                    menuToggle.className = 'mobile-menu-toggle';
                    menuToggle.innerHTML = '<span></span><span></span><span></span>';
                    menuToggle.setAttribute('aria-label', 'Toggle menu');
                    
                    // Add to header
                    const logo = header.querySelector('.logo');
                    if (logo && logo.parentNode) {
                        logo.parentNode.appendChild(menuToggle);
                    }
                    
                    // Add menu overlay
                    const overlay = document.createElement('div');
                    overlay.className = 'menu-overlay';
                    document.body.appendChild(overlay);
                    
                    // Setup toggle functionality
                    menuToggle.addEventListener('click', () => {
                        const nav = document.querySelector('nav, .main-nav');
                        if (nav) {
                            nav.classList.toggle('active');
                            overlay.classList.toggle('active');
                            menuToggle.classList.toggle('active');
                        }
                    });
                    
                    // Close menu when overlay is clicked
                    overlay.addEventListener('click', () => {
                        const nav = document.querySelector('nav, .main-nav');
                        if (nav) {
                            nav.classList.remove('active');
                            overlay.classList.remove('active');
                            menuToggle.classList.remove('active');
                        }
                    });
                }
            }
        },
        
        initTouchEvents() {
            // Add touch feedback to interactive elements
            const interactiveElements = document.querySelectorAll('a, button, .card, .clickable');
            interactiveElements.forEach(element => {
                element.addEventListener('touchstart', function() {
                    this.classList.add('touch-active');
                });
                
                element.addEventListener('touchend', function() {
                    setTimeout(() => {
                        this.classList.remove('touch-active');
                    }, 100);
                });
            });
        },
        
        addSwipeSupport(element) {
            let startX = 0;
            let startY = 0;
            let distX = 0;
            let distY = 0;
            
            element.addEventListener('touchstart', (e) => {
                startX = e.touches[0].pageX;
                startY = e.touches[0].pageY;
            });
            
            element.addEventListener('touchmove', (e) => {
                distX = e.touches[0].pageX - startX;
                distY = e.touches[0].pageY - startY;
                
                // Horizontal swipe
                if (Math.abs(distX) > Math.abs(distY)) {
                    e.preventDefault();
                    element.scrollLeft -= distX;
                }
            });
        },
        
        addBreadcrumbs() {
            // Add breadcrumb navigation for better mobile UX
            const pathname = window.location.pathname;
            if (pathname !== '/' && pathname !== '/index.html') {
                const breadcrumb = document.createElement('nav');
                breadcrumb.className = 'breadcrumb mobile-only';
                breadcrumb.innerHTML = `
                    <a href="/">Home</a> 
                    <span>›</span> 
                    <span>${document.title.split('|')[0].trim()}</span>
                `;
                
                const main = document.querySelector('main, .main-content');
                if (main && !document.querySelector('.breadcrumb')) {
                    main.insertBefore(breadcrumb, main.firstChild);
                }
            }
        },
        
        handleOrientationChanges() {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.viewport = MobileDetector.getViewport();
                    this.applyDeviceClasses();
                    
                    // Re-initialize features if needed
                    if (this.viewport.width <= 768) {
                        this.setupMobileMenu();
                    }
                }, 300);
            });
        },
        
        watchViewportChanges() {
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    const newViewport = MobileDetector.getViewport();
                    
                    // Check if we've crossed a breakpoint
                    const wasSmall = this.viewport.width <= 768;
                    const isSmall = newViewport.width <= 768;
                    
                    if (wasSmall !== isSmall) {
                        this.viewport = newViewport;
                        this.applyDeviceClasses();
                        this.setupMobileMenu();
                    } else {
                        this.viewport = newViewport;
                    }
                    
                    // Update data attribute
                    document.body.setAttribute('data-viewport-width', this.viewport.width);
                }, 250);
            });
        }
    };
    
    // Performance Monitor
    const PerformanceMonitor = {
        init() {
            if ('IntersectionObserver' in window) {
                this.lazyLoadImages();
                this.lazyLoadIframes();
            }
            
            this.deferNonCriticalCSS();
        },
        
        lazyLoadImages() {
            const images = document.querySelectorAll('img[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        },
        
        lazyLoadIframes() {
            const iframes = document.querySelectorAll('iframe[data-src]');
            const iframeObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const iframe = entry.target;
                        iframe.src = iframe.dataset.src;
                        iframe.removeAttribute('data-src');
                        iframeObserver.unobserve(iframe);
                    }
                });
            });
            
            iframes.forEach(iframe => iframeObserver.observe(iframe));
        },
        
        deferNonCriticalCSS() {
            // Defer loading of non-critical CSS
            const links = document.querySelectorAll('link[data-defer]');
            links.forEach(link => {
                link.removeAttribute('data-defer');
                link.rel = 'stylesheet';
            });
        }
    };
    
    // Initialize everything when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            ResponsiveHandler.init();
            PerformanceMonitor.init();
        });
    } else {
        ResponsiveHandler.init();
        PerformanceMonitor.init();
    }
    
    // Expose for global use if needed
    window.MobileDetector = MobileDetector;
    window.ResponsiveHandler = ResponsiveHandler;
    
})();