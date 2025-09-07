// Development Configuration for EPL News Hub
// This file manages environment settings for development vs production

(function() {
    'use strict';
    
    // Check if we're in development mode
    const isDevelopment = () => {
        // Development mode triggers:
        // 1. URL contains localhost
        // 2. URL contains ?dev=true parameter
        // 3. URL contains staging subdomain
        // 4. localStorage has dev_mode enabled
        
        const hostname = window.location.hostname;
        const params = new URLSearchParams(window.location.search);
        const devStorage = localStorage.getItem('dev_mode') === 'true';
        
        return (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.includes('staging') ||
            hostname.includes('.local') ||
            params.get('dev') === 'true' ||
            devStorage
        );
    };
    
    // Stripe Configuration
    const stripeConfig = {
        // Test Keys (Safe to expose - these are public keys)
        test: {
            publishableKey: 'pk_test_51R1zJxR10Q6bz3BHmXUzrCnWKhVtFVlYnZgXvVzMBWzQPKH8iJPNKj6tHYmJfKqWYvNP0Ht5vZ5UkNZqKJxQwzKa00nNMSgDCH',
            prices: {
                starter_monthly: 'price_1QgN6tR10Q6bz3BH0J4VGm7O',
                pro_monthly: 'price_1QgN7hR10Q6bz3BHlZxuZ5Yx', 
                starter_annual: 'price_1QgN8MR10Q6bz3BH8kBbGH2D',
                pro_annual: 'price_1QgN8nR10Q6bz3BHqX9yN4Tc'
            }
        },
        // Live Keys
        live: {
            publishableKey: 'pk_live_51R1zJxR10Q6bz3BHKVdTzRdwLsxzlrbN5bQoZ96FpQ7nZaZZ4aNrfk7EhW4aSDLKhqhSzBWNKFvxxLwMp6Zb9b3p005qGMCRDO',
            prices: {
                starter_monthly: 'price_1RoaG1R10Q6bz3BHC2hDRKLv',
                pro_monthly: 'price_1Rox4aR10Q6bz3BHxohJtpcO',
                starter_annual: 'price_1RoxK6R10Q6bz3BHdZkxAn3p',
                pro_annual: 'price_1RoxmQR10Q6bz3BHQKy7G89g'
            }
        }
    };
    
    // Firebase Configuration (same for both dev and prod)
    const firebaseConfig = {
        apiKey: "AIzaSyCyOey0l27yQP68oybpoodMVcvayhIHt2I",
        authDomain: "epl-news-hub-94c09.firebaseapp.com",
        projectId: "epl-news-hub-94c09",
        storageBucket: "epl-news-hub-94c09.firebasestorage.app",
        messagingSenderId: "674703933278",
        appId: "1:674703933278:web:90c6dd4aa9f1ace73099cf",
        measurementId: "G-ECM6BCQCS8"
    };
    
    // API Endpoints
    const apiEndpoints = {
        test: {
            baseUrl: 'http://localhost:3000',
            checkoutSession: '/api/create-checkout-session',
            checkMembership: '/api/check-membership',
            webhook: '/api/stripe-webhook'
        },
        live: {
            baseUrl: 'https://eplnewshub.com',
            checkoutSession: '/api/create-checkout-session',
            checkMembership: '/api/check-membership',
            webhook: '/api/stripe-webhook'
        }
    };
    
    // Get current configuration based on environment
    const getConfig = () => {
        const isDevMode = isDevelopment();
        
        return {
            isDevelopment: isDevMode,
            stripe: isDevMode ? stripeConfig.test : stripeConfig.live,
            firebase: firebaseConfig, // Same for both environments
            api: isDevMode ? apiEndpoints.test : apiEndpoints.live,
            features: {
                showDevBanner: isDevMode,
                enableLogging: isDevMode,
                bypassPayment: false, // Set to true to skip actual payment in dev
                freeMessageLimit: isDevMode ? 100 : 5, // More free messages in dev
                showTestCards: isDevMode
            }
        };
    };
    
    // Development Mode Banner
    const showDevBanner = () => {
        if (!getConfig().features.showDevBanner) return;
        
        const banner = document.createElement('div');
        banner.id = 'dev-mode-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(90deg, #ff6b6b, #ffd93d);
                color: #000;
                padding: 10px;
                text-align: center;
                z-index: 100000;
                font-family: monospace;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            ">
                🚧 DEVELOPMENT MODE 🚧 | 
                Using Test Stripe Keys | 
                Test Card: 4242 4242 4242 4242 | 
                <button onclick="devConfig.toggleDevMode()" style="
                    background: #000;
                    color: #fff;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 10px;
                ">Toggle Dev Mode</button>
                <button onclick="devConfig.showTestCards()" style="
                    background: #4CAF50;
                    color: #fff;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-left: 5px;
                ">Show Test Cards</button>
            </div>
        `;
        
        // Add to body when DOM is ready
        if (document.body) {
            document.body.insertBefore(banner, document.body.firstChild);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.insertBefore(banner, document.body.firstChild);
            });
        }
    };
    
    // Toggle Development Mode
    const toggleDevMode = () => {
        const currentMode = localStorage.getItem('dev_mode') === 'true';
        localStorage.setItem('dev_mode', (!currentMode).toString());
        location.reload();
    };
    
    // Show Test Card Information
    const showTestCards = () => {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 100001;
                max-width: 500px;
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <h2 style="margin-top: 0; color: #333;">Stripe Test Cards</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Success</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">4242 4242 4242 4242</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Decline</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">4000 0000 0000 0002</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Requires Auth</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">4000 0025 0000 3155</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Insufficient Funds</strong></td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace;">4000 0000 0000 9995</td>
                    </tr>
                </table>
                <p style="margin-top: 20px; color: #666; font-size: 14px;">
                    Use any future expiry date, any 3-digit CVC, and any 5-digit ZIP code.
                </p>
                <div style="margin-top: 20px;">
                    <h3 style="color: #333;">Test User Accounts:</h3>
                    <ul style="color: #666; font-size: 14px;">
                        <li>testuser@example.com / password123</li>
                        <li>premium@example.com / password123</li>
                        <li>free@example.com / password123</li>
                    </ul>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #333;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                    width: 100%;
                ">Close</button>
            </div>
            <div onclick="this.parentElement.remove()" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 100000;
            "></div>
        `;
        document.body.appendChild(modal);
    };
    
    // Console logging for development
    const log = (...args) => {
        if (getConfig().features.enableLogging) {
            console.log('[DEV]', ...args);
        }
    };
    
    // Initialize development features
    const init = () => {
        const config = getConfig();
        
        // Show dev banner if in development mode
        showDevBanner();
        
        // Log configuration
        log('Development Mode Active:', config.isDevelopment);
        log('Configuration:', config);
        
        // Add keyboard shortcuts for development
        if (config.isDevelopment) {
            document.addEventListener('keydown', (e) => {
                // Ctrl+Shift+D to toggle dev mode
                if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                    toggleDevMode();
                }
                // Ctrl+Shift+T to show test cards
                if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                    showTestCards();
                }
            });
        }
        
        return config;
    };
    
    // Export to window
    window.devConfig = {
        init,
        getConfig,
        toggleDevMode,
        showTestCards,
        log,
        isDevelopment
    };
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();