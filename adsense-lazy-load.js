// Optimized AdSense Lazy Loading Script
(function() {
    'use strict';
    
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all ads immediately for older browsers
        loadAllAds();
        return;
    }
    
    // Configuration
    const config = {
        rootMargin: '200px 0px', // Start loading 200px before the ad enters viewport
        threshold: 0.01
    };
    
    // Keep track of loaded ads
    const loadedAds = new Set();
    
    // Function to load AdSense ad
    function loadAdSenseAd(element) {
        // Prevent duplicate loading
        if (loadedAds.has(element)) return;
        loadedAds.add(element);
        
        // Create the ad container
        const adContainer = document.createElement('ins');
        adContainer.className = 'adsbygoogle';
        adContainer.style.display = 'block';
        adContainer.style.textAlign = 'center';
        adContainer.setAttribute('data-ad-layout', 'in-article');
        adContainer.setAttribute('data-ad-format', 'fluid');
        adContainer.setAttribute('data-ad-client', 'ca-pub-6480210605786899');
        adContainer.setAttribute('data-ad-slot', element.getAttribute('data-ad-slot') || '2656767439');
        
        // Replace placeholder with actual ad
        element.innerHTML = '';
        element.appendChild(adContainer);
        
        // Push to adsbygoogle
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error('AdSense loading error:', e);
        }
    }
    
    // Intersection Observer callback
    function handleIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const adPlaceholder = entry.target;
                
                // Load the ad
                loadAdSenseAd(adPlaceholder);
                
                // Stop observing this element
                observer.unobserve(adPlaceholder);
            }
        });
    }
    
    // Create the observer
    const observer = new IntersectionObserver(handleIntersection, config);
    
    // Function to initialize lazy loading
    function initLazyAds() {
        // Find all ad placeholders
        const adPlaceholders = document.querySelectorAll('.adsense-lazy-load');
        
        adPlaceholders.forEach(placeholder => {
            // Start observing
            observer.observe(placeholder);
        });
    }
    
    // Fallback function to load all ads
    function loadAllAds() {
        const adPlaceholders = document.querySelectorAll('.adsense-lazy-load');
        adPlaceholders.forEach(loadAdSenseAd);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLazyAds);
    } else {
        // DOM already loaded
        initLazyAds();
    }
    
    // Also reinitialize if new content is added dynamically
    window.addEventListener('contentAdded', initLazyAds);
})();

// Ensure AdSense script is loaded only once
(function() {
    if (!window.adsenseScriptLoaded) {
        window.adsenseScriptLoaded = true;
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6480210605786899';
        script.crossOrigin = 'anonymous';
        script.onerror = function() {
            console.warn('AdSense script failed to load');
        };
        document.head.appendChild(script);
    }
})();