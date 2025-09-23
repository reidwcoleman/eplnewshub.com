/**
 * FPL Live Data Service
 * Fetches and manages real FPL data including fixtures, players, and live match data
 */

class FPLLiveDataService {
    constructor() {
        this.apiBase = 'https://fantasy.premierleague.com/api';
        this.corsProxy = 'https://corsproxy.io/?'; // CORS proxy for browser requests
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.bootstrapData = null;
        this.currentGameweek = null;
        this.fixtures = [];
        this.players = [];
        this.teams = [];
        this.liveData = null;
        
        this.init();
    }

    /**
     * Initialize the service
     */
    async init() {
        try {
            // Load bootstrap data (contains all players, teams, gameweeks)
            await this.loadBootstrapData();
            
            // Load fixtures for current gameweek
            await this.loadFixtures();
            
            // Start periodic updates
            this.startAutoUpdate();
            
            console.log('FPL Live Data Service initialized');
            console.log(`Current Gameweek: ${this.currentGameweek}`);
        } catch (error) {
            console.error('Failed to initialize FPL data service:', error);
        }
    }

    /**
     * Fetch data with CORS proxy and caching
     */
    async fetchData(endpoint) {
        const cacheKey = endpoint;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }
        
        try {
            // Use CORS proxy for browser requests
            const url = `${this.corsProxy}${this.apiBase}${endpoint}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the data
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            
            // Return cached data if available
            if (this.cache.has(cacheKey)) {
                console.log('Using cached data due to fetch error');
                return this.cache.get(cacheKey).data;
            }
            
            throw error;
        }
    }

    /**
     * Load bootstrap data (players, teams, gameweeks)
     */
    async loadBootstrapData() {
        try {
            this.bootstrapData = await this.fetchData('/bootstrap-static/');
            
            // Extract current gameweek
            const currentEvent = this.bootstrapData.events.find(e => e.is_current);
            this.currentGameweek = currentEvent ? currentEvent.id : 1;
            
            // Process teams
            this.teams = this.bootstrapData.teams.map(team => ({
                id: team.id,
                name: team.name,
                shortName: team.short_name,
                strength: team.strength,
                strengthHome: team.strength_overall_home,
                strengthAway: team.strength_overall_away
            }));
            
            // Process players
            this.players = this.bootstrapData.elements.map(player => ({
                id: player.id,
                code: player.code,
                firstName: player.first_name,
                secondName: player.second_name,
                webName: player.web_name,
                team: player.team,
                teamName: this.teams.find(t => t.id === player.team)?.name,
                position: this.getPositionName(player.element_type),
                price: player.now_cost / 10,
                totalPoints: player.total_points,
                form: parseFloat(player.form),
                pointsPerGame: parseFloat(player.points_per_game),
                selectedBy: parseFloat(player.selected_by_percent),
                transfersIn: player.transfers_in_event,
                transfersOut: player.transfers_out_event,
                news: player.news,
                chanceOfPlaying: player.chance_of_playing_next_round,
                photo: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`,
                stats: {
                    goals: player.goals_scored,
                    assists: player.assists,
                    cleanSheets: player.clean_sheets,
                    goalsConceeded: player.goals_conceded,
                    ownGoals: player.own_goals,
                    penaltiesSaved: player.penalties_saved,
                    penaltiesMissed: player.penalties_missed,
                    yellowCards: player.yellow_cards,
                    redCards: player.red_cards,
                    saves: player.saves,
                    bonus: player.bonus,
                    bps: player.bps,
                    influence: parseFloat(player.influence),
                    creativity: parseFloat(player.creativity),
                    threat: parseFloat(player.threat),
                    ictIndex: parseFloat(player.ict_index),
                    minutes: player.minutes,
                    xG: parseFloat(player.expected_goals) || 0,
                    xA: parseFloat(player.expected_assists) || 0,
                    xGI: parseFloat(player.expected_goal_involvements) || 0
                }
            }));
            
            return this.bootstrapData;
        } catch (error) {
            console.error('Failed to load bootstrap data:', error);
            throw error;
        }
    }

    /**
     * Load fixtures for current gameweek
     */
    async loadFixtures() {
        try {
            const allFixtures = await this.fetchData('/fixtures/');
            
            // Filter fixtures for current and next gameweek
            this.fixtures = allFixtures
                .filter(f => f.event === this.currentGameweek || f.event === this.currentGameweek + 1)
                .map(fixture => ({
                    id: fixture.id,
                    gameweek: fixture.event,
                    homeTeam: this.teams.find(t => t.id === fixture.team_h),
                    awayTeam: this.teams.find(t => t.id === fixture.team_a),
                    kickoffTime: new Date(fixture.kickoff_time),
                    started: fixture.started,
                    finished: fixture.finished,
                    homeScore: fixture.team_h_score,
                    awayScore: fixture.team_a_score,
                    difficulty: {
                        home: fixture.team_h_difficulty,
                        away: fixture.team_a_difficulty
                    },
                    stats: fixture.stats || []
                }));
            
            return this.fixtures;
        } catch (error) {
            console.error('Failed to load fixtures:', error);
            return [];
        }
    }

    /**
     * Get fixtures for next gameweek
     */
    getNextGameweekFixtures() {
        const nextGW = this.currentGameweek + 1;
        return this.fixtures.filter(f => f.gameweek === nextGW);
    }

    /**
     * Get current gameweek fixtures
     */
    getCurrentGameweekFixtures() {
        return this.fixtures.filter(f => f.gameweek === this.currentGameweek);
    }

    /**
     * Get live data for current gameweek
     */
    async getLiveData() {
        try {
            const liveData = await this.fetchData(`/event/${this.currentGameweek}/live/`);
            
            this.liveData = liveData.elements.map(element => {
                const player = this.players.find(p => p.id === element.id);
                return {
                    playerId: element.id,
                    playerName: player?.webName,
                    stats: element.stats,
                    explain: element.explain
                };
            });
            
            return this.liveData;
        } catch (error) {
            console.error('Failed to load live data:', error);
            return [];
        }
    }

    /**
     * Get player details
     */
    async getPlayerDetails(playerId) {
        try {
            const data = await this.fetchData(`/element-summary/${playerId}/`);
            
            return {
                history: data.history,
                fixtures: data.fixtures.map(f => ({
                    ...f,
                    opponent: this.teams.find(t => t.id === (f.is_home ? f.team_a : f.team_h))
                })),
                historyPast: data.history_past
            };
        } catch (error) {
            console.error('Failed to load player details:', error);
            return null;
        }
    }

    /**
     * Search players by name
     */
    searchPlayers(query) {
        if (!query || query.length < 2) return [];
        
        const searchTerm = query.toLowerCase();
        return this.players
            .filter(p => 
                p.webName.toLowerCase().includes(searchTerm) ||
                p.firstName.toLowerCase().includes(searchTerm) ||
                p.secondName.toLowerCase().includes(searchTerm) ||
                p.teamName.toLowerCase().includes(searchTerm)
            )
            .slice(0, 10)
            .sort((a, b) => b.totalPoints - a.totalPoints);
    }

    /**
     * Get top players by position
     */
    getTopPlayersByPosition(position, limit = 5) {
        return this.players
            .filter(p => p.position === position)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit);
    }

    /**
     * Get top players by form
     */
    getTopPlayersByForm(limit = 10) {
        return this.players
            .filter(p => p.form > 0)
            .sort((a, b) => b.form - a.form)
            .slice(0, limit);
    }

    /**
     * Get differential players (low ownership, high form)
     */
    getDifferentialPlayers(maxOwnership = 10, minForm = 5) {
        return this.players
            .filter(p => p.selectedBy <= maxOwnership && p.form >= minForm)
            .sort((a, b) => b.form - a.form)
            .slice(0, 10);
    }

    /**
     * Get players likely to score
     */
    getGoalScorerCandidates() {
        return this.players
            .filter(p => (p.position === 'FWD' || p.position === 'MID') && p.stats.xG > 0)
            .sort((a, b) => b.stats.xG - a.stats.xG)
            .slice(0, 10);
    }

    /**
     * Get clean sheet candidates
     */
    getCleanSheetCandidates() {
        const nextFixtures = this.getNextGameweekFixtures();
        const easyFixtures = nextFixtures.filter(f => 
            f.difficulty.home <= 2 || f.difficulty.away <= 2
        );
        
        const teams = [];
        easyFixtures.forEach(fixture => {
            if (fixture.difficulty.home <= 2) {
                teams.push({
                    team: fixture.homeTeam,
                    opponent: fixture.awayTeam,
                    difficulty: fixture.difficulty.home,
                    isHome: true
                });
            }
            if (fixture.difficulty.away <= 2) {
                teams.push({
                    team: fixture.awayTeam,
                    opponent: fixture.homeTeam,
                    difficulty: fixture.difficulty.away,
                    isHome: false
                });
            }
        });
        
        return teams.sort((a, b) => a.difficulty - b.difficulty);
    }

    /**
     * Get captain candidates
     */
    getCaptainCandidates() {
        const nextFixtures = this.getNextGameweekFixtures();
        const candidates = [];
        
        // Get top players with easy fixtures
        this.players
            .filter(p => p.form >= 6 && p.totalPoints >= 50)
            .forEach(player => {
                const team = this.teams.find(t => t.id === player.team);
                const fixture = nextFixtures.find(f => 
                    f.homeTeam.id === player.team || f.awayTeam.id === player.team
                );
                
                if (fixture) {
                    const isHome = fixture.homeTeam.id === player.team;
                    const difficulty = isHome ? fixture.difficulty.home : fixture.difficulty.away;
                    
                    if (difficulty <= 3) {
                        candidates.push({
                            player: player,
                            fixture: fixture,
                            difficulty: difficulty,
                            isHome: isHome,
                            score: player.form * 2 + player.totalPoints / 10 - difficulty * 3
                        });
                    }
                }
            });
        
        return candidates.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    /**
     * Get prediction suggestions for each type
     */
    getPredictionSuggestions(type) {
        switch (type) {
            case 'captain':
            case 'triple_captain':
                return this.getCaptainCandidates().map(c => ({
                    name: c.player.webName,
                    team: c.player.teamName,
                    info: `vs ${c.isHome ? c.fixture.awayTeam.name : c.fixture.homeTeam.name} (${c.isHome ? 'H' : 'A'})`,
                    confidence: Math.min(95, 50 + c.player.form * 5 + (4 - c.difficulty) * 10)
                }));
                
            case 'top_scorer':
                return this.getGoalScorerCandidates().map(p => ({
                    name: p.webName,
                    team: p.teamName,
                    info: `xG: ${p.stats.xG.toFixed(2)}, Goals: ${p.stats.goals}`,
                    confidence: Math.min(90, 40 + p.stats.xG * 20)
                }));
                
            case 'clean_sheet':
                return this.getCleanSheetCandidates().map(c => ({
                    name: c.team.name,
                    team: c.team.shortName,
                    info: `vs ${c.opponent.name} (${c.isHome ? 'H' : 'A'})`,
                    confidence: Math.min(85, 70 - c.difficulty * 15)
                }));
                
            case 'differential':
                return this.getDifferentialPlayers().map(p => ({
                    name: p.webName,
                    team: p.teamName,
                    info: `${p.selectedBy}% owned, Form: ${p.form}`,
                    confidence: Math.min(80, 30 + p.form * 8)
                }));
                
            case 'hat_trick':
                return this.getGoalScorerCandidates()
                    .filter(p => p.stats.goals >= 5)
                    .slice(0, 3)
                    .map(p => ({
                        name: p.webName,
                        team: p.teamName,
                        info: `${p.stats.goals} goals, xG: ${p.stats.xG.toFixed(2)}`,
                        confidence: Math.min(40, 10 + p.stats.goals * 2)
                    }));
                    
            case 'assist_king':
                return this.players
                    .filter(p => p.stats.assists > 0)
                    .sort((a, b) => b.stats.assists - a.stats.assists)
                    .slice(0, 5)
                    .map(p => ({
                        name: p.webName,
                        team: p.teamName,
                        info: `${p.stats.assists} assists, xA: ${p.stats.xA.toFixed(2)}`,
                        confidence: Math.min(75, 40 + p.stats.assists * 5)
                    }));
                    
            case 'transfer_in':
                return this.players
                    .filter(p => p.transfersIn > 10000 && p.form >= 5)
                    .sort((a, b) => b.transfersIn - a.transfersIn)
                    .slice(0, 5)
                    .map(p => ({
                        name: p.webName,
                        team: p.teamName,
                        info: `${(p.transfersIn / 1000).toFixed(0)}k transfers in`,
                        confidence: Math.min(70, 40 + p.form * 5)
                    }));
                    
            case 'transfer_out':
                return this.players
                    .filter(p => p.news && p.news.includes('injured'))
                    .slice(0, 5)
                    .map(p => ({
                        name: p.webName,
                        team: p.teamName,
                        info: p.news.substring(0, 30),
                        confidence: 80
                    }));
                    
            default:
                return [];
        }
    }

    /**
     * Get upcoming fixtures display
     */
    getUpcomingFixturesDisplay() {
        const fixtures = this.getNextGameweekFixtures();
        
        return fixtures.map(f => ({
            match: `${f.homeTeam.name} vs ${f.awayTeam.name}`,
            kickoff: f.kickoffTime.toLocaleString('en-GB', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            homeDifficulty: f.difficulty.home,
            awayDifficulty: f.difficulty.away
        }));
    }

    /**
     * Get position name from element type
     */
    getPositionName(elementType) {
        const positions = {
            1: 'GKP',
            2: 'DEF',
            3: 'MID',
            4: 'FWD'
        };
        return positions[elementType] || 'Unknown';
    }

    /**
     * Start automatic updates
     */
    startAutoUpdate() {
        // Update every 5 minutes
        setInterval(() => {
            this.loadBootstrapData();
            this.loadFixtures();
            
            // Update live data during matches
            const now = new Date();
            const isMatchTime = (now.getDay() >= 5 || now.getDay() <= 1) && 
                               (now.getHours() >= 11 && now.getHours() <= 23);
            
            if (isMatchTime) {
                this.getLiveData();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Check if matches are live
     */
    areMatchesLive() {
        return this.fixtures.some(f => 
            f.gameweek === this.currentGameweek && 
            f.started && 
            !f.finished
        );
    }

    /**
     * Get live match updates
     */
    async getLiveMatchUpdates() {
        if (!this.areMatchesLive()) {
            return { live: false, message: 'No matches currently live' };
        }
        
        const liveData = await this.getLiveData();
        const liveFixtures = this.fixtures.filter(f => 
            f.gameweek === this.currentGameweek && f.started && !f.finished
        );
        
        return {
            live: true,
            fixtures: liveFixtures,
            playerUpdates: liveData,
            lastUpdated: new Date()
        };
    }
}

// Create singleton instance
const fplLiveData = new FPLLiveDataService();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLLiveDataService;
}