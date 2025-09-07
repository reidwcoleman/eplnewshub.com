// Premium Access Control System for EPL News Hub
// This system manages user subscription status and controls access to premium features

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        STORAGE_KEYS: {
            USER_STATUS: 'epl_user_status',
            SUBSCRIPTION: 'epl_subscription',
            SESSION_ID: 'epl_session_id',
            DAILY_USAGE: 'epl_daily_usage',
            LAST_SYNC: 'epl_last_sync'
        },
        FREE_LIMITS: {
            'ai-assistant': 5,
            'player-predictor': 3,
            'transfer-simulator': 3,
            'team-analyzer': 3
        },
        STARTER_LIMITS: {
            'ai-assistant': 50,
            'player-predictor': 20,
            'transfer-simulator': 20,
            'team-analyzer': 20
        },
        PRO_LIMITS: {
            // Pro has unlimited access
            'ai-assistant': -1,
            'player-predictor': -1,
            'transfer-simulator': -1,
            'team-analyzer': -1
        },
        PREMIUM_PAGES: [
            'fpl-ai-assistant.html',
            'player-predictor.html',
            'transfer-simulator-pro.html',
            'team-analyzer.html',
            'player-data.html',
            'fpl-premium-hub.html'
        ]
    };

    class PremiumAccessControl {
        constructor() {
            this.userStatus = this.loadUserStatus();
            this.dailyUsage = this.loadDailyUsage();
            this.init();
        }

        init() {
            // Check for subscription updates
            this.checkForSubscriptionUpdate();
            
            // Reset daily limits if needed
            this.resetDailyLimitsIfNeeded();
            
            // Set up page access control
            this.setupPageAccessControl();
            
            // Listen for storage changes (multi-tab sync)
            window.addEventListener('storage', (e) => {
                if (e.key === CONFIG.STORAGE_KEYS.USER_STATUS) {
                    this.userStatus = this.loadUserStatus();
                    this.handleStatusChange();
                }
            });
            
            // Listen for successful payment events
            window.addEventListener('paymentSuccess', (e) => {
                this.handlePaymentSuccess(e.detail);
            });
        }

        // Load user status from storage
        loadUserStatus() {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_STATUS);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.error('Error parsing user status:', e);
                }
            }
            
            // Default status for new users
            return {
                isLoggedIn: false,
                email: null,
                uid: null,
                membershipLevel: 'free',
                membershipStatus: 'inactive',
                startDate: null,
                expiryDate: null,
                stripeCustomerId: null,
                stripeSubscriptionId: null,
                lastUpdated: new Date().toISOString()
            };
        }

        // Save user status to storage
        saveUserStatus(status) {
            this.userStatus = { ...this.userStatus, ...status, lastUpdated: new Date().toISOString() };
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_STATUS, JSON.stringify(this.userStatus));
            
            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('userStatusUpdated', { detail: this.userStatus }));
        }

        // Load daily usage tracking
        loadDailyUsage() {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.DAILY_USAGE);
            if (stored) {
                try {
                    const usage = JSON.parse(stored);
                    // Check if it's from today
                    const today = new Date().toDateString();
                    if (usage.date === today) {
                        return usage;
                    }
                } catch (e) {
                    console.error('Error parsing daily usage:', e);
                }
            }
            
            // Reset for new day
            return {
                date: new Date().toDateString(),
                counts: {}
            };
        }

        // Save daily usage
        saveDailyUsage() {
            localStorage.setItem(CONFIG.STORAGE_KEYS.DAILY_USAGE, JSON.stringify(this.dailyUsage));
        }

        // Reset daily limits if it's a new day
        resetDailyLimitsIfNeeded() {
            const today = new Date().toDateString();
            if (this.dailyUsage.date !== today) {
                this.dailyUsage = {
                    date: today,
                    counts: {}
                };
                this.saveDailyUsage();
                console.log('Daily limits reset for new day');
            }
        }

        // Check for subscription updates from URL parameters or session
        checkForSubscriptionUpdate() {
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('session_id');
            const plan = urlParams.get('plan');
            
            if (sessionId && plan) {
                // User just completed a successful payment
                this.processSuccessfulPayment(plan, sessionId);
            }
        }

        // Process successful payment
        processSuccessfulPayment(plan, sessionId) {
            console.log('Processing successful payment:', { plan, sessionId });
            
            // Determine membership level from plan
            let membershipLevel = 'free';
            if (plan.includes('pro')) {
                membershipLevel = 'pro';
            } else if (plan.includes('starter')) {
                membershipLevel = 'starter';
            }
            
            // Calculate expiry date (1 month for monthly, 1 year for annual)
            const now = new Date();
            const expiryDate = new Date();
            if (plan.includes('annual')) {
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            } else {
                expiryDate.setMonth(expiryDate.getMonth() + 1);
            }
            
            // Update user status
            this.saveUserStatus({
                membershipLevel: membershipLevel,
                membershipStatus: 'active',
                startDate: now.toISOString(),
                expiryDate: expiryDate.toISOString(),
                stripeSessionId: sessionId,
                plan: plan
            });
            
            // Store session ID for verification
            localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_ID, sessionId);
            
            // Clear any access restrictions
            this.clearAccessRestrictions();
            
            // Notify user
            this.showSuccessNotification(membershipLevel);
        }

        // Handle payment success event
        handlePaymentSuccess(detail) {
            const { plan, email, sessionId } = detail;
            
            console.log('Payment success event received:', detail);
            
            // Process the successful payment
            this.processSuccessfulPayment(plan, sessionId);
            
            // Update email if provided
            if (email) {
                this.saveUserStatus({ email });
            }
        }

        // Clear all access restrictions
        clearAccessRestrictions() {
            // Remove all popup overlays
            const popups = document.querySelectorAll('.premium-popup-overlay, .subscription-popup, .access-restricted-overlay');
            popups.forEach(popup => popup.remove());
            
            // Enable all disabled elements
            const disabledElements = document.querySelectorAll('[data-premium-disabled="true"]');
            disabledElements.forEach(el => {
                el.removeAttribute('data-premium-disabled');
                el.style.pointerEvents = 'auto';
                el.style.opacity = '1';
            });
            
            // Remove blur effects
            const blurredElements = document.querySelectorAll('.premium-blur, .content-blur');
            blurredElements.forEach(el => {
                el.classList.remove('premium-blur', 'content-blur');
                el.style.filter = 'none';
            });
            
            // Show premium content
            const premiumContent = document.querySelectorAll('[data-premium-content="true"]');
            premiumContent.forEach(el => {
                el.style.display = '';
                el.style.visibility = 'visible';
            });
            
            console.log('Access restrictions cleared');
        }

        // Set up page access control
        setupPageAccessControl() {
            const currentPage = window.location.pathname.split('/').pop();
            
            // Check if this is a premium page
            if (CONFIG.PREMIUM_PAGES.includes(currentPage)) {
                this.checkPageAccess(currentPage);
            }
            
            // Set up click interceptors for premium features
            this.setupFeatureInterceptors();
        }

        // Check if user has access to current page
        checkPageAccess(page) {
            const hasAccess = this.hasAccess(page);
            
            if (!hasAccess.hasAccess) {
                // Show upgrade prompt instead of blocking
                this.showUpgradePrompt(hasAccess.reason);
            } else {
                // Clear any existing restrictions
                this.clearAccessRestrictions();
            }
            
            return hasAccess;
        }

        // Check if user has access to a feature
        hasAccess(feature) {
            // Admin accounts always have access
            if (this.isAdminAccount()) {
                return { hasAccess: true, unlimited: true };
            }
            
            // Check membership status
            if (this.userStatus.membershipStatus !== 'active') {
                // Check if subscription is expired
                if (this.userStatus.expiryDate) {
                    const expiry = new Date(this.userStatus.expiryDate);
                    if (expiry < new Date()) {
                        return { hasAccess: false, reason: 'expired' };
                    }
                }
            }
            
            // Get limits based on membership level
            const limits = this.getLimitsForLevel(this.userStatus.membershipLevel);
            const featureKey = this.getFeatureKey(feature);
            const limit = limits[featureKey] || 0;
            
            // Unlimited access
            if (limit === -1) {
                return { hasAccess: true, unlimited: true };
            }
            
            // Check daily usage
            const used = this.dailyUsage.counts[featureKey] || 0;
            const remaining = limit - used;
            
            if (remaining > 0) {
                return { hasAccess: true, unlimited: false, remaining, limit };
            }
            
            return { hasAccess: false, reason: 'limit_reached', limit, used };
        }

        // Get feature key from page or feature name
        getFeatureKey(feature) {
            const mapping = {
                'fpl-ai-assistant.html': 'ai-assistant',
                'player-predictor.html': 'player-predictor',
                'transfer-simulator-pro.html': 'transfer-simulator',
                'team-analyzer.html': 'team-analyzer'
            };
            
            return mapping[feature] || feature;
        }

        // Get limits for membership level
        getLimitsForLevel(level) {
            switch (level) {
                case 'pro':
                    return CONFIG.PRO_LIMITS;
                case 'starter':
                    return CONFIG.STARTER_LIMITS;
                default:
                    return CONFIG.FREE_LIMITS;
            }
        }

        // Update daily usage count
        updateDailyUsage(feature) {
            const featureKey = this.getFeatureKey(feature);
            this.dailyUsage.counts[featureKey] = (this.dailyUsage.counts[featureKey] || 0) + 1;
            this.saveDailyUsage();
            
            // Dispatch usage update event
            window.dispatchEvent(new CustomEvent('usageUpdated', { 
                detail: { 
                    feature: featureKey, 
                    count: this.dailyUsage.counts[featureKey] 
                } 
            }));
        }

        // Set up feature interceptors
        setupFeatureInterceptors() {
            // Intercept clicks on premium buttons
            document.addEventListener('click', (e) => {
                const premiumButton = e.target.closest('[data-premium-feature]');
                if (premiumButton) {
                    const feature = premiumButton.getAttribute('data-premium-feature');
                    const access = this.hasAccess(feature);
                    
                    if (!access.hasAccess) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showUpgradePrompt(access.reason, feature);
                    } else if (!access.unlimited) {
                        // Track usage for limited features
                        this.updateDailyUsage(feature);
                    }
                }
            });
        }

        // Show upgrade prompt
        showUpgradePrompt(reason, feature = null) {
            // Remove any existing prompts
            const existingPrompt = document.querySelector('.premium-upgrade-modal');
            if (existingPrompt) {
                existingPrompt.remove();
            }
            
            let message = '';
            let title = '🔒 Premium Feature';
            
            switch (reason) {
                case 'expired':
                    title = '⏰ Subscription Expired';
                    message = 'Your subscription has expired. Renew now to continue enjoying premium features!';
                    break;
                case 'limit_reached':
                    title = '📊 Daily Limit Reached';
                    message = 'You\'ve reached your daily limit for this feature. Upgrade to get more access!';
                    break;
                default:
                    message = 'This feature requires a premium subscription. Unlock all features with our affordable plans!';
            }
            
            const modal = document.createElement('div');
            modal.className = 'premium-upgrade-modal';
            modal.innerHTML = `
                <div class="upgrade-modal-overlay" onclick="this.parentElement.remove()"></div>
                <div class="upgrade-modal-content">
                    <button class="modal-close" onclick="this.closest('.premium-upgrade-modal').remove()">×</button>
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <div class="upgrade-plans">
                        <div class="plan-option">
                            <h3>⚽ Starter</h3>
                            <p class="plan-price">$2/month</p>
                            <ul>
                                <li>50 AI queries daily</li>
                                <li>20 predictions daily</li>
                                <li>Ad-free browsing</li>
                            </ul>
                            <button onclick="window.location.href='/membership.html#starter'">Choose Starter</button>
                        </div>
                        <div class="plan-option featured">
                            <div class="best-value">BEST VALUE</div>
                            <h3>🏆 Pro</h3>
                            <p class="plan-price">$7/month</p>
                            <ul>
                                <li>Unlimited everything</li>
                                <li>Priority support</li>
                                <li>Early access</li>
                            </ul>
                            <button onclick="window.location.href='/membership.html#pro'">Choose Pro</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add styles if not already present
            if (!document.querySelector('#premium-modal-styles')) {
                const styles = document.createElement('style');
                styles.id = 'premium-modal-styles';
                styles.innerHTML = `
                    .premium-upgrade-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .upgrade-modal-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                    }
                    
                    .upgrade-modal-content {
                        position: relative;
                        background: white;
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 600px;
                        width: 90%;
                        max-height: 80vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        animation: modalSlideIn 0.3s ease;
                    }
                    
                    @keyframes modalSlideIn {
                        from {
                            transform: translateY(-50px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                    
                    .modal-close {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: none;
                        border: none;
                        font-size: 30px;
                        cursor: pointer;
                        color: #999;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }
                    
                    .modal-close:hover {
                        background: #f0f0f0;
                        color: #333;
                    }
                    
                    .upgrade-modal-content h2 {
                        margin-top: 0;
                        font-size: 2em;
                        color: #37003c;
                        text-align: center;
                    }
                    
                    .upgrade-modal-content > p {
                        text-align: center;
                        color: #666;
                        margin-bottom: 30px;
                        font-size: 1.1em;
                    }
                    
                    .upgrade-plans {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-top: 30px;
                    }
                    
                    .plan-option {
                        border: 2px solid #e0e0e0;
                        border-radius: 15px;
                        padding: 25px;
                        text-align: center;
                        position: relative;
                        transition: all 0.3s;
                    }
                    
                    .plan-option:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    }
                    
                    .plan-option.featured {
                        border-color: #37003c;
                        background: linear-gradient(to bottom, #f8f4ff, white);
                    }
                    
                    .best-value {
                        position: absolute;
                        top: -12px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #37003c;
                        color: white;
                        padding: 4px 16px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: bold;
                    }
                    
                    .plan-option h3 {
                        margin: 10px 0;
                        font-size: 1.5em;
                        color: #37003c;
                    }
                    
                    .plan-price {
                        font-size: 2em;
                        font-weight: bold;
                        color: #37003c;
                        margin: 15px 0;
                    }
                    
                    .plan-option ul {
                        list-style: none;
                        padding: 0;
                        margin: 20px 0;
                    }
                    
                    .plan-option li {
                        padding: 8px 0;
                        color: #666;
                    }
                    
                    .plan-option button {
                        width: 100%;
                        padding: 12px;
                        background: #37003c;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                    }
                    
                    .plan-option button:hover {
                        background: #6f42c1;
                        transform: scale(1.05);
                    }
                    
                    @media (max-width: 600px) {
                        .upgrade-modal-content {
                            padding: 30px 20px;
                        }
                        
                        .upgrade-plans {
                            grid-template-columns: 1fr;
                        }
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(modal);
        }

        // Show success notification
        showSuccessNotification(level) {
            const notification = document.createElement('div');
            notification.className = 'premium-success-notification';
            notification.innerHTML = `
                <div class="success-content">
                    <span class="success-icon">🎉</span>
                    <div class="success-text">
                        <h3>Welcome to ${level.charAt(0).toUpperCase() + level.slice(1)} Membership!</h3>
                        <p>All premium features are now unlocked. Enjoy your enhanced experience!</p>
                    </div>
                    <button onclick="this.closest('.premium-success-notification').remove()">×</button>
                </div>
            `;
            
            // Add styles
            if (!document.querySelector('#success-notification-styles')) {
                const styles = document.createElement('style');
                styles.id = 'success-notification-styles';
                styles.innerHTML = `
                    .premium-success-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: linear-gradient(135deg, #37003c, #6f42c1);
                        color: white;
                        border-radius: 15px;
                        padding: 20px;
                        max-width: 400px;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                        z-index: 10001;
                        animation: slideInRight 0.5s ease;
                    }
                    
                    @keyframes slideInRight {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    
                    .success-content {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                    }
                    
                    .success-icon {
                        font-size: 40px;
                    }
                    
                    .success-text h3 {
                        margin: 0 0 5px 0;
                        font-size: 18px;
                    }
                    
                    .success-text p {
                        margin: 0;
                        font-size: 14px;
                        opacity: 0.9;
                    }
                    
                    .success-content button {
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        font-size: 24px;
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-left: auto;
                    }
                    
                    .success-content button:hover {
                        background: rgba(255, 255, 255, 0.3);
                    }
                `;
                document.head.appendChild(styles);
            }
            
            document.body.appendChild(notification);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 10000);
        }

        // Check if user is admin
        isAdminAccount() {
            const adminEmails = ['reidwcoleman@gmail.com', 'brianpcoleman@gmail.com'];
            return adminEmails.includes(this.userStatus.email);
        }

        // Handle status changes
        handleStatusChange() {
            // Clear restrictions if user is now premium
            if (this.userStatus.membershipStatus === 'active' && 
                (this.userStatus.membershipLevel === 'starter' || this.userStatus.membershipLevel === 'pro')) {
                this.clearAccessRestrictions();
            }
        }

        // Get user status (public method)
        getUserStatus() {
            return this.userStatus;
        }

        // Update user authentication status
        updateAuthStatus(user) {
            if (user) {
                this.saveUserStatus({
                    isLoggedIn: true,
                    email: user.email,
                    uid: user.uid
                });
            } else {
                this.saveUserStatus({
                    isLoggedIn: false,
                    email: null,
                    uid: null
                });
            }
        }

        // Check if user has active subscription
        hasActiveSubscription() {
            if (this.isAdminAccount()) {
                return true;
            }
            
            if (this.userStatus.membershipStatus !== 'active') {
                return false;
            }
            
            // Check expiry
            if (this.userStatus.expiryDate) {
                const expiry = new Date(this.userStatus.expiryDate);
                return expiry > new Date();
            }
            
            return false;
        }

        // Get membership level
        getMembershipLevel() {
            if (this.isAdminAccount()) {
                return 'pro';
            }
            return this.userStatus.membershipLevel;
        }
    }

    // Initialize the system
    const premiumAccessControl = new PremiumAccessControl();
    
    // Make it globally accessible
    window.premiumAccessControl = premiumAccessControl;
    
    // Integration with Firebase Auth
    if (window.onAuthStateChanged && window.auth) {
        window.onAuthStateChanged(window.auth, (user) => {
            premiumAccessControl.updateAuthStatus(user);
        });
    }
    
    console.log('Premium Access Control System initialized');
})();