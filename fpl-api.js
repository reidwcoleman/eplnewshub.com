class FPLDataService {
    constructor() {
        this.baseUrl = 'https://fantasy.premierleague.com/api/';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }

    async fetchWithCache(url, cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('FPL API Error:', error);
            if (cached) {
                console.log('Using stale cache data due to API error');
                return cached.data;
            }
            throw error;
        }
    }

    async getBootstrapData() {
        return await this.fetchWithCache(
            `${this.baseUrl}bootstrap-static/`,
            'bootstrap'
        );
    }

    async getFixtures() {
        return await this.fetchWithCache(
            `${this.baseUrl}fixtures/`,
            'fixtures'
        );
    }

    async getUpcomingFixtures() {
        return await this.fetchWithCache(
            `${this.baseUrl}fixtures/?future=1`,
            'upcoming_fixtures'
        );
    }

    async getPlayerDetails(playerId) {
        return await this.fetchWithCache(
            `${this.baseUrl}element-summary/${playerId}/`,
            `player_${playerId}`
        );
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
}

window.FPLDataService = FPLDataService;