/**
 * FPL Real Predictions System
 * Connects predictions to actual FPL matches and live data
 */

class FPLRealPredictions {
    constructor() {
        this.dataService = null;
        this.currentGameweek = null;
        this.upcomingFixtures = [];
        this.predictionTypes = [
            { id: 'captain', title: 'Captain Pick', icon: '👑', basePoints: 50, description: 'Select your captain based on fixtures' },
            { id: 'triple_captain', title: 'Triple Captain', icon: '⭐', basePoints: 100, description: 'Triple captain chip for double gameweeks' },
            { id: 'top_scorer', title: 'Top Scorer', icon: '⚽', basePoints: 75, description: 'Predict this week\'s top scorer' },
            { id: 'clean_sheet', title: 'Clean Sheet', icon: '🛡️', basePoints: 30, description: 'Team to keep a clean sheet' },
            { id: 'differential', title: 'Differential Pick', icon: '💎', basePoints: 60, description: 'Low ownership hidden gem' },
            { id: 'hat_trick', title: 'Hat Trick Hero', icon: '🎩', basePoints: 150, description: 'Player to score 3+ goals' },
            { id: 'match_result', title: 'Match Result', icon: '🎯', basePoints: 40, description: 'Predict match outcome' },
            { id: 'both_teams_score', title: 'BTTS', icon: '⚡', basePoints: 35, description: 'Both teams to score' },
            { id: 'first_goal', title: 'First Goal', icon: '🥇', basePoints: 55, description: 'First goalscorer in match' },
            { id: 'player_to_score', title: 'Anytime Scorer', icon: '✨', basePoints: 45, description: 'Player to score anytime' },
            { id: 'assist_provider', title: 'Assist King', icon: '👐', basePoints: 65, description: 'Most assists this week' },
            { id: 'penalty_incident', title: 'Penalty Event', icon: '🎯', basePoints: 80, description: 'Match with penalty' }
        ];
        
        this.init();
    }

    /**
     * Initialize the real predictions system
     */
    async init() {
        // Wait for FPL data service
        await this.waitForDataService();
        
        // Get current gameweek and fixtures
        await this.loadGameweekData();
        
        // Create UI with real data
        this.createRealPredictionsUI();
        
        // Set up live updates
        this.setupLiveUpdates();
    }

    /**
     * Wait for data service to be ready
     */
    async waitForDataService() {
        return new Promise((resolve) => {
            const checkService = () => {
                if (window.fplLiveData) {
                    this.dataService = window.fplLiveData;
                    resolve();
                } else {
                    setTimeout(checkService, 100);
                }
            };
            checkService();
        });
    }

    /**
     * Load current gameweek data
     */
    async loadGameweekData() {
        this.currentGameweek = this.dataService.currentGameweek;
        this.upcomingFixtures = this.dataService.getNextGameweekFixtures();
        
        console.log(`Gameweek ${this.currentGameweek + 1} Fixtures:`, this.upcomingFixtures);
    }

    /**
     * Create the real predictions UI
     */
    createRealPredictionsUI() {
        const container = document.getElementById('predictions-content') || document.body;
        
        // Create fixtures section
        const fixturesHTML = `
            <div class="fixtures-section" style="
                background: white;
                border-radius: 20px;
                padding: 2rem;
                margin-bottom: 3rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            ">
                <h2 style="
                    font-size: 2rem;
                    color: #37003c;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                ">
                    📅 Gameweek ${this.currentGameweek + 1} Fixtures
                    <span style="
                        background: #00ff85;
                        color: #37003c;
                        padding: 0.25rem 1rem;
                        border-radius: 20px;
                        font-size: 1rem;
                        font-weight: normal;
                    ">${this.upcomingFixtures.length} Matches</span>
                </h2>
                <div class="fixtures-grid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                ">
                    ${this.upcomingFixtures.map(fixture => this.createFixtureCard(fixture)).join('')}
                </div>
            </div>
        `;
        
        // Create predictions section with real data
        const predictionsHTML = `
            <div class="real-predictions-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                gap: 2rem;
                margin: 2rem 0;
            ">
                ${this.predictionTypes.map(type => this.createRealPredictionCard(type)).join('')}
            </div>
        `;
        
        // Add live tracker if matches are ongoing
        const liveTrackerHTML = this.dataService.areMatchesLive() ? `
            <div class="live-tracker" style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #e90052;
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 30px;
                box-shadow: 0 10px 30px rgba(233,0,82,0.3);
                z-index: 1000;
                animation: pulse 2s infinite;
            ">
                <span style="
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                    margin-right: 0.5rem;
                    animation: blink 1s infinite;
                "></span>
                LIVE MATCHES
            </div>
        ` : '';
        
        container.innerHTML = fixturesHTML + predictionsHTML + liveTrackerHTML;
        
        // Add event listeners
        this.attachRealEventListeners();
    }

    /**
     * Create fixture card
     */
    createFixtureCard(fixture) {
        const kickoffTime = fixture.kickoffTime.toLocaleString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="fixture-card" style="
                background: linear-gradient(135deg, #f8f8f8 0%, #ffffff 100%);
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                padding: 1rem;
                transition: all 0.3s;
                cursor: pointer;
            " data-fixture-id="${fixture.id}">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.75rem;
                ">
                    <span style="
                        background: #37003c;
                        color: white;
                        padding: 0.25rem 0.5rem;
                        border-radius: 6px;
                        font-size: 0.75rem;
                        font-weight: bold;
                    ">${kickoffTime}</span>
                    ${fixture.started && !fixture.finished ? `
                        <span style="
                            background: #e90052;
                            color: white;
                            padding: 0.25rem 0.5rem;
                            border-radius: 6px;
                            font-size: 0.75rem;
                            font-weight: bold;
                            animation: blink 1s infinite;
                        ">LIVE</span>
                    ` : ''}
                </div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="flex: 1; text-align: center;">
                        <div style="font-weight: bold; color: #37003c; margin-bottom: 0.25rem;">
                            ${fixture.homeTeam.name}
                        </div>
                        <div style="
                            display: inline-block;
                            padding: 0.25rem 0.5rem;
                            background: ${this.getDifficultyColor(fixture.difficulty.home)};
                            color: white;
                            border-radius: 4px;
                            font-size: 0.75rem;
                        ">FDR ${fixture.difficulty.home}</div>
                    </div>
                    <div style="
                        padding: 0 1rem;
                        font-weight: bold;
                        color: #666;
                    ">VS</div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-weight: bold; color: #37003c; margin-bottom: 0.25rem;">
                            ${fixture.awayTeam.name}
                        </div>
                        <div style="
                            display: inline-block;
                            padding: 0.25rem 0.5rem;
                            background: ${this.getDifficultyColor(fixture.difficulty.away)};
                            color: white;
                            border-radius: 4px;
                            font-size: 0.75rem;
                        ">FDR ${fixture.difficulty.away}</div>
                    </div>
                </div>
                ${fixture.started ? `
                    <div style="
                        margin-top: 0.75rem;
                        padding-top: 0.75rem;
                        border-top: 1px solid #e0e0e0;
                        text-align: center;
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #37003c;
                    ">
                        ${fixture.homeScore || 0} - ${fixture.awayScore || 0}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Create real prediction card with actual data
     */
    createRealPredictionCard(type) {
        // Get suggestions based on real data
        const suggestions = this.dataService.getPredictionSuggestions(type.id);
        
        return `
            <div class="real-prediction-card" style="
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                transition: all 0.3s;
            " data-type="${type.id}">
                <div style="
                    background: linear-gradient(135deg, #37003c 0%, #4a0050 100%);
                    color: white;
                    padding: 1.5rem;
                    position: relative;
                ">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">${type.icon}</div>
                    <div style="font-size: 1.25rem; font-weight: bold;">${type.title}</div>
                    <div style="font-size: 0.875rem; opacity: 0.9;">${type.description}</div>
                    <div style="
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: #00ff85;
                        color: #37003c;
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        font-weight: bold;
                    ">+${type.basePoints}</div>
                </div>
                
                <div style="padding: 1.5rem;">
                    ${suggestions.length > 0 ? `
                        <div style="margin-bottom: 1rem;">
                            <div style="
                                font-weight: bold;
                                color: #37003c;
                                margin-bottom: 0.5rem;
                            ">📊 Data-Driven Suggestions</div>
                            <div style="
                                display: flex;
                                flex-wrap: wrap;
                                gap: 0.5rem;
                            ">
                                ${suggestions.slice(0, 3).map(s => `
                                    <button class="suggestion-btn" style="
                                        background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
                                        border: none;
                                        padding: 0.5rem 1rem;
                                        border-radius: 20px;
                                        cursor: pointer;
                                        transition: all 0.2s;
                                        font-size: 0.875rem;
                                    " data-suggestion='${JSON.stringify(s)}'>
                                        <strong>${s.name}</strong>
                                        <span style="color: #666; margin-left: 0.25rem;">${s.info}</span>
                                        <span style="
                                            background: ${this.getConfidenceColor(s.confidence)};
                                            color: white;
                                            padding: 0.125rem 0.5rem;
                                            border-radius: 10px;
                                            margin-left: 0.5rem;
                                            font-size: 0.75rem;
                                        ">${s.confidence}%</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 1rem;">
                        <input type="text" 
                               class="real-player-search" 
                               placeholder="Search for player or team..."
                               style="
                                   width: 100%;
                                   padding: 0.875rem;
                                   border: 2px solid #e0e0e0;
                                   border-radius: 12px;
                                   font-size: 1rem;
                               ">
                        <div class="real-search-results" style="display: none;"></div>
                    </div>
                    
                    <div class="selected-real-player" style="display: none;"></div>
                    
                    ${type.id === 'match_result' || type.id === 'both_teams_score' ? `
                        <div style="margin-bottom: 1rem;">
                            <select class="fixture-select" style="
                                width: 100%;
                                padding: 0.875rem;
                                border: 2px solid #e0e0e0;
                                border-radius: 12px;
                                font-size: 1rem;
                            ">
                                <option value="">Select a match...</option>
                                ${this.upcomingFixtures.map(f => `
                                    <option value="${f.id}">
                                        ${f.homeTeam.name} vs ${f.awayTeam.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    ` : ''}
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 0.5rem;
                        ">
                            <span>Confidence</span>
                            <span class="confidence-display" style="
                                font-weight: bold;
                                color: #37003c;
                            ">50%</span>
                        </div>
                        <input type="range" 
                               class="real-confidence" 
                               min="0" max="100" value="50"
                               style="
                                   width: 100%;
                                   height: 8px;
                                   -webkit-appearance: none;
                                   background: linear-gradient(to right, #e90052 0%, #fdb913 50%, #00ff85 100%);
                                   border-radius: 5px;
                               ">
                    </div>
                    
                    <div style="
                        background: linear-gradient(135deg, #fdb913 0%, #ffed4e 100%);
                        padding: 1rem;
                        border-radius: 12px;
                        text-align: center;
                        margin-bottom: 1rem;
                    ">
                        <div style="font-size: 0.875rem; color: #333;">Potential Points</div>
                        <div class="potential-display" style="
                            font-size: 2rem;
                            font-weight: bold;
                            color: #37003c;
                        ">${type.basePoints}</div>
                    </div>
                    
                    <button class="submit-real-prediction" style="
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
                    ">Submit Prediction</button>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners for real predictions
     */
    attachRealEventListeners() {
        // Suggestion buttons
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const suggestion = JSON.parse(btn.dataset.suggestion);
                const card = btn.closest('.real-prediction-card');
                this.selectSuggestion(card, suggestion);
            });
        });
        
        // Player search
        document.querySelectorAll('.real-player-search').forEach(input => {
            let searchTimeout;
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchRealPlayers(e.target.value, input.closest('.real-prediction-card'));
                }, 300);
            });
        });
        
        // Confidence sliders
        document.querySelectorAll('.real-confidence').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const card = slider.closest('.real-prediction-card');
                card.querySelector('.confidence-display').textContent = `${e.target.value}%`;
                this.updatePotentialPoints(card);
            });
        });
        
        // Submit buttons
        document.querySelectorAll('.submit-real-prediction').forEach(btn => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.real-prediction-card');
                this.submitRealPrediction(card);
            });
        });
        
        // Fixture cards
        document.querySelectorAll('.fixture-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showFixtureDetails(card.dataset.fixtureId);
            });
        });
    }

    /**
     * Search real players from FPL data
     */
    searchRealPlayers(query, card) {
        const resultsDiv = card.querySelector('.real-search-results');
        
        if (!query || query.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        const players = this.dataService.searchPlayers(query);
        
        if (players.length === 0) {
            resultsDiv.innerHTML = '<div style="padding: 1rem; text-align: center;">No results found</div>';
        } else {
            resultsDiv.innerHTML = players.map(player => `
                <div class="search-result-item" style="
                    padding: 0.75rem;
                    border-bottom: 1px solid #f0f0f0;
                    cursor: pointer;
                    transition: background 0.2s;
                " data-player='${JSON.stringify({
                    id: player.id,
                    name: player.webName,
                    team: player.teamName,
                    price: player.price,
                    form: player.form,
                    points: player.totalPoints
                })}'>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${player.webName}</strong>
                            <span style="color: #666; margin-left: 0.5rem;">
                                ${player.teamName} • ${player.position}
                            </span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: bold;">£${player.price}m</div>
                            <div style="font-size: 0.75rem; color: #666;">
                                ${player.totalPoints} pts • Form: ${player.form}
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Add click handlers
            resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const player = JSON.parse(item.dataset.player);
                    this.selectRealPlayer(card, player);
                });
            });
        }
        
        resultsDiv.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #37003c;
            border-radius: 12px;
            margin-top: 0.5rem;
            max-height: 300px;
            overflow-y: auto;
            z-index: 100;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        `;
        resultsDiv.style.display = 'block';
    }

    /**
     * Select a real player
     */
    selectRealPlayer(card, player) {
        const searchInput = card.querySelector('.real-player-search');
        const resultsDiv = card.querySelector('.real-search-results');
        const selectedDiv = card.querySelector('.selected-real-player');
        
        searchInput.style.display = 'none';
        resultsDiv.style.display = 'none';
        
        selectedDiv.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%);
                border: 2px solid #00ff85;
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div style="font-weight: bold; color: #37003c; font-size: 1.125rem;">
                        ${player.name}
                    </div>
                    <div style="color: #666; font-size: 0.875rem;">
                        ${player.team} • £${player.price}m • ${player.points} pts
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.style.display='none'; 
                                 this.parentElement.parentElement.previousElementSibling.previousElementSibling.style.display='block';"
                        style="
                    background: #e90052;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                ">Remove</button>
            </div>
        `;
        selectedDiv.style.display = 'block';
        
        card.dataset.selectedPlayer = JSON.stringify(player);
        this.updatePotentialPoints(card);
    }

    /**
     * Select a suggestion
     */
    selectSuggestion(card, suggestion) {
        const player = {
            name: suggestion.name,
            team: suggestion.team,
            info: suggestion.info,
            confidence: suggestion.confidence
        };
        
        this.selectRealPlayer(card, player);
        
        // Update confidence slider
        card.querySelector('.real-confidence').value = suggestion.confidence;
        card.querySelector('.confidence-display').textContent = `${suggestion.confidence}%`;
        this.updatePotentialPoints(card);
    }

    /**
     * Update potential points based on confidence
     */
    updatePotentialPoints(card) {
        const type = this.predictionTypes.find(t => t.id === card.dataset.type);
        const confidence = parseInt(card.querySelector('.real-confidence').value);
        
        const basePoints = type.basePoints;
        const multiplier = 1 + (confidence - 50) / 100;
        const potential = Math.round(basePoints * multiplier);
        
        card.querySelector('.potential-display').textContent = potential;
    }

    /**
     * Submit real prediction
     */
    async submitRealPrediction(card) {
        if (!fplAuth || !fplAuth.isAuthenticated()) {
            alert('Please login to submit predictions');
            return;
        }
        
        const type = card.dataset.type;
        const selectedPlayer = card.dataset.selectedPlayer ? JSON.parse(card.dataset.selectedPlayer) : null;
        const selectedFixture = card.querySelector('.fixture-select')?.value;
        const confidence = parseInt(card.querySelector('.real-confidence').value);
        
        if (!selectedPlayer && !selectedFixture) {
            alert('Please select a player or match');
            return;
        }
        
        const predictionData = {
            type: type,
            playerId: selectedPlayer?.id,
            playerName: selectedPlayer?.name,
            team: selectedPlayer?.team,
            fixtureId: selectedFixture,
            confidence: confidence,
            stake: 10,
            gameweek: this.currentGameweek + 1,
            details: {
                price: selectedPlayer?.price,
                form: selectedPlayer?.form,
                points: selectedPlayer?.points
            }
        };
        
        // Submit to prediction system
        const result = await fplUltraPredictions.submitPrediction(predictionData);
        
        if (result.success) {
            // Success animation
            card.style.animation = 'successFlash 0.5s';
            setTimeout(() => {
                card.style.animation = '';
            }, 500);
            
            // Show success message
            alert(`Prediction submitted! Potential: ${result.prediction.potentialPoints} points`);
            
            // Reset form
            card.querySelector('.real-player-search').value = '';
            card.querySelector('.real-player-search').style.display = 'block';
            card.querySelector('.selected-real-player').style.display = 'none';
            card.querySelector('.real-confidence').value = 50;
            card.querySelector('.confidence-display').textContent = '50%';
            delete card.dataset.selectedPlayer;
        } else {
            alert(result.message || 'Failed to submit prediction');
        }
    }

    /**
     * Get difficulty color
     */
    getDifficultyColor(difficulty) {
        const colors = {
            1: '#00ff85',
            2: '#01fc7a',
            3: '#fdb913',
            4: '#ff6b6b',
            5: '#e90052'
        };
        return colors[difficulty] || '#666';
    }

    /**
     * Get confidence color
     */
    getConfidenceColor(confidence) {
        if (confidence >= 75) return '#00ff85';
        if (confidence >= 50) return '#fdb913';
        return '#e90052';
    }

    /**
     * Show fixture details
     */
    showFixtureDetails(fixtureId) {
        const fixture = this.upcomingFixtures.find(f => f.id == fixtureId);
        if (!fixture) return;
        
        // Get players from both teams
        const homePlayers = this.dataService.players.filter(p => p.team === fixture.homeTeam.id);
        const awayPlayers = this.dataService.players.filter(p => p.team === fixture.awayTeam.id);
        
        console.log('Fixture details:', fixture);
        console.log('Home players:', homePlayers);
        console.log('Away players:', awayPlayers);
    }

    /**
     * Set up live updates for ongoing matches
     */
    setupLiveUpdates() {
        // Check for live updates every minute during match times
        setInterval(async () => {
            if (this.dataService.areMatchesLive()) {
                const updates = await this.dataService.getLiveMatchUpdates();
                if (updates.live) {
                    this.updateLiveScores(updates);
                }
            }
        }, 60000); // Every minute
    }

    /**
     * Update live scores in UI
     */
    updateLiveScores(updates) {
        updates.fixtures.forEach(fixture => {
            const card = document.querySelector(`[data-fixture-id="${fixture.id}"]`);
            if (card) {
                // Update score if exists
                const scoreDiv = card.querySelector('.live-score');
                if (scoreDiv) {
                    scoreDiv.textContent = `${fixture.homeScore || 0} - ${fixture.awayScore || 0}`;
                }
            }
        });
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes successFlash {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(0,255,133,0.5); }
        100% { transform: scale(1); }
    }
    
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .suggestion-btn:hover {
        transform: scale(1.05);
        background: linear-gradient(135deg, #37003c 0%, #4a0050 100%) !important;
        color: white !important;
    }
    
    .suggestion-btn:hover span {
        color: white !important;
    }
    
    .search-result-item:hover {
        background: #f8f8f8;
    }
    
    .fixture-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        border-color: #37003c;
    }
`;
document.head.appendChild(style);

// Initialize when DOM and data service are ready
document.addEventListener('DOMContentLoaded', () => {
    // Load FPL data service first
    if (!window.fplLiveData) {
        const dataScript = document.createElement('script');
        dataScript.src = '/fpl-live-data-service.js';
        dataScript.onload = () => {
            // After data service loads, initialize real predictions
            setTimeout(() => {
                window.fplRealPredictions = new FPLRealPredictions();
            }, 2000); // Give data service time to load
        };
        document.head.appendChild(dataScript);
    } else {
        window.fplRealPredictions = new FPLRealPredictions();
    }
});