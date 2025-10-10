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

    getMockBootstrapData() {
        // Mock data for when API is unavailable
        return {
            elements: [
                {
                    id: 1,
                    first_name: "Erling",
                    second_name: "Haaland",
                    team: 1,
                    element_type: 4,
                    now_cost: 150,
                    total_points: 289,
                    form: "8.5",
                    selected_by_percent: "45.2",
                    ict_index: "18.5",
                    goals_scored: 21,
                    assists: 5,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 15,
                    minutes: 2340,
                    transfers_in_event: 125000,
                    transfers_out_event: 45000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 2,
                    first_name: "Mohamed",
                    second_name: "Salah",
                    team: 2,
                    element_type: 3,
                    now_cost: 130,
                    total_points: 267,
                    form: "7.8",
                    selected_by_percent: "38.7",
                    ict_index: "17.2",
                    goals_scored: 18,
                    assists: 12,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 20,
                    minutes: 2520,
                    transfers_in_event: 189000,
                    transfers_out_event: 23000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 3,
                    first_name: "Cole",
                    second_name: "Palmer",
                    team: 3,
                    element_type: 3,
                    now_cost: 105,
                    total_points: 245,
                    form: "9.2",
                    selected_by_percent: "25.4",
                    ict_index: "16.8",
                    goals_scored: 15,
                    assists: 14,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 18,
                    minutes: 2280,
                    transfers_in_event: 234000,
                    transfers_out_event: 12000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 4,
                    first_name: "Bukayo",
                    second_name: "Saka",
                    team: 4,
                    element_type: 3,
                    now_cost: 100,
                    total_points: 198,
                    form: "6.5",
                    selected_by_percent: "32.1",
                    ict_index: "15.4",
                    goals_scored: 10,
                    assists: 9,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 12,
                    minutes: 2160,
                    transfers_in_event: 45000,
                    transfers_out_event: 67000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 5,
                    first_name: "Morgan",
                    second_name: "Gibbs-White",
                    team: 5,
                    element_type: 3,
                    now_cost: 65,
                    total_points: 156,
                    form: "7.1",
                    selected_by_percent: "8.9",
                    ict_index: "14.2",
                    goals_scored: 8,
                    assists: 7,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 8,
                    minutes: 1980,
                    transfers_in_event: 23000,
                    transfers_out_event: 5000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 6,
                    first_name: "Adam",
                    second_name: "Wharton",
                    team: 6,
                    element_type: 3,
                    now_cost: 50,
                    total_points: 134,
                    form: "6.8",
                    selected_by_percent: "4.2",
                    ict_index: "12.8",
                    goals_scored: 3,
                    assists: 5,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 6,
                    minutes: 1800,
                    transfers_in_event: 18000,
                    transfers_out_event: 3000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 7,
                    first_name: "Murillo",
                    second_name: "",
                    team: 5,
                    element_type: 2,
                    now_cost: 45,
                    total_points: 128,
                    form: "5.9",
                    selected_by_percent: "7.3",
                    ict_index: "11.5",
                    goals_scored: 2,
                    assists: 3,
                    clean_sheets: 8,
                    saves: 0,
                    bonus: 4,
                    minutes: 2100,
                    transfers_in_event: 15000,
                    transfers_out_event: 2000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 8,
                    first_name: "Jordan",
                    second_name: "Pickford",
                    team: 7,
                    element_type: 1,
                    now_cost: 52,
                    total_points: 142,
                    form: "6.2",
                    selected_by_percent: "12.5",
                    ict_index: "10.8",
                    goals_scored: 0,
                    assists: 1,
                    clean_sheets: 9,
                    saves: 98,
                    bonus: 8,
                    minutes: 2520,
                    transfers_in_event: 8000,
                    transfers_out_event: 12000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 9,
                    first_name: "Virgil",
                    second_name: "van Dijk",
                    team: 2,
                    element_type: 2,
                    now_cost: 62,
                    total_points: 156,
                    form: "7.3",
                    selected_by_percent: "18.9",
                    ict_index: "13.7",
                    goals_scored: 4,
                    assists: 2,
                    clean_sheets: 12,
                    saves: 0,
                    bonus: 10,
                    minutes: 2430,
                    transfers_in_event: 25000,
                    transfers_out_event: 8000,
                    chance_of_playing_next_round: 100
                },
                {
                    id: 10,
                    first_name: "Heung-Min",
                    second_name: "Son",
                    team: 8,
                    element_type: 3,
                    now_cost: 95,
                    total_points: 187,
                    form: "6.9",
                    selected_by_percent: "22.7",
                    ict_index: "14.9",
                    goals_scored: 12,
                    assists: 8,
                    clean_sheets: 0,
                    saves: 0,
                    bonus: 14,
                    minutes: 2250,
                    transfers_in_event: 34000,
                    transfers_out_event: 18000,
                    chance_of_playing_next_round: 100
                }
            ],
            teams: [
                { id: 1, name: "Manchester City", short_name: "MCI" },
                { id: 2, name: "Liverpool", short_name: "LIV" },
                { id: 3, name: "Chelsea", short_name: "CHE" },
                { id: 4, name: "Arsenal", short_name: "ARS" },
                { id: 5, name: "Nottingham Forest", short_name: "NFO" },
                { id: 6, name: "Crystal Palace", short_name: "CRY" },
                { id: 7, name: "Everton", short_name: "EVE" },
                { id: 8, name: "Tottenham", short_name: "TOT" }
            ],
            element_types: [
                { id: 1, singular_name: "Goalkeeper", singular_name_short: "GKP" },
                { id: 2, singular_name: "Defender", singular_name_short: "DEF" },
                { id: 3, singular_name: "Midfielder", singular_name_short: "MID" },
                { id: 4, singular_name: "Forward", singular_name_short: "FWD" }
            ]
        };
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