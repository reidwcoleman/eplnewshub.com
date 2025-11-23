/**
 * Desktop Redirect Script for Mobile Pages
 * Redirects desktop users back to desktop version if they access mobile pages
 * UltraThink Mobile Optimization System
 */

(function() {
    'use strict';

    // Only run this script on mobile pages
    if (!window.location.pathname.includes('/mobile/')) {
        return;
    }

    // Check if user is on desktop
    function isDesktopDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

        const isDesktopWidth = window.innerWidth > 768;
        const isTouchDevice = ('ontouchstart' in window) ||
                             (navigator.maxTouchPoints > 0) ||
                             (navigator.msMaxTouchPoints > 0);

        // Desktop if: not mobile user agent AND (wide screen OR no touch)
        return !mobileRegex.test(userAgent) && (isDesktopWidth || !isTouchDevice);
    }

    // Get desktop version of current URL
    function getDesktopURL() {
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;
        const currentHash = window.location.hash;

        // Remove /mobile/ from path
        const desktopPath = currentPath.replace('/mobile/', '/');

        return desktopPath + currentSearch + currentHash;
    }

    // Check for manual override (allow desktop users to view mobile version)
    function hasMobileOverride() {
        if (localStorage.getItem('forceMobileView') === 'true') {
            return true;
        }

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('mobile') === 'true') {
            localStorage.setItem('forceMobileView', 'true');
            return true;
        }

        return false;
    }

    // Perform redirect if on desktop
    function redirectToDesktop() {
        if (hasMobileOverride()) {
            console.log('[Desktop Redirect] Mobile view forced by user');
            return;
        }

        if (isDesktopDevice()) {
            const desktopURL = getDesktopURL();
            console.log('[Desktop Redirect] Desktop device detected, redirecting to:', desktopURL);

            window.location.replace(desktopURL);
        } else {
            console.log('[Desktop Redirect] Mobile device detected, staying on mobile version');
        }
    }

    // Run redirect check immediately
    redirectToDesktop();

})();
