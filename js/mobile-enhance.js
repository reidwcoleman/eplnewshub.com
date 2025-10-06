/**
 * EPL News Hub - Mobile Enhancement JavaScript
 * Improves mobile user experience with touch interactions and optimizations
 */

(function() {
    'use strict';

    // ==================== MOBILE DETECTION ====================
    const isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };

    // ==================== VIEWPORT HEIGHT FIX ====================
    // Fix for mobile browser viewport height issues
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // ==================== TOUCH INTERACTIONS ====================
    
    // Add touch feedback to all interactive elements
    function addTouchFeedback() {
        const interactiveElements = document.querySelectorAll('button, a, .clickable, .card, .tool-card');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            });
            
            element.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('touch-active');
                }, 300);
            });
        });
    }

    // ==================== SMOOTH SCROLLING ====================
    function enableSmoothScrolling() {
        // Smooth scroll for anchor links
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
    }

    // ==================== MOBILE NAVIGATION ====================
    function enhanceMobileNavigation() {
        const menuBtn = document.querySelector('.menu-btn, .mobile-menu-toggle');
        const mobileNav = document.querySelector('.mobile-sidebar, .mobile-nav');
        const overlay = document.querySelector('.mobile-sidebar-overlay, .mobile-overlay');
        
        if (menuBtn && mobileNav) {
            // Prevent body scroll when menu is open
            function toggleBodyScroll(disable) {
                if (disable) {
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.width = '100%';
                } else {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                }
            }
            
            menuBtn.addEventListener('click', function() {
                const isOpen = mobileNav.classList.contains('active');
                toggleBodyScroll(!isOpen);
            });
            
            if (overlay) {
                overlay.addEventListener('click', function() {
                    toggleBodyScroll(false);
                });
            }
        }
    }

    // ==================== SWIPE GESTURES ====================
    function enableSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        const threshold = 50;
        
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const mobileNav = document.querySelector('.mobile-sidebar, .mobile-nav');
            if (!mobileNav) return;
            
            // Swipe right to open menu
            if (touchEndX > touchStartX + threshold && touchStartX < 50) {
                if (!mobileNav.classList.contains('active')) {
                    const menuBtn = document.querySelector('.menu-btn, .mobile-menu-toggle');
                    if (menuBtn) menuBtn.click();
                }
            }
            
            // Swipe left to close menu
            if (touchStartX > touchEndX + threshold) {
                if (mobileNav.classList.contains('active')) {
                    const menuBtn = document.querySelector('.menu-btn, .mobile-menu-toggle');
                    if (menuBtn) menuBtn.click();
                }
            }
        }
    }

    // ==================== IMAGE LAZY LOADING ====================
    function optimizeImages() {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
        });
        
        // Add placeholder for loading images
        images.forEach(img => {
            if (!img.complete) {
                img.classList.add('loading');
                img.addEventListener('load', function() {
                    this.classList.remove('loading');
                });
            }
        });
    }

    // ==================== TABLE SCROLL INDICATOR ====================
    function addTableScrollIndicators() {
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-scroll-wrapper';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
            
            // Check if table is scrollable
            function checkScroll() {
                if (wrapper.scrollWidth > wrapper.clientWidth) {
                    wrapper.classList.add('is-scrollable');
                } else {
                    wrapper.classList.remove('is-scrollable');
                }
            }
            
            checkScroll();
            window.addEventListener('resize', checkScroll);
            
            // Add scroll indicators
            wrapper.addEventListener('scroll', function() {
                if (this.scrollLeft > 0) {
                    this.classList.add('scrolled-left');
                } else {
                    this.classList.remove('scrolled-left');
                }
                
                if (this.scrollLeft + this.clientWidth >= this.scrollWidth - 5) {
                    this.classList.add('scrolled-right');
                } else {
                    this.classList.remove('scrolled-right');
                }
            });
        });
    }

    // ==================== FORM ENHANCEMENTS ====================
    function enhanceForms() {
        // Auto-focus first input on form pages
        if (isMobile.any()) {
            const firstInput = document.querySelector('input:not([type="hidden"]), textarea');
            if (firstInput && window.location.pathname.includes('form')) {
                setTimeout(() => {
                    firstInput.focus();
                }, 500);
            }
        }
        
        // Better number input controls
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            const wrapper = document.createElement('div');
            wrapper.className = 'number-input-wrapper';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);
            
            const decreaseBtn = document.createElement('button');
            decreaseBtn.innerHTML = '-';
            decreaseBtn.className = 'number-decrease';
            decreaseBtn.type = 'button';
            
            const increaseBtn = document.createElement('button');
            increaseBtn.innerHTML = '+';
            increaseBtn.className = 'number-increase';
            increaseBtn.type = 'button';
            
            wrapper.insertBefore(decreaseBtn, input);
            wrapper.appendChild(increaseBtn);
            
            decreaseBtn.addEventListener('click', () => {
                input.stepDown();
                input.dispatchEvent(new Event('change'));
            });
            
            increaseBtn.addEventListener('click', () => {
                input.stepUp();
                input.dispatchEvent(new Event('change'));
            });
        });
    }

    // ==================== STICKY HEADER OPTIMIZATION ====================
    function optimizeStickyHeader() {
        const header = document.querySelector('.site-header, header');
        if (!header) return;
        
        let lastScrollTop = 0;
        let ticking = false;
        
        function updateHeader() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down - hide header
                header.classList.add('header-hidden');
            } else {
                // Scrolling up - show header
                header.classList.remove('header-hidden');
            }
            
            lastScrollTop = scrollTop;
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // ==================== PERFORMANCE OPTIMIZATIONS ====================
    function performanceOptimizations() {
        // Debounce resize events
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                setViewportHeight();
            }, 250);
        });
        
        // Reduce motion for users who prefer it
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.classList.add('reduce-motion');
        }
        
        // Add will-change to scrollable elements
        const scrollables = document.querySelectorAll('.scrollable, .overflow-auto, .overflow-scroll');
        scrollables.forEach(el => {
            el.style.willChange = 'transform';
        });
    }

    // ==================== INITIALIZATION ====================
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
        } else {
            initialize();
        }
    }

    function initialize() {
        // Only run on mobile devices or small screens
        if (isMobile.any() || window.innerWidth <= 768) {
            addTouchFeedback();
            enableSmoothScrolling();
            enhanceMobileNavigation();
            enableSwipeGestures();
            optimizeImages();
            addTableScrollIndicators();
            enhanceForms();
            optimizeStickyHeader();
            performanceOptimizations();
            
            // Add mobile class to body
            document.body.classList.add('is-mobile');
            
            // Add specific device classes
            if (isMobile.iOS()) {
                document.body.classList.add('ios-device');
            } else if (isMobile.Android()) {
                document.body.classList.add('android-device');
            }
        }
    }

    // Start the enhancement
    init();

    // ==================== CSS INJECTION ====================
    // Inject critical mobile CSS for immediate effect
    const style = document.createElement('style');
    style.innerHTML = `
        /* Touch feedback */
        .touch-active {
            opacity: 0.7 !important;
            transform: scale(0.98) !important;
        }
        
        /* Loading images */
        img.loading {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* Hidden header on scroll */
        .header-hidden {
            transform: translateY(-100%);
            transition: transform 0.3s ease-in-out;
        }
        
        /* Table scroll indicators */
        .table-scroll-wrapper {
            position: relative;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        .table-scroll-wrapper.is-scrollable::before,
        .table-scroll-wrapper.is-scrollable::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            width: 30px;
            pointer-events: none;
            z-index: 1;
        }
        
        .table-scroll-wrapper.is-scrollable::before {
            left: 0;
            background: linear-gradient(to right, white, transparent);
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .table-scroll-wrapper.is-scrollable::after {
            right: 0;
            background: linear-gradient(to left, white, transparent);
        }
        
        .table-scroll-wrapper.scrolled-left::before {
            opacity: 1;
        }
        
        .table-scroll-wrapper.scrolled-right::after {
            opacity: 0;
        }
        
        /* Number input controls */
        .number-input-wrapper {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .number-increase,
        .number-decrease {
            width: 40px !important;
            height: 40px !important;
            min-width: 40px !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        
        /* Use CSS custom property for viewport height */
        .full-height {
            height: calc(var(--vh, 1vh) * 100);
        }
    `;
    document.head.appendChild(style);

})();