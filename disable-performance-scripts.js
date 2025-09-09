// Temporary script to disable performance optimizations for testing
// This prevents the performance scripts from loading

// Block performance scripts
const blockedScripts = [
    'ultra-performance.js',
    'performance-optimizer.js', 
    'performance-boost.js',
    'mobile-detector.js',
    'seo-helper.js'
];

// Override script loading
const originalAppendChild = document.head.appendChild;
document.head.appendChild = function(element) {
    if (element.tagName === 'SCRIPT' && element.src) {
        const shouldBlock = blockedScripts.some(script => element.src.includes(script));
        if (shouldBlock) {
            console.log('Blocked performance script:', element.src);
            return element;
        }
    }
    return originalAppendChild.call(this, element);
};

// Disable service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
            registration.unregister();
        }
    });
}

console.log('Performance scripts disabled for testing');