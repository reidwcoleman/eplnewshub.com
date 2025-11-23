/**
 * Mobile Detection and Redirect Script
 * Automatically redirects mobile devices to mobile-optimized pages
 * UltraThink Mobile Optimization System
 */

(function() {
    'use strict';

    // Check if user is already on a mobile page
    if (window.location.pathname.includes('/mobile/')) {
        return; // Already on mobile version, don't redirect
    }

    // Comprehensive mobile device detection
    function isMobileDevice() {
        // Check 1: User agent string
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

        // Check 2: Screen width (mobile devices typically < 768px)
        const isMobileWidth = window.innerWidth <= 768;

        // Check 3: Touch support (most mobile devices support touch)
        const isTouchDevice = ('ontouchstart' in window) ||
                             (navigator.maxTouchPoints > 0) ||
                             (navigator.msMaxTouchPoints > 0);

        // Return true if user agent matches OR (small screen AND touch support)
        return mobileRegex.test(userAgent) || (isMobileWidth && isTouchDevice);
    }

    // Get mobile version of current URL
    function getMobileURL() {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const currentHash = window.location.hash;

        // Handle different page types
        let mobilePath;

        // Root index
        if (currentPath === '/' || currentPath === '/index.html') {
            mobilePath = '/mobile/index.html';
        }
        // Articles
        else if (currentPath.startsWith('/articles/')) {
            const articleName = currentPath.replace('/articles/', '');
            mobilePath = '/mobile/articles/' + articleName;
        }
        // Other pages
        else {
            const pageName = currentPath.substring(1); // Remove leading slash
            mobilePath = '/mobile/' + pageName;
        }

        return mobilePath + currentSearch + currentHash;
    }

    // Check for manual override (allow users to force desktop version)
    function hasDesktopOverride() {
        // Check localStorage
        if (localStorage.getItem('forceDesktopView') === 'true') {
            return true;
        }

        // Check URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('desktop') === 'true') {
            localStorage.setItem('forceDesktopView', 'true');
            return true;
        }

        return false;
    }

    // Perform redirect if on mobile device
    function redirectToMobile() {
        if (hasDesktopOverride()) {
            console.log('[Mobile Redirect] Desktop view forced by user');
            return;
        }

        if (isMobileDevice()) {
            const mobileURL = getMobileURL();
            console.log('[Mobile Redirect] Mobile device detected, redirecting to:', mobileURL);

            // Set flag to prevent redirect loops
            sessionStorage.setItem('mobileRedirected', 'true');

            // Redirect to mobile version
            window.location.replace(mobileURL);
        } else {
            console.log('[Mobile Redirect] Desktop device detected, staying on desktop version');
        }
    }

    // Run redirect check immediately
    redirectToMobile();

})();
