/**
 * Unified User Authentication & Premium Membership Manager
 * Handles user sign-in, data persistence, and premium access control
 */

class UserAuthManager {
    constructor() {
        this.currentUser = null;
        this.membershipData = null;
        this.STORAGE_KEYS = {
            USER: 'eplhub_user',
            MEMBERSHIP: 'eplhub_membership',
            USER_DATA: 'eplhub_user_data',
            SESSION: 'eplhub_session'
        };
        
        // Premium tool IDs
        this.PREMIUM_TOOLS = {
            FPL_AI_ASSISTANT: 'fpl-ai-assistant',
            TRANSFER_SIMULATOR_PRO: 'transfer-simulator-pro',
            TEAM_ANALYZER: 'team-analyzer',
            PLAYER_PREDICTOR: 'player-predictor',
            FPL_PLAYER_ANALYZER: 'fpl-player-analyzer',
            FIXTURE_TRACKER_PRO: 'fixture-tracker-pro',
            BUDGET_OPTIMIZER: 'budget-optimizer'
        };
        
        this.init();
    }
    
    /**
     * Initialize the auth manager
     */
    async init() {
        // Load existing session
        this.loadSession();
        
        // Set up Firebase auth listener if available
        if (window.auth && window.onAuthStateChanged) {
            window.onAuthStateChanged(window.auth, (user) => {
                if (user) {
                    this.handleFirebaseAuth(user);
                } else {
                    // User signed out
                    this.handleSignOut();
                }
            });
        }
        
        // Listen for cross-tab updates
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEYS.USER) {
                this.handleCrossTabUpdate(e);
            }
        });
        
        // Apply premium access control immediately
        this.applyAccessControl();
    }
    
    /**
     * Handle Firebase authentication
     */
    handleFirebaseAuth(firebaseUser) {
        // Create comprehensive user object
        const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            provider: firebaseUser.providerData?.[0]?.providerId || 'email',
            signedInAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        
        // Store user data
        this.currentUser = userData;
        this.saveToStorage(this.STORAGE_KEYS.USER, userData);
        
        // Load or create user profile
        this.loadUserProfile(userData.uid);
        
        // Check and load membership data
        this.loadMembershipData(userData.uid);
        
        // Update UI
        this.updateUIForSignedInUser();
    }
    
    /**
     * Handle user sign out
     */
    handleSignOut() {
        this.currentUser = null;
        this.membershipData = null;
        
        // Clear all storage
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Update UI
        this.updateUIForSignedOutUser();
        
        // Apply access restrictions
        this.applyAccessControl();
    }
    
    /**
     * Load existing session from storage
     */
    loadSession() {
        try {
            const storedUser = this.getFromStorage(this.STORAGE_KEYS.USER);
            const storedMembership = this.getFromStorage(this.STORAGE_KEYS.MEMBERSHIP);
            
            if (storedUser) {
                // Check if session is still valid (24 hours)
                const signedInTime = new Date(storedUser.signedInAt).getTime();
                const now = new Date().getTime();
                const hoursSinceSignIn = (now - signedInTime) / (1000 * 60 * 60);
                
                if (hoursSinceSignIn < 24) {
                    this.currentUser = storedUser;
                    this.currentUser.lastActive = new Date().toISOString();
                    this.saveToStorage(this.STORAGE_KEYS.USER, this.currentUser);
                    
                    if (storedMembership) {
                        this.membershipData = storedMembership;
                    }
                    
                    this.updateUIForSignedInUser();
                } else {
                    // Session expired
                    this.handleSignOut();
                }
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
    }
    
    /**
     * Load user profile data
     */
    async loadUserProfile(userId) {
        try {
            // Check if profile exists in storage
            let userProfile = this.getFromStorage(this.STORAGE_KEYS.USER_DATA);
            
            if (!userProfile || userProfile.userId !== userId) {
                // Create new profile
                userProfile = {
                    userId: userId,
                    preferences: {
                        favoriteTeam: null,
                        favoritePlayer: null,
                        notifications: true,
                        theme: 'light'
                    },
                    stats: {
                        articlesRead: 0,
                        predictionsMade: 0,
                        toolsUsed: [],
                        lastVisit: new Date().toISOString()
                    },
                    fplData: {
                        teamId: null,
                        currentRank: null,
                        previousRanks: [],
                        savedTeams: []
                    },
                    savedContent: {
                        bookmarkedArticles: [],
                        favoriteTools: [],
                        notes: []
                    },
                    achievements: [],
                    createdAt: new Date().toISOString()
                };
            }
            
            // Update last visit
            userProfile.stats.lastVisit = new Date().toISOString();
            
            // Save profile
            this.saveToStorage(this.STORAGE_KEYS.USER_DATA, userProfile);
            
            return userProfile;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }
    
    /**
     * Load membership data
     */
    loadMembershipData(userId) {
        try {
            // Check for existing membership data
            let membership = this.getFromStorage(this.STORAGE_KEYS.MEMBERSHIP);
            
            // Also check legacy keys for backward compatibility
            if (!membership) {
                membership = this.getFromStorage('membership') || 
                            this.getFromStorage('eplMembership') ||
                            this.getFromStorage(`membership_${userId}`);
            }
            
            if (membership) {
                // Update membership with current user
                membership.userId = userId;
                membership.lastVerified = new Date().toISOString();
                
                // Validate membership expiry
                if (membership.expiresAt) {
                    const expiryDate = new Date(membership.expiresAt);
                    if (expiryDate < new Date()) {
                        // Membership expired
                        membership.status = 'expired';
                        membership.plan = 'free';
                    }
                }
                
                this.membershipData = membership;
                this.saveToStorage(this.STORAGE_KEYS.MEMBERSHIP, membership);
                
                // Apply premium features if active
                if (this.isPremiumActive()) {
                    this.enablePremiumFeatures();
                }
            } else {
                // Create free membership
                this.membershipData = {
                    userId: userId,
                    plan: 'free',
                    status: 'active',
                    startedAt: new Date().toISOString(),
                    features: this.getFreePlanFeatures()
                };
                this.saveToStorage(this.STORAGE_KEYS.MEMBERSHIP, this.membershipData);
            }
        } catch (error) {
            console.error('Error loading membership data:', error);
        }
    }
    
    /**
     * Upgrade to premium membership
     */
    upgradeToPremium(plan = 'starter', duration = 'monthly') {
        if (!this.currentUser) {
            alert('Please sign in to upgrade to premium');
            window.location.href = '/signin.html';
            return false;
        }
        
        // Calculate expiry date
        let expiryDate = new Date();
        if (duration === 'monthly') {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (duration === 'yearly') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }
        
        // Update membership data
        this.membershipData = {
            userId: this.currentUser.uid,
            plan: plan, // 'starter' or 'pro'
            status: 'active',
            startedAt: new Date().toISOString(),
            expiresAt: expiryDate.toISOString(),
            billingCycle: duration,
            features: plan === 'pro' ? this.getProPlanFeatures() : this.getStarterPlanFeatures(),
            paymentMethod: null,
            autoRenew: true
        };
        
        // Save membership
        this.saveToStorage(this.STORAGE_KEYS.MEMBERSHIP, this.membershipData);
        
        // Enable premium features
        this.enablePremiumFeatures();
        
        // Update UI
        this.updateUIForPremiumUser();
        
        return true;
    }
    
    /**
     * Check if user has premium access
     */
    isPremiumActive() {
        if (!this.membershipData) return false;
        
        const isPremium = this.membershipData.plan === 'starter' || 
                         this.membershipData.plan === 'pro';
        const isActive = this.membershipData.status === 'active';
        
        // Check expiry if premium
        if (isPremium && this.membershipData.expiresAt) {
            const expiryDate = new Date(this.membershipData.expiresAt);
            const isNotExpired = expiryDate > new Date();
            return isActive && isNotExpired;
        }
        
        return isPremium && isActive;
    }
    
    /**
     * Get current membership plan
     */
    getCurrentPlan() {
        return this.membershipData?.plan || 'free';
    }
    
    /**
     * Check if user has access to specific tool
     */
    hasToolAccess(toolId) {
        // Free tools always accessible
        const freeTools = ['fpl', 'articles', 'news', 'standings', 'fixtures'];
        if (freeTools.includes(toolId)) return true;
        
        // Check if signed in
        if (!this.currentUser) return false;
        
        // Check premium status for premium tools
        if (Object.values(this.PREMIUM_TOOLS).includes(toolId)) {
            return this.isPremiumActive();
        }
        
        return true;
    }
    
    /**
     * Apply access control to premium content
     */
    applyAccessControl() {
        // Get all premium tool elements
        const premiumElements = document.querySelectorAll('[data-premium="true"], .premium-feature, .premium-tool');
        
        premiumElements.forEach(element => {
            if (!this.isPremiumActive()) {
                // Add locked state
                element.classList.add('locked');
                
                // Add click handler to show upgrade prompt
                element.style.cursor = 'pointer';
                element.onclick = (e) => {
                    e.preventDefault();
                    this.showUpgradePrompt();
                };
                
                // Add lock overlay if not exists
                if (!element.querySelector('.premium-lock-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'premium-lock-overlay';
                    overlay.innerHTML = `
                        <div class="lock-content">
                            <span class="lock-icon">🔒</span>
                            <span class="lock-text">Premium Feature</span>
                            <button class="upgrade-btn">Upgrade Now</button>
                        </div>
                    `;
                    element.style.position = 'relative';
                    element.appendChild(overlay);
                }
            } else {
                // Remove locked state
                element.classList.remove('locked');
                element.onclick = null;
                element.style.cursor = 'default';
                
                // Remove lock overlay
                const overlay = element.querySelector('.premium-lock-overlay');
                if (overlay) overlay.remove();
            }
        });
    }
    
    /**
     * Enable premium features
     */
    enablePremiumFeatures() {
        // Remove all premium locks
        document.querySelectorAll('.premium-lock-overlay').forEach(el => el.remove());
        document.querySelectorAll('.locked').forEach(el => el.classList.remove('locked'));
        
        // Enable premium tool access
        this.enablePremiumTools();
        
        // Add premium badge to header
        this.addPremiumBadge();
        
        // Enable advanced features
        this.enableAdvancedFeatures();
    }
    
    /**
     * Enable premium tools
     */
    enablePremiumTools() {
        // Enable FPL AI Assistant
        if (document.querySelector('#fpl-ai-assistant')) {
            window.fplAIEnabled = true;
        }
        
        // Enable Transfer Simulator Pro
        if (document.querySelector('#transfer-simulator-pro')) {
            window.transferSimulatorProEnabled = true;
        }
        
        // Enable other premium tools
        Object.values(this.PREMIUM_TOOLS).forEach(toolId => {
            const toolElement = document.querySelector(`#${toolId}`);
            if (toolElement) {
                toolElement.classList.add('premium-enabled');
                toolElement.removeAttribute('disabled');
            }
        });
    }
    
    /**
     * Show upgrade prompt
     */
    showUpgradePrompt() {
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="upgrade-modal-content">
                <button class="close-modal">&times;</button>
                <h2>🚀 Upgrade to Premium</h2>
                <p>Unlock all premium features and take your FPL game to the next level!</p>
                
                <div class="plan-options">
                    <div class="plan-card starter">
                        <h3>Starter Plan</h3>
                        <div class="price">$2/month</div>
                        <ul>
                            <li>✅ FPL AI Assistant</li>
                            <li>✅ Basic Transfer Simulator</li>
                            <li>✅ Team Analyzer</li>
                            <li>✅ Ad-free experience</li>
                        </ul>
                        <button onclick="userAuthManager.selectPlan('starter')">Choose Starter</button>
                    </div>
                    
                    <div class="plan-card pro">
                        <div class="popular-badge">Most Popular</div>
                        <h3>Pro Plan</h3>
                        <div class="price">$7/month</div>
                        <ul>
                            <li>✅ Everything in Starter</li>
                            <li>✅ Transfer Simulator Pro</li>
                            <li>✅ Player Predictor</li>
                            <li>✅ Advanced Analytics</li>
                            <li>✅ Priority Support</li>
                        </ul>
                        <button onclick="userAuthManager.selectPlan('pro')">Choose Pro</button>
                    </div>
                </div>
                
                <p class="sign-in-prompt">
                    ${!this.currentUser ? 'Please <a href="/signin.html">sign in</a> to continue' : ''}
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles if not exists
        if (!document.querySelector('#upgrade-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'upgrade-modal-styles';
            styles.textContent = `
                .upgrade-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s;
                }
                
                .upgrade-modal-content {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    animation: slideUp 0.3s;
                }
                
                .close-modal {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 30px;
                    cursor: pointer;
                    color: #666;
                }
                
                .plan-options {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 30px 0;
                }
                
                .plan-card {
                    border: 2px solid #e0e0e0;
                    border-radius: 15px;
                    padding: 30px;
                    text-align: center;
                    position: relative;
                    transition: transform 0.3s, box-shadow 0.3s;
                }
                
                .plan-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }
                
                .plan-card.pro {
                    border-color: #37003c;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e8d4f0 100%);
                }
                
                .popular-badge {
                    position: absolute;
                    top: -12px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #37003c;
                    color: white;
                    padding: 5px 20px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }
                
                .plan-card h3 {
                    color: #37003c;
                    margin-bottom: 10px;
                }
                
                .plan-card .price {
                    font-size: 2em;
                    font-weight: bold;
                    color: #37003c;
                    margin: 20px 0;
                }
                
                .plan-card ul {
                    list-style: none;
                    padding: 0;
                    margin: 20px 0;
                    text-align: left;
                }
                
                .plan-card li {
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                
                .plan-card button {
                    background: #37003c;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.3s;
                    width: 100%;
                }
                
                .plan-card button:hover {
                    background: #5a0050;
                }
                
                .premium-lock-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255,255,255,0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    backdrop-filter: blur(5px);
                }
                
                .lock-content {
                    text-align: center;
                }
                
                .lock-icon {
                    font-size: 48px;
                    display: block;
                    margin-bottom: 10px;
                }
                
                .lock-text {
                    display: block;
                    font-weight: bold;
                    margin-bottom: 15px;
                    color: #37003c;
                }
                
                .upgrade-btn {
                    background: #37003c;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 20px;
                    cursor: pointer;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Close modal handlers
        modal.querySelector('.close-modal').onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
    
    /**
     * Select a plan
     */
    selectPlan(plan) {
        if (!this.currentUser) {
            window.location.href = '/signin.html';
            return;
        }
        
        // Close modal
        document.querySelector('.upgrade-modal')?.remove();
        
        // Upgrade to selected plan
        if (this.upgradeToPremium(plan, 'monthly')) {
            // Show success message
            this.showSuccessMessage(`🎉 Welcome to EPL News Hub ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan!`);
            
            // Redirect to premium hub
            setTimeout(() => {
                window.location.href = '/fpl-premium-hub.html';
            }, 2000);
        }
    }
    
    /**
     * Update UI for signed-in user
     */
    updateUIForSignedInUser() {
        // Update header with user info
        const userMenu = document.querySelector('.user-menu, .header-user-menu');
        if (userMenu) {
            userMenu.innerHTML = `
                <div class="user-info">
                    ${this.currentUser.photoURL ? 
                        `<img src="${this.currentUser.photoURL}" alt="Profile" class="user-avatar">` :
                        `<span class="user-avatar-placeholder">${this.currentUser.displayName?.[0] || '👤'}</span>`
                    }
                    <span class="user-name">${this.currentUser.displayName || 'User'}</span>
                    ${this.isPremiumActive() ? '<span class="premium-badge">⭐ Premium</span>' : ''}
                </div>
                <div class="user-dropdown">
                    <a href="/account.html">My Account</a>
                    ${this.isPremiumActive() ? 
                        '<a href="/fpl-premium-hub.html">Premium Hub</a>' :
                        '<a href="/membership.html">Upgrade to Premium</a>'
                    }
                    <a href="#" onclick="userAuthManager.signOut()">Sign Out</a>
                </div>
            `;
        }
        
        // Show/hide sign-in buttons
        document.querySelectorAll('.sign-in-btn, .login-btn').forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Apply access control
        this.applyAccessControl();
    }
    
    /**
     * Update UI for signed-out user
     */
    updateUIForSignedOutUser() {
        // Update header
        const userMenu = document.querySelector('.user-menu, .header-user-menu');
        if (userMenu) {
            userMenu.innerHTML = `
                <a href="/signin.html" class="sign-in-btn">Sign In</a>
                <a href="/create-account.html" class="create-account-btn">Create Account</a>
            `;
        }
        
        // Apply access restrictions
        this.applyAccessControl();
    }
    
    /**
     * Update UI for premium user
     */
    updateUIForPremiumUser() {
        // Add premium class to body
        document.body.classList.add('premium-user');
        
        // Remove ads if premium
        if (this.isPremiumActive()) {
            document.querySelectorAll('.ad, .advertisement, ins.adsbygoogle').forEach(ad => {
                ad.style.display = 'none';
            });
        }
        
        // Enable premium features
        this.enablePremiumFeatures();
    }
    
    /**
     * Add premium badge to header
     */
    addPremiumBadge() {
        if (!document.querySelector('.header-premium-badge')) {
            const header = document.querySelector('header, .header');
            if (header) {
                const badge = document.createElement('div');
                badge.className = 'header-premium-badge';
                badge.innerHTML = `⭐ ${this.getCurrentPlan().toUpperCase()} MEMBER`;
                header.appendChild(badge);
            }
        }
    }
    
    /**
     * Enable advanced features for premium users
     */
    enableAdvancedFeatures() {
        // Enable AI features
        window.premiumAIEnabled = true;
        
        // Enable data export
        window.dataExportEnabled = true;
        
        // Enable advanced analytics
        window.advancedAnalyticsEnabled = true;
        
        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('premium-features-enabled', {
            detail: {
                plan: this.getCurrentPlan(),
                features: this.membershipData?.features || []
            }
        }));
    }
    
    /**
     * Sign out user
     */
    async signOut() {
        if (window.auth && window.signOut) {
            try {
                await window.signOut(window.auth);
            } catch (error) {
                console.error('Firebase sign out error:', error);
            }
        }
        
        this.handleSignOut();
        window.location.href = '/';
    }
    
    /**
     * Save user data
     */
    saveUserData(key, data) {
        if (!this.currentUser) return false;
        
        try {
            const userData = this.getFromStorage(this.STORAGE_KEYS.USER_DATA) || {};
            userData[key] = data;
            userData.lastUpdated = new Date().toISOString();
            this.saveToStorage(this.STORAGE_KEYS.USER_DATA, userData);
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }
    
    /**
     * Get user data
     */
    getUserData(key) {
        if (!this.currentUser) return null;
        
        const userData = this.getFromStorage(this.STORAGE_KEYS.USER_DATA);
        return key ? userData?.[key] : userData;
    }
    
    /**
     * Get plan features
     */
    getFreePlanFeatures() {
        return [
            'Read unlimited articles',
            'View live scores and standings',
            'Basic FPL tools',
            'Community features'
        ];
    }
    
    getStarterPlanFeatures() {
        return [
            ...this.getFreePlanFeatures(),
            'FPL AI Assistant',
            'Transfer Simulator',
            'Team Analyzer',
            'Player Statistics',
            'Ad-free experience'
        ];
    }
    
    getProPlanFeatures() {
        return [
            ...this.getStarterPlanFeatures(),
            'Transfer Simulator Pro',
            'Player Predictor',
            'Advanced Analytics',
            'Custom Notifications',
            'Data Export',
            'Priority Support'
        ];
    }
    
    /**
     * Show success message
     */
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 10001;
            animation: slideInRight 0.3s;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 5000);
    }
    
    /**
     * Handle cross-tab updates
     */
    handleCrossTabUpdate(event) {
        if (event.newValue) {
            // User signed in or updated in another tab
            this.loadSession();
            this.updateUIForSignedInUser();
        } else {
            // User signed out in another tab
            this.handleSignOut();
        }
    }
    
    /**
     * Storage helpers
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    }
    
    getFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage retrieval error:', error);
            return null;
        }
    }
}

// Initialize the auth manager
const userAuthManager = new UserAuthManager();

// Make it globally available
window.userAuthManager = userAuthManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        userAuthManager.applyAccessControl();
    });
} else {
    userAuthManager.applyAccessControl();
}