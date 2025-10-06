/**
 * FPL Account UI Controller
 * Manages all UI interactions for the account dashboard
 */

class FPLAccountUI {
    constructor() {
        this.selectedPredictionType = null;
        this.selectedPlayer = null;
        this.currentFilter = 'all';
        this.mockPlayers = this.generateMockPlayers();
        
        this.init();
    }

    /**
     * Initialize UI controller
     */
    async init() {
        // Wait for auth and predictions systems to initialize
        await this.waitForDependencies();
        
        // Set up event listeners
        this.attachEventListeners();
        
        // Check authentication status
        this.updateAuthUI();
        
        // Subscribe to auth changes
        fplAuth.onAuthStateChange((isAuthenticated, user) => {
            this.updateAuthUI();
            if (isAuthenticated) {
                this.loadUserDashboard(user);
            } else {
                this.showWelcomeSection();
            }
        });
        
        // Subscribe to prediction updates
        fplPredictions.onPredictionsUpdate((predictions) => {
            this.updatePredictionsList(predictions);
        });
        
        // Load initial data if authenticated
        if (fplAuth.isAuthenticated()) {
            this.loadUserDashboard(fplAuth.getCurrentUser());
        }
    }

    /**
     * Wait for dependencies to load
     */
    async waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                if (window.fplAuth && window.fplPredictions) {
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Auth modal
        document.getElementById('authBtn')?.addEventListener('click', () => {
            this.showAuthModal();
        });
        
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Close modal on outside click
        document.getElementById('authModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.hideAuthModal();
            }
        });
        
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchAuthTab(tab.dataset.tab);
            });
        });
        
        // Auth forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('signupForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });
        
        // Prediction type buttons
        document.querySelectorAll('.prediction-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectPredictionType(btn.dataset.type);
            });
        });
        
        // Player search
        const playerSearch = document.getElementById('playerSearch');
        if (playerSearch) {
            playerSearch.addEventListener('input', (e) => {
                this.handlePlayerSearch(e.target.value);
            });
            
            playerSearch.addEventListener('focus', () => {
                if (playerSearch.value) {
                    this.handlePlayerSearch(playerSearch.value);
                }
            });
            
            // Close dropdown on outside click
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.player-selector')) {
                    document.getElementById('playerDropdown')?.classList.remove('active');
                }
            });
        }
        
        // Confidence slider
        const confidenceSlider = document.getElementById('confidenceSlider');
        if (confidenceSlider) {
            confidenceSlider.addEventListener('input', (e) => {
                document.getElementById('confidenceValue').textContent = `${e.target.value}%`;
            });
        }
        
        // Submit prediction
        document.getElementById('submitPrediction')?.addEventListener('click', () => {
            this.handlePredictionSubmit();
        });
        
        // History filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterPredictions(btn.dataset.filter);
            });
        });
    }

    /**
     * Update authentication UI
     */
    updateAuthUI() {
        const isAuthenticated = fplAuth.isAuthenticated();
        const authBtn = document.getElementById('authBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userDisplay = document.getElementById('userDisplay');
        
        if (isAuthenticated) {
            const user = fplAuth.getCurrentUser();
            authBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
            userDisplay.style.display = 'flex';
            
            document.getElementById('username').textContent = user.username;
            document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
        } else {
            authBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            userDisplay.style.display = 'none';
        }
    }

    /**
     * Show auth modal
     */
    showAuthModal() {
        document.getElementById('authModal').classList.add('active');
        this.switchAuthTab('login');
    }

    /**
     * Hide auth modal
     */
    hideAuthModal() {
        document.getElementById('authModal').classList.remove('active');
        this.clearAuthForms();
    }

    /**
     * Switch auth tab
     */
    switchAuthTab(tab) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        
        // Update forms
        document.querySelectorAll('.auth-form').forEach(f => {
            f.classList.toggle('active', f.id === `${tab}Form`);
        });
        
        this.clearAuthForms();
    }

    /**
     * Clear auth forms
     */
    clearAuthForms() {
        document.querySelectorAll('.form-input').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('active');
            error.textContent = '';
        });
    }

    /**
     * Handle login
     */
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Clear errors
        this.clearAuthErrors();
        
        // Validate
        if (!email) {
            this.showAuthError('loginEmailError', 'Email is required');
            return;
        }
        
        if (!password) {
            this.showAuthError('loginPasswordError', 'Password is required');
            return;
        }
        
        // Attempt login
        const result = await fplAuth.login({ email, password });
        
        if (result.success) {
            this.hideAuthModal();
            this.showToast('Login successful!', 'success');
            this.loadUserDashboard(result.user);
        } else {
            this.showAuthError('loginPasswordError', result.message);
        }
    }

    /**
     * Handle signup
     */
    async handleSignup() {
        const username = document.getElementById('signupUsername').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const fplTeamId = document.getElementById('signupFplId').value;
        
        // Clear errors
        this.clearAuthErrors();
        
        // Validate
        if (!username || username.length < 3) {
            this.showAuthError('signupUsernameError', 'Username must be at least 3 characters');
            return;
        }
        
        if (!email) {
            this.showAuthError('signupEmailError', 'Email is required');
            return;
        }
        
        if (!password || password.length < 8) {
            this.showAuthError('signupPasswordError', 'Password must be at least 8 characters');
            return;
        }
        
        // Attempt registration
        const result = await fplAuth.register({
            username,
            email,
            password,
            fplTeamId
        });
        
        if (result.success) {
            this.hideAuthModal();
            this.showToast('Account created successfully!', 'success');
            this.loadUserDashboard(result.user);
        } else {
            this.showAuthError('signupEmailError', result.message);
        }
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        const result = await fplAuth.logout();
        
        if (result.success) {
            this.showToast('Logged out successfully', 'success');
            this.showWelcomeSection();
        }
    }

    /**
     * Show auth error
     */
    showAuthError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('active');
        }
    }

    /**
     * Clear auth errors
     */
    clearAuthErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.classList.remove('active');
            error.textContent = '';
        });
    }

    /**
     * Load user dashboard
     */
    async loadUserDashboard(user) {
        // Show dashboard
        document.getElementById('welcomeSection').style.display = 'none';
        document.getElementById('userDashboard').style.display = 'block';
        
        // Update current gameweek
        const gameweek = await fplPredictions.getCurrentGameweek();
        document.getElementById('currentGameweek').textContent = `Gameweek ${gameweek}`;
        
        // Load user stats
        await this.loadUserStats();
        
        // Load prediction history
        await this.loadPredictionHistory();
        
        // Load leaderboard
        await this.loadLeaderboard();
    }

    /**
     * Show welcome section
     */
    showWelcomeSection() {
        document.getElementById('welcomeSection').style.display = 'block';
        document.getElementById('userDashboard').style.display = 'none';
    }

    /**
     * Load user statistics
     */
    async loadUserStats() {
        const stats = await fplPredictions.getUserPredictionStats();
        
        document.getElementById('statTotalPredictions').textContent = stats.totalPredictions;
        document.getElementById('statSuccessRate').textContent = `${stats.successRate}%`;
        document.getElementById('statTotalPoints').textContent = stats.totalPoints;
        document.getElementById('statCurrentStreak').textContent = stats.currentStreak;
    }

    /**
     * Load prediction history
     */
    async loadPredictionHistory() {
        const history = await fplPredictions.getUserPredictionHistory();
        this.updatePredictionsList(history);
    }

    /**
     * Update predictions list
     */
    updatePredictionsList(predictions) {
        const container = document.getElementById('predictionsList');
        
        // Filter predictions
        const filtered = this.currentFilter === 'all' 
            ? predictions 
            : predictions.filter(p => p.status === this.currentFilter);
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-title">No predictions found</div>
                    <div class="empty-state-text">Make your first prediction to start tracking your success!</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filtered.map(prediction => `
            <div class="prediction-card ${prediction.status}">
                <div class="prediction-header">
                    <div class="prediction-info">
                        <div class="prediction-gw">Gameweek ${prediction.gameweek}</div>
                        <div class="prediction-type">${this.formatPredictionType(prediction.type)}</div>
                        <div class="prediction-details">
                            ${prediction.data.playerName || prediction.data.team || prediction.data.value}
                        </div>
                    </div>
                    <div class="prediction-status ${prediction.status}">
                        ${this.formatStatus(prediction.status)}
                    </div>
                </div>
                <div class="prediction-footer">
                    <span>Confidence: ${prediction.data.confidence}%</span>
                    <span>Points: ${prediction.pointsEarned || 0}</span>
                    <span>${this.formatDate(prediction.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Load leaderboard
     */
    async loadLeaderboard() {
        const leaderboard = await fplPredictions.getLeaderboard();
        const tbody = document.getElementById('leaderboardBody');
        
        tbody.innerHTML = leaderboard.map((entry, index) => `
            <tr class="${entry.isCurrentUser ? 'current-user' : ''}">
                <td>
                    ${index < 3 ? 
                        `<span class="rank-badge ${['gold', 'silver', 'bronze'][index]}">${entry.rank}</span>` :
                        entry.rank
                    }
                </td>
                <td>${entry.username}</td>
                <td>${entry.points}</td>
                <td>${entry.predictions}</td>
                <td>${entry.successRate}%</td>
            </tr>
        `).join('');
    }

    /**
     * Select prediction type
     */
    selectPredictionType(type) {
        this.selectedPredictionType = type;
        
        // Update UI
        document.querySelectorAll('.prediction-type-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.type === type);
        });
        
        // Update player search placeholder
        const playerSearch = document.getElementById('playerSearch');
        if (type === 'clean_sheet') {
            playerSearch.placeholder = 'Search for a team...';
        } else {
            playerSearch.placeholder = 'Search for a player...';
        }
    }

    /**
     * Handle player search
     */
    handlePlayerSearch(query) {
        const dropdown = document.getElementById('playerDropdown');
        
        if (!query || query.length < 2) {
            dropdown.classList.remove('active');
            return;
        }
        
        // Filter players
        const filtered = this.mockPlayers.filter(player => 
            player.name.toLowerCase().includes(query.toLowerCase()) ||
            player.team.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);
        
        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="player-option">No players found</div>';
        } else {
            dropdown.innerHTML = filtered.map(player => `
                <div class="player-option" data-player='${JSON.stringify(player)}'>
                    <div class="player-option-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-team">${player.team} - ${player.position}</div>
                    </div>
                    <div class="player-price">£${player.price}m</div>
                </div>
            `).join('');
            
            // Add click handlers
            dropdown.querySelectorAll('.player-option').forEach(option => {
                option.addEventListener('click', () => {
                    const playerData = JSON.parse(option.dataset.player);
                    this.selectPlayer(playerData);
                });
            });
        }
        
        dropdown.classList.add('active');
    }

    /**
     * Select player
     */
    selectPlayer(player) {
        this.selectedPlayer = player;
        document.getElementById('playerSearch').value = player.name;
        document.getElementById('playerDropdown').classList.remove('active');
    }

    /**
     * Handle prediction submit
     */
    async handlePredictionSubmit() {
        if (!fplAuth.isAuthenticated()) {
            this.showToast('Please login to submit predictions', 'error');
            return;
        }
        
        if (!this.selectedPredictionType) {
            this.showToast('Please select a prediction type', 'error');
            return;
        }
        
        if (!this.selectedPlayer) {
            this.showToast('Please select a player or team', 'error');
            return;
        }
        
        const confidence = document.getElementById('confidenceSlider').value;
        
        const predictionData = {
            type: this.selectedPredictionType,
            playerId: this.selectedPlayer.id,
            playerName: this.selectedPlayer.name,
            team: this.selectedPlayer.team,
            confidence: parseInt(confidence),
            details: {
                position: this.selectedPlayer.position,
                price: this.selectedPlayer.price
            }
        };
        
        const result = await fplPredictions.submitPrediction(predictionData);
        
        if (result.success) {
            this.showToast('Prediction submitted successfully!', 'success');
            
            // Reset form
            this.selectedPredictionType = null;
            this.selectedPlayer = null;
            document.getElementById('playerSearch').value = '';
            document.getElementById('confidenceSlider').value = 50;
            document.getElementById('confidenceValue').textContent = '50%';
            document.querySelectorAll('.prediction-type-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Reload stats and history
            await this.loadUserStats();
            await this.loadPredictionHistory();
        } else {
            this.showToast(result.message, 'error');
        }
    }

    /**
     * Filter predictions
     */
    filterPredictions(filter) {
        this.currentFilter = filter;
        
        // Update UI
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Reload predictions
        this.loadPredictionHistory();
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Format prediction type
     */
    formatPredictionType(type) {
        const types = {
            'captain': 'Captain Pick',
            'triple_captain': 'Triple Captain',
            'top_scorer': 'Top Scorer',
            'clean_sheet': 'Clean Sheet',
            'differential': 'Differential',
            'transfer': 'Transfer Target',
            'points_target': 'Points Target',
            'rank_target': 'Rank Target'
        };
        return types[type] || type;
    }

    /**
     * Format status
     */
    formatStatus(status) {
        const statuses = {
            'pending': 'Pending',
            'success': 'Won',
            'failed': 'Lost'
        };
        return statuses[status] || status;
    }

    /**
     * Format date
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)} mins ago`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)} hours ago`;
        } else if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Generate mock players for demo
     */
    generateMockPlayers() {
        const teams = ['Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man United', 'Tottenham'];
        const positions = ['GKP', 'DEF', 'MID', 'FWD'];
        const players = [
            { id: 1, name: 'Erling Haaland', team: 'Man City', position: 'FWD', price: 14.0 },
            { id: 2, name: 'Mohamed Salah', team: 'Liverpool', position: 'MID', price: 12.5 },
            { id: 3, name: 'Bukayo Saka', team: 'Arsenal', position: 'MID', price: 10.0 },
            { id: 4, name: 'Cole Palmer', team: 'Chelsea', position: 'MID', price: 11.0 },
            { id: 5, name: 'Bruno Fernandes', team: 'Man United', position: 'MID', price: 8.5 },
            { id: 6, name: 'Son Heung-min', team: 'Tottenham', position: 'MID', price: 9.5 },
            { id: 7, name: 'Virgil van Dijk', team: 'Liverpool', position: 'DEF', price: 6.5 },
            { id: 8, name: 'William Saliba', team: 'Arsenal', position: 'DEF', price: 6.0 },
            { id: 9, name: 'Alisson', team: 'Liverpool', position: 'GKP', price: 5.5 },
            { id: 10, name: 'David Raya', team: 'Arsenal', position: 'GKP', price: 5.5 }
        ];
        
        return players;
    }
}

// Initialize the UI controller
document.addEventListener('DOMContentLoaded', () => {
    window.fplAccountUI = new FPLAccountUI();
});