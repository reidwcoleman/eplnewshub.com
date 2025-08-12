// Membership Popup Modal System
// This handles showing membership plans in a modal without leaving the current page

class MembershipPopup {
    constructor() {
        this.modal = null;
        this.stripe = null;
        this.currentTool = null;
        this.initializeStripe();
    }

    initializeStripe() {
        // Initialize Stripe with appropriate key based on environment
        if (typeof Stripe !== 'undefined') {
            // Check if dev config is available
            if (window.devConfig) {
                const config = window.devConfig.getConfig();
                this.stripe = Stripe(config.stripe.publishableKey);
                console.log('Membership popup using', config.isDevelopment ? 'TEST' : 'LIVE', 'Stripe keys');
            } else {
                // Fallback to live key
                this.stripe = Stripe('pk_live_51R1zJxR10Q6bz3BHKVdTzRdwLsxzlrbN5bQoZ96FpQ7nZaZZ4aNrfk7EhW4aSDLKhqhSzBWNKFvxxLwMp6Zb9b3p005qGMCRDO');
            }
        }
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="membership-modal" class="membership-modal">
                <div class="membership-modal-overlay"></div>
                <div class="membership-modal-content">
                    <button class="membership-modal-close">&times;</button>
                    
                    <div class="membership-modal-header">
                        <h2>🔒 Premium Access Required</h2>
                        <p>Unlock this tool with an EPL News Hub membership</p>
                    </div>

                    <div class="membership-modal-body">
                        <div class="membership-plans-grid">
                            <!-- Starter Plan -->
                            <div class="membership-plan-card starter">
                                <div class="plan-badge">Most Popular</div>
                                <h3>⚽ Starter</h3>
                                <div class="plan-price">
                                    <span class="currency">$</span>
                                    <span class="amount">2</span>
                                    <span class="period">/month</span>
                                </div>
                                <ul class="plan-features-list">
                                    <li>✅ 5 exclusive articles per week</li>
                                    <li>✅ Latest transfer rumors</li>
                                    <li>✅ Weekly team analysis</li>
                                    <li>✅ FPL pro advice</li>
                                    <li>✅ Ad-free browsing</li>
                                    <li>✅ Access to this tool</li>
                                </ul>
                                <button class="plan-select-btn" onclick="membershipPopup.selectPlan('starter', 'price_1RoaG1R10Q6bz3BHC2hDRKLv')">
                                    Choose Starter
                                </button>
                            </div>

                            <!-- Pro Plan -->
                            <div class="membership-plan-card pro featured">
                                <div class="plan-badge premium">Best Value</div>
                                <h3>🏆 Pro</h3>
                                <div class="plan-price">
                                    <span class="currency">$</span>
                                    <span class="amount">7</span>
                                    <span class="period">/month</span>
                                </div>
                                <ul class="plan-features-list">
                                    <li>✅ Everything in Starter</li>
                                    <li>✅ Unlimited exclusive articles</li>
                                    <li>✅ Premium transfer insider info</li>
                                    <li>✅ Early access to content</li>
                                    <li>✅ FPL team of the week</li>
                                    <li>✅ All premium tools</li>
                                </ul>
                                <button class="plan-select-btn premium" onclick="membershipPopup.selectPlan('pro', 'price_1Rox4aR10Q6bz3BHxohJtpcO')">
                                    Choose Pro
                                </button>
                            </div>
                        </div>

                        <div class="membership-modal-footer">
                            <p class="secure-payment">🔒 Secure payment powered by Stripe</p>
                            <p class="cancel-anytime">Cancel anytime from your account page</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('membership-modal');

        // Add styles if not already present
        if (!document.getElementById('membership-modal-styles')) {
            const styles = `
                <style id="membership-modal-styles">
                    .membership-modal {
                        display: none;
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 10000;
                    }

                    .membership-modal.active {
                        display: block;
                    }

                    .membership-modal-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        backdrop-filter: blur(5px);
                    }

                    .membership-modal-content {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: #fff;
                        border-radius: 20px;
                        padding: 40px;
                        max-width: 900px;
                        width: 90%;
                        max-height: 90vh;
                        overflow-y: auto;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        animation: modalSlideIn 0.3s ease;
                    }

                    @keyframes modalSlideIn {
                        from {
                            opacity: 0;
                            transform: translate(-50%, -45%);
                        }
                        to {
                            opacity: 1;
                            transform: translate(-50%, -50%);
                        }
                    }

                    .membership-modal-close {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        background: none;
                        border: none;
                        font-size: 30px;
                        cursor: pointer;
                        color: #666;
                        transition: color 0.3s;
                    }

                    .membership-modal-close:hover {
                        color: #000;
                    }

                    .membership-modal-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    .membership-modal-header h2 {
                        font-size: 2rem;
                        color: #333;
                        margin-bottom: 10px;
                    }

                    .membership-modal-header p {
                        color: #666;
                        font-size: 1.1rem;
                    }

                    .membership-plans-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 30px;
                        margin-bottom: 30px;
                    }

                    .membership-plan-card {
                        background: #f8f9fa;
                        border-radius: 15px;
                        padding: 30px;
                        position: relative;
                        transition: transform 0.3s, box-shadow 0.3s;
                    }

                    .membership-plan-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                    }

                    .membership-plan-card.featured {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }

                    .plan-badge {
                        position: absolute;
                        top: -10px;
                        right: 20px;
                        background: #4CAF50;
                        color: white;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-size: 0.85rem;
                        font-weight: bold;
                    }

                    .plan-badge.premium {
                        background: #ff9800;
                    }

                    .membership-plan-card h3 {
                        font-size: 1.5rem;
                        margin-bottom: 15px;
                    }

                    .plan-price {
                        display: flex;
                        align-items: baseline;
                        margin-bottom: 20px;
                    }

                    .plan-price .currency {
                        font-size: 1.2rem;
                        margin-right: 2px;
                    }

                    .plan-price .amount {
                        font-size: 2.5rem;
                        font-weight: bold;
                    }

                    .plan-price .period {
                        font-size: 1rem;
                        opacity: 0.8;
                        margin-left: 5px;
                    }

                    .plan-features-list {
                        list-style: none;
                        padding: 0;
                        margin: 0 0 20px 0;
                    }

                    .plan-features-list li {
                        padding: 8px 0;
                        font-size: 0.95rem;
                    }

                    .plan-select-btn {
                        width: 100%;
                        padding: 12px 20px;
                        background: #37003c;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: bold;
                        cursor: pointer;
                        transition: background 0.3s;
                    }

                    .plan-select-btn:hover {
                        background: #4a0050;
                    }

                    .plan-select-btn.premium {
                        background: white;
                        color: #764ba2;
                    }

                    .plan-select-btn.premium:hover {
                        background: #f0f0f0;
                    }

                    .membership-modal-footer {
                        text-align: center;
                        color: #666;
                        font-size: 0.9rem;
                    }

                    .membership-modal-footer p {
                        margin: 5px 0;
                    }

                    @media (max-width: 768px) {
                        .membership-modal-content {
                            padding: 20px;
                            width: 95%;
                        }

                        .membership-plans-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', styles);
        }

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button - redirect to homepage
        const closeBtn = this.modal.querySelector('.membership-modal-close');
        closeBtn.addEventListener('click', () => this.closeAndRedirect());

        // Overlay click - redirect to homepage
        const overlay = this.modal.querySelector('.membership-modal-overlay');
        overlay.addEventListener('click', () => this.closeAndRedirect());

        // ESC key - redirect to homepage
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeAndRedirect();
            }
        });
    }

    show(toolName = null) {
        this.currentTool = toolName;
        
        // Create modal if it doesn't exist
        if (!this.modal) {
            this.createModal();
        }

        // Show the modal
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    closeAndRedirect() {
        // Close the modal first
        this.close();
        
        // Redirect to homepage
        window.location.href = '/';
    }

    async selectPlan(planType, priceId) {
        console.log('Selecting plan:', planType, priceId);

        // Check if user is authenticated
        if (!window.auth || !window.auth.currentUser) {
            // Show auth prompt in modal
            const confirmed = confirm('You need to sign in or create an account to purchase a membership. Would you like to sign in now?');
            if (confirmed) {
                // Store the current page and plan selection
                sessionStorage.setItem('returnUrl', window.location.href);
                sessionStorage.setItem('selectedPlan', planType);
                sessionStorage.setItem('selectedPriceId', priceId);
                window.location.href = '/signin.html';
            }
            return;
        }

        // Show loading state
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Processing...';
        button.disabled = true;

        try {
            // Create checkout session via your backend
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    priceId: priceId,
                    planType: planType,
                    userEmail: window.auth.currentUser.email,
                    userId: window.auth.currentUser.uid,
                    returnUrl: window.location.href // Save current page to return after payment
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { sessionId } = await response.json();

            // Redirect to Stripe Checkout
            const result = await this.stripe.redirectToCheckout({
                sessionId: sessionId
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error('Error:', error);
            alert('There was an error processing your request. Please try again.');
            
            // Restore button state
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    // Check if user has active membership
    async checkMembership() {
        if (!window.auth || !window.auth.currentUser) {
            return false;
        }

        // Check localStorage first (for demo/testing)
        const membership = localStorage.getItem('membership');
        if (membership) {
            const membershipData = JSON.parse(membership);
            const expiryDate = new Date(membershipData.expiryDate || membershipData.nextBilling);
            if (expiryDate > new Date()) {
                return membershipData.plan;
            }
        }

        // In production, check with your backend
        try {
            const response = await fetch(`/api/check-membership/${window.auth.currentUser.uid}`);
            if (response.ok) {
                const data = await response.json();
                return data.activePlan || false;
            }
        } catch (error) {
            console.error('Error checking membership:', error);
        }

        return false;
    }
}

// Initialize globally
window.membershipPopup = new MembershipPopup();

// Function to show membership popup from anywhere
window.showMembershipPopup = function(toolName = null) {
    window.membershipPopup.show(toolName);
};

// Function to check and handle premium content access
window.checkPremiumAccess = async function(requiredPlan = 'starter') {
    const membershipPlan = await window.membershipPopup.checkMembership();
    
    if (!membershipPlan) {
        // No membership - show popup
        window.membershipPopup.show();
        return false;
    }
    
    // Check if user has required plan level
    if (requiredPlan === 'pro' && membershipPlan === 'starter') {
        // Needs upgrade to pro
        window.membershipPopup.show();
        return false;
    }
    
    return true;
};