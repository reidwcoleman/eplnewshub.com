// EPL News Hub - Mobile Navigation Script

document.addEventListener('DOMContentLoaded', function() {
    // Create mobile navigation toggle button if it doesn't exist
    function initMobileNav() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        // Check if mobile toggle already exists
        let mobileToggle = header.querySelector('.mobile-nav-toggle');
        
        if (!mobileToggle) {
            // Create mobile menu toggle button
            mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-nav-toggle';
            mobileToggle.innerHTML = '☰';
            mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
            mobileToggle.setAttribute('aria-expanded', 'false');
            
            // Insert the toggle button in the header
            const headerContent = header.querySelector('.header-content') || header.firstElementChild || header;
            headerContent.style.position = 'relative';
            headerContent.appendChild(mobileToggle);
        }
        
        // Get the navigation menu
        const nav = header.querySelector('nav');
        if (!nav) return;
        
        // Add mobile menu functionality
        mobileToggle.addEventListener('click', function() {
            const isOpen = nav.classList.contains('mobile-menu-open');
            
            if (isOpen) {
                nav.classList.remove('mobile-menu-open');
                mobileToggle.innerHTML = '☰';
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            } else {
                nav.classList.add('mobile-menu-open');
                mobileToggle.innerHTML = '✕';
                mobileToggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!header.contains(event.target) && nav.classList.contains('mobile-menu-open')) {
                nav.classList.remove('mobile-menu-open');
                mobileToggle.innerHTML = '☰';
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (nav.classList.contains('mobile-menu-open')) {
                    nav.classList.remove('mobile-menu-open');
                    mobileToggle.innerHTML = '☰';
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 768) {
                    nav.classList.remove('mobile-menu-open');
                    mobileToggle.innerHTML = '☰';
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                }
            }, 250);
        });
    }
    
    // Initialize mobile navigation
    initMobileNav();
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80; // Account for fixed header
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add swipe functionality for mobile menu
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleSwipe() {
        const header = document.querySelector('.header');
        const nav = header ? header.querySelector('nav') : null;
        const mobileToggle = header ? header.querySelector('.mobile-nav-toggle') : null;
        
        if (!nav || !mobileToggle) return;
        
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        // Swipe right to open menu
        if (swipeDistance > swipeThreshold && touchStartX < 50) {
            nav.classList.add('mobile-menu-open');
            mobileToggle.innerHTML = '✕';
            mobileToggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        
        // Swipe left to close menu
        if (swipeDistance < -swipeThreshold && nav.classList.contains('mobile-menu-open')) {
            nav.classList.remove('mobile-menu-open');
            mobileToggle.innerHTML = '☰';
            mobileToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }
    
    // Add touch event listeners for swipe
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    // Improve table responsiveness
    function makeTablesResponsive() {
        const tables = document.querySelectorAll('table');
        
        tables.forEach(table => {
            // Wrap table in scrollable container if not already wrapped
            if (!table.parentElement.classList.contains('table-container')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-container';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
            
            // Add responsive class to table
            table.classList.add('responsive-table');
            
            // Add data-labels for mobile view
            const headers = table.querySelectorAll('thead th');
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, index) => {
                    if (headers[index]) {
                        cell.setAttribute('data-label', headers[index].textContent);
                    }
                });
            });
        });
    }
    
    makeTablesResponsive();
    
    // Optimize images for mobile
    function optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" if not present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Ensure images have alt text
            if (!img.hasAttribute('alt') || img.alt === '') {
                img.setAttribute('alt', 'EPL News Hub');
            }
        });
    }
    
    optimizeImages();
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            // Recalculate any dynamic elements
            makeTablesResponsive();
            optimizeImages();
        }, 500);
    });
    
    // Add viewport height fix for mobile browsers
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
});

// Helper function to detect mobile devices
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
           || window.innerWidth <= 768;
}

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isMobileDevice };
}