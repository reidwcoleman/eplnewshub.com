// Fast, simple include system for EPL News Hub
(function() {
    'use strict';
    
    // Load HTML includes with priority
    async function loadIncludes() {
        const includes = document.querySelectorAll('[include]');
        
        // Separate critical (header, main content) from non-critical includes
        const critical = [];
        const nonCritical = [];
        
        includes.forEach(el => {
            const path = el.getAttribute('include');
            if (!path) return;
            
            if (el.classList.contains('header') || 
                el.classList.contains('main_headline') ||
                el.classList.contains('main_subheadline')) {
                critical.push({element: el, path: path});
            } else {
                nonCritical.push({element: el, path: path});
            }
        });
        
        // Load critical content first
        await Promise.all(critical.map(item => loadInclude(item.element, item.path)));
        
        // Then load non-critical content
        nonCritical.forEach(item => {
            requestIdleCallback(() => loadInclude(item.element, item.path), {timeout: 2000});
        });
    }
    
    // Simple include loader
    async function loadInclude(element, path) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                const html = await response.text();
                element.innerHTML = html;
                
                // Re-run scripts if needed
                const scripts = element.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => 
                        newScript.setAttribute(attr.name, attr.value)
                    );
                    newScript.textContent = oldScript.textContent;
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            }
        } catch (error) {
            console.error('Failed to load:', path, error);
        }
    }
    
    // Start loading as soon as DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadIncludes);
    } else {
        loadIncludes();
    }
    
    // Add native lazy loading to all images
    window.addEventListener('load', () => {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            // Skip above-the-fold images
            const rect = img.getBoundingClientRect();
            if (rect.top > window.innerHeight) {
                img.loading = 'lazy';
            }
        });
    });
})();