// Subscription Manager for EPL News Hub
// This module handles client-side subscription checks and feature access

class SubscriptionManager {
    constructor() {
        this.subscriptionData = null;
        this.userEmail = null;
        this.checkInterval = null;
    }

    // Initialize subscription checking
    async init() {
        // Check if user is authenticated with Firebase
        if (window.auth && window.onAuthStateChanged) {
            window.onAuthStateChanged(window.auth, async (user) => {
                if (user) {
                    this.userEmail = user.email;
                    await this.checkSubscription();
                    
                    // Set up periodic checks every 5 minutes
                    this.checkInterval = setInterval(() => {
                        this.checkSubscription();
                    }, 5 * 60 * 1000);
                } else {
                    this.clearSubscription();
                }
            });
        } else {
            // Check localStorage for subscription data (fallback)
            this.loadFromLocalStorage();
        }
    }

    // Check subscription status from server
    async checkSubscription() {
        if (!this.userEmail) return;

        try {
            const response = await fetch(`/api/user/subscription/${encodeURIComponent(this.userEmail)}`);
            const data = await response.json();
            
            if (data.success) {
                this.subscriptionData = data.subscription;
                this.saveToLocalStorage();
                this.updateUIBasedOnSubscription();
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            // Fall back to localStorage data
            this.loadFromLocalStorage();
        }
    }

    // Save subscription data to localStorage
    saveToLocalStorage() {
        if (this.subscriptionData) {
            localStorage.setItem('eplSubscription', JSON.stringify({
                ...this.subscriptionData,
                lastChecked: new Date().toISOString()
            }));
        }
    }

    // Load subscription data from localStorage
    loadFromLocalStorage() {
        const stored = localStorage.getItem('eplSubscription');
        if (stored) {
            const data = JSON.parse(stored);
            // Check if data is less than 1 hour old
            const lastChecked = new Date(data.lastChecked);
            const now = new Date();
            const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            
            if (lastChecked > hourAgo) {
                this.subscriptionData = data;
                this.updateUIBasedOnSubscription();
            }
        }
    }

    // Clear subscription data
    clearSubscription() {
        this.subscriptionData = null;
        this.userEmail = null;
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        localStorage.removeItem('eplSubscription');
        this.updateUIBasedOnSubscription();
    }

    // Get current subscription tier
    getTier() {
        return this.subscriptionData?.tier || 'free';
    }

    // Check if user has specific tier access
    hasTierAccess(requiredTier) {
        const tierHierarchy = {
            'free': 0,
            'starter': 1,
            'pro': 2
        };
        
        const userTier = this.getTier();
        const userLevel = tierHierarchy[userTier] || 0;
        const requiredLevel = tierHierarchy[requiredTier] || 0;
        
        return userLevel >= requiredLevel;
    }

    // Check if subscription is active
    isActive() {
        return this.subscriptionData?.status === 'active';
    }

    // Get subscription features based on tier
    getFeatures() {
        const tier = this.getTier();
        const features = {
            'free': {
                articlesPerWeek: 0,
                exclusiveArticles: false,
                transferRumors: false,
                teamAnalysis: false,
                fplAdvice: false,
                adFree: false,
                premiumTransferInfo: false,
                earlyAccess: false,
                fplTeamOfWeek: false
            },
            'starter': {
                articlesPerWeek: 5,
                exclusiveArticles: true,
                transferRumors: true,
                teamAnalysis: true,
                fplAdvice: true,
                adFree: true,
                premiumTransferInfo: false,
                earlyAccess: false,
                fplTeamOfWeek: false
            },
            'pro': {
                articlesPerWeek: -1, // Unlimited
                exclusiveArticles: true,
                transferRumors: true,
                teamAnalysis: true,
                fplAdvice: true,
                adFree: true,
                premiumTransferInfo: true,
                earlyAccess: true,
                fplTeamOfWeek: true
            }
        };
        
        return features[tier] || features['free'];
    }

    // Update UI based on subscription status
    updateUIBasedOnSubscription() {
        const tier = this.getTier();
        const isActive = this.isActive();
        const features = this.getFeatures();
        
        // Hide ads for paid subscribers
        if (features.adFree && isActive) {
            this.hideAds();
        }
        
        // Show/hide premium content indicators
        this.updatePremiumIndicators(tier, isActive);
        
        // Update membership badges
        this.updateMembershipBadges(tier, isActive);
        
        // Dispatch custom event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
            detail: {
                tier,
                isActive,
                features,
                subscription: this.subscriptionData
            }
        }));
    }

    // Hide advertisement elements
    hideAds() {
        // Hide Ezoic ads
        const ezoicElements = document.querySelectorAll('[id^="ezoic-pub-ad-placeholder"]');
        ezoicElements.forEach(el => el.style.display = 'none');
        
        // Hide AdSense ads
        const adsenseElements = document.querySelectorAll('.adsbygoogle');
        adsenseElements.forEach(el => el.style.display = 'none');
        
        // Hide any custom ad containers
        const adContainers = document.querySelectorAll('.ad-container, .advertisement, .ad-wrapper');
        adContainers.forEach(el => el.style.display = 'none');
    }

    // Update premium content indicators
    updatePremiumIndicators(tier, isActive) {
        // Find all premium content elements
        const premiumElements = document.querySelectorAll('[data-premium-tier]');
        
        premiumElements.forEach(element => {
            const requiredTier = element.getAttribute('data-premium-tier');
            const hasAccess = isActive && this.hasTierAccess(requiredTier);
            
            if (hasAccess) {
                // Show content
                element.classList.remove('premium-locked');
                element.classList.add('premium-unlocked');
                
                // Remove any lock overlays
                const lockOverlay = element.querySelector('.premium-lock-overlay');
                if (lockOverlay) {
                    lockOverlay.style.display = 'none';
                }
            } else {
                // Lock content
                element.classList.add('premium-locked');
                element.classList.remove('premium-unlocked');
                
                // Add or show lock overlay if not present
                let lockOverlay = element.querySelector('.premium-lock-overlay');
                if (!lockOverlay) {
                    lockOverlay = this.createLockOverlay(requiredTier);
                    element.appendChild(lockOverlay);
                } else {
                    lockOverlay.style.display = 'block';
                }
            }
        });
    }

    // Create a lock overlay for premium content
    createLockOverlay(requiredTier) {
        const overlay = document.createElement('div');
        overlay.className = 'premium-lock-overlay';
        overlay.innerHTML = `
            <div class="lock-content">
                <span class="lock-icon">🔒</span>
                <h3>Premium Content</h3>
                <p>This content requires a ${requiredTier} subscription</p>
                <a href="/membership.html" class="upgrade-button">Upgrade Now</a>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('#premium-lock-styles')) {
            const styles = document.createElement('style');
            styles.id = 'premium-lock-styles';
            styles.textContent = `
                .premium-lock-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                }
                
                .premium-locked {
                    position: relative;
                    overflow: hidden;
                }
                
                .lock-content {
                    text-align: center;
                    padding: 20px;
                }
                
                .lock-icon {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 10px;
                }
                
                .upgrade-button {
                    display: inline-block;
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #37003c, #6f42c1);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: transform 0.2s;
                }
                
                .upgrade-button:hover {
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(styles);
        }
        
        return overlay;
    }

    // Update membership badges in UI
    updateMembershipBadges(tier, isActive) {
        // Find or create badge container
        let badgeContainer = document.querySelector('.membership-badge');
        
        if (!badgeContainer && isActive && tier !== 'free') {
            // Create badge if user has active subscription
            badgeContainer = document.createElement('div');
            badgeContainer.className = 'membership-badge';
            
            // Try to add to header or create floating badge
            const header = document.querySelector('header, .header');
            if (header) {
                header.appendChild(badgeContainer);
            } else {
                badgeContainer.style.position = 'fixed';
                badgeContainer.style.top = '10px';
                badgeContainer.style.right = '10px';
                badgeContainer.style.zIndex = '1000';
                document.body.appendChild(badgeContainer);
            }
        }
        
        if (badgeContainer) {
            if (isActive && tier !== 'free') {
                const badgeEmoji = tier === 'pro' ? '🏆' : '⚽';
                const badgeText = tier.charAt(0).toUpperCase() + tier.slice(1);
                badgeContainer.innerHTML = `
                    <span class="badge-emoji">${badgeEmoji}</span>
                    <span class="badge-text">${badgeText} Member</span>
                `;
                badgeContainer.style.display = 'flex';
                
                // Add badge styles if not present
                if (!document.querySelector('#membership-badge-styles')) {
                    const styles = document.createElement('style');
                    styles.id = 'membership-badge-styles';
                    styles.textContent = `
                        .membership-badge {
                            background: linear-gradient(135deg, #37003c, #6f42c1);
                            color: white;
                            padding: 8px 15px;
                            border-radius: 20px;
                            font-size: 14px;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            box-shadow: 0 2px 10px rgba(55, 0, 60, 0.3);
                        }
                        
                        .badge-emoji {
                            font-size: 18px;
                        }
                    `;
                    document.head.appendChild(styles);
                }
            } else {
                badgeContainer.style.display = 'none';
            }
        }
    }
}

// Initialize subscription manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.subscriptionManager = new SubscriptionManager();
        window.subscriptionManager.init();
    });
} else {
    window.subscriptionManager = new SubscriptionManager();
    window.subscriptionManager.init();
}