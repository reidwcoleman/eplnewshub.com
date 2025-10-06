// Prevent automatic page reloads
(function() {
    'use strict';
    
    // Override location.reload to prevent unwanted reloads
    const originalReload = window.location.reload;
    window.location.reload = function() {
        console.warn('Page reload attempt blocked');
        console.trace('Reload attempted from:');
        // Uncomment the next line to allow manual reloads
        // originalReload.call(window.location);
    };
    
    // Override location.href assignment
    const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
    Object.defineProperty(window.location, 'href', {
        get: originalHref.get,
        set: function(value) {
            console.warn('Location.href change blocked:', value);
            console.trace('Location change attempted from:');
            // Uncomment the next line to allow location changes
            // originalHref.set.call(this, value);
        }
    });
    
    // Monitor for meta refresh tags
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeName === 'META' && node.httpEquiv === 'refresh') {
                        console.warn('Meta refresh tag detected and removed');
                        node.remove();
                    }
                });
            }
        });
    });
    
    observer.observe(document.head, { childList: true });
    
    // Log any interval/timeout that might be causing issues
    const originalSetInterval = window.setInterval;
    const originalSetTimeout = window.setTimeout;
    
    window.setInterval = function(fn, delay) {
        if (delay <= 5000 && fn.toString().includes('reload')) {
            console.warn('Blocked interval with reload:', fn.toString());
            return;
        }
        return originalSetInterval.apply(this, arguments);
    };
    
    window.setTimeout = function(fn, delay) {
        if (delay <= 5000 && fn.toString().includes('reload')) {
            console.warn('Blocked timeout with reload:', fn.toString());
            return;
        }
        return originalSetTimeout.apply(this, arguments);
    };
    
    console.log('Reload prevention script active');
})();