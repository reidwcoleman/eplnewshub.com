// Mobile Optimizations for EPL News Hub
(function() {
    'use strict';
    
    // Check if device is mobile
    const isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i);
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i);
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i);
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i);
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };
    
    // Initialize mobile optimizations
    function initMobileOptimizations() {
        if (isMobile.any() || window.innerWidth <= 768) {
            document.body.classList.add('mobile-device');
            
            // Optimize touch events
            optimizeTouchEvents();
            
            // Optimize images for mobile
            optimizeImages();
            
            // Improve scrolling performance
            improveScrollPerformance();
            
            // Handle viewport changes
            handleViewportChanges();
            
            // Optimize forms for mobile
            optimizeForms();
            
            // Add pull-to-refresh functionality
            addPullToRefresh();
        }
    }
    
    // Optimize touch events
    function optimizeTouchEvents() {
        // Fast click implementation
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            const horizontalSwipe = Math.abs(touchEndX - touchStartX);
            const verticalSwipe = Math.abs(touchEndY - touchStartY);
            
            // Detect horizontal swipe for navigation
            if (horizontalSwipe > swipeThreshold && horizontalSwipe > verticalSwipe) {
                if (touchEndX < touchStartX) {
                    // Swipe left - could open menu
                    const menuBtn = document.querySelector('.menu-btn');
                    if (menuBtn && window.innerWidth <= 768) {
                        // Optional: implement swipe to open menu
                    }
                }
                if (touchEndX > touchStartX) {
                    // Swipe right - could close menu
                    const sidebar = document.getElementById('mobile-sidebar');
                    if (sidebar && sidebar.classList.contains('active')) {
                        toggleMobileMenu();
                    }
                }
            }
        }
        
        // Remove 300ms delay on touch devices
        const clickableElements = document.querySelectorAll('a, button, input, select, textarea, .clickable');
        clickableElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                this.classList.remove('touch-active');
            }, { passive: true });
        });
    }
    
    // Optimize images for mobile
    function optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" if not present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Ensure images have proper dimensions
            if (!img.hasAttribute('width') && img.naturalWidth) {
                img.setAttribute('width', img.naturalWidth);
            }
            if (!img.hasAttribute('height') && img.naturalHeight) {
                img.setAttribute('height', img.naturalHeight);
            }
            
            // Add error handling
            img.addEventListener('error', function() {
                this.style.display = 'none';
            });
        });
        
        // Implement progressive image loading
        const lazyImages = document.querySelectorAll('img[data-src]');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(img => imageObserver.observe(img));
        }
    }
    
    // Improve scrolling performance
    function improveScrollPerformance() {
        let ticking = false;
        let lastScrollY = 0;
        const header = document.querySelector('.site-header');
        
        function updateHeader() {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                header?.classList.add('compact');
            } else {
                header?.classList.remove('compact');
            }
            
            // Hide header on scroll down, show on scroll up
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header?.classList.add('hidden-header');
            } else {
                header?.classList.remove('hidden-header');
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }
        
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }, { passive: true });
    }
    
    // Handle viewport changes
    function handleViewportChanges() {
        let viewportHeight = window.innerHeight;
        
        // Fix for mobile browsers with changing viewport height
        document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
        
        window.addEventListener('resize', () => {
            const newViewportHeight = window.innerHeight;
            if (Math.abs(viewportHeight - newViewportHeight) > 100) {
                viewportHeight = newViewportHeight;
                document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
            }
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                viewportHeight = window.innerHeight;
                document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
            }, 500);
        });
    }
    
    // Optimize forms for mobile
    function optimizeForms() {
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Prevent zoom on focus for iOS
            if (input.type === 'text' || input.type === 'email' || input.type === 'password') {
                input.style.fontSize = '16px';
            }
            
            // Add proper input modes
            if (input.type === 'email' && !input.hasAttribute('inputmode')) {
                input.setAttribute('inputmode', 'email');
            }
            if (input.type === 'tel' && !input.hasAttribute('inputmode')) {
                input.setAttribute('inputmode', 'tel');
            }
            if (input.type === 'url' && !input.hasAttribute('inputmode')) {
                input.setAttribute('inputmode', 'url');
            }
            if (input.type === 'number' && !input.hasAttribute('inputmode')) {
                input.setAttribute('inputmode', 'numeric');
            }
            
            // Auto-capitalize where appropriate
            if (input.type === 'text' && !input.hasAttribute('autocapitalize')) {
                input.setAttribute('autocapitalize', 'sentences');
            }
        });
    }
    
    // Add pull-to-refresh functionality
    function addPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pulling = false;
        const threshold = 100;
        
        const refreshIndicator = document.createElement('div');
        refreshIndicator.className = 'pull-to-refresh';
        refreshIndicator.innerHTML = '<span>↓ Pull to refresh</span>';
        refreshIndicator.style.cssText = `
            position: fixed;
            top: -60px;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(135deg, #37003c, #6f42c1);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            transition: transform 0.3s ease;
            z-index: 997;
        `;
        document.body.appendChild(refreshIndicator);
        
        document.addEventListener('touchstart', function(e) {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            if (!pulling) return;
            
            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;
            
            if (pullDistance > 0 && pullDistance < threshold * 2) {
                refreshIndicator.style.transform = `translateY(${Math.min(pullDistance, threshold)}px)`;
                
                if (pullDistance > threshold) {
                    refreshIndicator.innerHTML = '<span>↑ Release to refresh</span>';
                } else {
                    refreshIndicator.innerHTML = '<span>↓ Pull to refresh</span>';
                }
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function() {
            if (!pulling) return;
            
            const pullDistance = currentY - startY;
            
            if (pullDistance > threshold) {
                refreshIndicator.innerHTML = '<span>⟳ Refreshing...</span>';
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                refreshIndicator.style.transform = 'translateY(0)';
            }
            
            pulling = false;
            startY = 0;
            currentY = 0;
        }, { passive: true });
    }
    
    // Add mobile-specific CSS
    function addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile touch feedback */
            .touch-active {
                opacity: 0.7 !important;
                transform: scale(0.98) !important;
            }
            
            /* Compact header on scroll */
            .site-header.compact {
                padding: 8px 0;
            }
            
            .site-header.compact .logo h1 {
                font-size: 1.1rem;
            }
            
            .site-header.compact .logo-image {
                width: 30px;
                height: 30px;
            }
            
            /* Hidden header animation */
            .site-header.hidden-header {
                transform: translateY(-100%);
                transition: transform 0.3s ease;
            }
            
            /* Use CSS custom property for viewport height */
            .mobile-device .mobile-sidebar {
                height: calc(var(--vh, 1vh) * 100);
            }
            
            /* Optimize for thumb reach on mobile */
            @media (max-width: 768px) {
                .mobile-device .main-nav {
                    padding-bottom: env(safe-area-inset-bottom);
                }
                
                .mobile-device .footer {
                    padding-bottom: env(safe-area-inset-bottom);
                }
                
                /* Larger tap targets */
                .mobile-device a,
                .mobile-device button {
                    min-height: 44px;
                    min-width: 44px;
                }
                
                /* Better spacing for mobile */
                .mobile-device p {
                    margin-bottom: 1.2rem;
                }
                
                .mobile-device h1,
                .mobile-device h2,
                .mobile-device h3 {
                    margin-top: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize everything when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initMobileOptimizations();
            addMobileStyles();
        });
    } else {
        initMobileOptimizations();
        addMobileStyles();
    }
    
    // Re-initialize on orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(initMobileOptimizations, 300);
    });
    
})();