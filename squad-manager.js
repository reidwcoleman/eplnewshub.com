// Squad Manager with Save/Load and Comparison Features
class SquadManager {
    constructor() {
        this.savedSquads = this.loadFromStorage();
        this.currentSquad = null;
        this.comparisonSquads = [];
        this.transferHistory = [];
        this.optimizationHistory = [];
    }

    // Save squad to local storage
    saveSquad(squad, name = null) {
        const squadData = {
            id: this.generateId(),
            name: name || `Squad ${new Date().toLocaleDateString()}`,
            dateCreated: new Date().toISOString(),
            squad: squad.squad,
            totalCost: squad.totalCost,
            formation: this.getFormation(squad.squad),
            predictedPoints: squad.predictedPoints,
            valueScore: squad.valueScore,
            strategy: squad.strategy || 'balanced',
            metadata: {
                captain: squad.captain,
                viceCaptain: squad.viceCaptain,
                benchBoost: squad.benchBoost || false,
                tripleCaption: squad.tripleCaption || false,
                freeHit: squad.freeHit || false
            }
        };

        this.savedSquads.push(squadData);
        this.saveToStorage();
        this.currentSquad = squadData;
        
        return squadData.id;
    }

    // Load squad from storage
    loadSquad(squadId) {
        const squad = this.savedSquads.find(s => s.id === squadId);
        if (squad) {
            this.currentSquad = squad;
            return squad;
        }
        return null;
    }

    // Get all saved squads
    getSavedSquads() {
        return this.savedSquads.sort((a, b) => 
            new Date(b.dateCreated) - new Date(a.dateCreated)
        );
    }

    // Delete squad
    deleteSquad(squadId) {
        this.savedSquads = this.savedSquads.filter(s => s.id !== squadId);
        this.saveToStorage();
        
        if (this.currentSquad && this.currentSquad.id === squadId) {
            this.currentSquad = null;
        }
    }

    // Compare two squads
    compareSquads(squad1Id, squad2Id) {
        const squad1 = this.savedSquads.find(s => s.id === squad1Id);
        const squad2 = this.savedSquads.find(s => s.id === squad2Id);
        
        if (!squad1 || !squad2) return null;

        const comparison = {
            squad1: squad1.name,
            squad2: squad2.name,
            costDiff: squad1.totalCost - squad2.totalCost,
            pointsDiff: squad1.predictedPoints - squad2.predictedPoints,
            valueDiff: parseFloat(squad1.valueScore) - parseFloat(squad2.valueScore),
            playerDifferences: this.getPlayerDifferences(squad1.squad, squad2.squad),
            formationDiff: this.compareFormations(squad1.formation, squad2.formation),
            metrics: this.compareMetrics(squad1, squad2)
        };

        return comparison;
    }

    // Get player differences between squads
    getPlayerDifferences(squad1, squad2) {
        const differences = {
            onlyInSquad1: [],
            onlyInSquad2: [],
            common: []
        };

        const squad1Players = this.flattenSquad(squad1);
        const squad2Players = this.flattenSquad(squad2);
        
        const squad1Ids = new Set(squad1Players.map(p => p.id));
        const squad2Ids = new Set(squad2Players.map(p => p.id));

        squad1Players.forEach(player => {
            if (!squad2Ids.has(player.id)) {
                differences.onlyInSquad1.push(player);
            } else {
                differences.common.push(player);
            }
        });

        squad2Players.forEach(player => {
            if (!squad1Ids.has(player.id)) {
                differences.onlyInSquad2.push(player);
            }
        });

        return differences;
    }

    // Compare squad metrics
    compareMetrics(squad1, squad2) {
        return {
            costEfficiency: {
                squad1: squad1.predictedPoints / (squad1.totalCost / 10),
                squad2: squad2.predictedPoints / (squad2.totalCost / 10),
                better: null // Will be calculated
            },
            teamDiversity: {
                squad1: this.calculateTeamDiversity(squad1.squad),
                squad2: this.calculateTeamDiversity(squad2.squad),
                better: null
            },
            premiumCount: {
                squad1: this.countPremiumPlayers(squad1.squad),
                squad2: this.countPremiumPlayers(squad2.squad),
                better: null
            },
            captainOptions: {
                squad1: this.countCaptainOptions(squad1.squad),
                squad2: this.countCaptainOptions(squad2.squad),
                better: null
            },
            averageOwnership: {
                squad1: this.calculateAverageOwnership(squad1.squad),
                squad2: this.calculateAverageOwnership(squad2.squad),
                better: null
            }
        };
    }

    // Multi-squad comparison
    compareMultipleSquads(squadIds) {
        const squads = squadIds.map(id => this.savedSquads.find(s => s.id === id))
                               .filter(s => s !== null);
        
        if (squads.length < 2) return null;

        const comparison = {
            squads: squads.map(s => ({
                id: s.id,
                name: s.name,
                cost: s.totalCost,
                points: s.predictedPoints,
                value: s.valueScore
            })),
            bestByMetric: {
                cost: null,
                points: null,
                value: null,
                efficiency: null
            },
            rankings: this.rankSquads(squads),
            commonPlayers: this.findCommonPlayers(squads),
            uniquePlayers: this.findUniquePlayers(squads)
        };

        // Determine best by each metric
        comparison.bestByMetric.cost = squads.reduce((min, s) => 
            s.totalCost < min.totalCost ? s : min
        ).id;
        
        comparison.bestByMetric.points = squads.reduce((max, s) => 
            s.predictedPoints > max.predictedPoints ? s : max
        ).id;
        
        comparison.bestByMetric.value = squads.reduce((max, s) => 
            parseFloat(s.valueScore) > parseFloat(max.valueScore) ? s : max
        ).id;

        return comparison;
    }

    // Calculate transfer requirements
    calculateTransfers(fromSquad, toSquad) {
        const from = this.flattenSquad(fromSquad.squad);
        const to = this.flattenSquad(toSquad.squad);
        
        const fromIds = new Set(from.map(p => p.id));
        const toIds = new Set(to.map(p => p.id));
        
        const transfers = {
            out: from.filter(p => !toIds.has(p.id)),
            in: to.filter(p => !fromIds.has(p.id)),
            count: 0,
            cost: 0,
            hits: 0
        };
        
        transfers.count = Math.max(transfers.out.length, transfers.in.length);
        
        // Calculate cost difference
        const outCost = transfers.out.reduce((sum, p) => sum + p.now_cost, 0);
        const inCost = transfers.in.reduce((sum, p) => sum + p.now_cost, 0);
        transfers.cost = inCost - outCost;
        
        // Calculate hits (assuming 1 free transfer)
        transfers.hits = Math.max(0, transfers.count - 1) * 4;
        
        return transfers;
    }

    // Squad optimization tracking
    trackOptimization(squad, algorithm, duration, iterations) {
        const record = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            algorithm,
            duration,
            iterations,
            squadId: squad.id || null,
            result: {
                cost: squad.totalCost,
                points: squad.predictedPoints,
                value: squad.valueScore
            }
        };
        
        this.optimizationHistory.push(record);
        this.saveOptimizationHistory();
        
        return record;
    }

    // Get optimization history
    getOptimizationHistory(limit = 10) {
        return this.optimizationHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Export squad to FPL format
    exportToFPL(squadId) {
        const squad = this.savedSquads.find(s => s.id === squadId);
        if (!squad) return null;

        const fplFormat = {
            picks: [],
            chips: [],
            transfers: {
                in: [],
                out: [],
                bank: squad.totalCost ? (1000 - squad.totalCost) : 0
            }
        };

        // Convert squad to FPL picks format
        let position = 0;
        Object.values(squad.squad).forEach(positionPlayers => {
            positionPlayers.forEach(player => {
                position++;
                fplFormat.picks.push({
                    element: player.id,
                    position,
                    selling_price: player.now_cost,
                    multiplier: player.id === squad.metadata?.captain ? 2 : 1,
                    is_captain: player.id === squad.metadata?.captain,
                    is_vice_captain: player.id === squad.metadata?.viceCaptain
                });
            });
        });

        return fplFormat;
    }

    // Share squad via URL
    generateShareableLink(squadId) {
        const squad = this.savedSquads.find(s => s.id === squadId);
        if (!squad) return null;

        // Compress squad data
        const shareData = {
            n: squad.name,
            f: squad.formation,
            p: this.flattenSquad(squad.squad).map(p => p.id),
            c: squad.totalCost
        };

        const encoded = btoa(JSON.stringify(shareData));
        return `${window.location.origin}/budget-optimizer.html?squad=${encoded}`;
    }

    // Import squad from URL
    importFromLink(encodedData) {
        try {
            const decoded = JSON.parse(atob(encodedData));
            // Reconstruct squad from player IDs
            // This would need access to player data to rebuild full squad
            return decoded;
        } catch (error) {
            console.error('Failed to import squad:', error);
            return null;
        }
    }

    // Helper methods
    flattenSquad(squad) {
        const players = [];
        Object.values(squad).forEach(position => {
            players.push(...position);
        });
        return players;
    }

    getFormation(squad) {
        const def = squad[2]?.length || 0;
        const mid = squad[3]?.length || 0;
        const fwd = squad[4]?.length || 0;
        return `${def}-${mid}-${fwd}`;
    }

    compareFormations(f1, f2) {
        return f1 === f2 ? 'Same' : `${f1} vs ${f2}`;
    }

    calculateTeamDiversity(squad) {
        const teams = new Set();
        this.flattenSquad(squad).forEach(p => teams.add(p.team));
        return teams.size;
    }

    countPremiumPlayers(squad, threshold = 100) {
        return this.flattenSquad(squad).filter(p => p.now_cost >= threshold).length;
    }

    countCaptainOptions(squad, minPoints = 100) {
        return this.flattenSquad(squad).filter(p => p.total_points >= minPoints).length;
    }

    calculateAverageOwnership(squad) {
        const players = this.flattenSquad(squad);
        const total = players.reduce((sum, p) => sum + parseFloat(p.selected_by_percent || 0), 0);
        return (total / players.length).toFixed(1);
    }

    rankSquads(squads) {
        // Create rankings for different metrics
        const rankings = {
            byPoints: [...squads].sort((a, b) => b.predictedPoints - a.predictedPoints),
            byValue: [...squads].sort((a, b) => parseFloat(b.valueScore) - parseFloat(a.valueScore)),
            byCost: [...squads].sort((a, b) => a.totalCost - b.totalCost),
            byEfficiency: [...squads].sort((a, b) => {
                const effA = a.predictedPoints / (a.totalCost / 10);
                const effB = b.predictedPoints / (b.totalCost / 10);
                return effB - effA;
            })
        };

        return rankings;
    }

    findCommonPlayers(squads) {
        if (squads.length === 0) return [];
        
        const allPlayerSets = squads.map(s => 
            new Set(this.flattenSquad(s.squad).map(p => p.id))
        );
        
        const common = [...allPlayerSets[0]].filter(id => 
            allPlayerSets.every(set => set.has(id))
        );
        
        // Get full player objects
        const firstSquadPlayers = this.flattenSquad(squads[0].squad);
        return common.map(id => firstSquadPlayers.find(p => p.id === id));
    }

    findUniquePlayers(squads) {
        const unique = new Map();
        
        squads.forEach(squad => {
            const players = this.flattenSquad(squad.squad);
            players.forEach(player => {
                if (!unique.has(player.id)) {
                    unique.set(player.id, {
                        player,
                        squads: [squad.id]
                    });
                } else {
                    unique.get(player.id).squads.push(squad.id);
                }
            });
        });
        
        // Filter to only players in one squad
        const uniquePlayers = [];
        unique.forEach((value, key) => {
            if (value.squads.length === 1) {
                uniquePlayers.push({
                    ...value.player,
                    squadId: value.squads[0]
                });
            }
        });
        
        return uniquePlayers;
    }

    // Storage methods
    saveToStorage() {
        localStorage.setItem('fpl_saved_squads', JSON.stringify(this.savedSquads));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('fpl_saved_squads');
        return saved ? JSON.parse(saved) : [];
    }

    saveOptimizationHistory() {
        localStorage.setItem('fpl_optimization_history', JSON.stringify(this.optimizationHistory));
    }

    loadOptimizationHistory() {
        const saved = localStorage.getItem('fpl_optimization_history');
        return saved ? JSON.parse(saved) : [];
    }

    generateId() {
        return 'squad_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Clear all data
    clearAllData() {
        this.savedSquads = [];
        this.optimizationHistory = [];
        this.currentSquad = null;
        localStorage.removeItem('fpl_saved_squads');
        localStorage.removeItem('fpl_optimization_history');
    }
}

// Differential Analysis Tool
class DifferentialAnalyzer {
    constructor() {
        this.ownershipThresholds = {
            differential: 5,
            lowOwned: 10,
            medium: 30,
            highOwned: 50,
            essential: 70
        };
    }

    analyzeDifferentials(players, currentGameweek = 1) {
        const analysis = {
            topDifferentials: [],
            risingStars: [],
            fallingGiants: [],
            hiddenGems: [],
            templateBreakers: []
        };

        // Categorize players
        players.forEach(player => {
            const ownership = parseFloat(player.selected_by_percent) || 0;
            const form = parseFloat(player.form) || 0;
            const transfersNet = (player.transfers_in_event || 0) - (player.transfers_out_event || 0);
            
            // Top differentials (low owned, high performing)
            if (ownership < this.ownershipThresholds.differential && form > 6) {
                analysis.topDifferentials.push({
                    ...player,
                    differentialScore: this.calculateDifferentialScore(player)
                });
            }
            
            // Rising stars (increasing ownership rapidly)
            if (transfersNet > 50000 && ownership < this.ownershipThresholds.medium) {
                analysis.risingStars.push({
                    ...player,
                    momentum: transfersNet
                });
            }
            
            // Falling giants (decreasing ownership, still expensive)
            if (transfersNet < -50000 && player.now_cost > 90) {
                analysis.fallingGiants.push({
                    ...player,
                    momentum: transfersNet
                });
            }
            
            // Hidden gems (cheap, good returns)
            if (player.now_cost < 55 && player.total_points > 50) {
                analysis.hiddenGems.push({
                    ...player,
                    valueRatio: player.total_points / player.now_cost
                });
            }
            
            // Template breakers (alternatives to highly owned)
            if (ownership > this.ownershipThresholds.essential) {
                const alternatives = this.findAlternatives(player, players);
                if (alternatives.length > 0) {
                    analysis.templateBreakers.push({
                        template: player,
                        alternatives: alternatives.slice(0, 3)
                    });
                }
            }
        });

        // Sort by relevance
        analysis.topDifferentials.sort((a, b) => b.differentialScore - a.differentialScore);
        analysis.risingStars.sort((a, b) => b.momentum - a.momentum);
        analysis.fallingGiants.sort((a, b) => a.momentum - b.momentum);
        analysis.hiddenGems.sort((a, b) => b.valueRatio - a.valueRatio);

        return analysis;
    }

    calculateDifferentialScore(player) {
        const ownership = parseFloat(player.selected_by_percent) || 0;
        const form = parseFloat(player.form) || 0;
        const value = player.total_points / player.now_cost;
        
        // Lower ownership = higher differential potential
        const ownershipScore = (100 - ownership) / 10;
        
        // Combined score
        return (form * 2) + (value * 10) + ownershipScore;
    }

    findAlternatives(templatePlayer, allPlayers) {
        return allPlayers
            .filter(p => 
                p.element_type === templatePlayer.element_type &&
                p.id !== templatePlayer.id &&
                Math.abs(p.now_cost - templatePlayer.now_cost) <= 10 &&
                parseFloat(p.selected_by_percent) < this.ownershipThresholds.lowOwned
            )
            .map(p => ({
                ...p,
                comparisonScore: this.compareToTemplate(p, templatePlayer)
            }))
            .sort((a, b) => b.comparisonScore - a.comparisonScore)
            .slice(0, 5);
    }

    compareToTemplate(player, template) {
        const pointsDiff = player.total_points - template.total_points;
        const costDiff = template.now_cost - player.now_cost;
        const ownershipDiff = template.selected_by_percent - player.selected_by_percent;
        
        return (pointsDiff / 10) + (costDiff / 5) + (ownershipDiff / 10);
    }

    getMiniLeagueDifferentials(players, miniLeagueSize = 20) {
        // Simulate mini-league ownership patterns
        const effectiveOwnership = players.map(player => ({
            ...player,
            miniLeagueOwnership: this.estimateMiniLeagueOwnership(
                player.selected_by_percent,
                miniLeagueSize
            )
        }));

        return effectiveOwnership
            .filter(p => p.miniLeagueOwnership < 20 && parseFloat(p.form) > 5)
            .sort((a, b) => parseFloat(b.form) - parseFloat(a.form))
            .slice(0, 10);
    }

    estimateMiniLeagueOwnership(overallOwnership, leagueSize) {
        // Statistical estimation of mini-league ownership
        const owned = parseFloat(overallOwnership) || 0;
        const probability = owned / 100;
        const expectedOwners = probability * leagueSize;
        
        // Add some variance for realism
        const variance = Math.random() * 0.2 - 0.1;
        return Math.max(0, Math.min(100, (expectedOwners / leagueSize) * 100 * (1 + variance)));
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SquadManager, DifferentialAnalyzer };
}