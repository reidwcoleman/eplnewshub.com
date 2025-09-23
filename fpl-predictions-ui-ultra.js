/**
 * FPL Ultra Predictions UI
 * Enhanced UI for managing multiple predictions per gameweek
 */

class FPLUltraPredictionsUI {
    constructor() {
        this.currentGameweek = 1;
        this.activePredictions = {};
        this.selectedPlayers = {};
        this.predictionCards = [];
        
        this.init();
    }

    /**
     * Initialize the ultra predictions UI
     */
    async init() {
        // Wait for dependencies
        await this.waitForDependencies();
        
        // Get current gameweek
        this.currentGameweek = await fplUltraPredictions.getCurrentGameweek();
        
        // Create prediction cards UI
        this.createPredictionCardsUI();
        
        // Load active predictions
        await this.loadActivePredictions();
        
        // Set up event listeners
        this.attachEventListeners();
        
        // Subscribe to updates
        if (window.fplAuth) {
            fplAuth.onAuthStateChange((isAuthenticated) => {
                if (isAuthenticated) {
                    this.loadActivePredictions();
                    this.updateStatsDisplay();
                } else {
                    this.clearUI();
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
     * Create the prediction cards UI
     */
    createPredictionCardsUI() {
        const container = document.createElement('div');
        container.id = 'ultra-predictions-container';
        container.innerHTML = `
            <style>
                #ultra-predictions-container {
                    max-width: 1400px;
                    margin: 2rem auto;
                    padding: 0 2rem;
                    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
                }
                
                .predictions-header {
                    background: linear-gradient(135deg, #37003c 0%, #00ff85 100%);
                    color: white;
                    padding: 2rem;
                    border-radius: 20px;
                    margin-bottom: 2rem;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                }
                
                .predictions-title {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                }
                
                .gameweek-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255,255,255,0.1);
                    padding: 1rem;
                    border-radius: 12px;
                    margin-top: 1rem;
                }
                
                .prediction-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                
                .stat-item {
                    background: rgba(255,255,255,0.15);
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                }
                
                .stat-value {
                    font-size: 2rem;
                    font-weight: bold;
                    color: #00ff85;
                }
                
                .stat-label {
                    font-size: 0.875rem;
                    opacity: 0.9;
                    margin-top: 0.25rem;
                }
                
                .predictions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                    margin: 2rem 0;
                }
                
                .prediction-card {
                    background: white;
                    border-radius: 15px;
                    padding: 1.5rem;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                }
                
                .prediction-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }
                
                .prediction-card.submitted {
                    border: 2px solid #28a745;
                    background: linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%);
                }
                
                .prediction-card.pending {
                    border: 2px solid #fdb913;
                }
                
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #f0f0f0;
                }
                
                .card-title {
                    font-size: 1.25rem;
                    font-weight: bold;
                    color: #37003c;
                }
                
                .card-points {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #fdb913 0%, #ffed4e 100%);
                    border-radius: 20px;
                    font-weight: bold;
                }
                
                .card-content {
                    margin: 1.5rem 0;
                }
                
                .player-select {
                    position: relative;
                    margin-bottom: 1rem;
                }
                
                .player-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1rem;
                    transition: all 0.3s;
                }
                
                .player-input:focus {
                    outline: none;
                    border-color: #37003c;
                    box-shadow: 0 0 0 3px rgba(55,0,60,0.1);
                }
                
                .selected-player {
                    background: #f5f5f5;
                    padding: 1rem;
                    border-radius: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .player-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .player-name {
                    font-weight: bold;
                    color: #37003c;
                }
                
                .player-details {
                    font-size: 0.875rem;
                    color: #666;
                    margin-top: 0.25rem;
                }
                
                .confidence-section {
                    margin: 1.5rem 0;
                }
                
                .confidence-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                
                .confidence-slider {
                    width: 100%;
                    height: 8px;
                    -webkit-appearance: none;
                    border-radius: 5px;
                    background: linear-gradient(to right, 
                        #e90052 0%, 
                        #fdb913 50%, 
                        #00ff85 100%);
                    outline: none;
                }
                
                .confidence-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #37003c;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                
                .stake-section {
                    margin: 1.5rem 0;
                }
                
                .stake-buttons {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 0.5rem;
                }
                
                .stake-btn {
                    padding: 0.5rem;
                    border: 2px solid #e0e0e0;
                    background: white;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: 600;
                }
                
                .stake-btn.selected {
                    background: #37003c;
                    color: white;
                    border-color: #37003c;
                }
                
                .submit-btn {
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #37003c 0%, #4a0050 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(55,0,60,0.3);
                }
                
                .submit-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .prediction-result {
                    margin-top: 1rem;
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                    font-weight: 600;
                }
                
                .prediction-result.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .prediction-result.partial {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                
                .prediction-result.failed {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .prediction-badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #00ff85;
                    color: #37003c;
                    padding: 0.25rem 0.75rem;
                    border-radius: 0 15px 0 15px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                
                .active-predictions {
                    background: white;
                    border-radius: 15px;
                    padding: 2rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                }
                
                .active-predictions-title {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #37003c;
                    margin-bottom: 1.5rem;
                }
                
                .predictions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .prediction-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: #f5f5f5;
                    border-radius: 10px;
                    transition: all 0.3s;
                }
                
                .prediction-item:hover {
                    background: #e8e8e8;
                    transform: translateX(5px);
                }
                
                .prediction-item-info {
                    display: flex;
                    flex-direction: column;
                }
                
                .prediction-item-type {
                    font-weight: bold;
                    color: #37003c;
                }
                
                .prediction-item-player {
                    font-size: 0.875rem;
                    color: #666;
                    margin-top: 0.25rem;
                }
                
                .prediction-item-points {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .points-badge {
                    padding: 0.25rem 0.75rem;
                    background: #fdb913;
                    color: #000;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 0.875rem;
                }
                
                @media (max-width: 768px) {
                    .predictions-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .stake-buttons {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
            
            <div class="predictions-header">
                <h1 class="predictions-title">FPL Ultra Predictions</h1>
                <div class="gameweek-info">
                    <div>
                        <strong>Gameweek ${this.currentGameweek}</strong>
                        <div id="deadline-countdown"></div>
                    </div>
                    <div id="remaining-slots">
                        Slots Used: <span id="slots-count">0/20</span>
                    </div>
                </div>
                <div class="prediction-stats">
                    <div class="stat-item">
                        <div class="stat-value" id="week-predictions">0</div>
                        <div class="stat-label">This Week</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="week-potential">0</div>
                        <div class="stat-label">Potential Points</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="total-points">0</div>
                        <div class="stat-label">Total Points</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="success-rate">0%</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                </div>
            </div>
            
            <div class="active-predictions" id="active-predictions-section" style="display: none;">
                <h2 class="active-predictions-title">Your Active Predictions</h2>
                <div class="predictions-list" id="active-predictions-list"></div>
            </div>
            
            <div class="predictions-grid" id="predictions-grid"></div>
        `;
        
        // Add to page if dashboard element exists, otherwise create standalone
        const dashboardElement = document.getElementById('userDashboard');
        if (dashboardElement) {
            dashboardElement.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
        
        // Create prediction cards for each type
        this.createPredictionCards();
    }

    /**
     * Create individual prediction cards
     */
    createPredictionCards() {
        const grid = document.getElementById('predictions-grid');
        if (!grid) return;
        
        const predictionTypes = [
            { type: 'captain', title: 'Captain Pick', icon: '👑', basePoints: 50, description: 'Select your captain for the week' },
            { type: 'triple_captain', title: 'Triple Captain', icon: '⭐', basePoints: 100, description: 'Triple captain chip prediction' },
            { type: 'top_scorer', title: 'Top Scorer', icon: '⚽', basePoints: 75, description: 'Predict the top scorer' },
            { type: 'clean_sheet', title: 'Clean Sheet', icon: '🛡️', basePoints: 30, description: 'Predict a clean sheet team' },
            { type: 'differential', title: 'Differential', icon: '💎', basePoints: 60, description: 'Low ownership, high return' },
            { type: 'hat_trick', title: 'Hat Trick Hero', icon: '🎩', basePoints: 150, description: 'Predict a hat-trick scorer' },
            { type: 'assist_king', title: 'Assist King', icon: '👐', basePoints: 65, description: 'Most assists this week' },
            { type: 'transfer_in', title: 'Transfer Target', icon: '📈', basePoints: 35, description: 'Best transfer in' },
            { type: 'transfer_out', title: 'Transfer Out', icon: '📉', basePoints: 35, description: 'Player to transfer out' },
            { type: 'red_card', title: 'Red Card', icon: '🔴', basePoints: 80, description: 'Predict a red card' },
            { type: 'penalty_save', title: 'Penalty Save', icon: '🧤', basePoints: 120, description: 'Goalkeeper penalty save' },
            { type: 'bench_boost', title: 'Bench Boost', icon: '🔄', basePoints: 40, description: 'Best bench boost week' }
        ];
        
        predictionTypes.forEach(pred => {
            const card = this.createPredictionCard(pred);
            grid.appendChild(card);
            this.predictionCards.push({ type: pred.type, element: card });
        });
    }

    /**
     * Create a single prediction card
     */
    createPredictionCard(predType) {
        const card = document.createElement('div');
        card.className = 'prediction-card';
        card.dataset.type = predType.type;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">
                    <span>${predType.icon}</span>
                    ${predType.title}
                </div>
                <div class="card-points">
                    <span>+${predType.basePoints}</span>
                </div>
            </div>
            
            <div class="card-content">
                <p style="color: #666; font-size: 0.875rem; margin-bottom: 1rem;">
                    ${predType.description}
                </p>
                
                <div class="player-select">
                    <input type="text" 
                           class="player-input" 
                           placeholder="Search player or team..."
                           data-type="${predType.type}">
                    <div class="player-dropdown" style="display: none;"></div>
                </div>
                
                <div class="selected-player" style="display: none;">
                    <div class="player-info">
                        <div class="player-name"></div>
                        <div class="player-details"></div>
                    </div>
                    <button class="clear-btn" style="
                        background: #e90052;
                        color: white;
                        border: none;
                        padding: 0.25rem 0.75rem;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Clear</button>
                </div>
                
                <div class="confidence-section">
                    <div class="confidence-header">
                        <span>Confidence</span>
                        <span class="confidence-value">50%</span>
                    </div>
                    <input type="range" class="confidence-slider" min="0" max="100" value="50">
                </div>
                
                <div class="stake-section">
                    <div style="margin-bottom: 0.5rem;">Points Stake</div>
                    <div class="stake-buttons">
                        <button class="stake-btn" data-stake="5">5</button>
                        <button class="stake-btn selected" data-stake="10">10</button>
                        <button class="stake-btn" data-stake="25">25</button>
                        <button class="stake-btn" data-stake="50">50</button>
                    </div>
                </div>
            </div>
            
            <button class="submit-btn" data-type="${predType.type}">
                Submit Prediction
            </button>
            
            <div class="prediction-result" style="display: none;"></div>
        `;
        
        // Add event listeners for this card
        this.attachCardListeners(card, predType);
        
        return card;
    }

    /**
     * Attach event listeners to a prediction card
     */
    attachCardListeners(card, predType) {
        // Player search
        const input = card.querySelector('.player-input');
        input?.addEventListener('input', (e) => {
            this.handlePlayerSearch(e.target.value, predType.type, card);
        });
        
        // Confidence slider
        const slider = card.querySelector('.confidence-slider');
        slider?.addEventListener('input', (e) => {
            card.querySelector('.confidence-value').textContent = `${e.target.value}%`;
            this.updatePotentialPoints(card, predType);
        });
        
        // Stake buttons
        card.querySelectorAll('.stake-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                card.querySelectorAll('.stake-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.updatePotentialPoints(card, predType);
            });
        });
        
        // Submit button
        const submitBtn = card.querySelector('.submit-btn');
        submitBtn?.addEventListener('click', () => {
            this.submitPrediction(predType, card);
        });
        
        // Clear button
        const clearBtn = card.querySelector('.clear-btn');
        clearBtn?.addEventListener('click', () => {
            this.clearPlayerSelection(card, predType.type);
        });
    }

    /**
     * Handle player search
     */
    handlePlayerSearch(query, type, card) {
        const dropdown = card.querySelector('.player-dropdown');
        
        if (!query || query.length < 2) {
            dropdown.style.display = 'none';
            return;
        }
        
        // Mock player data (replace with real data)
        const players = this.getMockPlayers().filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.team.toLowerCase().includes(query.toLowerCase())
        );
        
        if (players.length === 0) {
            dropdown.innerHTML = '<div style="padding: 0.5rem;">No results found</div>';
        } else {
            dropdown.innerHTML = players.slice(0, 5).map(player => `
                <div class="dropdown-item" style="
                    padding: 0.75rem;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                " data-player='${JSON.stringify(player)}'>
                    <strong>${player.name}</strong>
                    <span style="color: #666; margin-left: 0.5rem;">
                        ${player.team} - £${player.price}m
                    </span>
                </div>
            `).join('');
            
            // Add click handlers
            dropdown.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', () => {
                    const player = JSON.parse(item.dataset.player);
                    this.selectPlayer(player, type, card);
                });
            });
        }
        
        dropdown.style.display = 'block';
    }

    /**
     * Select a player for prediction
     */
    selectPlayer(player, type, card) {
        this.selectedPlayers[type] = player;
        
        // Update UI
        card.querySelector('.player-input').style.display = 'none';
        card.querySelector('.player-dropdown').style.display = 'none';
        
        const selectedDiv = card.querySelector('.selected-player');
        selectedDiv.style.display = 'flex';
        selectedDiv.querySelector('.player-name').textContent = player.name;
        selectedDiv.querySelector('.player-details').textContent = `${player.team} - £${player.price}m`;
        
        // Update potential points
        this.updatePotentialPoints(card, { type, basePoints: parseInt(card.querySelector('.card-points span').textContent.slice(1)) });
    }

    /**
     * Clear player selection
     */
    clearPlayerSelection(card, type) {
        delete this.selectedPlayers[type];
        
        card.querySelector('.player-input').style.display = 'block';
        card.querySelector('.player-input').value = '';
        card.querySelector('.selected-player').style.display = 'none';
    }

    /**
     * Update potential points display
     */
    updatePotentialPoints(card, predType) {
        const confidence = parseInt(card.querySelector('.confidence-slider').value);
        const stake = parseInt(card.querySelector('.stake-btn.selected').dataset.stake);
        
        const basePoints = predType.basePoints || 50;
        const confidenceMultiplier = 1 + (confidence - 50) / 100;
        const stakeMultiplier = stake / 10;
        
        const potential = Math.round(basePoints * confidenceMultiplier * stakeMultiplier);
        
        // Update card points display
        card.querySelector('.card-points span').textContent = `+${potential}`;
    }

    /**
     * Submit a prediction
     */
    async submitPrediction(predType, card) {
        if (!fplAuth.isAuthenticated()) {
            alert('Please login to submit predictions');
            return;
        }
        
        const player = this.selectedPlayers[predType.type];
        if (!player) {
            alert('Please select a player or team');
            return;
        }
        
        const confidence = parseInt(card.querySelector('.confidence-slider').value);
        const stake = parseInt(card.querySelector('.stake-btn.selected').dataset.stake);
        
        const predictionData = {
            type: predType.type,
            playerId: player.id,
            playerName: player.name,
            team: player.team,
            confidence: confidence,
            stake: stake,
            details: {
                price: player.price,
                position: player.position
            }
        };
        
        // Submit to system
        const result = await fplUltraPredictions.submitPrediction(predictionData);
        
        // Show result
        const resultDiv = card.querySelector('.prediction-result');
        if (result.success) {
            resultDiv.className = 'prediction-result success';
            resultDiv.textContent = result.message;
            resultDiv.style.display = 'block';
            
            // Mark card as submitted
            card.classList.add('submitted');
            
            // Disable submit button
            card.querySelector('.submit-btn').disabled = true;
            card.querySelector('.submit-btn').textContent = 'Submitted';
            
            // Reload active predictions
            await this.loadActivePredictions();
            
            // Update stats
            await this.updateStatsDisplay();
        } else {
            resultDiv.className = 'prediction-result failed';
            resultDiv.textContent = result.message;
            resultDiv.style.display = 'block';
        }
        
        // Hide result after 3 seconds
        setTimeout(() => {
            resultDiv.style.display = 'none';
        }, 3000);
    }

    /**
     * Load active predictions
     */
    async loadActivePredictions() {
        if (!fplAuth.isAuthenticated()) return;
        
        const activePredictions = await fplUltraPredictions.getActivePredictionsByType();
        this.activePredictions = activePredictions;
        
        // Count total active predictions
        let totalActive = 0;
        Object.values(activePredictions).forEach(preds => {
            totalActive += preds.length;
        });
        
        // Update slots count
        document.getElementById('slots-count').textContent = `${totalActive}/20`;
        
        // Update active predictions display
        if (totalActive > 0) {
            document.getElementById('active-predictions-section').style.display = 'block';
            this.displayActivePredictions(activePredictions);
        } else {
            document.getElementById('active-predictions-section').style.display = 'none';
        }
        
        // Update card states
        this.updateCardStates(activePredictions);
    }

    /**
     * Display active predictions
     */
    displayActivePredictions(predictions) {
        const list = document.getElementById('active-predictions-list');
        if (!list) return;
        
        const items = [];
        
        Object.entries(predictions).forEach(([type, preds]) => {
            preds.forEach(pred => {
                items.push(`
                    <div class="prediction-item">
                        <div class="prediction-item-info">
                            <div class="prediction-item-type">${this.formatType(type)}</div>
                            <div class="prediction-item-player">
                                ${pred.data.playerName || pred.data.team || pred.data.value}
                                • Confidence: ${pred.data.confidence}%
                            </div>
                        </div>
                        <div class="prediction-item-points">
                            <span class="points-badge">+${pred.potentialPoints}</span>
                        </div>
                    </div>
                `);
            });
        });
        
        list.innerHTML = items.join('');
    }

    /**
     * Update card states based on active predictions
     */
    updateCardStates(activePredictions) {
        this.predictionCards.forEach(({ type, element }) => {
            const typePredictions = activePredictions[type] || [];
            
            if (typePredictions.length > 0) {
                // Show latest prediction for this type
                const latest = typePredictions[typePredictions.length - 1];
                
                // Add badge showing number of predictions
                let badge = element.querySelector('.prediction-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'prediction-badge';
                    element.appendChild(badge);
                }
                badge.textContent = `${typePredictions.length} Active`;
                
                // Update UI to show prediction
                const selectedDiv = element.querySelector('.selected-player');
                if (latest.data.playerName) {
                    element.querySelector('.player-input').style.display = 'none';
                    selectedDiv.style.display = 'flex';
                    selectedDiv.querySelector('.player-name').textContent = latest.data.playerName;
                    selectedDiv.querySelector('.player-details').textContent = latest.data.team || '';
                }
            }
        });
    }

    /**
     * Update stats display
     */
    async updateStatsDisplay() {
        if (!fplAuth.isAuthenticated()) return;
        
        const stats = await fplUltraPredictions.getUserPredictionStats();
        const weekPredictions = await fplUltraPredictions.getUserGameweekPredictions(
            fplAuth.getCurrentUser().id,
            this.currentGameweek
        );
        
        // Update stats
        document.getElementById('week-predictions').textContent = weekPredictions.length;
        document.getElementById('week-potential').textContent = 
            weekPredictions.reduce((sum, p) => sum + (p.potentialPoints || 0), 0);
        document.getElementById('total-points').textContent = stats.totalPoints;
        document.getElementById('success-rate').textContent = `${stats.successRate}%`;
    }

    /**
     * Clear UI when logged out
     */
    clearUI() {
        this.activePredictions = {};
        this.selectedPlayers = {};
        
        // Reset all cards
        this.predictionCards.forEach(({ element }) => {
            element.classList.remove('submitted');
            element.querySelector('.submit-btn').disabled = false;
            element.querySelector('.submit-btn').textContent = 'Submit Prediction';
            this.clearPlayerSelection(element, element.dataset.type);
        });
        
        // Hide active predictions
        document.getElementById('active-predictions-section').style.display = 'none';
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Update deadline countdown
        setInterval(() => this.updateDeadlineCountdown(), 1000);
    }

    /**
     * Update deadline countdown
     */
    updateDeadlineCountdown() {
        const deadline = fplUltraPredictions.getGameweekDeadline(this.currentGameweek);
        const now = Date.now();
        const diff = deadline - now;
        
        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            const countdownEl = document.getElementById('deadline-countdown');
            if (countdownEl) {
                countdownEl.textContent = `Deadline: ${hours}h ${minutes}m`;
            }
        }
    }

    /**
     * Format prediction type
     */
    formatType(type) {
        return type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Get mock players for demo
     */
    getMockPlayers() {
        return [
            { id: 1, name: 'Erling Haaland', team: 'Man City', position: 'FWD', price: 14.0 },
            { id: 2, name: 'Mohamed Salah', team: 'Liverpool', position: 'MID', price: 12.5 },
            { id: 3, name: 'Bukayo Saka', team: 'Arsenal', position: 'MID', price: 10.0 },
            { id: 4, name: 'Cole Palmer', team: 'Chelsea', position: 'MID', price: 11.0 },
            { id: 5, name: 'Bruno Fernandes', team: 'Man United', position: 'MID', price: 8.5 }
        ];
    }
}

// Initialize the UI
document.addEventListener('DOMContentLoaded', () => {
    // Load the ultra predictions system first
    const script = document.createElement('script');
    script.src = '/fpl-predictions-ultra.js';
    script.onload = () => {
        window.fplUltraPredictionsUI = new FPLUltraPredictionsUI();
    };
    document.head.appendChild(script);
});