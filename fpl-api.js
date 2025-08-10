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

        try {
            // Try without CORS proxy first (in case we're on same domain or CORS is allowed)
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
        } catch (error) {
            console.log('Direct fetch failed, trying CORS proxy...', error.message);
            
            // Try with CORS proxy
            try {
                const proxyUrl = `${this.corsProxy}${encodeURIComponent(url)}`;
                console.log(`Using CORS proxy for ${cacheKey}...`);
                
                const response = await fetch(proxyUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
                
                this.lastUpdateTime = Date.now();
                this.isLiveData = true;
                return data;
            } catch (proxyError) {
                console.log('CORS proxy failed, trying alternate proxy...', proxyError.message);
                
                // Try alternate CORS proxy
                try {
                    const alternateProxy = 'https://api.allorigins.win/raw?url=';
                    const alternateUrl = `${alternateProxy}${encodeURIComponent(url)}`;
                    
                    const response = await fetch(alternateUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    
                    this.cache.set(cacheKey, {
                        data: data,
                        timestamp: Date.now()
                    });
                    
                    this.lastUpdateTime = Date.now();
                    this.isLiveData = true;
                    return data;
                } catch (altError) {
                    console.log('All API attempts failed, using fallback data');
                    
                    // Return cached data if available
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
            }
        }
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
            return {
                elements: [],
                teams: [],
                events: [{ id: 1, name: 'Gameweek 1', is_current: true }],
                element_types: [
                    { id: 1, singular_name: 'Goalkeeper' },
                    { id: 2, singular_name: 'Defender' },
                    { id: 3, singular_name: 'Midfielder' },
                    { id: 4, singular_name: 'Forward' }
                ]
            };
        }
        return { error: 'Mock data not available' };
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