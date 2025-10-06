// Enhanced FPL Data Service with Live Fixtures and Table Data
class FPLDataServiceEnhanced {
    constructor() {
        this.apiBase = 'https://fantasy.premierleague.com/api';
        this.corsProxy = 'https://corsproxy.io/?';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.fixtures = null;
        this.table = null;
        this.lastUpdate = null;
    }

    async fetchWithProxy(url) {
        try {
            const cachedData = this.getCached(url);
            if (cachedData) return cachedData;

            const response = await fetch(this.corsProxy + encodeURIComponent(url));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            this.setCache(url, data);
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            // Return mock data if API fails
            return this.getMockData(url);
        }
    }

    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    async getBootstrapData() {
        return await this.fetchWithProxy(`${this.apiBase}/bootstrap-static/`);
    }

    async getPlayerData() {
        const data = await this.getBootstrapData();
        return data;
    }

    async getFixtures() {
        return await this.fetchWithProxy(`${this.apiBase}/fixtures/`);
    }

    async getPlayerDetails(playerId) {
        return await this.fetchWithProxy(`${this.apiBase}/element-summary/${playerId}/`);
    }

    async getLiveData(gameweek) {
        return await this.fetchWithProxy(`${this.apiBase}/live/`);
    }

    // Get live Premier League table
    async getLiveTable() {
        // Simulate fetching from the onefootball scraper
        // In production, this would call your Flask API
        return [
            { position: 1, team: "Liverpool", played: 20, wins: 14, draws: 5, losses: 1, gd: 30, points: 47 },
            { position: 2, team: "Arsenal", played: 20, wins: 12, draws: 6, losses: 2, gd: 25, points: 42 },
            { position: 3, team: "Chelsea", played: 20, wins: 11, draws: 6, losses: 3, gd: 20, points: 39 },
            { position: 4, team: "Man City", played: 20, wins: 11, draws: 5, losses: 4, gd: 18, points: 38 },
            { position: 5, team: "Newcastle", played: 20, wins: 10, draws: 5, losses: 5, gd: 12, points: 35 },
            { position: 6, team: "Bournemouth", played: 20, wins: 9, draws: 7, losses: 4, gd: 10, points: 34 },
            { position: 7, team: "Man Utd", played: 20, wins: 9, draws: 5, losses: 6, gd: 5, points: 32 },
            { position: 8, team: "Fulham", played: 20, wins: 8, draws: 7, losses: 5, gd: 3, points: 31 },
            { position: 9, team: "Brighton", played: 20, wins: 7, draws: 9, losses: 4, gd: 2, points: 30 },
            { position: 10, team: "Tottenham", played: 20, wins: 8, draws: 3, losses: 9, gd: 8, points: 27 },
            { position: 11, team: "Brentford", played: 20, wins: 7, draws: 5, losses: 8, gd: -2, points: 26 },
            { position: 12, team: "Aston Villa", played: 20, wins: 7, draws: 5, losses: 8, gd: -4, points: 26 },
            { position: 13, team: "Nottingham", played: 20, wins: 6, draws: 7, losses: 7, gd: -4, points: 25 },
            { position: 14, team: "West Ham", played: 20, wins: 6, draws: 5, losses: 9, gd: -10, points: 23 },
            { position: 15, team: "Crystal Palace", played: 20, wins: 5, draws: 7, losses: 8, gd: -8, points: 22 },
            { position: 16, team: "Everton", played: 19, wins: 4, draws: 8, losses: 7, gd: -9, points: 20 },
            { position: 17, team: "Leicester", played: 20, wins: 4, draws: 5, losses: 11, gd: -18, points: 17 },
            { position: 18, team: "Wolves", played: 20, wins: 3, draws: 5, losses: 12, gd: -20, points: 14 },
            { position: 19, team: "Ipswich", played: 20, wins: 2, draws: 7, losses: 11, gd: -25, points: 13 },
            { position: 20, team: "Southampton", played: 20, wins: 1, draws: 3, losses: 16, gd: -35, points: 6 }
        ];
    }

    // Get upcoming fixtures
    async getUpcomingFixtures() {
        // Simulate fetching fixtures
        // In production, this would call your Flask API
        const fixtures = await this.getFixtures();
        return fixtures.filter(f => !f.finished).slice(0, 10).map(f => ({
            home: this.getTeamName(f.team_h),
            away: this.getTeamName(f.team_a),
            kickoff: f.kickoff_time,
            difficulty_h: f.team_h_difficulty,
            difficulty_a: f.team_a_difficulty
        }));
    }

    // Get team fixtures
    async getTeamFixtures(teamId) {
        const fixtures = await this.getFixtures();
        return fixtures.filter(f => f.team_h === teamId || f.team_a === teamId);
    }

    // Get player's upcoming fixtures with difficulty
    async getPlayerFixtures(player) {
        const fixtures = await this.getFixtures();
        const teamFixtures = fixtures.filter(f => 
            (f.team_h === player.team || f.team_a === player.team) && !f.finished
        ).slice(0, 5);

        return teamFixtures.map(f => {
            const isHome = f.team_h === player.team;
            return {
                opponent: isHome ? this.getTeamName(f.team_a) : this.getTeamName(f.team_h),
                venue: isHome ? 'H' : 'A',
                difficulty: isHome ? f.team_h_difficulty : f.team_a_difficulty,
                date: new Date(f.kickoff_time).toLocaleDateString()
            };
        });
    }

    // Get team form (last 5 games)
    async getTeamForm(teamId) {
        const fixtures = await this.getFixtures();
        const teamFixtures = fixtures
            .filter(f => (f.team_h === teamId || f.team_a === teamId) && f.finished)
            .slice(-5);

        return teamFixtures.map(f => {
            const isHome = f.team_h === teamId;
            const teamScore = isHome ? f.team_h_score : f.team_a_score;
            const oppScore = isHome ? f.team_a_score : f.team_h_score;
            
            let result = 'D';
            if (teamScore > oppScore) result = 'W';
            else if (teamScore < oppScore) result = 'L';
            
            return result;
        }).reverse();
    }

    // Get detailed player statistics
    async getDetailedPlayerStats(playerId) {
        const details = await this.getPlayerDetails(playerId);
        const history = details.history || [];
        const fixtures = details.fixtures || [];

        // Calculate advanced stats
        const recentForm = history.slice(-5);
        const avgPoints = recentForm.reduce((sum, gw) => sum + gw.total_points, 0) / recentForm.length;
        const avgMinutes = recentForm.reduce((sum, gw) => sum + gw.minutes, 0) / recentForm.length;
        
        return {
            recentAvgPoints: avgPoints.toFixed(1),
            recentAvgMinutes: avgMinutes.toFixed(0),
            homeForm: this.calculateVenueForm(history, 'home'),
            awayForm: this.calculateVenueForm(history, 'away'),
            upcomingFixtures: fixtures.slice(0, 5),
            seasonHistory: history,
            goalInvolvement: this.calculateGoalInvolvement(history),
            consistencyScore: this.calculateConsistency(history)
        };
    }

    calculateVenueForm(history, venue) {
        const venueGames = history.filter(g => 
            venue === 'home' ? g.was_home : !g.was_home
        ).slice(-5);
        
        if (venueGames.length === 0) return 0;
        
        const avgPoints = venueGames.reduce((sum, g) => sum + g.total_points, 0) / venueGames.length;
        return avgPoints.toFixed(1);
    }

    calculateGoalInvolvement(history) {
        const recent = history.slice(-10);
        const goals = recent.reduce((sum, g) => sum + g.goals_scored, 0);
        const assists = recent.reduce((sum, g) => sum + g.assists, 0);
        return goals + assists;
    }

    calculateConsistency(history) {
        if (history.length < 5) return 0;
        
        const recent = history.slice(-5);
        const returns = recent.filter(g => g.total_points >= 5).length;
        return (returns / 5 * 100).toFixed(0);
    }

    // Get team strength metrics
    async getTeamStrength() {
        const data = await this.getBootstrapData();
        const teams = data.teams;
        const table = await this.getLiveTable();
        
        return teams.map(team => {
            const tableData = table.find(t => 
                t.team.toLowerCase().includes(team.name.toLowerCase().split(' ')[0])
            );
            
            return {
                id: team.id,
                name: team.name,
                position: tableData ? tableData.position : 20,
                form: tableData ? (tableData.points / tableData.played * 3).toFixed(1) : 0,
                strength_home: team.strength_overall_home,
                strength_away: team.strength_overall_away,
                attack_strength: team.strength_attack_home + team.strength_attack_away,
                defence_strength: team.strength_defence_home + team.strength_defence_away
            };
        });
    }

    // Price prediction algorithm
    async predictPriceChange(player) {
        const details = await this.getPlayerDetails(player.id);
        const history = details.history || [];
        const recent = history.slice(-3);
        
        // Factors affecting price
        let priceChangeScore = 0;
        
        // Recent performance
        const recentAvg = recent.reduce((sum, g) => sum + g.total_points, 0) / recent.length;
        if (recentAvg > 6) priceChangeScore += 2;
        if (recentAvg > 8) priceChangeScore += 3;
        
        // Ownership trend
        if (player.transfers_in_event > player.transfers_out_event) {
            priceChangeScore += (player.transfers_in_event - player.transfers_out_event) / 10000;
        }
        
        // Fixture difficulty
        const upcomingFixtures = details.fixtures.slice(0, 3);
        const avgDifficulty = upcomingFixtures.reduce((sum, f) => sum + f.difficulty, 0) / upcomingFixtures.length;
        if (avgDifficulty <= 2) priceChangeScore += 2;
        
        // Calculate prediction
        let prediction = 'STABLE';
        let confidence = 50;
        
        if (priceChangeScore > 5) {
            prediction = 'RISING';
            confidence = Math.min(90, 50 + priceChangeScore * 5);
        } else if (priceChangeScore < -3) {
            prediction = 'FALLING';
            confidence = Math.min(90, 50 + Math.abs(priceChangeScore) * 5);
        }
        
        return {
            prediction,
            confidence,
            factors: {
                performance: recentAvg.toFixed(1),
                ownership: `${player.selected_by_percent}%`,
                netTransfers: player.transfers_in_event - player.transfers_out_event,
                fixtureRating: avgDifficulty.toFixed(1)
            }
        };
    }

    // Team chemistry analyzer
    async analyzeTeamChemistry(player1Id, player2Id) {
        const p1Details = await this.getPlayerDetails(player1Id);
        const p2Details = await this.getPlayerDetails(player2Id);
        
        let chemistryScore = 50; // Base score
        
        // Same team bonus
        const data = await this.getBootstrapData();
        const p1 = data.elements.find(p => p.id === player1Id);
        const p2 = data.elements.find(p => p.id === player2Id);
        
        if (p1.team === p2.team) {
            chemistryScore += 20;
        }
        
        // Complementary positions
        if ((p1.element_type === 3 && p2.element_type === 4) || 
            (p1.element_type === 4 && p2.element_type === 3)) {
            chemistryScore += 15; // Mid-Forward combo
        }
        
        // Form synchronization
        const p1Recent = p1Details.history.slice(-5);
        const p2Recent = p2Details.history.slice(-5);
        
        let syncScore = 0;
        for (let i = 0; i < p1Recent.length && i < p2Recent.length; i++) {
            if (p1Recent[i].total_points >= 5 && p2Recent[i].total_points >= 5) {
                syncScore++;
            }
        }
        chemistryScore += syncScore * 5;
        
        return {
            score: Math.min(100, chemistryScore),
            sameTeam: p1.team === p2.team,
            positionCombo: `${this.getPositionName(p1.element_type)}-${this.getPositionName(p2.element_type)}`,
            formSync: `${syncScore}/5 gameweeks`
        };
    }

    getTeamName(teamId) {
        const teams = {
            1: 'Arsenal', 2: 'Aston Villa', 3: 'Bournemouth', 4: 'Brentford',
            5: 'Brighton', 6: 'Chelsea', 7: 'Crystal Palace', 8: 'Everton',
            9: 'Fulham', 10: 'Leicester', 11: 'Liverpool', 12: 'Man City',
            13: 'Man Utd', 14: 'Newcastle', 15: 'Nottm Forest', 16: 'Southampton',
            17: 'Tottenham', 18: 'West Ham', 19: 'Wolves', 20: 'Ipswich'
        };
        return teams[teamId] || 'Unknown';
    }

    getPositionName(positionId) {
        const positions = {
            1: 'GKP',
            2: 'DEF',
            3: 'MID',
            4: 'FWD'
        };
        return positions[positionId] || 'Unknown';
    }

    // Mock data fallback
    getMockData(url) {
        console.log('Using mock data for:', url);
        
        if (url.includes('bootstrap-static')) {
            return {
                elements: this.getMockPlayers(),
                teams: this.getMockTeams(),
                events: this.getMockEvents()
            };
        }
        
        if (url.includes('fixtures')) {
            return this.getMockFixtures();
        }
        
        if (url.includes('element-summary')) {
            return this.getMockPlayerDetails();
        }
        
        return {};
    }

    getMockPlayers() {
        return [
            {
                id: 1,
                first_name: "Mohamed",
                second_name: "Salah",
                team: 11,
                element_type: 3,
                now_cost: 131,
                total_points: 134,
                points_per_game: "7.4",
                selected_by_percent: "45.2",
                form: "8.2",
                transfers_in_event: 125000,
                transfers_out_event: 45000,
                goals_scored: 15,
                assists: 8,
                clean_sheets: 0,
                bonus: 22
            },
            {
                id: 2,
                first_name: "Erling",
                second_name: "Haaland",
                team: 12,
                element_type: 4,
                now_cost: 151,
                total_points: 145,
                points_per_game: "8.1",
                selected_by_percent: "62.3",
                form: "9.1",
                transfers_in_event: 95000,
                transfers_out_event: 22000,
                goals_scored: 18,
                assists: 4,
                clean_sheets: 0,
                bonus: 25
            },
            {
                id: 3,
                first_name: "Bukayo",
                second_name: "Saka",
                team: 1,
                element_type: 3,
                now_cost: 101,
                total_points: 98,
                points_per_game: "5.8",
                selected_by_percent: "38.7",
                form: "6.3",
                transfers_in_event: 78000,
                transfers_out_event: 31000,
                goals_scored: 8,
                assists: 10,
                clean_sheets: 0,
                bonus: 18
            }
        ];
    }

    getMockTeams() {
        return [
            { id: 1, name: "Arsenal", strength_overall_home: 1350, strength_overall_away: 1320 },
            { id: 11, name: "Liverpool", strength_overall_home: 1380, strength_overall_away: 1340 },
            { id: 12, name: "Man City", strength_overall_home: 1400, strength_overall_away: 1360 }
        ];
    }

    getMockEvents() {
        return Array.from({ length: 38 }, (_, i) => ({
            id: i + 1,
            name: `Gameweek ${i + 1}`,
            finished: i < 20,
            is_current: i === 19
        }));
    }

    getMockFixtures() {
        return [
            {
                id: 1,
                team_h: 11,
                team_a: 1,
                team_h_score: null,
                team_a_score: null,
                finished: false,
                kickoff_time: "2025-01-25T15:00:00Z",
                team_h_difficulty: 4,
                team_a_difficulty: 4
            },
            {
                id: 2,
                team_h: 12,
                team_a: 6,
                team_h_score: null,
                team_a_score: null,
                finished: false,
                kickoff_time: "2025-01-25T17:30:00Z",
                team_h_difficulty: 2,
                team_a_difficulty: 5
            }
        ];
    }

    getMockPlayerDetails() {
        return {
            history: Array.from({ length: 10 }, (_, i) => ({
                round: i + 1,
                total_points: Math.floor(Math.random() * 10) + 2,
                minutes: Math.floor(Math.random() * 30) + 60,
                goals_scored: Math.random() > 0.7 ? 1 : 0,
                assists: Math.random() > 0.8 ? 1 : 0,
                was_home: Math.random() > 0.5
            })),
            fixtures: Array.from({ length: 5 }, (_, i) => ({
                id: i + 100,
                difficulty: Math.floor(Math.random() * 3) + 2,
                is_home: Math.random() > 0.5
            }))
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLDataServiceEnhanced;
}