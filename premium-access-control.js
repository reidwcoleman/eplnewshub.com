/**
 * Premium Access Control System for EPL News Hub
 * Manages access to premium FPL features based on user membership status
 */

class PremiumAccessControl {
    constructor() {
        this.premiumFeatures = [
            'fpl-ai-assistant.html',
            'transfer-simulator-pro.html', 
            'player-data-enhanced.html',
            'player-predictor.html',
            'budget-optimizer.html'
        ];
        
        this.userStatus = this.getUserStatus();
        this.initializeAccessControl();
    }

    /**
     * Get user authentication and membership status
     * In a real implementation, this would integrate with Firebase Auth
     */
    getUserStatus() {
        // Check if user is logged in (placeholder - would use Firebase Auth)
        const isLoggedIn = localStorage.getItem('userLoggedIn') === 'true';
        const membershipLevel = localStorage.getItem('membershipLevel') || 'free';
        
        return {
            isLoggedIn: isLoggedIn,
            membershipLevel: membershipLevel, // 'free', 'starter', 'pro'
            dailyUsage: this.getDailyUsage()
        };
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
        const { isLoggedIn, membershipLevel, dailyUsage } = this.userStatus;
        
        // Special handling for AI Assistant (has limited free access)
        if (feature === 'fpl-ai-assistant.html') {
            if (membershipLevel === 'pro') return { hasAccess: true, unlimited: true };
            if (membershipLevel === 'starter') return { 
                hasAccess: dailyUsage.aiQueries < 50, 
                unlimited: false,
                remaining: 50 - dailyUsage.aiQueries 
            };
            // Free users get 5 queries per day
            return { 
                hasAccess: dailyUsage.aiQueries < 5, 
                unlimited: false,
                remaining: 5 - dailyUsage.aiQueries 
            };
        }
        
        // Premium-only features
        if (this.premiumFeatures.includes(feature)) {
            return { 
                hasAccess: membershipLevel === 'pro', 
                unlimited: true 
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
        return this.premiumFeatures.includes(page);
    }

    /**
     * Enforce access control for premium pages
     */
    enforceAccess(page) {
        const access = this.hasAccess(page);
        
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
        const overlay = document.createElement('div');
        overlay.id = 'premium-access-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
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
        
        modal.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
            <h2 style="color: #37003c; margin-bottom: 15px; font-size: 1.8rem;">Premium Feature</h2>
            <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">
                <strong>${featureName}</strong> is available with EPL News Hub Pro membership.
            </p>
            <div style="margin-bottom: 25px;">
                <div style="background: linear-gradient(135deg, #37003c, #6f42c1); color: white; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <strong>🏆 Pro Membership - $7/month</strong><br>
                    <small>All premium FPL tools + unlimited access</small>
                </div>
                <div style="background: #f0f8ff; padding: 15px; border-radius: 10px; border: 2px solid #37003c;">
                    <strong>⚽ Starter Membership - $2/month</strong><br>
                    <small>Basic tools + 50 AI queries/day</small>
                </div>
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
        
        // Add close handler
        document.getElementById('close-premium-overlay').onclick = () => {
            document.body.removeChild(overlay);
            window.history.back();
        };
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                window.history.back();
            }
        };
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
            
            if (this.premiumFeatures.includes(page)) {
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
            
            if (this.premiumFeatures.includes(page)) {
                // Check if badge doesn't already exist
                if (!card.querySelector('.premium-indicator')) {
                    const badge = document.createElement('div');
                    badge.className = 'premium-indicator';
                    badge.style.cssText = `
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: linear-gradient(135deg, #ffd700, #ffed4e);
                        color: #37003c;
                        padding: 5px 12px;
                        border-radius: 15px;
                        font-size: 0.8rem;
                        font-weight: 700;
                        z-index: 10;
                    `;
                    badge.innerHTML = '🔒 PRO';
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
}