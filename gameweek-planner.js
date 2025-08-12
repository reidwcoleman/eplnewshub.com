// Multi-Gameweek Planning and Transfer Suggestion System
class GameweekPlanner {
    constructor(fixtureService, squadManager) {
        this.fixtureService = fixtureService;
        this.squadManager = squadManager;
        this.planHorizon = 6; // Plan 6 gameweeks ahead
        this.freeTransfers = 1;
        this.maxHits = 8; // Maximum point hits to consider
        this.wildcardsAvailable = 2;
        this.benchBoostAvailable = true;
        this.tripleCaptainAvailable = true;
        this.freeHitAvailable = true;
    }

    // Create a multi-gameweek transfer plan
    createTransferPlan(currentSquad, targetGameweeks = 6, budget = 0) {
        const plan = {
            gameweeks: [],
            totalTransfers: 0,
            totalHits: 0,
            projectedPoints: 0,
            chipStrategy: this.planChipUsage(targetGameweeks),
            keyMilestones: []
        };

        let workingSquad = JSON.parse(JSON.stringify(currentSquad));
        let availableFT = this.freeTransfers;
        let remainingBudget = budget;

        for (let gw = 1; gw <= targetGameweeks; gw++) {
            const gwPlan = this.planGameweek(
                workingSquad,
                gw,
                availableFT,
                remainingBudget
            );

            plan.gameweeks.push(gwPlan);
            
            // Update working squad with transfers
            if (gwPlan.transfers.length > 0) {
                workingSquad = this.applyTransfers(workingSquad, gwPlan.transfers);
                remainingBudget += gwPlan.netCost;
                plan.totalTransfers += gwPlan.transfers.length;
                plan.totalHits += gwPlan.hits;
            }

            // Update free transfers
            availableFT = Math.min(2, availableFT - gwPlan.transfers.length + 1);
            if (availableFT < 0) availableFT = 1;

            plan.projectedPoints += gwPlan.projectedPoints;
        }

        // Identify key milestones
        plan.keyMilestones = this.identifyMilestones(plan.gameweeks);

        return plan;
    }

    // Plan transfers for a specific gameweek
    planGameweek(squad, gameweek, freeTransfers, budget) {
        const gwPlan = {
            gameweek,
            transfers: [],
            captain: null,
            viceCaptain: null,
            bench: [],
            projectedPoints: 0,
            hits: 0,
            netCost: 0,
            chip: null,
            reasoning: []
        };

        // Analyze fixture difficulty for this gameweek
        const fixtureAnalysis = this.analyzeGameweekFixtures(squad, gameweek);
        
        // Identify problem players (bad fixtures, injuries, suspensions)
        const problemPlayers = this.identifyProblemPlayers(squad, gameweek);
        
        // Find transfer targets
        const targets = this.findTransferTargets(squad, gameweek, budget);
        
        // Optimize transfers
        const optimalTransfers = this.optimizeTransfers(
            problemPlayers,
            targets,
            freeTransfers,
            budget
        );

        gwPlan.transfers = optimalTransfers.transfers;
        gwPlan.hits = Math.max(0, (optimalTransfers.transfers.length - freeTransfers) * 4);
        gwPlan.netCost = optimalTransfers.netCost;

        // Select captain and vice-captain
        const captaincy = this.selectCaptaincy(squad, gameweek);
        gwPlan.captain = captaincy.captain;
        gwPlan.viceCaptain = captaincy.viceCaptain;

        // Optimize bench
        gwPlan.bench = this.optimizeBench(squad, gameweek);

        // Calculate projected points
        gwPlan.projectedPoints = this.calculateProjectedPoints(squad, gameweek) - gwPlan.hits;

        // Add reasoning
        gwPlan.reasoning = this.generateReasoning(
            optimalTransfers,
            captaincy,
            fixtureAnalysis
        );

        return gwPlan;
    }

    // Analyze fixtures for a gameweek
    analyzeGameweekFixtures(squad, gameweek) {
        const analysis = {
            averageDifficulty: 0,
            easiestFixtures: [],
            hardestFixtures: [],
            recommendations: []
        };

        const players = this.squadManager.flattenSquad(squad.squad);
        let totalDifficulty = 0;
        const fixtures = [];

        players.forEach(player => {
            const teamFixtures = this.fixtureService.getTeamFixtures(player.team, 1);
            if (teamFixtures && teamFixtures[0]) {
                const fixture = teamFixtures[0];
                fixtures.push({
                    player,
                    fixture,
                    difficulty: fixture.difficulty
                });
                totalDifficulty += fixture.difficulty;
            }
        });

        analysis.averageDifficulty = totalDifficulty / players.length;
        
        // Sort by difficulty
        fixtures.sort((a, b) => a.difficulty - b.difficulty);
        analysis.easiestFixtures = fixtures.slice(0, 5);
        analysis.hardestFixtures = fixtures.slice(-5);

        // Generate recommendations
        if (analysis.averageDifficulty > 3.5) {
            analysis.recommendations.push('Consider using Free Hit or making multiple transfers');
        }
        if (analysis.easiestFixtures[0]?.difficulty < 2) {
            analysis.recommendations.push(`Captain ${analysis.easiestFixtures[0].player.second_name}`);
        }

        return analysis;
    }

    // Identify players that should be transferred out
    identifyProblemPlayers(squad, gameweek) {
        const problems = [];
        const players = this.squadManager.flattenSquad(squad.squad);

        players.forEach(player => {
            const issues = [];
            let priority = 0;

            // Check fixtures
            const avgDifficulty = this.fixtureService.getAverageDifficulty(player.team, 3);
            if (avgDifficulty > 4) {
                issues.push('Difficult fixtures');
                priority += 3;
            }

            // Check form
            if (parseFloat(player.form) < 2) {
                issues.push('Poor form');
                priority += 2;
            }

            // Check injuries (would need real injury data)
            if (player.chance_of_playing_this_round && player.chance_of_playing_this_round < 75) {
                issues.push('Injury doubt');
                priority += 5;
            }

            // Check value drop risk
            if (player.transfers_out_event > player.transfers_in_event * 2) {
                issues.push('Price falling');
                priority += 1;
            }

            if (issues.length > 0) {
                problems.push({
                    player,
                    issues,
                    priority,
                    gameweek
                });
            }
        });

        return problems.sort((a, b) => b.priority - a.priority);
    }

    // Find optimal transfer targets
    findTransferTargets(squad, gameweek, budget) {
        const targets = {
            goalkeepers: [],
            defenders: [],
            midfielders: [],
            forwards: []
        };

        // Get all players (would come from data service)
        const allPlayers = []; // This would be populated from the data service

        // Filter and score potential targets
        allPlayers.forEach(player => {
            // Skip if already in squad
            if (this.isInSquad(player, squad)) return;

            // Check if affordable
            if (player.now_cost > budget + 50) return; // Some flexibility

            const score = this.scoreTransferTarget(player, gameweek);
            
            const target = {
                player,
                score,
                fixtures: this.fixtureService.getTeamFixtures(player.team, 3),
                reasoning: this.getTargetReasoning(player, score)
            };

            // Add to appropriate position list
            switch (player.element_type) {
                case 1: targets.goalkeepers.push(target); break;
                case 2: targets.defenders.push(target); break;
                case 3: targets.midfielders.push(target); break;
                case 4: targets.forwards.push(target); break;
            }
        });

        // Sort each position by score
        Object.keys(targets).forEach(position => {
            targets[position].sort((a, b) => b.score - a.score);
            targets[position] = targets[position].slice(0, 10); // Top 10 per position
        });

        return targets;
    }

    // Score a potential transfer target
    scoreTransferTarget(player, gameweek) {
        let score = 0;

        // Form and performance
        score += parseFloat(player.form) * 10;
        score += (player.total_points / Math.max(player.starts, 1)) * 5;

        // Fixtures
        const avgDifficulty = this.fixtureService.getAverageDifficulty(player.team, 3);
        score += (5 - avgDifficulty) * 15;

        // Value
        const value = player.total_points / player.now_cost;
        score += value * 20;

        // Differential potential
        if (player.selected_by_percent < 10) {
            score += 10;
        }

        // Momentum (transfers)
        const momentum = (player.transfers_in_event - player.transfers_out_event) / 10000;
        score += momentum;

        return score;
    }

    // Optimize transfer combinations
    optimizeTransfers(problems, targets, freeTransfers, budget) {
        const optimization = {
            transfers: [],
            netCost: 0,
            pointsGain: 0
        };

        // Simple greedy approach for now
        const topProblems = problems.slice(0, Math.min(3, problems.length));
        
        topProblems.forEach(problem => {
            const position = problem.player.element_type;
            const positionTargets = this.getTargetsByPosition(targets, position);
            
            if (positionTargets.length > 0) {
                const bestTarget = positionTargets[0];
                
                if (bestTarget.player.now_cost <= budget + problem.player.now_cost) {
                    optimization.transfers.push({
                        out: problem.player,
                        in: bestTarget.player,
                        cost: bestTarget.player.now_cost - problem.player.now_cost
                    });
                    
                    optimization.netCost += bestTarget.player.now_cost - problem.player.now_cost;
                    optimization.pointsGain += bestTarget.score - problem.priority;
                }
            }
        });

        // Limit transfers based on hits tolerance
        if (optimization.transfers.length > freeTransfers) {
            const hits = (optimization.transfers.length - freeTransfers) * 4;
            if (hits > this.maxHits) {
                // Reduce to acceptable number
                optimization.transfers = optimization.transfers
                    .sort((a, b) => b.pointsGain - a.pointsGain)
                    .slice(0, freeTransfers + Math.floor(this.maxHits / 4));
            }
        }

        return optimization;
    }

    // Select captain and vice-captain
    selectCaptaincy(squad, gameweek) {
        const players = this.squadManager.flattenSquad(squad.squad);
        const candidates = [];

        players.forEach(player => {
            const score = this.calculateCaptainScore(player, gameweek);
            candidates.push({ player, score });
        });

        candidates.sort((a, b) => b.score - a.score);

        return {
            captain: candidates[0]?.player,
            viceCaptain: candidates[1]?.player,
            reasoning: this.getCaptaincyReasoning(candidates[0], candidates[1])
        };
    }

    // Calculate captain score
    calculateCaptainScore(player, gameweek) {
        let score = 0;

        // Base on form and points
        score += parseFloat(player.form) * 15;
        score += player.total_points / 10;

        // Fixture difficulty
        const difficulty = this.fixtureService.getAverageDifficulty(player.team, 1);
        score += (5 - difficulty) * 20;

        // Home/away
        const fixtures = this.fixtureService.getTeamFixtures(player.team, 1);
        if (fixtures[0]?.isHome) {
            score += 10;
        }

        // Position bonus (attackers preferred)
        if (player.element_type === 4) score *= 1.2; // Forwards
        if (player.element_type === 3) score *= 1.1; // Midfielders

        // Penalty takers get bonus
        if (player.penalties_order && player.penalties_order <= 1) {
            score += 15;
        }

        return score;
    }

    // Optimize bench order
    optimizeBench(squad, gameweek) {
        const bench = [];
        const players = this.squadManager.flattenSquad(squad.squad);
        
        // Identify likely bench players (worst 4 excluding GK)
        const outfield = players.filter(p => p.element_type !== 1);
        outfield.sort((a, b) => {
            const scoreA = this.calculateBenchScore(a, gameweek);
            const scoreB = this.calculateBenchScore(b, gameweek);
            return scoreA - scoreB;
        });

        // Take worst 3 outfield players for bench
        bench.push(...outfield.slice(0, 3));
        
        // Add backup GK
        const goalkeepers = players.filter(p => p.element_type === 1);
        if (goalkeepers.length > 1) {
            bench.push(goalkeepers[1]);
        }

        // Order bench by likelihood of playing
        bench.sort((a, b) => {
            const chanceA = a.chance_of_playing_this_round || 100;
            const chanceB = b.chance_of_playing_this_round || 100;
            return chanceB - chanceA;
        });

        return bench.slice(0, 4);
    }

    // Calculate bench priority score
    calculateBenchScore(player, gameweek) {
        let score = 0;
        
        // Fixture difficulty (harder fixtures = more likely to bench)
        const difficulty = this.fixtureService.getAverageDifficulty(player.team, 1);
        score += difficulty * 10;
        
        // Form (poor form = more likely to bench)
        score -= parseFloat(player.form) * 5;
        
        // Playing time (less minutes = more likely to bench)
        score += (1 - player.minutes / 3420) * 20;
        
        return score;
    }

    // Plan chip usage strategy
    planChipUsage(gameweeks) {
        const chipPlan = {
            wildcard1: null,
            wildcard2: null,
            benchBoost: null,
            tripleCaptain: null,
            freeHit: null,
            reasoning: []
        };

        // Analyze best gameweeks for each chip
        for (let gw = 1; gw <= gameweeks; gw++) {
            const gwAnalysis = this.analyzeChipPotential(gw);
            
            // Wildcard for major squad overhaul
            if (gwAnalysis.wildcardScore > 80 && !chipPlan.wildcard1) {
                chipPlan.wildcard1 = gw;
                chipPlan.reasoning.push(`Wildcard GW${gw}: Major fixture swing opportunity`);
            }
            
            // Bench Boost for double gameweeks or easy fixtures
            if (gwAnalysis.benchBoostScore > 75 && !chipPlan.benchBoost) {
                chipPlan.benchBoost = gw;
                chipPlan.reasoning.push(`Bench Boost GW${gw}: Favorable fixtures for entire squad`);
            }
            
            // Triple Captain for best fixture
            if (gwAnalysis.tripleCaptainScore > 85 && !chipPlan.tripleCaptain) {
                chipPlan.tripleCaptain = gw;
                chipPlan.reasoning.push(`Triple Captain GW${gw}: Premium captain with excellent fixture`);
            }
            
            // Free Hit for blank or difficult gameweek
            if (gwAnalysis.freeHitScore > 70 && !chipPlan.freeHit) {
                chipPlan.freeHit = gw;
                chipPlan.reasoning.push(`Free Hit GW${gw}: Navigate blank/difficult gameweek`);
            }
        }

        return chipPlan;
    }

    // Analyze chip potential for a gameweek
    analyzeChipPotential(gameweek) {
        return {
            wildcardScore: Math.random() * 100, // Would use real analysis
            benchBoostScore: Math.random() * 100,
            tripleCaptainScore: Math.random() * 100,
            freeHitScore: Math.random() * 100
        };
    }

    // Apply transfers to squad
    applyTransfers(squad, transfers) {
        const newSquad = JSON.parse(JSON.stringify(squad));
        
        transfers.forEach(transfer => {
            // Remove outgoing player
            Object.keys(newSquad.squad).forEach(position => {
                newSquad.squad[position] = newSquad.squad[position].filter(
                    p => p.id !== transfer.out.id
                );
            });
            
            // Add incoming player
            const position = transfer.in.element_type;
            if (!newSquad.squad[position]) {
                newSquad.squad[position] = [];
            }
            newSquad.squad[position].push(transfer.in);
        });
        
        return newSquad;
    }

    // Calculate projected points for gameweek
    calculateProjectedPoints(squad, gameweek) {
        let points = 0;
        const players = this.squadManager.flattenSquad(squad.squad);
        
        players.forEach(player => {
            // Simple projection based on form and fixtures
            const basePoints = parseFloat(player.form) * 1.5;
            const fixtureDifficulty = this.fixtureService.getAverageDifficulty(player.team, 1);
            const fixtureMultiplier = (6 - fixtureDifficulty) / 5;
            
            points += basePoints * fixtureMultiplier;
        });
        
        return Math.round(points);
    }

    // Identify key milestones in the plan
    identifyMilestones(gameweeks) {
        const milestones = [];
        
        gameweeks.forEach(gw => {
            if (gw.chip) {
                milestones.push({
                    gameweek: gw.gameweek,
                    type: 'chip',
                    description: `Use ${gw.chip} chip`,
                    impact: 'high'
                });
            }
            
            if (gw.transfers.length >= 3) {
                milestones.push({
                    gameweek: gw.gameweek,
                    type: 'transfers',
                    description: `Make ${gw.transfers.length} transfers`,
                    impact: 'medium'
                });
            }
            
            if (gw.projectedPoints > 70) {
                milestones.push({
                    gameweek: gw.gameweek,
                    type: 'highScore',
                    description: `Projected ${gw.projectedPoints} points`,
                    impact: 'high'
                });
            }
        });
        
        return milestones;
    }

    // Generate reasoning for decisions
    generateReasoning(transfers, captaincy, fixtures) {
        const reasoning = [];
        
        if (transfers.transfers.length > 0) {
            reasoning.push(`Making ${transfers.transfers.length} transfers to improve fixtures and form`);
        }
        
        if (captaincy.captain) {
            reasoning.push(`Captain ${captaincy.captain.second_name} due to favorable fixture`);
        }
        
        if (fixtures.averageDifficulty < 2.5) {
            reasoning.push('Excellent fixtures this gameweek - expect high scores');
        } else if (fixtures.averageDifficulty > 3.5) {
            reasoning.push('Difficult fixtures - consider defensive approach');
        }
        
        return reasoning;
    }

    // Helper methods
    isInSquad(player, squad) {
        const players = this.squadManager.flattenSquad(squad.squad);
        return players.some(p => p.id === player.id);
    }

    getTargetsByPosition(targets, position) {
        switch (position) {
            case 1: return targets.goalkeepers;
            case 2: return targets.defenders;
            case 3: return targets.midfielders;
            case 4: return targets.forwards;
            default: return [];
        }
    }

    getTargetReasoning(player, score) {
        const reasons = [];
        
        if (parseFloat(player.form) > 6) {
            reasons.push('Excellent form');
        }
        
        if (player.selected_by_percent < 10) {
            reasons.push('Differential pick');
        }
        
        const avgDifficulty = this.fixtureService.getAverageDifficulty(player.team, 3);
        if (avgDifficulty < 2.5) {
            reasons.push('Great fixtures');
        }
        
        return reasons.join(', ');
    }

    getCaptaincyReasoning(captain, vice) {
        const reasons = [];
        
        if (captain) {
            reasons.push(`${captain.player.second_name}: ${captain.score.toFixed(0)} captain score`);
        }
        
        if (vice) {
            reasons.push(`${vice.player.second_name} as vice: ${vice.score.toFixed(0)} score`);
        }
        
        return reasons.join('; ');
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameweekPlanner };
}