/**
 * Authentication Service for EPL News Hub
 * Handles user authentication state and subscription status
 */
class AuthService {
    constructor() {
        this.currentUser = null;
        this.subscriptionData = null;
        this.initialized = false;
    }

    /**
     * Initialize the authentication service
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Check server authentication status
            await this.checkAuthStatus();
            this.initialized = true;
            
            // Dispatch authentication ready event
            window.dispatchEvent(new CustomEvent('authServiceReady', {
                detail: {
                    user: this.currentUser,
                    subscription: this.subscriptionData
                }
            }));
        } catch (error) {
            console.error('Failed to initialize auth service:', error);
            this.initialized = true; // Mark as initialized even on error
        }
    }

    /**
     * Check authentication status with server
     */
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated && data.user) {
                this.currentUser = data.user;
                this.subscriptionData = data.user.subscription;
                
                // Update localStorage for offline access
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('membershipLevel', this.subscriptionData?.tier || 'free');
                
                if (this.subscriptionData) {
                    localStorage.setItem('eplSubscription', JSON.stringify({
                        ...this.subscriptionData,
                        lastChecked: new Date().toISOString()
                    }));
                }
                
                return true;
            } else {
                this.currentUser = null;
                this.subscriptionData = null;
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('membershipLevel');
                localStorage.removeItem('eplSubscription');
                return false;
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            
            // Fall back to localStorage
            const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
            const membershipLevel = localStorage.getItem('membershipLevel') || 'free';
            const subscriptionData = localStorage.getItem('eplSubscription');
            
            if (isLoggedIn && subscriptionData) {
                try {
                    this.subscriptionData = JSON.parse(subscriptionData);
                    this.currentUser = {
                        membershipLevel: membershipLevel,
                        subscription: this.subscriptionData
                    };
                    return true;
                } catch (parseError) {
                    console.error('Error parsing cached subscription data:', parseError);
                }
            }
            
            return false;
        }
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get subscription data
     */
    getSubscription() {
        return this.subscriptionData;
    }

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return this.currentUser !== null;
    }

    /**
     * Check if user has active subscription
     */
    hasActiveSubscription() {
        return this.subscriptionData && this.subscriptionData.status === 'active';
    }

    /**
     * Get user's membership tier
     */
    getMembershipTier() {
        return this.subscriptionData?.tier || 'free';
    }

    /**
     * Check if user has specific tier or higher
     */
    hasTierAccess(requiredTier) {
        if (!this.hasActiveSubscription()) {
            return requiredTier === 'free';
        }
        
        const tierHierarchy = {
            'free': 0,
            'starter': 1,
            'pro': 2
        };
        
        const userLevel = tierHierarchy[this.getMembershipTier()] || 0;
        const requiredLevel = tierHierarchy[requiredTier] || 0;
        
        return userLevel >= requiredLevel;
    }

    /**
     * Simulate login for testing (development only)
     */
    simulateLogin(tier = 'free', isActive = true) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('simulateLogin is for development only');
            return;
        }
        
        this.currentUser = {
            email: `test@${tier}.user`,
            firstName: 'Test',
            lastName: 'User',
            subscription: {
                tier: tier,
                status: isActive ? 'active' : 'inactive'
            }
        };
        
        this.subscriptionData = this.currentUser.subscription;
        
        // Update localStorage
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('membershipLevel', tier);
        localStorage.setItem('eplSubscription', JSON.stringify({
            ...this.subscriptionData,
            lastChecked: new Date().toISOString()
        }));
        
        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('authChanged', {
            detail: {
                user: this.currentUser,
                subscription: this.subscriptionData
            }
        }));
    }

    /**
     * Simulate logout for testing (development only)
     */
    simulateLogout() {
        if (process.env.NODE_ENV === 'production') {
            console.warn('simulateLogout is for development only');
            return;
        }
        
        this.currentUser = null;
        this.subscriptionData = null;
        
        // Clear localStorage
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('membershipLevel');
        localStorage.removeItem('eplSubscription');
        
        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('authChanged', {
            detail: {
                user: null,
                subscription: null
            }
        }));
    }

    /**
     * Subscribe to subscription changes from Stripe webhooks
     */
    async checkForSubscriptionUpdates(userEmail) {
        if (!userEmail) return;
        
        try {
            const response = await fetch(`/api/user/subscription/${encodeURIComponent(userEmail)}`);
            const data = await response.json();
            
            if (data.success && data.subscription) {
                const hasChanged = JSON.stringify(this.subscriptionData) !== JSON.stringify(data.subscription);
                
                if (hasChanged) {
                    this.subscriptionData = data.subscription;
                    
                    // Update localStorage
                    localStorage.setItem('membershipLevel', this.subscriptionData.tier);
                    localStorage.setItem('eplSubscription', JSON.stringify({
                        ...this.subscriptionData,
                        lastChecked: new Date().toISOString()
                    }));
                    
                    // Dispatch subscription update event
                    window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
                        detail: {
                            tier: this.subscriptionData.tier,
                            isActive: this.subscriptionData.status === 'active',
                            features: this.getFeatures(),
                            subscription: this.subscriptionData
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Error checking subscription updates:', error);
        }
    }

    /**
     * Get features based on current subscription
     */
    getFeatures() {
        const tier = this.getMembershipTier();
        const features = {
            'free': {
                premiumTools: false,
                starterTools: false,
                aiQueriesPerDay: 5,
                adFree: false
            },
            'starter': {
                premiumTools: false,
                starterTools: true,
                aiQueriesPerDay: 50,
                adFree: true
            },
            'pro': {
                premiumTools: true,
                starterTools: true,
                aiQueriesPerDay: -1, // Unlimited
                adFree: true
            }
        };
        
        return features[tier] || features['free'];
    }
}

// Create global auth service instance
window.authService = new AuthService();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authService.init();
    });
} else {
    window.authService.init();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}