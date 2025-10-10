// Mobile Detection and Redirection Script
(function() {
    // Comprehensive mobile detection
    function isMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Check for mobile user agents
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
        
        // Check screen size
        const isSmallScreen = window.innerWidth <= 768;
        
        // Check for touch capability
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check for mobile-specific features
        const isMobileUA = mobileRegex.test(userAgent);
        
        // Return true if any strong mobile indicators are present
        return isMobileUA || (isSmallScreen && hasTouch);
    }
    
    // Get current page name
    function getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1);
        return page || 'index.html';
    }
    
    // Redirect to mobile version if on mobile device
    function handleMobileRedirect() {
        // Skip if already on mobile version
        if (window.location.pathname.includes('/mobile/')) {
            return;
        }
        
        // Skip if user has opted for desktop version
        if (localStorage.getItem('preferDesktop') === 'true') {
            return;
        }
        
        if (isMobileDevice()) {
            const currentPage = getCurrentPage();
            let mobilePage = '/mobile/' + currentPage;
            
            // Handle articles specially
            if (window.location.pathname.includes('/articles/')) {
                const articlePath = window.location.pathname.replace('/articles/', '/mobile/articles/');
                mobilePage = articlePath;
            }
            
            // Check if mobile version exists before redirecting
            fetch(mobilePage, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        window.location.href = mobilePage;
                    }
                })
                .catch(() => {
                    // If mobile version doesn't exist, stay on current page
                    console.log('Mobile version not available for this page');
                });
        }
    }
    
    // Add viewport meta tag for mobile optimization
    function addMobileViewport() {
        if (isMobileDevice()) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            }
        }
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            handleMobileRedirect();
            addMobileViewport();
        });
    } else {
        handleMobileRedirect();
        addMobileViewport();
    }
})();