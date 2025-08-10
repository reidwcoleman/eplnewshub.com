class FPLDataService {
    constructor() {
        // Using CORS proxy to access FPL API from browser
        this.corsProxy = 'https://corsproxy.io/?';
        this.baseUrl = 'https://fantasy.premierleague.com/api/';
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for fresher data
        this.lastUpdateTime = null;
        this.isLiveData = false;
    }

    async fetchWithCache(url, cacheKey, forceRefresh = false) {
        const cached = this.cache.get(cacheKey);
        
        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`Using cached data for ${cacheKey}`);
            this.isLiveData = false;
            return cached.data;
        }

        // Array of CORS proxies to try in order
        const corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://proxy.cors.sh/',
            'https://cors-anywhere.herokuapp.com/'
        ];

        // First try direct fetch (in case CORS is allowed)
        try {
            console.log(`Attempting direct fetch for ${cacheKey}...`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Update cache with fresh data
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            this.lastUpdateTime = Date.now();
            this.isLiveData = true;
            console.log(`Live data fetched successfully for ${cacheKey}`);
            
            return data;
        } catch (directError) {
            console.log('Direct fetch failed (CORS blocked), trying proxy services...', directError.message);
        }

        // Try each CORS proxy in order
        for (const proxy of corsProxies) {
            try {
                console.log(`Trying proxy: ${proxy.split('/')[2]}...`);
                const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // Validate the data has expected structure
                if (cacheKey === 'bootstrap' && (!data.elements || !Array.isArray(data.elements))) {
                    throw new Error('Invalid bootstrap data structure');
                }
                
                // Update cache with fresh data
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                this.lastUpdateTime = Date.now();
                this.isLiveData = true;
                console.log(`Successfully fetched data using ${proxy.split('/')[2]}`);
                
                return data;
            } catch (proxyError) {
                console.log(`Proxy ${proxy.split('/')[2]} failed:`, proxyError.message);
                continue; // Try next proxy
            }
        }

        // All proxies failed, use fallback strategies
        console.log('All proxy attempts failed, checking fallback options...');
        
        // Return cached data if available (even if stale)
        if (cached) {
            console.log('Using stale cache data');
            this.isLiveData = false;
            return cached.data;
        }
        
        // Return mock data as last resort
        console.log('Using mock data as final fallback');
        this.isLiveData = false;
        return this.getMockData(cacheKey);
    }

    async getBootstrapData(forceRefresh = false) {
        return await this.fetchWithCache(
            `${this.baseUrl}bootstrap-static/`,
            'bootstrap',
            forceRefresh
        );
    }

    async getFixtures(forceRefresh = false) {
        return await this.fetchWithCache(
            `${this.baseUrl}fixtures/`,
            'fixtures',
            forceRefresh
        );
    }

    async getUpcomingFixtures(forceRefresh = false) {
        return await this.fetchWithCache(
            `${this.baseUrl}fixtures/?future=1`,
            'upcoming_fixtures',
            forceRefresh
        );
    }

    async getPlayerDetails(playerId, forceRefresh = false) {
        return await this.fetchWithCache(
            `${this.baseUrl}element-summary/${playerId}/`,
            `player_${playerId}`,
            forceRefresh
        );
    }

    async getLiveGameweekData() {
        try {
            const url = `${this.baseUrl}event-status/`;
            return await this.fetchWithCache(url, 'live_gameweek', true);
        } catch (error) {
            console.error('Failed to fetch live gameweek data:', error);
            return null;
        }
    }

    async getCurrentGameweek() {
        const bootstrap = await this.getBootstrapData();
        return bootstrap.events.find(event => event.is_current) || 
               bootstrap.events.find(event => event.is_next);
    }

    async getTopPlayers(limit = 10) {
        const bootstrap = await this.getBootstrapData();
        return bootstrap.elements
            .sort((a, b) => b.total_points - a.total_points)
            .slice(0, limit);
    }

    async getBestValuePlayers(limit = 10, minPrice = 40) {
        const bootstrap = await this.getBootstrapData();
        return bootstrap.elements
            .filter(player => player.now_cost >= minPrice)
            .map(player => ({
                ...player,
                value_ratio: player.total_points / player.now_cost
            }))
            .sort((a, b) => b.value_ratio - a.value_ratio)
            .slice(0, limit);
    }

    async getTopScorers(positionFilter = null, limit = 10) {
        const bootstrap = await this.getBootstrapData();
        let players = bootstrap.elements;
        
        if (positionFilter) {
            players = players.filter(p => p.element_type === positionFilter);
        }
        
        return players
            .sort((a, b) => b.goals_scored - a.goals_scored)
            .slice(0, limit);
    }

    async getCaptainCandidates(limit = 5) {
        const bootstrap = await this.getBootstrapData();
        const fixtures = await this.getUpcomingFixtures();
        const currentGW = await this.getCurrentGameweek();
        
        if (!currentGW) return [];
        
        const nextFixtures = fixtures.filter(f => f.event === currentGW.id);
        
        return bootstrap.elements
            .filter(player => {
                const hasFixture = nextFixtures.some(f => 
                    f.team_h === player.team || f.team_a === player.team
                );
                return hasFixture && player.total_points > 50;
            })
            .map(player => {
                const fixture = nextFixtures.find(f => 
                    f.team_h === player.team || f.team_a === player.team
                );
                const isHome = fixture && fixture.team_h === player.team;
                const team = bootstrap.teams.find(t => t.id === player.team);
                const opponent = bootstrap.teams.find(t => 
                    t.id === (isHome ? fixture.team_a : fixture.team_h)
                );
                
                return {
                    ...player,
                    fixture: {
                        opponent: opponent?.name,
                        is_home: isHome,
                        difficulty: isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty
                    },
                    team_name: team?.name
                };
            })
            .sort((a, b) => {
                const aScore = (b.form * 10) + (b.total_points / 10) - (a.fixture.difficulty * 2);
                const bScore = (a.form * 10) + (a.total_points / 10) - (b.fixture.difficulty * 2);
                return bScore - aScore;
            })
            .slice(0, limit);
    }

    async getTransferTargets() {
        const bootstrap = await this.getBootstrapData();
        const fixtures = await this.getUpcomingFixtures();
        
        const playersWithUpcomingFixtures = bootstrap.elements.map(player => {
            const playerFixtures = fixtures
                .filter(f => f.team_h === player.team || f.team_a === player.team)
                .slice(0, 3);
            
            const avgDifficulty = playerFixtures.length > 0 
                ? playerFixtures.reduce((sum, f) => {
                    const difficulty = f.team_h === player.team ? f.team_h_difficulty : f.team_a_difficulty;
                    return sum + difficulty;
                }, 0) / playerFixtures.length
                : 5;
            
            return {
                ...player,
                avg_fixture_difficulty: avgDifficulty,
                upcoming_fixtures: playerFixtures.length
            };
        });

        const transfersIn = playersWithUpcomingFixtures
            .filter(p => p.total_points > 30 && p.avg_fixture_difficulty <= 3)
            .sort((a, b) => (b.form * 10 + b.total_points / 5) - (a.form * 10 + a.total_points / 5))
            .slice(0, 5);

        const transfersOut = playersWithUpcomingFixtures
            .filter(p => p.total_points > 50 && (p.avg_fixture_difficulty >= 4 || p.form < 3))
            .sort((a, b) => (a.form + a.avg_fixture_difficulty) - (b.form + b.avg_fixture_difficulty))
            .slice(0, 5);

        return { transfersIn, transfersOut };
    }

    // Get mock data when API is unavailable
    getMockData(cacheKey) {
        if (cacheKey === 'bootstrap') {
            // Return realistic mock data for testing
            const mockPlayers = [
                { id: 1, first_name: 'Mohamed', second_name: 'Salah', team: 10, element_type: 3, now_cost: 130, total_points: 128, form: '7.2', minutes: 1890, goals_scored: 12, assists: 8, bonus: 25, selected_by_percent: '45.2', transfers_in_event: 125432, status: 'a', ict_index: '245.6', influence: '678.9', creativity: '456.7', threat: '789.0', event_points: 8 },
                { id: 2, first_name: 'Erling', second_name: 'Haaland', team: 11, element_type: 4, now_cost: 145, total_points: 156, form: '8.5', minutes: 1750, goals_scored: 18, assists: 5, bonus: 28, selected_by_percent: '62.3', transfers_in_event: 89234, status: 'a', ict_index: '289.4', influence: '789.0', creativity: '234.5', threat: '890.1', event_points: 12 },
                { id: 3, first_name: 'Bukayo', second_name: 'Saka', team: 1, element_type: 3, now_cost: 100, total_points: 112, form: '6.8', minutes: 1650, goals_scored: 8, assists: 10, bonus: 20, selected_by_percent: '35.6', transfers_in_event: 45678, status: 'a', ict_index: '198.7', influence: '567.8', creativity: '678.9', threat: '456.7', event_points: 7 },
                { id: 4, first_name: 'Trent', second_name: 'Alexander-Arnold', team: 10, element_type: 2, now_cost: 85, total_points: 98, form: '5.5', minutes: 1500, goals_scored: 2, assists: 8, bonus: 18, selected_by_percent: '28.9', transfers_in_event: 34567, status: 'a', ict_index: '156.7', influence: '456.7', creativity: '567.8', threat: '234.5', event_points: 6 },
                { id: 5, first_name: 'Kevin', second_name: 'De Bruyne', team: 11, element_type: 3, now_cost: 105, total_points: 95, form: '6.2', minutes: 1200, goals_scored: 6, assists: 12, bonus: 22, selected_by_percent: '22.4', transfers_in_event: 23456, status: 'a', ict_index: '234.5', influence: '678.9', creativity: '789.0', threat: '345.6', event_points: 9 },
                { id: 6, first_name: 'Martin', second_name: 'Odegaard', team: 1, element_type: 3, now_cost: 85, total_points: 105, form: '6.0', minutes: 1680, goals_scored: 7, assists: 6, bonus: 19, selected_by_percent: '31.2', transfers_in_event: 45678, status: 'a', ict_index: '178.9', influence: '456.7', creativity: '567.8', threat: '345.6', event_points: 5 },
                { id: 7, first_name: 'Ollie', second_name: 'Watkins', team: 2, element_type: 4, now_cost: 90, total_points: 102, form: '7.0', minutes: 1590, goals_scored: 11, assists: 4, bonus: 17, selected_by_percent: '25.7', transfers_in_event: 34567, status: 'a', ict_index: '189.0', influence: '567.8', creativity: '345.6', threat: '678.9', event_points: 10 },
                { id: 8, first_name: 'Alisson', second_name: 'Becker', team: 10, element_type: 1, now_cost: 55, total_points: 78, form: '4.5', minutes: 1530, goals_scored: 0, assists: 0, bonus: 12, selected_by_percent: '18.9', transfers_in_event: 12345, status: 'a', ict_index: '89.0', influence: '234.5', creativity: '123.4', threat: '45.6', event_points: 6 },
                { id: 9, first_name: 'Gabriel', second_name: 'Magalhaes', team: 1, element_type: 2, now_cost: 60, total_points: 85, form: '5.2', minutes: 1620, goals_scored: 3, assists: 1, bonus: 15, selected_by_percent: '22.3', transfers_in_event: 23456, status: 'a', ict_index: '123.4', influence: '345.6', creativity: '234.5', threat: '178.9', event_points: 5 },
                { id: 10, first_name: 'Cole', second_name: 'Palmer', team: 6, element_type: 3, now_cost: 115, total_points: 135, form: '8.0', minutes: 1700, goals_scored: 10, assists: 9, bonus: 24, selected_by_percent: '38.5', transfers_in_event: 56789, status: 'a', ict_index: '212.3', influence: '589.0', creativity: '678.9', threat: '567.8', event_points: 11 }
            ];

            const mockTeams = [
                { id: 1, name: 'Arsenal', strength: 4, strength_overall_home: 1300, strength_overall_away: 1250 },
                { id: 2, name: 'Aston Villa', strength: 3, strength_overall_home: 1150, strength_overall_away: 1100 },
                { id: 3, name: 'Bournemouth', strength: 2, strength_overall_home: 950, strength_overall_away: 900 },
                { id: 4, name: 'Brentford', strength: 2, strength_overall_home: 1000, strength_overall_away: 950 },
                { id: 5, name: 'Brighton', strength: 3, strength_overall_home: 1100, strength_overall_away: 1050 },
                { id: 6, name: 'Chelsea', strength: 3, strength_overall_home: 1200, strength_overall_away: 1150 },
                { id: 7, name: 'Crystal Palace', strength: 2, strength_overall_home: 1000, strength_overall_away: 950 },
                { id: 8, name: 'Everton', strength: 2, strength_overall_home: 950, strength_overall_away: 900 },
                { id: 9, name: 'Fulham', strength: 2, strength_overall_home: 1050, strength_overall_away: 1000 },
                { id: 10, name: 'Liverpool', strength: 5, strength_overall_home: 1350, strength_overall_away: 1300 },
                { id: 11, name: 'Man City', strength: 5, strength_overall_home: 1400, strength_overall_away: 1350 },
                { id: 12, name: 'Man Utd', strength: 3, strength_overall_home: 1150, strength_overall_away: 1100 },
                { id: 13, name: 'Newcastle', strength: 4, strength_overall_home: 1200, strength_overall_away: 1150 },
                { id: 14, name: 'Nottm Forest', strength: 2, strength_overall_home: 1000, strength_overall_away: 950 },
                { id: 15, name: 'Southampton', strength: 2, strength_overall_home: 900, strength_overall_away: 850 },
                { id: 16, name: 'Spurs', strength: 4, strength_overall_home: 1250, strength_overall_away: 1200 },
                { id: 17, name: 'West Ham', strength: 3, strength_overall_home: 1100, strength_overall_away: 1050 },
                { id: 18, name: 'Wolves', strength: 2, strength_overall_home: 1000, strength_overall_away: 950 },
                { id: 19, name: 'Leicester', strength: 2, strength_overall_home: 950, strength_overall_away: 900 },
                { id: 20, name: 'Ipswich', strength: 2, strength_overall_home: 900, strength_overall_away: 850 }
            ];

            return {
                elements: mockPlayers,
                teams: mockTeams,
                events: [{ id: 1, name: 'Gameweek 1', is_current: true }],
                element_types: [
                    { id: 1, singular_name: 'Goalkeeper' },
                    { id: 2, singular_name: 'Defender' },
                    { id: 3, singular_name: 'Midfielder' },
                    { id: 4, singular_name: 'Forward' }
                ]
            };
        }
        
        if (cacheKey === 'fixtures' || cacheKey === 'upcoming_fixtures') {
            return [
                { id: 1, team_h: 1, team_a: 10, event: 1, team_h_difficulty: 4, team_a_difficulty: 2 },
                { id: 2, team_h: 11, team_a: 6, event: 1, team_h_difficulty: 2, team_a_difficulty: 4 },
                { id: 3, team_h: 2, team_a: 13, event: 1, team_h_difficulty: 3, team_a_difficulty: 3 }
            ];
        }
        
        return { error: 'Mock data not available for this endpoint' };
    }

    // Utility methods
    formatPrice(price) {
        return `£${(price / 10).toFixed(1)}m`;
    }

    formatPlayerName(firstName, lastName) {
        return `${firstName} ${lastName}`.trim();
    }

    getTeamName(teamId, teams) {
        const team = teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown';
    }

    getPositionName(elementType) {
        const positions = {
            1: 'GKP',
            2: 'DEF', 
            3: 'MID',
            4: 'FWD'
        };
        return positions[elementType] || 'Unknown';
    }

    // Check if data is live
    isDataLive() {
        return this.isLiveData && this.lastUpdateTime && 
               (Date.now() - this.lastUpdateTime) < this.cacheTimeout;
    }

    // Get last update time formatted
    getLastUpdateTime() {
        if (!this.lastUpdateTime) return 'Never';
        const date = new Date(this.lastUpdateTime);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Clear cache to force fresh data
    clearCache() {
        this.cache.clear();
        console.log('Cache cleared - will fetch fresh data on next request');
    }
}

window.FPLDataService = FPLDataService;