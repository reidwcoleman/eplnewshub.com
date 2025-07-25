// Script to make Google AdSense ads open in new tabs
(function() {
    'use strict';
    
    // Override window.open to ensure ads open in new tabs
    const originalOpen = window.open;
    window.open = function(url, target, features) {
        // For ad clicks, always use _blank target
        if (!target || target === '_self' || target === '_parent' || target === '_top') {
            target = '_blank';
        }
        // Add noopener and noreferrer for security
        if (features && !features.includes('noopener')) {
            features += ',noopener,noreferrer';
        } else if (!features) {
            features = 'noopener,noreferrer';
        }
        return originalOpen.call(this, url, target, features);
    };
    
    // Function to process AdSense ads
    function processAdsForNewTab() {
        // Find all AdSense containers
        const adContainers = document.querySelectorAll('ins.adsbygoogle');
        
        adContainers.forEach(function(container) {
            if (container.dataset.processed) return;
            container.dataset.processed = 'true';
            
            // Add CSS to ensure proper cursor
            container.style.cursor = 'pointer';
            
            // Monitor for iframe creation within the ad container
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.tagName === 'IFRAME') {
                            processAdIframe(node);
                        }
                    });
                });
            });
            
            observer.observe(container, { childList: true, subtree: true });
            
            // Process existing iframes
            const existingIframes = container.querySelectorAll('iframe');
            existingIframes.forEach(processAdIframe);
        });
    }
    
    function processAdIframe(iframe) {
        if (iframe.dataset.processed) return;
        iframe.dataset.processed = 'true';
        
        // Add base target to iframe if possible
        try {
            iframe.onload = function() {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    if (doc) {
                        // Add base target to force new tab
                        let base = doc.querySelector('base');
                        if (!base) {
                            base = doc.createElement('base');
                            doc.head.appendChild(base);
                        }
                        base.target = '_blank';
                        
                        // Find and modify all links
                        const links = doc.querySelectorAll('a');
                        links.forEach(function(link) {
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                        });
                    }
                } catch (e) {
                    // Cross-origin restrictions - this is expected for AdSense
                    console.log('Cross-origin iframe - using fallback method');
                }
            };
        } catch (e) {
            console.log('Error setting up iframe processing:', e);
        }
    }
    
    // Initialize on DOM ready
    function init() {
        processAdsForNewTab();
        
        // Re-process periodically for dynamically loaded ads
        setInterval(processAdsForNewTab, 3000);
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also monitor for new ad insertions
    const globalObserver = new MutationObserver(function(mutations) {
        let hasNewAds = false;
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList && node.classList.contains('adsbygoogle') || 
                        node.querySelector && node.querySelector('ins.adsbygoogle')) {
                        hasNewAds = true;
                    }
                }
            });
        });
        
        if (hasNewAds) {
            setTimeout(processAdsForNewTab, 1000);
        }
    });
    
    globalObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})();