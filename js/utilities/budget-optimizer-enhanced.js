// Enhanced Budget Optimizer with Advanced Algorithms
class AdvancedBudgetOptimizer {
    constructor() {
        this.populationSize = 100;
        this.generations = 50;
        this.mutationRate = 0.1;
        this.eliteSize = 20;
        this.temperatureInitial = 1000;
        this.coolingRate = 0.95;
        this.fixtureData = null;
        this.injuryData = new Map();
        this.predictionModel = new PlayerPredictionModel();
    }

    // Genetic Algorithm Implementation
    async geneticAlgorithm(players, constraints) {
        let population = this.initializePopulation(players, constraints);
        let bestSquad = null;
        let bestFitness = -Infinity;

        for (let gen = 0; gen < this.generations; gen++) {
            // Evaluate fitness
            population = population.map(squad => ({
                squad,
                fitness: this.calculateFitness(squad, constraints)
            }));

            // Sort by fitness
            population.sort((a, b) => b.fitness - a.fitness);

            // Track best
            if (population[0].fitness > bestFitness) {
                bestFitness = population[0].fitness;
                bestSquad = JSON.parse(JSON.stringify(population[0].squad));
            }

            // Selection
            const parents = this.tournamentSelection(population);
            
            // Crossover and mutation
            const offspring = [];
            for (let i = 0; i < this.populationSize - this.eliteSize; i++) {
                const parent1 = parents[Math.floor(Math.random() * parents.length)];
                const parent2 = parents[Math.floor(Math.random() * parents.length)];
                
                let child = this.crossover(parent1.squad, parent2.squad, constraints);
                child = this.mutate(child, players, constraints);
                offspring.push(child);
            }

            // Elite preservation
            population = [
                ...population.slice(0, this.eliteSize).map(p => p.squad),
                ...offspring
            ];

            // Progress callback
            if (this.onProgress) {
                this.onProgress({
                    generation: gen + 1,
                    bestFitness,
                    averageFitness: population.reduce((sum, p) => sum + (p.fitness || 0), 0) / population.length
                });
            }
        }

        return bestSquad;
    }

    // Simulated Annealing Implementation
    async simulatedAnnealing(players, constraints) {
        let currentSquad = this.generateRandomSquad(players, constraints);
        let bestSquad = JSON.parse(JSON.stringify(currentSquad));
        let currentFitness = this.calculateFitness(currentSquad, constraints);
        let bestFitness = currentFitness;
        let temperature = this.temperatureInitial;

        while (temperature > 1) {
            const neighbor = this.getNeighbor(currentSquad, players, constraints);
            const neighborFitness = this.calculateFitness(neighbor, constraints);
            
            const delta = neighborFitness - currentFitness;
            
            if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
                currentSquad = neighbor;
                currentFitness = neighborFitness;
                
                if (currentFitness > bestFitness) {
                    bestFitness = currentFitness;
                    bestSquad = JSON.parse(JSON.stringify(currentSquad));
                }
            }
            
            temperature *= this.coolingRate;

            // Progress callback
            if (this.onProgress) {
                this.onProgress({
                    temperature,
                    currentFitness,
                    bestFitness
                });
            }
        }

        return bestSquad;
    }

    // Initialize population for genetic algorithm
    initializePopulation(players, constraints) {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            population.push(this.generateRandomSquad(players, constraints));
        }
        return population;
    }

    // Generate a random valid squad
    generateRandomSquad(players, constraints) {
        const squad = { 1: [], 2: [], 3: [], 4: [] };
        const usedPlayers = new Set();
        const teamCount = new Map();
        let remainingBudget = constraints.budget;

        // Required counts per position
        const requiredCounts = {
            1: 2, // GKP
            2: 5, // DEF
            3: 5, // MID
            4: 3  // FWD
        };

        // Fill each position
        for (let position = 1; position <= 4; position++) {
            const positionPlayers = players
                .filter(p => p.element_type === position)
                .filter(p => !usedPlayers.has(p.id))
                .sort(() => Math.random() - 0.5);

            const required = requiredCounts[position];
            let added = 0;

            for (const player of positionPlayers) {
                if (added >= required) break;
                
                // Check budget constraint
                if (player.now_cost > remainingBudget) continue;
                
                // Check team constraint (max 3 per team)
                const teamPlayerCount = teamCount.get(player.team) || 0;
                if (teamPlayerCount >= 3) continue;

                squad[position].push(player);
                usedPlayers.add(player.id);
                teamCount.set(player.team, teamPlayerCount + 1);
                remainingBudget -= player.now_cost;
                added++;
            }

            // Fill with cheapest if not enough added
            if (added < required) {
                const cheapest = positionPlayers
                    .filter(p => !usedPlayers.has(p.id))
                    .sort((a, b) => a.now_cost - b.now_cost)
                    .slice(0, required - added);
                
                for (const player of cheapest) {
                    squad[position].push(player);
                    usedPlayers.add(player.id);
                    const tc = teamCount.get(player.team) || 0;
                    teamCount.set(player.team, tc + 1);
                    remainingBudget -= player.now_cost;
                }
            }
        }

        return squad;
    }

    // Calculate fitness of a squad
    calculateFitness(squad, constraints) {
        let fitness = 0;
        let totalCost = 0;
        let totalPlayers = 0;

        // Base fitness from player scores
        Object.values(squad).forEach(position => {
            position.forEach(player => {
                const playerScore = this.calculateEnhancedPlayerScore(player, constraints);
                fitness += playerScore;
                totalCost += player.now_cost;
                totalPlayers++;
            });
        });

        // Validate constraints
        if (totalPlayers !== 15) return -Infinity;
        if (totalCost > constraints.budget) return -Infinity;
        if (!this.validateTeamConstraints(squad)) return -Infinity;

        // Bonus for budget efficiency
        const budgetEfficiency = (constraints.budget - totalCost) / constraints.budget;
        fitness += budgetEfficiency * 10;

        // Bonus for balanced team
        const balance = this.calculateTeamBalance(squad);
        fitness += balance * 20;

        // Fixture difficulty bonus
        if (this.fixtureData) {
            fitness += this.calculateFixtureBonus(squad) * 15;
        }

        // Captain options bonus
        const captainOptions = this.calculateCaptainOptions(squad);
        fitness += captainOptions * 10;

        return fitness;
    }

    // Enhanced player scoring with ML predictions
    calculateEnhancedPlayerScore(player, constraints) {
        let score = 0;

        // Base metrics
        const pointsPerGame = player.total_points / Math.max(player.starts || 1, 1);
        const form = parseFloat(player.form) || 0;
        const value = (player.total_points / player.now_cost) * 10;
        const ownership = parseFloat(player.selected_by_percent) || 0;

        // ML prediction component
        const prediction = this.predictionModel.predict(player);
        
        // Injury/suspension penalty
        const injuryPenalty = this.getInjuryPenalty(player);

        // Calculate weighted score
        score = (
            pointsPerGame * 0.25 +
            form * 0.20 +
            value * 0.15 +
            prediction * 0.30 +
            (100 - ownership) * 0.10 // Differential bonus
        ) * (1 - injuryPenalty);

        // Strategy-specific adjustments
        switch (constraints.strategy) {
            case 'aggressive':
                if (player.element_type === 3 || player.element_type === 4) {
                    score *= 1.2; // Boost attackers
                }
                break;
            case 'defensive':
                if (player.element_type === 1 || player.element_type === 2) {
                    score *= 1.2; // Boost defenders
                }
                break;
            case 'differential':
                if (ownership < 5) {
                    score *= 1.5; // Huge boost for differentials
                }
                break;
        }

        return score;
    }

    // Tournament selection for genetic algorithm
    tournamentSelection(population, tournamentSize = 5) {
        const selected = [];
        const targetSize = Math.floor(population.length / 2);

        for (let i = 0; i < targetSize; i++) {
            const tournament = [];
            for (let j = 0; j < tournamentSize; j++) {
                tournament.push(population[Math.floor(Math.random() * population.length)]);
            }
            tournament.sort((a, b) => b.fitness - a.fitness);
            selected.push(tournament[0]);
        }

        return selected;
    }

    // Crossover operation for genetic algorithm
    crossover(parent1, parent2, constraints) {
        const child = { 1: [], 2: [], 3: [], 4: [] };
        const usedPlayers = new Set();
        const teamCount = new Map();

        // For each position, randomly select from parents
        for (let position = 1; position <= 4; position++) {
            const pool = [...parent1[position], ...parent2[position]];
            const unique = Array.from(new Set(pool.map(p => p.id)))
                .map(id => pool.find(p => p.id === id))
                .filter(p => !usedPlayers.has(p.id));

            const required = position === 1 ? 2 : position === 2 ? 5 : position === 3 ? 5 : 3;
            
            // Randomly select from pool
            const selected = unique
                .sort(() => Math.random() - 0.5)
                .slice(0, required)
                .filter(player => {
                    const tc = teamCount.get(player.team) || 0;
                    return tc < 3;
                });

            selected.forEach(player => {
                child[position].push(player);
                usedPlayers.add(player.id);
                const tc = teamCount.get(player.team) || 0;
                teamCount.set(player.team, tc + 1);
            });
        }

        return this.repairSquad(child, parent1, parent2, constraints);
    }

    // Mutation operation for genetic algorithm
    mutate(squad, players, constraints) {
        if (Math.random() > this.mutationRate) return squad;

        const newSquad = JSON.parse(JSON.stringify(squad));
        const position = Math.floor(Math.random() * 4) + 1;
        const positionPlayers = newSquad[position];
        
        if (positionPlayers.length === 0) return squad;

        const playerIndex = Math.floor(Math.random() * positionPlayers.length);
        const oldPlayer = positionPlayers[playerIndex];

        // Find replacement
        const candidates = players
            .filter(p => p.element_type === position)
            .filter(p => !newSquad[position].some(sp => sp.id === p.id))
            .filter(p => Math.abs(p.now_cost - oldPlayer.now_cost) <= 10);

        if (candidates.length > 0) {
            const newPlayer = candidates[Math.floor(Math.random() * candidates.length)];
            newSquad[position][playerIndex] = newPlayer;
        }

        return this.validateSquadConstraints(newSquad, constraints) ? newSquad : squad;
    }

    // Get neighbor squad for simulated annealing
    getNeighbor(squad, players, constraints) {
        const newSquad = JSON.parse(JSON.stringify(squad));
        const changeType = Math.random();

        if (changeType < 0.5) {
            // Swap within position
            const position = Math.floor(Math.random() * 4) + 1;
            const positionPlayers = newSquad[position];
            
            if (positionPlayers.length >= 2) {
                const idx1 = Math.floor(Math.random() * positionPlayers.length);
                const idx2 = Math.floor(Math.random() * positionPlayers.length);
                
                if (idx1 !== idx2) {
                    [positionPlayers[idx1], positionPlayers[idx2]] = 
                    [positionPlayers[idx2], positionPlayers[idx1]];
                }
            }
        } else {
            // Replace player
            const position = Math.floor(Math.random() * 4) + 1;
            const positionPlayers = newSquad[position];
            
            if (positionPlayers.length > 0) {
                const playerIndex = Math.floor(Math.random() * positionPlayers.length);
                const oldPlayer = positionPlayers[playerIndex];
                
                const candidates = players
                    .filter(p => p.element_type === position)
                    .filter(p => !newSquad[position].some(sp => sp.id === p.id))
                    .filter(p => Math.abs(p.now_cost - oldPlayer.now_cost) <= 15);
                
                if (candidates.length > 0) {
                    const newPlayer = candidates[Math.floor(Math.random() * candidates.length)];
                    newSquad[position][playerIndex] = newPlayer;
                }
            }
        }

        return this.validateSquadConstraints(newSquad, constraints) ? newSquad : squad;
    }

    // Validate team constraints
    validateTeamConstraints(squad) {
        const teamCount = new Map();
        let totalPlayers = 0;

        Object.values(squad).forEach(position => {
            position.forEach(player => {
                const count = teamCount.get(player.team) || 0;
                teamCount.set(player.team, count + 1);
                totalPlayers++;
            });
        });

        // Check max 3 players per team
        for (const [team, count] of teamCount) {
            if (count > 3) return false;
        }

        // Check total players
        if (totalPlayers !== 15) return false;

        // Check position requirements
        if (squad[1].length !== 2) return false; // 2 GKP
        if (squad[2].length !== 5) return false; // 5 DEF
        if (squad[3].length !== 5) return false; // 5 MID
        if (squad[4].length !== 3) return false; // 3 FWD

        return true;
    }

    // Validate all squad constraints
    validateSquadConstraints(squad, constraints) {
        if (!this.validateTeamConstraints(squad)) return false;

        let totalCost = 0;
        Object.values(squad).forEach(position => {
            position.forEach(player => {
                totalCost += player.now_cost;
            });
        });

        return totalCost <= constraints.budget;
    }

    // Repair invalid squad
    repairSquad(squad, parent1, parent2, constraints) {
        // This would implement logic to fix invalid squads
        // For now, return the squad if valid, otherwise return parent1
        return this.validateSquadConstraints(squad, constraints) ? squad : parent1;
    }

    // Calculate team balance score
    calculateTeamBalance(squad) {
        let balance = 0;
        
        // Check for good distribution of funds
        const positionCosts = {};
        Object.entries(squad).forEach(([position, players]) => {
            positionCosts[position] = players.reduce((sum, p) => sum + p.now_cost, 0);
        });

        // Ideal distribution ratios
        const idealRatios = { 1: 0.08, 2: 0.28, 3: 0.38, 4: 0.26 };
        const totalCost = Object.values(positionCosts).reduce((sum, cost) => sum + cost, 0);

        Object.entries(idealRatios).forEach(([position, ideal]) => {
            const actual = positionCosts[position] / totalCost;
            const diff = Math.abs(actual - ideal);
            balance += (1 - diff) * 10;
        });

        return balance;
    }

    // Calculate fixture difficulty bonus
    calculateFixtureBonus(squad) {
        if (!this.fixtureData) return 0;
        
        let bonus = 0;
        Object.values(squad).forEach(position => {
            position.forEach(player => {
                const fixtures = this.fixtureData.get(player.team);
                if (fixtures) {
                    // Calculate average difficulty of next 5 fixtures
                    const avgDifficulty = fixtures.slice(0, 5).reduce((sum, f) => sum + f, 0) / 5;
                    bonus += (5 - avgDifficulty); // Lower difficulty = higher bonus
                }
            });
        });
        
        return bonus;
    }

    // Calculate captain options score
    calculateCaptainOptions(squad) {
        let captainScore = 0;
        const captainCandidates = [];

        Object.values(squad).forEach(position => {
            position.forEach(player => {
                if (player.total_points > 100) {
                    captainCandidates.push(player);
                    captainScore += player.total_points / 100;
                }
            });
        });

        // Bonus for having multiple captain options
        if (captainCandidates.length >= 2) captainScore *= 1.5;
        if (captainCandidates.length >= 3) captainScore *= 2;

        return captainScore;
    }

    // Get injury penalty for player
    getInjuryPenalty(player) {
        const status = this.injuryData.get(player.id);
        if (!status) return 0;

        switch (status) {
            case 'doubtful': return 0.5;
            case 'injured': return 0.8;
            case 'suspended': return 1.0;
            default: return 0;
        }
    }

    // Set fixture data
    setFixtureData(data) {
        this.fixtureData = data;
    }

    // Set injury data
    setInjuryData(data) {
        this.injuryData = data;
    }

    // Set progress callback
    setProgressCallback(callback) {
        this.onProgress = callback;
    }
}

// Machine Learning Player Prediction Model
class PlayerPredictionModel {
    constructor() {
        this.weights = {
            form: 0.3,
            totalPoints: 0.2,
            minutesPlayed: 0.15,
            goalsScored: 0.1,
            assists: 0.1,
            cleanSheets: 0.05,
            bonus: 0.05,
            influence: 0.05
        };
    }

    predict(player) {
        // Simple weighted prediction model
        const features = this.extractFeatures(player);
        let prediction = 0;

        Object.entries(features).forEach(([feature, value]) => {
            prediction += (this.weights[feature] || 0) * value;
        });

        // Add trend analysis
        const trend = this.analyzeTrend(player);
        prediction *= (1 + trend * 0.1);

        // Add position-specific adjustments
        prediction *= this.getPositionMultiplier(player.element_type);

        return Math.min(Math.max(prediction, 0), 100); // Clamp between 0-100
    }

    extractFeatures(player) {
        return {
            form: parseFloat(player.form) || 0,
            totalPoints: player.total_points / 38, // Normalize by max games
            minutesPlayed: player.minutes / 3420, // Normalize by max minutes
            goalsScored: (player.goals_scored || 0) / 30, // Normalize
            assists: (player.assists || 0) / 20, // Normalize
            cleanSheets: (player.clean_sheets || 0) / 20, // Normalize
            bonus: (player.bonus || 0) / 100, // Normalize
            influence: parseFloat(player.influence || 0) / 1000 // Normalize
        };
    }

    analyzeTrend(player) {
        // Analyze recent form trend
        const recentForm = parseFloat(player.form) || 0;
        const seasonAvg = player.total_points / Math.max(player.starts || 1, 1);
        
        if (recentForm > seasonAvg * 1.2) return 1; // Upward trend
        if (recentForm < seasonAvg * 0.8) return -1; // Downward trend
        return 0; // Stable
    }

    getPositionMultiplier(position) {
        // Position-specific scoring tendencies
        switch (position) {
            case 1: return 0.7; // GKP
            case 2: return 0.8; // DEF
            case 3: return 1.0; // MID
            case 4: return 1.1; // FWD
            default: return 1.0;
        }
    }

    // Train the model with historical data (placeholder)
    train(historicalData) {
        // This would implement actual ML training
        // For now, we use predefined weights
        console.log('Training model with', historicalData.length, 'samples');
    }
}

// Export for use in main optimizer
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedBudgetOptimizer, PlayerPredictionModel };
}