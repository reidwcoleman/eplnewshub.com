/**
 * Premium Access Control System for EPL News Hub
 * Manages access to premium FPL features based on user membership status
 */

class PremiumAccessControl {
    constructor() {
        // Pro-only features (most advanced)
        this.proOnlyFeatures = [
            'player-predictor.html',
            'budget-optimizer.html',
            'fixture-analyzer-pro.html'
        ];
        
        // Starter + Pro features (intermediate) 
        this.starterPlusFeatures = [
            'transfer-simulator-pro.html',
            'transfer-simulator.html',
            'team-analyzer.html',
            'player-data-enhanced.html'
        ];
        
        // AI Assistant has special handling (limited free access)
        this.aiAssistantFeature = 'fpl-ai-assistant.html';
        
        // All premium features combined
        this.allPremiumFeatures = [
            ...this.proOnlyFeatures,
            ...this.starterPlusFeatures,
            this.aiAssistantFeature
        ];
        
        this.userStatus = this.getUserStatus();
        this.initializeAccessControl();
    }

    /**
     * Get user authentication and membership status
     * Integrates with auth service, subscription manager, and server-side authentication
     */
    getUserStatus() {
        // First check if auth service has current user data
        if (window.authService && window.authService.getCurrentUser()) {
            const user = window.authService.getCurrentUser();
            const subscription = window.authService.getSubscription();
            return {
                isLoggedIn: window.authService.isLoggedIn(),
                membershipLevel: window.authService.getMembershipTier() || 'free',
                dailyUsage: this.getDailyUsage(),
                isActive: window.authService.hasActiveSubscription()
            };
        }
        
        // Second, check if subscription manager has current user data
        if (window.subscriptionManager && window.subscriptionManager.subscriptionData) {
            const subData = window.subscriptionManager.subscriptionData;
            return {
                isLoggedIn: true,
                membershipLevel: subData.tier || 'free',
                dailyUsage: this.getDailyUsage(),
                isActive: subData.status === 'active'
            };
        }
        
        // Check localStorage for cached user status (fallback)
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        const subscriptionData = localStorage.getItem('eplSubscription');
        
        if (isLoggedIn && subscriptionData) {
            try {
                const parsed = JSON.parse(subscriptionData);
                return {
                    isLoggedIn: true,
                    membershipLevel: parsed.tier || 'free',
                    dailyUsage: this.getDailyUsage(),
                    isActive: parsed.status === 'active'
                };
            } catch (error) {
                console.error('Error parsing subscription data:', error);
            }
        }
        
        // Default to free plan for non-authenticated users
        return {
            isLoggedIn: false,
            membershipLevel: 'free',
            dailyUsage: this.getDailyUsage(),
            isActive: false
        };
    }

    /**
     * Refresh user status (call when subscription changes)
     */
    refreshUserStatus() {
        this.userStatus = this.getUserStatus();
        this.addPremiumIndicators();
        
        // Re-check access for current page
        const currentPage = window.location.pathname.split('/').pop();
        if (this.requiresAccessControl(currentPage)) {
            this.enforceAccess(currentPage);
        }
    }

    /**
     * Get user's daily usage for limited features
     */
    getDailyUsage() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('dailyUsage');
        
        if (!stored) {
            return { date: today, aiQueries: 0 };
        }
        
        const usage = JSON.parse(stored);
        if (usage.date !== today) {
            // Reset for new day
            return { date: today, aiQueries: 0 };
        }
        
        return usage;
    }

    /**
     * Update daily usage counters
     */
    updateDailyUsage(feature) {
        const usage = this.getDailyUsage();
        
        if (feature === 'ai-assistant') {
            usage.aiQueries++;
        }
        
        localStorage.setItem('dailyUsage', JSON.stringify(usage));
        this.userStatus.dailyUsage = usage;
    }

    /**
     * Check if user has access to a specific feature
     */
    hasAccess(feature) {
        const { isLoggedIn, membershipLevel, dailyUsage, isActive } = this.userStatus;
        
        // Special handling for AI Assistant (has limited free access)
        if (feature === this.aiAssistantFeature) {
            if (isLoggedIn && isActive && membershipLevel === 'pro') {
                return { hasAccess: true, unlimited: true };
            }
            if (isLoggedIn && isActive && membershipLevel === 'starter') {
                return { 
                    hasAccess: dailyUsage.aiQueries < 50, 
                    unlimited: false,
                    remaining: 50 - dailyUsage.aiQueries 
                };
            }
            // Free users get 5 queries per day
            return { 
                hasAccess: dailyUsage.aiQueries < 5, 
                unlimited: false,
                remaining: 5 - dailyUsage.aiQueries 
            };
        }
        
        // Pro-only features - require active pro subscription
        if (this.proOnlyFeatures.includes(feature)) {
            return { 
                hasAccess: isLoggedIn && isActive && membershipLevel === 'pro', 
                unlimited: true,
                requiredTier: 'pro'
            };
        }
        
        // Starter + Pro features - require active starter or pro subscription
        if (this.starterPlusFeatures.includes(feature)) {
            return { 
                hasAccess: isLoggedIn && isActive && (membershipLevel === 'starter' || membershipLevel === 'pro'), 
                unlimited: true,
                requiredTier: 'starter'
            };
        }
        
        // Free features
        return { hasAccess: true, unlimited: true };
    }

    /**
     * Initialize access control on page load
     */
    initializeAccessControl() {
        // Check current page
        const currentPage = window.location.pathname.split('/').pop();
        
        if (this.requiresAccessControl(currentPage)) {
            this.enforceAccess(currentPage);
        }
        
        // Add click handlers to premium links
        this.addLinkHandlers();
    }

    /**
     * Check if current page requires access control
     */
    requiresAccessControl(page) {
        return this.allPremiumFeatures.includes(page);
    }

    /**
     * Enforce access control for premium pages
     */
    enforceAccess(page) {
        const access = this.hasAccess(page);
        
        // Remove any existing overlay first
        const existingOverlay = document.getElementById('premium-access-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }
        
        if (!access.hasAccess) {
            this.showAccessDeniedOverlay(page);
        } else if (!access.unlimited && access.remaining !== undefined) {
            this.showUsageLimitIndicator(access.remaining);
        }
    }

    /**
     * Show access denied overlay for premium features
     */
    showAccessDeniedOverlay(page) {
        // Use the membership popup if available
        if (typeof window.showMembershipPopup === 'function') {
            window.showMembershipPopup(page);
            return;
        }
        const access = this.hasAccess(page);
        const overlay = document.createElement('div');
        overlay.id = 'premium-access-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(15px);
            animation: fadeIn 0.3s ease;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            margin: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border: 3px solid #37003c;
        `;
        
        const featureName = this.getFeatureName(page);
        const currentTier = this.userStatus.membershipLevel;
        const requiredTier = access.requiredTier || 'pro';
        
        let upgradeContent = '';
        if (requiredTier === 'starter') {
            // Feature available with Starter or Pro
            if (currentTier === 'free') {
                upgradeContent = `
                    <div style="background: #f0f8ff; color: #37003c; padding: 15px; border-radius: 10px; margin-bottom: 15px; border: 2px solid #37003c;">
                        <strong>⚽ Starter Membership - $2/month</strong><br>
                        <small>✓ Access to this premium FPL tool<br>✓ Transfer Simulator Pro<br>✓ 50 AI Assistant queries/day</small>
                    </div>
                    <div style="background: linear-gradient(135deg, #37003c, #6f42c1); color: white; padding: 15px; border-radius: 10px;">
                        <strong>🏆 Pro Membership - $7/month</strong><br>
                        <small>✓ All premium FPL tools<br>✓ Unlimited AI queries<br>✓ Points Predictor & Budget Optimizer</small>
                    </div>
                `;
            }
        } else {
            // Pro-only feature
            if (currentTier === 'free') {
                upgradeContent = `
                    <div style="background: linear-gradient(135deg, #37003c, #6f42c1); color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                        <strong>🏆 Pro Membership - $7/month</strong><br>
                        <small>Required for advanced FPL tools</small>
                    </div>
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 10px; border: 2px solid #37003c;">
                        <strong>⚽ Starter Membership - $2/month</strong><br>
                        <small>Basic tools + Transfer Simulator + Player Analytics</small>
                    </div>
                `;
            } else if (currentTier === 'starter') {
                upgradeContent = `
                    <div style="background: linear-gradient(135deg, #37003c, #6f42c1); color: white; padding: 15px; border-radius: 10px;">
                        <strong>🏆 Upgrade to Pro - $7/month</strong><br>
                        <small>Unlock advanced AI tools like Points Predictor & Budget Optimizer</small>
                    </div>
                `;
            }
        }
        
        modal.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
            <h2 style="color: #37003c; margin-bottom: 15px; font-size: 1.8rem;">Premium FPL Tool</h2>
            <p style="color: #666; margin-bottom: 25px; line-height: 1.6; font-size: 1.1rem;">
                <strong>You need Pro or Starter membership for this feature</strong><br>
                <span style="font-size: 0.95rem; margin-top: 10px; display: block;">${featureName} is a premium tool that requires an active subscription.</span>
            </p>
            <div style="margin-bottom: 25px;">
                ${upgradeContent}
            </div>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <a href="/membership.html" style="background: linear-gradient(135deg, #37003c, #6f42c1); color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: 700;">
                    🚀 Upgrade Now
                </a>
                <button id="close-premium-overlay" style="background: #666; color: white; padding: 12px 25px; border: none; border-radius: 25px; font-weight: 700; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add close handler - redirect to homepage
        document.getElementById('close-premium-overlay').onclick = () => {
            document.body.removeChild(overlay);
            window.location.href = '/';
        };
        
        // Close on overlay click - redirect to homepage
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                window.location.href = '/';
            }
        };
        
        // Close on ESC key - redirect to homepage
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                document.removeEventListener('keydown', escHandler);
                window.location.href = '/';
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * Show usage limit indicator for AI Assistant
     */
    showUsageLimitIndicator(remaining) {
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #37003c;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: 700;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(255,215,0,0.4);
        `;
        
        indicator.innerHTML = `📊 ${remaining} queries remaining today`;
        document.body.appendChild(indicator);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 5000);
    }

    /**
     * Get user-friendly feature name
     */
    getFeatureName(page) {
        const names = {
            'fpl-ai-assistant.html': 'FPL AI Assistant',
            'transfer-simulator-pro.html': 'Transfer Simulator Pro',
            'transfer-simulator.html': 'Transfer Simulator',
            'team-analyzer.html': 'Team Analyzer',
            'fixture-analyzer-pro.html': 'Fixture Analyzer Pro',
            'player-data-enhanced.html': 'Player Analytics Suite',
            'player-predictor.html': 'Points Predictor',
            'budget-optimizer.html': 'Budget Optimizer'
        };
        return names[page] || 'Premium Feature';
    }

    /**
     * Add click handlers to premium feature links
     */
    addLinkHandlers() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            const page = href.split('/').pop();
            
            if (this.allPremiumFeatures.includes(page)) {
                const access = this.hasAccess(page);
                
                if (!access.hasAccess) {
                    e.preventDefault();
                    this.showAccessDeniedOverlay(page);
                }
            }
        });
    }

    /**
     * Add premium indicators to UI elements
     */
    addPremiumIndicators() {
        // Add premium badges to feature cards
        const premiumCards = document.querySelectorAll('.tool-card');
        
        premiumCards.forEach(card => {
            const link = card.querySelector('a');
            if (!link) return;
            
            const href = link.getAttribute('href');
            const page = href ? href.split('/').pop() : '';
            
            // Check if badge doesn't already exist
            if (!card.querySelector('.premium-indicator')) {
                let badgeContent = '';
                let badgeStyle = '';
                
                if (this.proOnlyFeatures.includes(page)) {
                    badgeContent = '🏆 PRO';
                    badgeStyle = `
                        background: linear-gradient(135deg, #6f42c1, #20c997);
                        color: white;
                    `;
                } else if (this.starterPlusFeatures.includes(page)) {
                    badgeContent = '⚽ STARTER+';
                    badgeStyle = `
                        background: linear-gradient(135deg, #f39c12, #e67e22);
                        color: white;
                    `;
                } else if (page === this.aiAssistantFeature) {
                    badgeContent = '🤖 LIMITED FREE';
                    badgeStyle = `
                        background: linear-gradient(135deg, #3498db, #2980b9);
                        color: white;
                    `;
                }
                
                if (badgeContent) {
                    const badge = document.createElement('div');
                    badge.className = 'premium-indicator';
                    badge.style.cssText = `
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        padding: 5px 12px;
                        border-radius: 15px;
                        font-size: 0.8rem;
                        font-weight: 700;
                        z-index: 10;
                        ${badgeStyle}
                    `;
                    badge.innerHTML = badgeContent;
                    card.style.position = 'relative';
                    card.appendChild(badge);
                }
            }
        });
    }

    /**
     * Simulate user login (for testing)
     */
    simulateLogin(membershipLevel = 'free') {
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('membershipLevel', membershipLevel);
        this.userStatus = this.getUserStatus();
        location.reload();
    }

    /**
     * Simulate user logout (for testing)
     */
    simulateLogout() {
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('membershipLevel');
        localStorage.removeItem('dailyUsage');
        this.userStatus = this.getUserStatus();
        location.reload();
    }
}

// Initialize premium access control when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.premiumAccessControl = new PremiumAccessControl();
    
    // Add premium indicators to UI
    window.premiumAccessControl.addPremiumIndicators();
    
    // Listen for subscription updates from subscription manager
    window.addEventListener('subscriptionUpdated', (event) => {
        console.log('Subscription updated, refreshing access control...', event.detail);
        window.premiumAccessControl.refreshUserStatus();
        
        // Remove any existing access denied overlays if user now has access
        const overlay = document.getElementById('premium-access-overlay');
        if (overlay) {
            const currentPage = window.location.pathname.split('/').pop();
            const access = window.premiumAccessControl.hasAccess(currentPage);
            if (access.hasAccess) {
                document.body.removeChild(overlay);
            }
        }
    });
    
    // Listen for auth service events
    window.addEventListener('authChanged', (event) => {
        console.log('Authentication changed, refreshing access control...', event.detail);
        window.premiumAccessControl.refreshUserStatus();
        
        // Remove any existing access denied overlays if user now has access
        const overlay = document.getElementById('premium-access-overlay');
        if (overlay) {
            const currentPage = window.location.pathname.split('/').pop();
            const access = window.premiumAccessControl.hasAccess(currentPage);
            if (access.hasAccess) {
                document.body.removeChild(overlay);
            }
        }
    });
    
    // Development helper functions (remove in production)
    if (localStorage.getItem('devMode') === 'true') {
        window.simulateLogin = (level) => window.premiumAccessControl.simulateLogin(level);
        window.simulateLogout = () => window.premiumAccessControl.simulateLogout();
        console.log('Dev mode enabled. Use simulateLogin("pro") or simulateLogout() to test access control.');
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PremiumAccessControl;
}// Initialize premium access control on page load
document.addEventListener("DOMContentLoaded", function() {
    // Initialize premium access control if not already initialized
    if (!window.premiumAccessControl) {
        window.premiumAccessControl = new PremiumAccessControl();
    }
});
