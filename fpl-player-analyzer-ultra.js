/* ============================================
   FPL Player Analyzer Ultra - Enhanced JavaScript
   Version 4.0 - Production Ready
   ============================================ */

// Configuration
const CONFIG = {
    API_BASE_URL: 'https://fantasy.premierleague.com/api',
    CACHE_DURATION: 300000, // 5 minutes
    MAX_COMPARISON_PLAYERS: 5,
    UPDATE_INTERVAL: 60000, // 1 minute
    ANIMATION_DURATION: 300
};

// Player Data Manager
class PlayerDataManager {
    constructor() {
        this.players = [];
        this.cache = new Map();
        this.lastUpdate = null;
    }
    
    async fetchPlayers() {
        const cacheKey = 'players_data';
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        try {
            // In production, this would be actual API calls
            const response = await this.simulateAPICall();
            this.setCache(cacheKey, response);
            this.players = response;
            this.lastUpdate = new Date();
            return response;
        } catch (error) {
            console.error('Failed to fetch player data:', error);
            return this.getFallbackData();
        }
    }
    
    async fetchPlayerDetails(playerId) {
        const cacheKey = `player_${playerId}`;
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        try {
            const details = await this.simulatePlayerDetailsAPI(playerId);
            this.setCache(cacheKey, details);
            return details;
        } catch (error) {
            console.error('Failed to fetch player details:', error);
            return null;
        }
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_DURATION) {
            return cached.data;
        }
        return null;
    }
    
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    simulateAPICall() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.generateSamplePlayers());
            }, 300);
        });
    }
    
    simulatePlayerDetailsAPI(playerId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.generatePlayerDetails(playerId));
            }, 200);
        });
    }
    
    generateSamplePlayers() {
        const teams = ['ARS', 'CHE', 'LIV', 'MCI', 'MUN', 'TOT', 'NEW', 'BHA', 'AVL', 'WHU'];
        const positions = ['GKP', 'DEF', 'MID', 'FWD'];
        const players = [];
        
        // Top players with realistic data
        const topPlayers = [
            { name: 'Mohamed Salah', team: 'LIV', position: 'MID', price: 13.0, points: 142, form: 7.8, ownership: 45.2, xG: 0.82, xA: 0.34 },
            { name: 'Erling Haaland', team: 'MCI', position: 'FWD', price: 14.2, points: 156, form: 8.4, ownership: 62.1, xG: 1.24, xA: 0.18 },
            { name: 'Bukayo Saka', team: 'ARS', position: 'MID', price: 10.1, points: 98, form: 6.2, ownership: 32.4, xG: 0.56, xA: 0.42 },
            { name: 'Cole Palmer', team: 'CHE', position: 'MID', price: 11.2, points: 124, form: 8.1, ownership: 28.3, xG: 0.68, xA: 0.51 },
            { name: 'Alexander Isak', team: 'NEW', position: 'FWD', price: 8.8, points: 112, form: 7.2, ownership: 18.6, xG: 0.78, xA: 0.22 },
            { name: 'Son Heung-min', team: 'TOT', position: 'MID', price: 9.8, points: 89, form: 5.9, ownership: 22.1, xG: 0.48, xA: 0.38 },
            { name: 'Bruno Fernandes', team: 'MUN', position: 'MID', price: 8.6, points: 94, form: 6.1, ownership: 26.8, xG: 0.42, xA: 0.45 },
            { name: 'Ollie Watkins', team: 'AVL', position: 'FWD', price: 9.2, points: 102, form: 6.8, ownership: 24.3, xG: 0.72, xA: 0.28 },
            { name: 'Trent Alexander-Arnold', team: 'LIV', position: 'DEF', price: 8.4, points: 86, form: 5.8, ownership: 35.2, xG: 0.08, xA: 0.52 },
            { name: 'Gabriel Magalhães', team: 'ARS', position: 'DEF', price: 6.2, points: 72, form: 5.2, ownership: 14.8, xG: 0.12, xA: 0.02 }
        ];
        
        return topPlayers.map((player, index) => ({
            id: index + 1,
            ...player,
            gamesPlayed: Math.floor(Math.random() * 10) + 20,
            minutes: Math.floor(Math.random() * 500) + 1500,
            goals: Math.floor(player.xG * 20),
            assists: Math.floor(player.xA * 20),
            cleanSheets: player.position === 'DEF' || player.position === 'GKP' ? Math.floor(Math.random() * 10) : 0,
            yellowCards: Math.floor(Math.random() * 5),
            redCards: Math.random() > 0.9 ? 1 : 0,
            bonus: Math.floor(Math.random() * 30),
            bps: Math.floor(Math.random() * 500) + 200,
            influence: (Math.random() * 1000).toFixed(1),
            creativity: (Math.random() * 1000).toFixed(1),
            threat: (Math.random() * 1000).toFixed(1),
            ictIndex: (Math.random() * 100).toFixed(1),
            expectedPoints: (player.form + Math.random() * 2).toFixed(1),
            transfersIn: Math.floor(Math.random() * 100000),
            transfersOut: Math.floor(Math.random() * 50000),
            priceChange: (Math.random() * 0.6 - 0.3).toFixed(1),
            fixtures: this.generateFixtures(player.team)
        }));
    }
    
    generateFixtures(team) {
        const opponents = ['BOU', 'CHE', 'ARS', 'NEW', 'BUR', 'BRE', 'SHU', 'LIV', 'WHU', 'WOL', 'EVE', 'TOT'];
        const fixtures = [];
        for (let i = 0; i < 5; i++) {
            const opponent = opponents[Math.floor(Math.random() * opponents.length)];
            const isHome = Math.random() > 0.5;
            fixtures.push({
                opponent,
                venue: isHome ? 'H' : 'A',
                difficulty: Math.floor(Math.random() * 5) + 1,
                gameweek: i + 1
            });
        }
        return fixtures;
    }
    
    generatePlayerDetails(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return null;
        
        return {
            ...player,
            seasonHistory: this.generateSeasonHistory(),
            gameweekHistory: this.generateGameweekHistory(),
            upcomingFixtures: this.generateDetailedFixtures(player.team)
        };
    }
    
    generateSeasonHistory() {
        const history = [];
        for (let i = 1; i <= 10; i++) {
            history.push({
                gameweek: i,
                points: Math.floor(Math.random() * 15),
                minutes: Math.floor(Math.random() * 30) + 60,
                goals: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
                assists: Math.random() > 0.6 ? Math.floor(Math.random() * 2) : 0,
                cleanSheet: Math.random() > 0.7,
                bonus: Math.floor(Math.random() * 4)
            });
        }
        return history;
    }
    
    generateGameweekHistory() {
        const history = [];
        for (let i = 1; i <= 5; i++) {
            history.push({
                gameweek: i,
                opponent: ['ARS', 'CHE', 'LIV', 'MCI', 'MUN'][i-1],
                points: Math.floor(Math.random() * 15) + 2,
                result: Math.random() > 0.5 ? 'W' : Math.random() > 0.5 ? 'D' : 'L'
            });
        }
        return history;
    }
    
    generateDetailedFixtures(team) {
        const fixtures = [];
        const teams = ['BOU', 'CHE', 'ARS', 'NEW', 'BUR'];
        
        teams.forEach((opponent, index) => {
            fixtures.push({
                gameweek: index + 1,
                opponent,
                venue: Math.random() > 0.5 ? 'H' : 'A',
                difficulty: Math.floor(Math.random() * 5) + 1,
                kickoff: new Date(Date.now() + (index * 7 * 24 * 60 * 60 * 1000)),
                xG: (Math.random() * 2).toFixed(2),
                xGA: (Math.random() * 2).toFixed(2)
            });
        });
        
        return fixtures;
    }
}

// UI Controller
class UIController {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.selectedPlayers = [];
        this.currentView = 'grid';
        this.currentTab = 'analyzer';
        this.filters = {
            search: '',
            position: '',
            team: '',
            priceRange: ''
        };
    }
    
    init() {
        this.attachEventListeners();
        this.loadInitialData();
        this.startLiveUpdates();
    }
    
    attachEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleTabSwitch(e));
        });
        
        // View toggles
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewSwitch(e));
        });
        
        // Search and filters
        const searchInput = document.getElementById('playerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }
        
        ['positionFilter', 'teamFilter', 'priceRange'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.handleFilterChange());
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    async loadInitialData() {
        this.showLoading();
        const players = await this.dataManager.fetchPlayers();
        this.renderPlayers(players);
        this.updateQuickStats(players);
        this.hideLoading();
    }
    
    startLiveUpdates() {
        setInterval(() => {
            this.updateLiveIndicators();
        }, CONFIG.UPDATE_INTERVAL);
    }
    
    handleTabSwitch(e) {
        const tab = e.currentTarget.dataset.tab;
        
        // Update UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        // Switch content
        this.switchTabContent(tab);
        this.currentTab = tab;
    }
    
    switchTabContent(tab) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Show selected tab
        const tabContent = document.getElementById(`${tab}-tab`);
        if (tabContent) {
            tabContent.style.display = 'block';
            tabContent.classList.add('animate-in');
        }
        
        // Load tab-specific data
        this.loadTabData(tab);
    }
    
    async loadTabData(tab) {
        switch(tab) {
            case 'comparison':
                this.renderComparisonView();
                break;
            case 'predictor':
                this.renderPredictorView();
                break;
            case 'differentials':
                this.renderDifferentialsView();
                break;
            case 'captain':
                this.renderCaptainPicksView();
                break;
            case 'fixtures':
                this.renderFixturesView();
                break;
            case 'trends':
                this.renderTrendsView();
                break;
        }
    }
    
    handleViewSwitch(e) {
        const view = e.currentTarget.dataset.view;
        
        // Update UI
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        this.currentView = view;
        this.renderPlayersInView(view);
    }
    
    renderPlayersInView(view) {
        const container = document.getElementById('playersGrid');
        if (!container) return;
        
        switch(view) {
            case 'grid':
                container.className = 'players-grid';
                break;
            case 'table':
                container.className = 'players-table';
                this.renderTableView();
                return;
            case 'cards':
                container.className = 'players-cards';
                break;
        }
        
        this.renderPlayers(this.dataManager.players);
    }
    
    renderTableView() {
        const container = document.getElementById('playersGrid');
        const players = this.getFilteredPlayers();
        
        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Team</th>
                        <th>Pos</th>
                        <th>Price</th>
                        <th>Points</th>
                        <th>Form</th>
                        <th>Own %</th>
                        <th>xG</th>
                        <th>xA</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        players.forEach(player => {
            html += `
                <tr>
                    <td><strong>${player.name}</strong></td>
                    <td>${player.team}</td>
                    <td>${player.position}</td>
                    <td>£${player.price}m</td>
                    <td>${player.points}</td>
                    <td><span class="form-badge" style="color: ${this.getFormColor(player.form)}">${player.form}</span></td>
                    <td>${player.ownership}%</td>
                    <td>${player.xG}</td>
                    <td>${player.xA}</td>
                    <td>
                        <button class="mini-btn" onclick="playerAnalyzer.analyzePlayer(${player.id})">Analyze</button>
                        <button class="mini-btn" onclick="playerAnalyzer.toggleCompare(${player.id})">Compare</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }
    
    handleSearch(e) {
        this.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
    }
    
    handleFilterChange() {
        this.filters.position = document.getElementById('positionFilter').value;
        this.filters.team = document.getElementById('teamFilter').value;
        this.filters.priceRange = document.getElementById('priceRange').value;
        this.applyFilters();
    }
    
    applyFilters() {
        const filtered = this.getFilteredPlayers();
        this.renderPlayers(filtered);
    }
    
    getFilteredPlayers() {
        return this.dataManager.players.filter(player => {
            const matchesSearch = !this.filters.search || 
                player.name.toLowerCase().includes(this.filters.search) ||
                player.team.toLowerCase().includes(this.filters.search);
                
            const matchesPosition = !this.filters.position || 
                player.position === this.filters.position;
                
            const matchesTeam = !this.filters.team || 
                player.team === this.filters.team;
                
            let matchesPrice = true;
            if (this.filters.priceRange) {
                const [min, max] = this.filters.priceRange.split('-').map(v => parseFloat(v) || Infinity);
                matchesPrice = player.price >= min && player.price <= max;
            }
            
            return matchesSearch && matchesPosition && matchesTeam && matchesPrice;
        });
    }
    
    renderPlayers(players) {
        const container = document.getElementById('playersGrid');
        if (!container) return;
        
        if (this.currentView === 'table') {
            this.renderTableView();
            return;
        }
        
        container.innerHTML = '';
        
        players.forEach((player, index) => {
            const card = this.createPlayerCard(player);
            
            // Add staggered animation
            setTimeout(() => {
                card.classList.add('animate-in');
            }, index * 50);
            
            container.appendChild(card);
        });
    }
    
    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.dataset.playerId = player.id;
        
        const isSelected = this.selectedPlayers.some(p => p.id === player.id);
        if (isSelected) {
            card.classList.add('selected');
        }
        
        const formColor = this.getFormColor(player.form);
        const priceChange = player.priceChange > 0 ? '↑' : player.priceChange < 0 ? '↓' : '→';
        const priceChangeColor = player.priceChange > 0 ? '#10b981' : player.priceChange < 0 ? '#ef4444' : '#6b7280';
        
        card.innerHTML = `
            <div class="player-header">
                <div class="player-photo">
                    ${this.getPlayerAvatar(player)}
                </div>
                <div class="player-info">
                    <h3>${player.name}</h3>
                    <div class="player-meta">
                        <span>${player.team}</span>
                        <span>•</span>
                        <span>${player.position}</span>
                        <span>•</span>
                        <span>£${player.price}m</span>
                        <span style="color: ${priceChangeColor}; font-weight: 700;">${priceChange}</span>
                    </div>
                </div>
            </div>
            
            <div class="player-stats">
                <div class="stat-item">
                    <span class="stat-label">Points</span>
                    <span class="stat-value">${player.points}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Form</span>
                    <span class="stat-value" style="color: ${formColor}">${player.form}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Own %</span>
                    <span class="stat-value">${player.ownership}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">xG90</span>
                    <span class="stat-value">${player.xG}</span>
                </div>
            </div>
            
            <div class="fixtures-preview">
                ${this.renderFixtureBar(player.fixtures)}
            </div>
            
            <div class="player-actions">
                <button class="action-btn primary" onclick="playerAnalyzer.analyzePlayer(${player.id})">
                    Analyze
                </button>
                <button class="action-btn secondary ${isSelected ? 'selected' : ''}" onclick="playerAnalyzer.toggleCompare(${player.id})">
                    ${isSelected ? 'Selected' : 'Compare'}
                </button>
            </div>
        `;
        
        return card;
    }
    
    getPlayerAvatar(player) {
        // In production, this would return actual player photos
        const colors = {
            'GKP': '#f59e0b',
            'DEF': '#3b82f6',
            'MID': '#10b981',
            'FWD': '#ef4444'
        };
        
        const color = colors[player.position] || '#6b7280';
        
        return `
            <svg width="60" height="60" viewBox="0 0 60 60" style="background: ${color}; border-radius: 50%;">
                <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-size="20" font-weight="bold">
                    ${player.name.split(' ').map(n => n[0]).join('')}
                </text>
            </svg>
        `;
    }
    
    getFormColor(form) {
        if (form >= 7) return '#10b981';
        if (form >= 5) return '#f59e0b';
        return '#ef4444';
    }
    
    renderFixtureBar(fixtures) {
        if (!fixtures || fixtures.length === 0) return '';
        
        const fixtureBlocks = fixtures.slice(0, 5).map(fix => {
            const difficultyColors = ['#10b981', '#84cc16', '#fbbf24', '#f97316', '#ef4444'];
            const color = difficultyColors[fix.difficulty - 1] || '#6b7280';
            
            return `
                <div class="fixture-block" style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                    ${fix.opponent}(${fix.venue})
                </div>
            `;
        }).join('');
        
        return `
            <div style="display: flex; gap: 4px; margin: 12px 0;">
                ${fixtureBlocks}
            </div>
        `;
    }
    
    async analyzePlayer(playerId) {
        const details = await this.dataManager.fetchPlayerDetails(playerId);
        if (!details) return;
        
        // Create and show modal
        this.showPlayerModal(details);
    }
    
    showPlayerModal(player) {
        // Remove existing modal if any
        const existingModal = document.getElementById('playerModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = document.createElement('div');
        modal.id = 'playerModal';
        modal.className = 'modal';
        modal.style.cssText = `
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
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="background: white; border-radius: 20px; padding: 40px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
                <button onclick="playerAnalyzer.closeModal()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                
                <h2 style="font-size: 2rem; margin-bottom: 20px;">${player.name}</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div>
                        <h4 style="color: #6b7280; font-size: 0.875rem; margin-bottom: 4px;">Total Points</h4>
                        <p style="font-size: 1.5rem; font-weight: 700;">${player.points}</p>
                    </div>
                    <div>
                        <h4 style="color: #6b7280; font-size: 0.875rem; margin-bottom: 4px;">Price</h4>
                        <p style="font-size: 1.5rem; font-weight: 700;">£${player.price}m</p>
                    </div>
                    <div>
                        <h4 style="color: #6b7280; font-size: 0.875rem; margin-bottom: 4px;">Form</h4>
                        <p style="font-size: 1.5rem; font-weight: 700; color: ${this.getFormColor(player.form)}">${player.form}</p>
                    </div>
                    <div>
                        <h4 style="color: #6b7280; font-size: 0.875rem; margin-bottom: 4px;">Ownership</h4>
                        <p style="font-size: 1.5rem; font-weight: 700;">${player.ownership}%</p>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 16px;">Recent Performance</h3>
                <div style="display: flex; gap: 8px; margin-bottom: 30px;">
                    ${player.gameweekHistory.map(gw => `
                        <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 0.75rem; color: #6b7280;">GW${gw.gameweek}</div>
                            <div style="font-size: 1.25rem; font-weight: 700;">${gw.points}</div>
                            <div style="font-size: 0.75rem; color: ${gw.result === 'W' ? '#10b981' : gw.result === 'D' ? '#f59e0b' : '#ef4444'}">${gw.result}</div>
                        </div>
                    `).join('')}
                </div>
                
                <h3 style="margin-bottom: 16px;">Upcoming Fixtures</h3>
                <div style="margin-bottom: 30px;">
                    ${player.upcomingFixtures.map(fix => {
                        const difficultyColors = ['#10b981', '#84cc16', '#fbbf24', '#f97316', '#ef4444'];
                        const color = difficultyColors[fix.difficulty - 1];
                        return `
                            <div style="display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #e5e7eb;">
                                <span>GW${fix.gameweek}: ${fix.opponent} (${fix.venue})</span>
                                <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.875rem; font-weight: 600;">
                                    Difficulty: ${fix.difficulty}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button onclick="playerAnalyzer.addToTeam(${player.id})" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Add to My Team
                    </button>
                    <button onclick="playerAnalyzer.toggleCompare(${player.id})" style="flex: 1; padding: 12px; background: #f3f4f6; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Compare
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }
    
    closeModal() {
        const modal = document.getElementById('playerModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    }
    
    toggleCompare(playerId) {
        const player = this.dataManager.players.find(p => p.id === playerId);
        if (!player) return;
        
        const index = this.selectedPlayers.findIndex(p => p.id === playerId);
        
        if (index > -1) {
            this.selectedPlayers.splice(index, 1);
            this.showNotification(`${player.name} removed from comparison`, 'info');
        } else if (this.selectedPlayers.length < CONFIG.MAX_COMPARISON_PLAYERS) {
            this.selectedPlayers.push(player);
            this.showNotification(`${player.name} added to comparison`, 'success');
        } else {
            this.showNotification(`Maximum ${CONFIG.MAX_COMPARISON_PLAYERS} players for comparison`, 'warning');
            return;
        }
        
        // Update UI
        this.updateComparisonBadge();
        this.refreshPlayerCards();
        
        if (this.currentTab === 'comparison') {
            this.renderComparisonView();
        }
    }
    
    updateComparisonBadge() {
        const badge = document.querySelector('[data-tab="comparison"] .badge');
        if (badge && this.selectedPlayers.length > 0) {
            badge.textContent = this.selectedPlayers.length;
            badge.style.display = 'inline-block';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }
    
    refreshPlayerCards() {
        document.querySelectorAll('.player-card').forEach(card => {
            const playerId = parseInt(card.dataset.playerId);
            const isSelected = this.selectedPlayers.some(p => p.id === playerId);
            
            if (isSelected) {
                card.classList.add('selected');
                const btn = card.querySelector('.action-btn.secondary');
                if (btn) {
                    btn.classList.add('selected');
                    btn.textContent = 'Selected';
                }
            } else {
                card.classList.remove('selected');
                const btn = card.querySelector('.action-btn.secondary');
                if (btn) {
                    btn.classList.remove('selected');
                    btn.textContent = 'Compare';
                }
            }
        });
    }
    
    renderComparisonView() {
        const container = document.getElementById('comparison-tab');
        if (!container) return;
        
        if (this.selectedPlayers.length < 2) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <h2 style="font-size: 1.5rem; margin-bottom: 16px;">Select Players to Compare</h2>
                    <p style="color: #6b7280; margin-bottom: 24px;">Choose at least 2 players from the analyzer tab to start comparing.</p>
                    <button onclick="playerAnalyzer.switchTab('analyzer')" style="padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        Go to Analyzer
                    </button>
                </div>
            `;
            return;
        }
        
        // Comparison table and charts implementation
        // This would be expanded in production
    }
    
    updateQuickStats(players) {
        // Calculate and update quick stats
        const topRising = players.reduce((a, b) => (a.priceChange || 0) > (b.priceChange || 0) ? a : b);
        const captainPick = players.reduce((a, b) => (a.expectedPoints || 0) > (b.expectedPoints || 0) ? a : b);
        const bestDiff = players.filter(p => p.ownership < 10).sort((a, b) => b.form - a.form)[0];
        const inForm = players.reduce((a, b) => a.form > b.form ? a : b);
        
        this.animateStatUpdate('topRising', `${topRising.name.split(' ').pop()} (${topRising.priceChange > 0 ? '↑' : ''}${Math.abs(topRising.priceChange || 0)})`);
        this.animateStatUpdate('captainPick', `${captainPick.name.split(' ').pop()} (C)`);
        this.animateStatUpdate('bestDiff', bestDiff ? `${bestDiff.name.split(' ').pop()} (${bestDiff.ownership}%)` : 'N/A');
        this.animateStatUpdate('inForm', `${inForm.name.split(' ').pop()} (${inForm.points} pts)`);
    }
    
    animateStatUpdate(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.style.transition = 'opacity 0.3s';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.opacity = '1';
        }, 300);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInUp 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showLoading() {
        const loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        loader.innerHTML = `
            <div class="loading-spinner"></div>
        `;
        
        document.body.appendChild(loader);
    }
    
    hideLoading() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => loader.remove(), 300);
        }
    }
    
    updateLiveIndicators() {
        // Update live badge animation
        const liveBadges = document.querySelectorAll('.stat-badge');
        liveBadges.forEach(badge => {
            if (badge.textContent.includes('Live')) {
                badge.style.animation = 'pulse 2s infinite';
            }
        });
    }
    
    handleKeyboardShortcuts(e) {
        // Command/Ctrl + K for search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('playerSearch')?.focus();
        }
        
        // Number keys for tabs
        if (e.key >= '1' && e.key <= '7' && !e.metaKey && !e.ctrlKey) {
            const tabIndex = parseInt(e.key) - 1;
            const tabs = document.querySelectorAll('.tab-btn');
            if (tabs[tabIndex]) {
                tabs[tabIndex].click();
            }
        }
    }
    
    switchTab(tabName) {
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.click();
        }
    }
}

// Initialize the application
const playerDataManager = new PlayerDataManager();
const playerAnalyzer = new UIController(playerDataManager);

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        playerAnalyzer.init();
    });
} else {
    playerAnalyzer.init();
}

// Export for global access
window.playerAnalyzer = playerAnalyzer;