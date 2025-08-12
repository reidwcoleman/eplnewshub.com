// Mobile Enhancements for EPL News Hub

document.addEventListener('DOMContentLoaded', function() {
    // Detect if user is on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
        // Mobile device optimizations
        
        // Disable sticky header on mobile to prevent scrolling issues
        const siteHeader = document.querySelector('.site-header');
        if (siteHeader) {
            siteHeader.style.position = 'relative';
        }
        
        // Optimize images for mobile
        document.querySelectorAll('img').forEach(img => {
            // Add loading lazy attribute if not present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Ensure images don't overflow
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        });
        
        // Improve touch interactions
        document.querySelectorAll('a, button').forEach(element => {
            // Add touch feedback
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            });
            
            element.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
        });
        
        // Prevent horizontal scroll
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        
        // Fix viewport height for mobile browsers
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        
        // Smooth scroll for internal links
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
        
        // Optimize newsletter forms for mobile
        const newsletterForms = document.querySelectorAll('.newsletter-banner-form, .widget-form');
        newsletterForms.forEach(form => {
            const input = form.querySelector('input[type="email"]');
            if (input) {
                input.setAttribute('autocomplete', 'email');
                input.setAttribute('inputmode', 'email');
            }
        });
        
        // Handle mobile menu if exists
        const mobileMenuBtn = document.querySelector('.menu-btn');
        const mobileSidebar = document.querySelector('.mobile-sidebar');
        const closeSidebarBtn = document.querySelector('.close-sidebar');
        const sidebarOverlay = document.querySelector('.mobile-sidebar-overlay');
        
        if (mobileMenuBtn && mobileSidebar) {
            // Prevent sidebar from sliding in from the side
            mobileSidebar.style.display = 'none';
            
            mobileMenuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // Instead of sliding, use a dropdown or modal approach
                if (mobileSidebar.style.display === 'none') {
                    mobileSidebar.style.display = 'block';
                    mobileSidebar.style.right = '0';
                    mobileSidebar.style.opacity = '1';
                } else {
                    mobileSidebar.style.display = 'none';
                }
            });
            
            if (closeSidebarBtn) {
                closeSidebarBtn.addEventListener('click', function() {
                    mobileSidebar.style.display = 'none';
                });
            }
            
            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', function() {
                    mobileSidebar.style.display = 'none';
                });
            }
        }
        
        // Optimize article cards for mobile
        const storyCards = document.querySelectorAll('.story-card');
        storyCards.forEach(card => {
            // Remove hover effects on mobile
            card.addEventListener('touchstart', function() {
                this.classList.add('touch-active');
            });
            
            card.addEventListener('touchend', function() {
                setTimeout(() => {
                    this.classList.remove('touch-active');
                }, 300);
            });
        });
        
        // Add mobile-specific class to body
        document.body.classList.add('mobile-device');
        
        // Handle orientation changes
        window.addEventListener('orientationchange', function() {
            // Force a reflow to fix any layout issues
            document.body.style.display = 'none';
            document.body.offsetHeight; // Trigger reflow
            document.body.style.display = '';
        });
        
        // Prevent pull-to-refresh on Chrome mobile
        let lastY = 0;
        window.addEventListener('touchstart', function(e) {
            lastY = e.touches[0].clientY;
        }, { passive: false });
        
        window.addEventListener('touchmove', function(e) {
            const y = e.touches[0].clientY;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const isScrollingUp = y > lastY;
            
            if (isScrollingUp && scrollTop === 0) {
                e.preventDefault();
            }
            lastY = y;
        }, { passive: false });
    }
    
    // Handle resize events
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            const nowMobile = window.innerWidth <= 768;
            
            if (nowMobile) {
                // Apply mobile optimizations
                
                document.body.classList.add('mobile-device');
            } else {
                // Remove mobile optimizations for desktop
                
                document.body.classList.remove('mobile-device');
            }
        }, 250);
    });
});

// Add CSS for mobile-specific styles
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    .mobile-device .story-card {
        transition: none !important;
    }
    
    .mobile-device .story-card.touch-active {
        opacity: 0.8;
        transform: scale(0.98);
    }
    
    
    .mobile-device .site-header {
        position: relative !important;
    }
    
    .mobile-device * {
        -webkit-tap-highlight-color: transparent;
    }
    
    /* Use CSS custom property for viewport height */
    .mobile-device .main-content {
        min-height: calc(var(--vh, 1vh) * 100);
    }
`;
document.head.appendChild(mobileStyles);