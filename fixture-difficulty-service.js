// Fixture Difficulty Rating Service for FPL
class FixtureDifficultyService {
    constructor() {
        this.fixtureData = new Map();
        this.teamStrengths = new Map();
        this.homeAdvantage = 1.2;
        this.formWeight = 0.3;
        this.historicalWeight = 0.7;
    }

    async loadFixtures() {
        try {
            // In production, this would fetch from FPL API
            // For now, we'll generate realistic fixture difficulty ratings
            this.generateMockFixtures();
            return true;
        } catch (error) {
            console.error('Failed to load fixtures:', error);
            return false;
        }
    }

    generateMockFixtures() {
        // Team strength ratings (1-5, 5 being strongest)
        const teamRatings = {
            'Arsenal': 4.5,
            'Aston Villa': 3.5,
            'Bournemouth': 2.5,
            'Brentford': 3.0,
            'Brighton': 3.5,
            'Burnley': 2.0,
            'Chelsea': 4.0,
            'Crystal Palace': 2.5,
            'Everton': 2.5,
            'Fulham': 3.0,
            'Liverpool': 4.8,
            'Luton': 1.5,
            'Man City': 5.0,
            'Man Utd': 3.8,
            'Newcastle': 4.0,
            'Nottm Forest': 2.0,
            'Sheffield Utd': 1.5,
            'Tottenham': 4.2,
            'West Ham': 3.2,
            'Wolves': 3.0
        };

        // Generate next 10 gameweeks of fixtures for each team
        const teams = Object.keys(teamRatings);
        teams.forEach((team, teamIndex) => {
            const fixtures = [];
            
            for (let gw = 1; gw <= 10; gw++) {
                // Generate a realistic fixture
                const opponentIndex = (teamIndex + gw * 7) % teams.length;
                const opponent = teams[opponentIndex === teamIndex ? (opponentIndex + 1) % teams.length : opponentIndex];
                const isHome = gw % 2 === 0;
                
                const difficulty = this.calculateDifficulty(
                    teamRatings[team],
                    teamRatings[opponent],
                    isHome
                );
                
                fixtures.push({
                    gameweek: gw,
                    opponent,
                    isHome,
                    difficulty,
                    difficultyRating: this.getDifficultyRating(difficulty)
                });
            }
            
            this.fixtureData.set(teamIndex + 1, fixtures);
            this.teamStrengths.set(teamIndex + 1, teamRatings[team]);
        });
    }

    calculateDifficulty(teamStrength, opponentStrength, isHome) {
        let difficulty = opponentStrength;
        
        // Adjust for home/away
        if (isHome) {
            difficulty -= 0.3; // Home advantage reduces difficulty
        } else {
            difficulty += 0.3; // Away increases difficulty
        }
        
        // Consider team's own strength (stronger teams find games easier)
        difficulty = difficulty - (teamStrength - 3) * 0.2;
        
        // Clamp between 1 and 5
        return Math.max(1, Math.min(5, difficulty));
    }

    getDifficultyRating(difficulty) {
        if (difficulty <= 2) return { value: 1, color: '#00ff87', label: 'Easy' };
        if (difficulty <= 2.5) return { value: 2, color: '#40ff40', label: 'Favorable' };
        if (difficulty <= 3.5) return { value: 3, color: '#ffeb3b', label: 'Average' };
        if (difficulty <= 4) return { value: 4, color: '#ff9800', label: 'Difficult' };
        return { value: 5, color: '#f44336', label: 'Very Difficult' };
    }

    getTeamFixtures(teamId, gameweeks = 5) {
        const fixtures = this.fixtureData.get(teamId);
        if (!fixtures) return [];
        return fixtures.slice(0, gameweeks);
    }

    getAverageDifficulty(teamId, gameweeks = 5) {
        const fixtures = this.getTeamFixtures(teamId, gameweeks);
        if (fixtures.length === 0) return 3; // Default average
        
        const sum = fixtures.reduce((acc, fix) => acc + fix.difficulty, 0);
        return sum / fixtures.length;
    }

    getFixtureRun(teamId, startGW = 1, endGW = 5) {
        const fixtures = this.fixtureData.get(teamId);
        if (!fixtures) return [];
        
        return fixtures.filter(f => f.gameweek >= startGW && f.gameweek <= endGW);
    }

    compareTeamFixtures(teamIds, gameweeks = 5) {
        const comparison = [];
        
        teamIds.forEach(teamId => {
            const avgDifficulty = this.getAverageDifficulty(teamId, gameweeks);
            const fixtures = this.getTeamFixtures(teamId, gameweeks);
            
            comparison.push({
                teamId,
                avgDifficulty,
                fixtures,
                rating: this.getDifficultyRating(avgDifficulty),
                score: (5 - avgDifficulty) * 20 // Convert to 0-100 score
            });
        });
        
        return comparison.sort((a, b) => b.score - a.score);
    }

    getRotationPairs() {
        const pairs = [];
        const teams = Array.from(this.fixtureData.keys());
        
        // Find complementary fixture pairs for rotation
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const team1 = teams[i];
                const team2 = teams[j];
                
                const rotationScore = this.calculateRotationScore(team1, team2);
                
                if (rotationScore > 70) { // Good rotation pair
                    pairs.push({
                        team1,
                        team2,
                        score: rotationScore,
                        fixtures1: this.getTeamFixtures(team1, 10),
                        fixtures2: this.getTeamFixtures(team2, 10)
                    });
                }
            }
        }
        
        return pairs.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    calculateRotationScore(team1Id, team2Id) {
        const fixtures1 = this.getTeamFixtures(team1Id, 10);
        const fixtures2 = this.getTeamFixtures(team2Id, 10);
        
        if (!fixtures1.length || !fixtures2.length) return 0;
        
        let score = 0;
        const gameweeks = Math.min(fixtures1.length, fixtures2.length);
        
        for (let i = 0; i < gameweeks; i++) {
            const f1 = fixtures1[i];
            const f2 = fixtures2[i];
            
            // Good rotation when one has easy and other has difficult
            const diffDiff = Math.abs(f1.difficulty - f2.difficulty);
            const minDiff = Math.min(f1.difficulty, f2.difficulty);
            
            // Best rotation: one easy (< 2.5) when other is hard (> 3.5)
            if (minDiff <= 2.5 && diffDiff >= 1.5) {
                score += 10;
            } else if (minDiff <= 3) {
                score += 5;
            }
            
            // Bonus for home/away alternation
            if (f1.isHome !== f2.isHome) {
                score += 2;
            }
        }
        
        return score;
    }

    getBestFixtureTeams(gameweeks = 5, minStrength = 3) {
        const teams = [];
        
        this.fixtureData.forEach((fixtures, teamId) => {
            const strength = this.teamStrengths.get(teamId);
            if (strength < minStrength) return; // Skip weak teams
            
            const avgDifficulty = this.getAverageDifficulty(teamId, gameweeks);
            
            teams.push({
                teamId,
                strength,
                avgDifficulty,
                score: (strength * 20) + ((5 - avgDifficulty) * 15),
                fixtures: this.getTeamFixtures(teamId, gameweeks)
            });
        });
        
        return teams.sort((a, b) => b.score - a.score).slice(0, 5);
    }

    getFixtureTicker(teamId) {
        const fixtures = this.getTeamFixtures(teamId, 5);
        if (!fixtures.length) return '';
        
        return fixtures.map(f => {
            const rating = this.getDifficultyRating(f.difficulty);
            const prefix = f.isHome ? 'H' : 'A';
            return `<span style="background: ${rating.color}; color: white; padding: 2px 4px; border-radius: 3px; margin: 0 2px;">${prefix}</span>`;
        }).join('');
    }

    generateFixtureReport(teamId) {
        const fixtures = this.getTeamFixtures(teamId, 10);
        const avgDifficulty = this.getAverageDifficulty(teamId, 5);
        const avgDifficultyLong = this.getAverageDifficulty(teamId, 10);
        
        const easyRun = fixtures.filter(f => f.difficulty <= 2.5).length;
        const hardRun = fixtures.filter(f => f.difficulty >= 3.5).length;
        const homeGames = fixtures.filter(f => f.isHome).length;
        
        return {
            teamId,
            shortTermDifficulty: avgDifficulty,
            longTermDifficulty: avgDifficultyLong,
            easyGames: easyRun,
            hardGames: hardRun,
            homeGames,
            awayGames: fixtures.length - homeGames,
            recommendation: this.getRecommendation(avgDifficulty, avgDifficultyLong),
            fixtures
        };
    }

    getRecommendation(shortTerm, longTerm) {
        if (shortTerm <= 2.5 && longTerm <= 3) {
            return { action: 'BUY', confidence: 'HIGH', reason: 'Excellent fixtures short and long term' };
        } else if (shortTerm <= 2.5) {
            return { action: 'BUY', confidence: 'MEDIUM', reason: 'Good short-term fixtures' };
        } else if (shortTerm >= 4) {
            return { action: 'SELL', confidence: 'HIGH', reason: 'Difficult fixtures ahead' };
        } else if (longTerm <= 2.5) {
            return { action: 'HOLD', confidence: 'MEDIUM', reason: 'Fixtures improve soon' };
        } else {
            return { action: 'MONITOR', confidence: 'LOW', reason: 'Average fixtures' };
        }
    }
}

// Fixture Swing Detector
class FixtureSwingDetector {
    constructor(fixtureService) {
        this.fixtureService = fixtureService;
    }

    detectSwings(lookAhead = 6) {
        const swings = [];
        
        this.fixtureService.fixtureData.forEach((fixtures, teamId) => {
            const analysis = this.analyzeTeamSwing(teamId, fixtures, lookAhead);
            if (analysis.swingDetected) {
                swings.push(analysis);
            }
        });
        
        return swings.sort((a, b) => b.swingMagnitude - a.swingMagnitude);
    }

    analyzeTeamSwing(teamId, fixtures, lookAhead) {
        if (fixtures.length < lookAhead) return { swingDetected: false };
        
        const first3 = fixtures.slice(0, 3);
        const next3 = fixtures.slice(3, 6);
        
        const avgFirst = first3.reduce((sum, f) => sum + f.difficulty, 0) / 3;
        const avgNext = next3.reduce((sum, f) => sum + f.difficulty, 0) / 3;
        
        const swingMagnitude = avgNext - avgFirst;
        
        let swingType = 'NONE';
        if (swingMagnitude <= -1.5) {
            swingType = 'IMPROVING'; // Fixtures getting easier
        } else if (swingMagnitude >= 1.5) {
            swingType = 'WORSENING'; // Fixtures getting harder
        }
        
        return {
            teamId,
            swingDetected: swingType !== 'NONE',
            swingType,
            swingMagnitude: Math.abs(swingMagnitude),
            currentDifficulty: avgFirst,
            futureDifficulty: avgNext,
            fixtures: fixtures.slice(0, lookAhead)
        };
    }

    getTransferTargets(budget = 100) {
        const swings = this.detectSwings();
        const targets = [];
        
        swings.forEach(swing => {
            if (swing.swingType === 'IMPROVING') {
                // Get players from this team within budget
                targets.push({
                    teamId: swing.teamId,
                    reason: 'Fixtures improving significantly',
                    swingMagnitude: swing.swingMagnitude,
                    currentDifficulty: swing.currentDifficulty,
                    futureDifficulty: swing.futureDifficulty
                });
            }
        });
        
        return targets;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FixtureDifficultyService, FixtureSwingDetector };
}