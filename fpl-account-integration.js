/**
 * FPL Account Integration
 * Integrates authentication and predictions with the main analyzer
 */

class FPLAccountIntegration {
    constructor() {
        this.initialized = false;
        this.userMenuAdded = false;
        
        this.init();
    }

    /**
     * Initialize integration
     */
    async init() {
        // Wait for all systems to be ready
        await this.waitForSystems();
        
        // Add user menu to all FPL pages
        this.addUserMenuToPages();
        
        // Add prediction widgets to analyzer
        this.addPredictionWidgets();
        
        // Sync user data across pages
        this.syncUserData();
        
        // Set up event listeners
        this.attachEventListeners();
        
        this.initialized = true;
    }

    /**
     * Wait for all systems to initialize
     */
    async waitForSystems() {
        return new Promise((resolve) => {
            const checkSystems = () => {
                if (window.fplAuth && (window.fplUltraPredictions || window.fplPredictions)) {
                    // Use ultra predictions if available, otherwise fallback to regular
                    if (!window.fplPredictions && window.fplUltraPredictions) {
                        window.fplPredictions = window.fplUltraPredictions;
                    }
                    resolve();
                } else {
                    // Load scripts if not present
                    this.loadRequiredScripts();
                    setTimeout(checkSystems, 500);
                }
            };
            checkSystems();
        });
    }

    /**
     * Load required scripts if not present
     */
    loadRequiredScripts() {
        // Check and load auth system
        if (!window.fplAuth && !document.querySelector('script[src*="fpl-auth-system"]')) {
            const authScript = document.createElement('script');
            authScript.src = '/fpl-auth-system.js';
            document.head.appendChild(authScript);
        }
        
        // Check and load ultra predictions system (preferred) or fallback to regular
        if (!window.fplUltraPredictions && !window.fplPredictions) {
            if (!document.querySelector('script[src*="fpl-predictions-ultra"]')) {
                const ultraScript = document.createElement('script');
                ultraScript.src = '/fpl-predictions-ultra.js';
                document.head.appendChild(ultraScript);
            } else if (!document.querySelector('script[src*="fpl-predictions-system"]')) {
                const predictionsScript = document.createElement('script');
                predictionsScript.src = '/fpl-predictions-system.js';
                document.head.appendChild(predictionsScript);
            }
        }
    }

    /**
     * Add user menu to all FPL pages
     */
    addUserMenuToPages() {
        if (this.userMenuAdded) return;
        
        // Create user menu HTML
        const userMenuHTML = `
            <div id="fpl-user-menu" style="
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 9999;
                background: white;
                border-radius: 12px;
                padding: 10px 15px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 10px;
                font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            ">
                <div id="fpl-user-info" style="display: none;">
                    <span id="fpl-username" style="font-weight: 600; color: #37003c;"></span>
                    <span id="fpl-user-points" style="margin-left: 10px; color: #666;"></span>
                </div>
                <button id="fpl-login-btn" style="
                    background: #37003c;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                ">Login</button>
                <button id="fpl-dashboard-btn" style="
                    display: none;
                    background: #00ff85;
                    color: #37003c;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                ">Dashboard</button>
                <button id="fpl-logout-btn" style="
                    display: none;
                    background: #e90052;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                ">Logout</button>
            </div>
        `;
        
        // Add to body
        const menuDiv = document.createElement('div');
        menuDiv.innerHTML = userMenuHTML;
        document.body.appendChild(menuDiv.firstElementChild);
        
        // Add event handlers
        document.getElementById('fpl-login-btn')?.addEventListener('click', () => {
            this.showLoginModal();
        });
        
        document.getElementById('fpl-dashboard-btn')?.addEventListener('click', () => {
            window.location.href = '/fpl-account-dashboard.html';
        });
        
        document.getElementById('fpl-logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });
        
        this.userMenuAdded = true;
        
        // Update menu based on auth status
        this.updateUserMenu();
    }

    /**
     * Update user menu based on authentication
     */
    updateUserMenu() {
        if (!window.fplAuth) return;
        
        const isAuthenticated = fplAuth.isAuthenticated();
        const loginBtn = document.getElementById('fpl-login-btn');
        const dashboardBtn = document.getElementById('fpl-dashboard-btn');
        const logoutBtn = document.getElementById('fpl-logout-btn');
        const userInfo = document.getElementById('fpl-user-info');
        
        if (isAuthenticated) {
            const user = fplAuth.getCurrentUser();
            loginBtn.style.display = 'none';
            dashboardBtn.style.display = 'block';
            logoutBtn.style.display = 'block';
            userInfo.style.display = 'block';
            
            document.getElementById('fpl-username').textContent = user.username;
            document.getElementById('fpl-user-points').textContent = `${user.stats?.total_points || 0} pts`;
        } else {
            loginBtn.style.display = 'block';
            dashboardBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
            userInfo.style.display = 'none';
        }
    }

    /**
     * Add prediction widgets to analyzer pages
     */
    addPredictionWidgets() {
        // Check if we're on a player analyzer page
        if (!window.location.pathname.includes('player') && !window.location.pathname.includes('analyzer')) {
            return;
        }
        
        // Create prediction widget
        const predictionWidgetHTML = `
            <div id="fpl-prediction-widget" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                max-width: 350px;
                z-index: 1000;
                display: none;
                font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
            ">
                <h3 style="margin: 0 0 15px 0; color: #37003c;">Quick Prediction</h3>
                <div id="prediction-player-info" style="
                    background: #f5f5f5;
                    padding: 10px;
                    border-radius: 8px;
                    margin-bottom: 15px;
                ">
                    <div style="font-weight: 600;" id="prediction-player-name">Select a player</div>
                    <div style="color: #666; font-size: 14px;" id="prediction-player-team"></div>
                </div>
                <select id="quick-prediction-type" style="
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    font-size: 14px;
                ">
                    <option value="">Select prediction type</option>
                    <option value="captain">Captain Pick</option>
                    <option value="top_scorer">Top Scorer</option>
                    <option value="differential">Differential</option>
                </select>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-size: 14px; color: #666;">
                        Confidence: <span id="quick-confidence-value">50%</span>
                    </label>
                    <input type="range" id="quick-confidence-slider" min="0" max="100" value="50" style="
                        width: 100%;
                        -webkit-appearance: none;
                        height: 6px;
                        border-radius: 3px;
                        background: #e0e0e0;
                        outline: none;
                    ">
                </div>
                <button id="submit-quick-prediction" style="
                    width: 100%;
                    padding: 12px;
                    background: #37003c;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                ">Submit Prediction</button>
                <div id="prediction-message" style="
                    margin-top: 10px;
                    padding: 10px;
                    border-radius: 8px;
                    display: none;
                    font-size: 14px;
                "></div>
            </div>
        `;
        
        // Add to body
        const widgetDiv = document.createElement('div');
        widgetDiv.innerHTML = predictionWidgetHTML;
        document.body.appendChild(widgetDiv.firstElementChild);
        
        // Add event handlers
        document.getElementById('quick-confidence-slider')?.addEventListener('input', (e) => {
            document.getElementById('quick-confidence-value').textContent = `${e.target.value}%`;
        });
        
        document.getElementById('submit-quick-prediction')?.addEventListener('click', () => {
            this.submitQuickPrediction();
        });
        
        // Show widget if authenticated
        this.updatePredictionWidget();
    }

    /**
     * Update prediction widget visibility
     */
    updatePredictionWidget() {
        const widget = document.getElementById('fpl-prediction-widget');
        if (widget && window.fplAuth && fplAuth.isAuthenticated()) {
            widget.style.display = 'block';
        } else if (widget) {
            widget.style.display = 'none';
        }
    }

    /**
     * Enable player selection for predictions
     */
    enablePlayerSelection() {
        // Add click handlers to player cards
        document.addEventListener('click', (e) => {
            const playerCard = e.target.closest('.player-card, .player-row, [data-player-id]');
            if (playerCard) {
                const playerId = playerCard.dataset.playerId;
                const playerName = playerCard.querySelector('.player-name, .player-web-name, h3')?.textContent;
                const playerTeam = playerCard.querySelector('.player-team, .team-short')?.textContent;
                
                if (playerId && playerName) {
                    this.selectPlayerForPrediction({
                        id: playerId,
                        name: playerName,
                        team: playerTeam
                    });
                }
            }
        });
    }

    /**
     * Select player for prediction
     */
    selectPlayerForPrediction(player) {
        const widget = document.getElementById('fpl-prediction-widget');
        if (!widget || !fplAuth.isAuthenticated()) return;
        
        // Update widget with player info
        document.getElementById('prediction-player-name').textContent = player.name;
        document.getElementById('prediction-player-team').textContent = player.team || '';
        
        // Store selected player
        this.selectedPlayer = player;
        
        // Show widget
        widget.style.display = 'block';
        
        // Highlight effect
        widget.style.animation = 'pulse 0.5s';
        setTimeout(() => {
            widget.style.animation = '';
        }, 500);
    }

    /**
     * Submit quick prediction
     */
    async submitQuickPrediction() {
        if (!fplAuth.isAuthenticated()) {
            this.showMessage('Please login to make predictions', 'error');
            return;
        }
        
        if (!this.selectedPlayer) {
            this.showMessage('Please select a player', 'error');
            return;
        }
        
        const type = document.getElementById('quick-prediction-type').value;
        if (!type) {
            this.showMessage('Please select a prediction type', 'error');
            return;
        }
        
        const confidence = document.getElementById('quick-confidence-slider').value;
        
        const predictionData = {
            type: type,
            playerId: this.selectedPlayer.id,
            playerName: this.selectedPlayer.name,
            team: this.selectedPlayer.team,
            confidence: parseInt(confidence),
            details: {}
        };
        
        const result = await fplPredictions.submitPrediction(predictionData);
        
        if (result.success) {
            this.showMessage('Prediction submitted successfully!', 'success');
            
            // Reset form
            document.getElementById('quick-prediction-type').value = '';
            document.getElementById('quick-confidence-slider').value = 50;
            document.getElementById('quick-confidence-value').textContent = '50%';
            
            // Update user points display
            this.updateUserMenu();
        } else {
            this.showMessage(result.message, 'error');
        }
    }

    /**
     * Show message in widget
     */
    showMessage(message, type) {
        const messageEl = document.getElementById('prediction-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.style.display = 'block';
            messageEl.style.background = type === 'success' ? '#d4edda' : '#f8d7da';
            messageEl.style.color = type === 'success' ? '#155724' : '#721c24';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        // Create simple login modal
        const modalHTML = `
            <div id="quick-login-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div style="
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    max-width: 400px;
                    width: 90%;
                ">
                    <h2 style="margin: 0 0 20px 0; color: #37003c;">Login to FPL Predictor</h2>
                    <input type="email" id="quick-login-email" placeholder="Email" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 15px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-size: 16px;
                    ">
                    <input type="password" id="quick-login-password" placeholder="Password" style="
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 20px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-size: 16px;
                    ">
                    <button id="quick-login-submit" style="
                        width: 100%;
                        padding: 12px;
                        background: #37003c;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        margin-bottom: 10px;
                    ">Login</button>
                    <button id="quick-login-cancel" style="
                        width: 100%;
                        padding: 12px;
                        background: #e0e0e0;
                        color: #333;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                    ">Cancel</button>
                    <p style="
                        margin-top: 15px;
                        text-align: center;
                        font-size: 14px;
                    ">
                        Don't have an account? 
                        <a href="/fpl-account-dashboard.html" style="color: #37003c;">Sign up</a>
                    </p>
                </div>
            </div>
        `;
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv.firstElementChild);
        
        // Add event handlers
        document.getElementById('quick-login-submit')?.addEventListener('click', () => {
            this.handleQuickLogin();
        });
        
        document.getElementById('quick-login-cancel')?.addEventListener('click', () => {
            this.closeLoginModal();
        });
        
        // Close on outside click
        document.getElementById('quick-login-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'quick-login-modal') {
                this.closeLoginModal();
            }
        });
    }

    /**
     * Handle quick login
     */
    async handleQuickLogin() {
        const email = document.getElementById('quick-login-email').value;
        const password = document.getElementById('quick-login-password').value;
        
        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }
        
        const result = await fplAuth.login({ email, password });
        
        if (result.success) {
            this.closeLoginModal();
            this.updateUserMenu();
            this.updatePredictionWidget();
            this.showMessage('Login successful!', 'success');
        } else {
            alert(result.message);
        }
    }

    /**
     * Close login modal
     */
    closeLoginModal() {
        const modal = document.getElementById('quick-login-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        await fplAuth.logout();
        this.updateUserMenu();
        this.updatePredictionWidget();
    }

    /**
     * Sync user data across pages
     */
    syncUserData() {
        // Listen for auth state changes
        if (window.fplAuth) {
            fplAuth.onAuthStateChange((isAuthenticated) => {
                this.updateUserMenu();
                this.updatePredictionWidget();
                
                if (isAuthenticated) {
                    this.loadUserPredictions();
                }
            });
        }
    }

    /**
     * Load user predictions for display
     */
    async loadUserPredictions() {
        if (!window.fplPredictions) return;
        
        const activePredictions = await fplPredictions.getActivePredictions();
        
        // Add visual indicators for predicted players
        activePredictions.forEach(prediction => {
            const playerElements = document.querySelectorAll(`[data-player-id="${prediction.data.playerId}"]`);
            playerElements.forEach(element => {
                // Add prediction badge
                if (!element.querySelector('.prediction-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'prediction-badge';
                    badge.style.cssText = `
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        background: #fdb913;
                        color: #000;
                        padding: 2px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                    `;
                    badge.textContent = 'PREDICTED';
                    element.style.position = 'relative';
                    element.appendChild(badge);
                }
            });
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Enable player selection
        this.enablePlayerSelection();
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + P for quick prediction
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                const widget = document.getElementById('fpl-prediction-widget');
                if (widget) {
                    widget.style.display = widget.style.display === 'none' ? 'block' : 'none';
                }
            }
            
            // Ctrl/Cmd + L for login
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                if (!fplAuth.isAuthenticated()) {
                    this.showLoginModal();
                }
            }
        });
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    #fpl-prediction-widget {
        transition: all 0.3s ease;
    }
    
    #fpl-prediction-widget:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    
    .prediction-badge {
        animation: pulse 2s infinite;
    }
`;
document.head.appendChild(style);

// Initialize integration on all pages
document.addEventListener('DOMContentLoaded', () => {
    window.fplAccountIntegration = new FPLAccountIntegration();
});

// Also initialize if document is already loaded
if (document.readyState !== 'loading') {
    window.fplAccountIntegration = new FPLAccountIntegration();
}