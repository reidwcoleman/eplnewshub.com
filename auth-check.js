/**
 * Authentication Check Script
 * Add this script to any page that requires authentication
 *
 * Usage: <script src="/auth-check.js"></script>
 */

(async function() {
    'use strict';

    // Check if user is authenticated
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (!data.authenticated) {
                // Store the current page URL to redirect back after login
                const currentPage = window.location.pathname + window.location.search;
                sessionStorage.setItem('redirectAfterLogin', currentPage);

                // Redirect to sign in
                window.location.href = '/signin.html';
                return false;
            }

            // User is authenticated
            return true;

        } catch (error) {
            console.error('Authentication check failed:', error);
            // On error, redirect to sign in to be safe
            window.location.href = '/signin.html';
            return false;
        }
    }

    // Run authentication check immediately
    const isAuthenticated = await checkAuth();

    // Make auth status available globally
    window.userAuthenticated = isAuthenticated;

    // Optional: Add user info to page
    if (isAuthenticated) {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (data.authenticated && data.user) {
                // Store user info globally
                window.currentUser = data.user;

                // Dispatch custom event that pages can listen to
                window.dispatchEvent(new CustomEvent('userAuthenticated', {
                    detail: data.user
                }));
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
        }
    }
})();
