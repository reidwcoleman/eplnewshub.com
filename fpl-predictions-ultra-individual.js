/**
 * FPL Ultra Individual Predictions UI
 * Each prediction type has its own submit button and can be submitted multiple times
 */

class FPLUltraIndividualPredictionsUI {
    constructor() {
        this.currentGameweek = 1;
        this.submittedPredictions = [];
        this.predictionCounter = {};
        
        this.init();
    }

    /**
     * Initialize the individual predictions UI
     */
    async init() {
        // Wait for dependencies
        await this.waitForDependencies();
        
        // Get current gameweek
        this.currentGameweek = await fplUltraPredictions.getCurrentGameweek();
        
        // Create the main UI
        this.createMainUI();
        
        // Load existing predictions
        await this.loadUserPredictions();
        
        // Set up event listeners
        this.attachGlobalListeners();
        
        // Subscribe to auth changes
        if (window.fplAuth) {
            fplAuth.onAuthStateChange((isAuthenticated) => {
                if (isAuthenticated) {
                    this.showPredictionCards();
                    this.loadUserPredictions();
                } else {
                    this.showLoginPrompt();
                }
            });
        }
    }

    /**
     * Wait for dependencies
     */
    async waitForDependencies() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.fplUltraPredictions && window.fplAuth) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    /**
     * Create the main UI structure
     */
    createMainUI() {
        const container = document.createElement('div');
        container.id = 'ultra-individual-predictions';
        container.innerHTML = `
            <style>
                #ultra-individual-predictions {
                    max-width: 1600px;
                    margin: 0 auto;
                    padding: 2rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                }
                
                .predictions-hero {
                    background: linear-gradient(135deg, #37003c 0%, #00ff85 100%);
                    color: white;
                    padding: 3rem;
                    border-radius: 24px;
                    margin-bottom: 3rem;
                    position: relative;
                    overflow: hidden;
                }
                
                .predictions-hero::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    right: -10%;
                    width: 60%;
                    height: 200%;
                    background: rgba(255,255,255,0.05);
                    transform: rotate(35deg);
                }
                
                .hero-content {
                    position: relative;
                    z-index: 1;
                }
                
                .hero-title {
                    font-size: 3rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    text-shadow: 0 2px 10px rgba(0,0,0,0.2);
                }
                
                .hero-subtitle {
                    font-size: 1.25rem;
                    opacity: 0.95;
                    margin-bottom: 2rem;
                }
                
                .stats-bar {
                    display: flex;
                    gap: 2rem;
                    background: rgba(255,255,255,0.1);
                    padding: 1.5rem;
                    border-radius: 16px;
                    backdrop-filter: blur(10px);
                }
                
                .stat-block {
                    flex: 1;
                    text-align: center;
                }
                
                .stat-number {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #00ff85;
                    text-shadow: 0 0 20px rgba(0,255,133,0.5);
                }
                
                .stat-label {
                    font-size: 0.875rem;
                    opacity: 0.9;
                    margin-top: 0.25rem;
                }
                
                .prediction-types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
                    gap: 2rem;
                    margin: 3rem 0;
                }
                
                .prediction-type-card {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                
                .prediction-type-card:hover {
                    transform: translateY(-5px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                }
                
                .card-header {
                    background: linear-gradient(135deg, #37003c 0%, #4a0050 100%);
                    color: white;
                    padding: 1.5rem;
                    position: relative;
                }
                
                .card-icon {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .card-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-bottom: 0.25rem;
                }
                
                .card-description {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }
                
                .points-indicator {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: #00ff85;
                    color: #37003c;
                    padding: 0.5rem 1rem;
                    border-radius: 30px;
                    font-weight: bold;
                    font-size: 1.125rem;
                }
                
                .card-body {
                    padding: 1.5rem;
                }
                
                .quick-select-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }
                
                .quick-select-btn {
                    padding: 0.5rem 1rem;
                    background: #f0f0f0;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }
                
                .quick-select-btn:hover {
                    background: #37003c;
                    color: white;
                    transform: scale(1.05);
                }
                
                .input-group {
                    margin-bottom: 1.5rem;
                }
                
                .input-label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #333;
                }
                
                .player-search-input {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.3s;
                    background: white;
                }
                
                .player-search-input:focus {
                    outline: none;
                    border-color: #37003c;
                    box-shadow: 0 0 0 4px rgba(55,0,60,0.1);
                }
                
                .player-suggestions {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: white;
                    border: 2px solid #37003c;
                    border-radius: 12px;
                    margin-top: 0.5rem;
                    max-height: 250px;
                    overflow-y: auto;
                    z-index: 100;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                
                .suggestion-item {
                    padding: 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    transition: background 0.2s;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .suggestion-item:hover {
                    background: #f8f8f8;
                }
                
                .suggestion-item:last-child {
                    border-bottom: none;
                }
                
                .suggestion-name {
                    font-weight: 600;
                    color: #37003c;
                }
                
                .suggestion-info {
                    font-size: 0.875rem;
                    color: #666;
                }
                
                .suggestion-price {
                    font-weight: bold;
                    color: #00ff85;
                    background: #37003c;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                }
                
                .selected-player-display {
                    background: linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%);
                    border: 2px solid #00ff85;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .selected-player-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .selected-player-name {
                    font-weight: bold;
                    color: #37003c;
                    font-size: 1.125rem;
                }
                
                .selected-player-details {
                    color: #666;
                    font-size: 0.875rem;
                }
                
                .remove-player-btn {
                    background: #e90052;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .remove-player-btn:hover {
                    background: #c7003f;
                    transform: scale(1.05);
                }
                
                .confidence-container {
                    margin-bottom: 1.5rem;
                }
                
                .confidence-display {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .confidence-value {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #37003c;
                }
                
                .confidence-slider {
                    width: 100%;
                    height: 10px;
                    -webkit-appearance: none;
                    border-radius: 10px;
                    background: linear-gradient(to right,
                        #e90052 0%,
                        #fdb913 50%,
                        #00ff85 100%);
                    outline: none;
                }
                
                .confidence-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    border: 3px solid #37003c;
                }
                
                .stake-container {
                    margin-bottom: 1.5rem;
                }
                
                .stake-options {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.75rem;
                }
                
                .stake-option {
                    padding: 0.75rem;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    font-weight: 600;
                }
                
                .stake-option:hover {
                    border-color: #37003c;
                    transform: scale(1.05);
                }
                
                .stake-option.selected {
                    background: #37003c;
                    color: white;
                    border-color: #37003c;
                }
                
                .potential-points {
                    background: linear-gradient(135deg, #fdb913 0%, #ffed4e 100%);
                    padding: 1rem;
                    border-radius: 12px;
                    text-align: center;
                    margin-bottom: 1.5rem;
                }
                
                .potential-label {
                    font-size: 0.875rem;
                    color: #333;
                    margin-bottom: 0.25rem;
                }
                
                .potential-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #37003c;
                }
                
                .submit-prediction-btn {
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #00ff85 0%, #00d968 100%);
                    color: #37003c;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.125rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    position: relative;
                    overflow: hidden;
                }
                
                .submit-prediction-btn:before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.5);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }
                
                .submit-prediction-btn:hover:before {
                    width: 300px;
                    height: 300px;
                }
                
                .submit-prediction-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0,255,133,0.3);
                }
                
                .submit-prediction-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .submission-count {
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: #e90052;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1rem;
                    box-shadow: 0 2px 8px rgba(233,0,82,0.3);
                }
                
                .submitted-list {
                    background: white;
                    border-radius: 20px;
                    padding: 2rem;
                    margin: 3rem 0;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                
                .submitted-title {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #37003c;
                    margin-bottom: 1.5rem;
                }
                
                .submitted-items {
                    display: grid;
                    gap: 1rem;
                }
                
                .submitted-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    background: #f8f8f8;
                    border-radius: 12px;
                    border-left: 4px solid #00ff85;
                    transition: all 0.2s;
                }
                
                .submitted-item:hover {
                    transform: translateX(5px);
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }
                
                .submitted-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .submitted-type {
                    font-weight: bold;
                    color: #37003c;
                    font-size: 1.125rem;
                }
                
                .submitted-player {
                    color: #666;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }
                
                .submitted-points {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .points-pill {
                    background: #fdb913;
                    color: #000;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: bold;
                }
                
                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #00ff85;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                .login-prompt {
                    background: white;
                    border-radius: 20px;
                    padding: 3rem;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    margin: 3rem 0;
                }
                
                .login-prompt h2 {
                    font-size: 2rem;
                    color: #37003c;
                    margin-bottom: 1rem;
                }
                
                .login-prompt p {
                    color: #666;
                    margin-bottom: 2rem;
                }
                
                .login-btn {
                    padding: 1rem 3rem;
                    background: #37003c;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.125rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .login-btn:hover {
                    background: #4a0050;
                    transform: scale(1.05);
                }
                
                @media (max-width: 768px) {
                    .prediction-types-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .stake-options {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .hero-title {
                        font-size: 2rem;
                    }
                }
            </style>
            
            <div class="predictions-hero">
                <div class="hero-content">
                    <h1 class="hero-title">FPL Predictions Center</h1>
                    <p class="hero-subtitle">Submit individual predictions for Gameweek ${this.currentGameweek}</p>
                    <div class="stats-bar">
                        <div class="stat-block">
                            <div class="stat-number" id="total-predictions">0</div>
                            <div class="stat-label">Predictions Made</div>
                        </div>
                        <div class="stat-block">
                            <div class="stat-number" id="potential-points">0</div>
                            <div class="stat-label">Potential Points</div>
                        </div>
                        <div class="stat-block">
                            <div class="stat-number" id="slots-remaining">20</div>
                            <div class="stat-label">Slots Remaining</div>
                        </div>
                        <div class="stat-block">
                            <div class="stat-number" id="success-rate">0%</div>
                            <div class="stat-label">Success Rate</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="predictions-content"></div>
            
            <div class="submitted-list" id="submitted-list" style="display: none;">
                <h2 class="submitted-title">Your Active Predictions</h2>
                <div class="submitted-items" id="submitted-items"></div>
            </div>
        `;
        
        // Add to page
        const targetElement = document.getElementById('userDashboard') || document.body;
        targetElement.appendChild(container);
        
        // Show appropriate content based on auth status
        if (fplAuth.isAuthenticated()) {
            this.showPredictionCards();
        } else {
            this.showLoginPrompt();
        }
    }

    /**
     * Show prediction cards for authenticated users
     */
    showPredictionCards() {
        const content = document.getElementById('predictions-content');
        if (!content) return;
        
        const predictionTypes = [
            { id: 'captain', title: 'Captain Pick', icon: '👑', basePoints: 50, description: 'Select your captain for massive points', popular: ['Haaland', 'Salah', 'Palmer'] },
            { id: 'triple_captain', title: 'Triple Captain', icon: '⭐', basePoints: 100, description: 'Triple captain chip prediction', popular: ['Haaland', 'Salah'] },
            { id: 'top_scorer', title: 'Top Scorer', icon: '⚽', basePoints: 75, description: 'Who will score the most goals?', popular: ['Haaland', 'Watkins', 'Isak'] },
            { id: 'clean_sheet', title: 'Clean Sheet', icon: '🛡️', basePoints: 30, description: 'Predict a team to keep a clean sheet', popular: ['Arsenal', 'Liverpool', 'Man City'] },
            { id: 'differential', title: 'Differential Pick', icon: '💎', basePoints: 60, description: 'Low ownership, high reward player', popular: ['Gordon', 'Bowen', 'Solanke'] },
            { id: 'hat_trick', title: 'Hat Trick Hero', icon: '🎩', basePoints: 150, description: 'Predict a hat-trick scorer', popular: ['Haaland', 'Salah', 'Son'] },
            { id: 'assist_king', title: 'Assist Master', icon: '👐', basePoints: 65, description: 'Most assists this gameweek', popular: ['De Bruyne', 'Palmer', 'Saka'] },
            { id: 'transfer_in', title: 'Transfer Target', icon: '📈', basePoints: 35, description: 'Best player to transfer in', popular: ['Palmer', 'Gordon', 'Mbeumo'] },
            { id: 'transfer_out', title: 'Sell Now', icon: '📉', basePoints: 35, description: 'Player to transfer out immediately', popular: ['Injured', 'Suspended', 'Out of form'] },
            { id: 'red_card', title: 'Red Card Risk', icon: '🔴', basePoints: 80, description: 'Player likely to see red', popular: ['Romero', 'Casemiro', 'Guimarães'] },
            { id: 'penalty_save', title: 'Penalty Save', icon: '🧤', basePoints: 120, description: 'Goalkeeper to save a penalty', popular: ['Alisson', 'Raya', 'Martinez'] },
            { id: 'bench_boost', title: 'Bench Boost Week', icon: '🔄', basePoints: 40, description: 'Best week for bench boost chip', popular: ['DGW', 'Easy fixtures'] }
        ];
        
        const grid = document.createElement('div');
        grid.className = 'prediction-types-grid';
        
        predictionTypes.forEach(type => {
            grid.appendChild(this.createPredictionCard(type));
        });
        
        content.innerHTML = '';
        content.appendChild(grid);
    }

    /**
     * Create an individual prediction card
     */
    createPredictionCard(type) {
        const card = document.createElement('div');
        card.className = 'prediction-type-card';
        card.dataset.typeId = type.id;
        
        // Get submission count for this type
        const count = this.predictionCounter[type.id] || 0;
        
        card.innerHTML = `
            ${count > 0 ? `<div class="submission-count">${count}</div>` : ''}
            <div class="card-header">
                <div class="card-icon">${type.icon}</div>
                <div class="card-title">${type.title}</div>
                <div class="card-description">${type.description}</div>
                <div class="points-indicator">+${type.basePoints}</div>
            </div>
            <div class="card-body">
                <div class="quick-select-buttons">
                    ${type.popular.map(item => 
                        `<button class="quick-select-btn" data-name="${item}">${item}</button>`
                    ).join('')}
                </div>
                
                <div class="input-group" style="position: relative;">
                    <label class="input-label">Select Player/Team</label>
                    <input type="text" 
                           class="player-search-input" 
                           placeholder="Type to search..."
                           data-type="${type.id}">
                    <div class="player-suggestions" style="display: none;"></div>
                </div>
                
                <div class="selected-player-display" style="display: none;">
                    <div class="selected-player-info">
                        <div class="selected-player-name"></div>
                        <div class="selected-player-details"></div>
                    </div>
                    <button class="remove-player-btn">Remove</button>
                </div>
                
                <div class="confidence-container">
                    <div class="confidence-display">
                        <span class="input-label">Confidence</span>
                        <span class="confidence-value">50%</span>
                    </div>
                    <input type="range" class="confidence-slider" min="0" max="100" value="50">
                </div>
                
                <div class="stake-container">
                    <label class="input-label">Points Stake</label>
                    <div class="stake-options">
                        <button class="stake-option" data-stake="5">5 pts</button>
                        <button class="stake-option selected" data-stake="10">10 pts</button>
                        <button class="stake-option" data-stake="25">25 pts</button>
                        <button class="stake-option" data-stake="50">50 pts</button>
                    </div>
                </div>
                
                <div class="potential-points">
                    <div class="potential-label">Potential Points</div>
                    <div class="potential-value">${type.basePoints}</div>
                </div>
                
                <button class="submit-prediction-btn">
                    Submit This Prediction
                </button>
            </div>
        `;
        
        // Attach event listeners for this card
        this.attachCardEventListeners(card, type);
        
        return card;
    }

    /**
     * Attach event listeners to a card
     */
    attachCardEventListeners(card, type) {
        // Quick select buttons
        card.querySelectorAll('.quick-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                this.selectPlayer(card, { name, team: 'Quick Pick' }, type);
            });
        });
        
        // Player search input
        const searchInput = card.querySelector('.player-search-input');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchPlayers(e.target.value, card, type);
            }, 300);
        });
        
        // Remove player button
        card.querySelector('.remove-player-btn')?.addEventListener('click', () => {
            this.clearPlayerSelection(card);
        });
        
        // Confidence slider
        const confidenceSlider = card.querySelector('.confidence-slider');
        confidenceSlider.addEventListener('input', (e) => {
            card.querySelector('.confidence-value').textContent = `${e.target.value}%`;
            this.updatePotentialPoints(card, type);
        });
        
        // Stake options
        card.querySelectorAll('.stake-option').forEach(btn => {
            btn.addEventListener('click', () => {
                card.querySelectorAll('.stake-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.updatePotentialPoints(card, type);
            });
        });
        
        // Submit button
        card.querySelector('.submit-prediction-btn').addEventListener('click', () => {
            this.submitIndividualPrediction(card, type);
        });
    }

    /**
     * Search for players
     */
    searchPlayers(query, card, type) {
        const suggestionsDiv = card.querySelector('.player-suggestions');
        
        if (!query || query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        // Mock player data (replace with real data)
        const players = [
            { name: 'Erling Haaland', team: 'Man City', position: 'FWD', price: 14.0 },
            { name: 'Mohamed Salah', team: 'Liverpool', position: 'MID', price: 12.5 },
            { name: 'Cole Palmer', team: 'Chelsea', position: 'MID', price: 11.0 },
            { name: 'Bukayo Saka', team: 'Arsenal', position: 'MID', price: 10.0 },
            { name: 'Alexander Isak', team: 'Newcastle', position: 'FWD', price: 8.5 }
        ];
        
        const filtered = players.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.team.toLowerCase().includes(query.toLowerCase())
        );
        
        if (filtered.length === 0) {
            suggestionsDiv.innerHTML = '<div style="padding: 1rem; text-align: center; color: #666;">No results found</div>';
        } else {
            suggestionsDiv.innerHTML = filtered.map(player => `
                <div class="suggestion-item" data-player='${JSON.stringify(player)}'>
                    <div>
                        <div class="suggestion-name">${player.name}</div>
                        <div class="suggestion-info">${player.team} • ${player.position}</div>
                    </div>
                    <div class="suggestion-price">£${player.price}m</div>
                </div>
            `).join('');
            
            // Add click handlers
            suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const player = JSON.parse(item.dataset.player);
                    this.selectPlayer(card, player, type);
                });
            });
        }
        
        suggestionsDiv.style.display = 'block';
    }

    /**
     * Select a player for the card
     */
    selectPlayer(card, player, type) {
        // Hide search and show selected
        card.querySelector('.player-search-input').style.display = 'none';
        card.querySelector('.player-suggestions').style.display = 'none';
        
        const selectedDiv = card.querySelector('.selected-player-display');
        selectedDiv.style.display = 'flex';
        selectedDiv.querySelector('.selected-player-name').textContent = player.name;
        selectedDiv.querySelector('.selected-player-details').textContent = 
            player.team ? `${player.team} • ${player.position || ''} • £${player.price || '?'}m` : '';
        
        // Store player data
        card.dataset.selectedPlayer = JSON.stringify(player);
        
        // Update potential points
        this.updatePotentialPoints(card, type);
    }

    /**
     * Clear player selection
     */
    clearPlayerSelection(card) {
        card.querySelector('.player-search-input').style.display = 'block';
        card.querySelector('.player-search-input').value = '';
        card.querySelector('.selected-player-display').style.display = 'none';
        delete card.dataset.selectedPlayer;
    }

    /**
     * Update potential points calculation
     */
    updatePotentialPoints(card, type) {
        const confidence = parseInt(card.querySelector('.confidence-slider').value);
        const stake = parseInt(card.querySelector('.stake-option.selected').dataset.stake);
        
        const basePoints = type.basePoints;
        const confidenceMultiplier = 1 + (confidence - 50) / 100;
        const stakeMultiplier = stake / 10;
        
        const potential = Math.round(basePoints * confidenceMultiplier * stakeMultiplier);
        
        card.querySelector('.potential-value').textContent = potential;
    }

    /**
     * Submit an individual prediction
     */
    async submitIndividualPrediction(card, type) {
        if (!fplAuth.isAuthenticated()) {
            alert('Please login to submit predictions');
            return;
        }
        
        const selectedPlayer = card.dataset.selectedPlayer;
        if (!selectedPlayer) {
            alert('Please select a player or team');
            return;
        }
        
        const player = JSON.parse(selectedPlayer);
        const confidence = parseInt(card.querySelector('.confidence-slider').value);
        const stake = parseInt(card.querySelector('.stake-option.selected').dataset.stake);
        const potential = parseInt(card.querySelector('.potential-value').textContent);
        
        const predictionData = {
            type: type.id,
            playerId: player.id || Math.random().toString(36).substr(2, 9),
            playerName: player.name,
            team: player.team,
            confidence: confidence,
            stake: stake,
            details: {
                position: player.position,
                price: player.price
            }
        };
        
        // Submit to system
        const result = await fplUltraPredictions.submitPrediction(predictionData);
        
        if (result.success) {
            // Success feedback
            this.showSuccessAnimation(card);
            
            // Update counter
            this.predictionCounter[type.id] = (this.predictionCounter[type.id] || 0) + 1;
            this.updateSubmissionCount(card, this.predictionCounter[type.id]);
            
            // Add to submitted list
            this.addToSubmittedList({
                ...predictionData,
                typeTitle: type.title,
                potential: potential,
                timestamp: Date.now()
            });
            
            // Clear the form for another submission
            setTimeout(() => {
                this.clearPlayerSelection(card);
                card.querySelector('.confidence-slider').value = 50;
                card.querySelector('.confidence-value').textContent = '50%';
                this.updatePotentialPoints(card, type);
            }, 1000);
            
            // Update global stats
            this.updateGlobalStats();
        } else {
            alert(result.message || 'Failed to submit prediction');
        }
    }

    /**
     * Show success animation on card
     */
    showSuccessAnimation(card) {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'successPulse 0.5s ease';
        }, 10);
        
        // Add temporary success border
        card.style.border = '3px solid #00ff85';
        setTimeout(() => {
            card.style.border = '';
        }, 2000);
    }

    /**
     * Update submission count badge
     */
    updateSubmissionCount(card, count) {
        let badge = card.querySelector('.submission-count');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'submission-count';
            card.appendChild(badge);
        }
        badge.textContent = count;
    }

    /**
     * Add prediction to submitted list
     */
    addToSubmittedList(prediction) {
        this.submittedPredictions.push(prediction);
        
        const listContainer = document.getElementById('submitted-list');
        const itemsContainer = document.getElementById('submitted-items');
        
        if (listContainer && itemsContainer) {
            listContainer.style.display = 'block';
            
            const item = document.createElement('div');
            item.className = 'submitted-item';
            item.innerHTML = `
                <div class="submitted-info">
                    <div class="submitted-type">${prediction.typeTitle}</div>
                    <div class="submitted-player">
                        ${prediction.playerName} • ${prediction.confidence}% confidence • ${prediction.stake} pts stake
                    </div>
                </div>
                <div class="submitted-points">
                    <div class="points-pill">+${prediction.potential}</div>
                    <div class="status-indicator"></div>
                </div>
            `;
            
            itemsContainer.insertBefore(item, itemsContainer.firstChild);
        }
    }

    /**
     * Update global statistics
     */
    async updateGlobalStats() {
        const totalPredictions = this.submittedPredictions.length;
        const totalPotential = this.submittedPredictions.reduce((sum, p) => sum + p.potential, 0);
        const slotsRemaining = 20 - totalPredictions;
        
        document.getElementById('total-predictions').textContent = totalPredictions;
        document.getElementById('potential-points').textContent = totalPotential;
        document.getElementById('slots-remaining').textContent = slotsRemaining;
        
        // Get success rate from system
        if (fplAuth.isAuthenticated()) {
            const stats = await fplUltraPredictions.getUserPredictionStats();
            document.getElementById('success-rate').textContent = `${stats.successRate}%`;
        }
    }

    /**
     * Load user's existing predictions
     */
    async loadUserPredictions() {
        if (!fplAuth.isAuthenticated()) return;
        
        const predictions = await fplUltraPredictions.getActivePredictions();
        
        // Count predictions by type
        this.predictionCounter = {};
        predictions.forEach(pred => {
            this.predictionCounter[pred.type] = (this.predictionCounter[pred.type] || 0) + 1;
        });
        
        // Update cards with counts
        document.querySelectorAll('.prediction-type-card').forEach(card => {
            const typeId = card.dataset.typeId;
            const count = this.predictionCounter[typeId] || 0;
            if (count > 0) {
                this.updateSubmissionCount(card, count);
            }
        });
        
        // Update global stats
        this.updateGlobalStats();
    }

    /**
     * Show login prompt
     */
    showLoginPrompt() {
        const content = document.getElementById('predictions-content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="login-prompt">
                <h2>🔒 Login Required</h2>
                <p>Please login to access the FPL Predictions Center and start making your predictions!</p>
                <button class="login-btn" onclick="window.location.href='/fpl-account-dashboard.html'">
                    Login / Sign Up
                </button>
            </div>
        `;
    }

    /**
     * Attach global event listeners
     */
    attachGlobalListeners() {
        // Add success animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes successPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.player-search-input') && !e.target.closest('.player-suggestions')) {
                document.querySelectorAll('.player-suggestions').forEach(div => {
                    div.style.display = 'none';
                });
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Load the ultra predictions system first
    if (!window.fplUltraPredictions) {
        const script = document.createElement('script');
        script.src = '/fpl-predictions-ultra.js';
        script.onload = () => {
            window.fplUltraIndividualUI = new FPLUltraIndividualPredictionsUI();
        };
        document.head.appendChild(script);
    } else {
        window.fplUltraIndividualUI = new FPLUltraIndividualPredictionsUI();
    }
});