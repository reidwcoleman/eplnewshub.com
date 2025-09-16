// EPL News Hub - Responsive Menu System
document.addEventListener('DOMContentLoaded', function() {
    // Create mobile menu toggle button if it doesn't exist
    function initMobileMenu() {
        const header = document.querySelector('.header');
        const headerContent = header?.querySelector('.header-content') || header?.querySelector('.container') || header;
        
        if (!headerContent) return;
        
        // Check if mobile menu button already exists
        let mobileToggle = headerContent.querySelector('.mobile-menu-toggle');
        
        if (!mobileToggle) {
            // Create mobile menu button
            mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-menu-toggle';
            mobileToggle.innerHTML = '☰';
            mobileToggle.setAttribute('aria-label', 'Toggle navigation menu');
            
            // Find nav element
            const nav = headerContent.querySelector('.header-nav') || headerContent.querySelector('nav');
            
            if (nav) {
                // Insert button before nav
                nav.parentNode.insertBefore(mobileToggle, nav);
                
                // Add click handler
                mobileToggle.addEventListener('click', function() {
                    nav.classList.toggle('mobile-active');
                    mobileToggle.innerHTML = nav.classList.contains('mobile-active') ? '✕' : '☰';
                });
                
                // Close menu when clicking outside
                document.addEventListener('click', function(e) {
                    if (!headerContent.contains(e.target)) {
                        nav.classList.remove('mobile-active');
                        mobileToggle.innerHTML = '☰';
                    }
                });
                
                // Close menu when clicking on a link
                nav.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', function() {
                        nav.classList.remove('mobile-active');
                        mobileToggle.innerHTML = '☰';
                    });
                });
            }
        }
    }
    
    // Initialize on load
    initMobileMenu();
    
    // Reinitialize when header is loaded dynamically
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const header = document.querySelector('.header');
                if (header && header.innerHTML.trim() !== '') {
                    initMobileMenu();
                    observer.disconnect();
                }
            }
        });
    });
    
    const headerElement = document.querySelector('.header');
    if (headerElement) {
        observer.observe(headerElement, { childList: true, subtree: true });
    }
    
    // Handle responsive tables
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        // Wrap table in scrollable container if not already wrapped
        if (!table.parentElement.classList.contains('table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            wrapper.style.overflowX = 'auto';
            wrapper.style.WebkitOverflowScrolling = 'touch';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
    
    // Optimize images for mobile
    function optimizeImages() {
        const images = document.querySelectorAll('img');
        const isMobile = window.innerWidth <= 768;
        
        images.forEach(img => {
            if (isMobile && !img.hasAttribute('data-mobile-optimized')) {
                // Add loading lazy for below-fold images
                if (img.getBoundingClientRect().top > window.innerHeight) {
                    img.loading = 'lazy';
                }
                img.setAttribute('data-mobile-optimized', 'true');
            }
        });
    }
    
    // Run on load and resize
    optimizeImages();
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(optimizeImages, 250);
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