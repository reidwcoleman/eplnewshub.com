/**
 * FPL Ultra Predictions System
 * Enhanced prediction system with multiple predictions per gameweek
 */

class FPLUltraPredictionsSystem {
    constructor() {
        this.db = null;
        this.userPredictions = [];
        this.predictionTypes = {
            CAPTAIN: 'captain',
            TRIPLE_CAPTAIN: 'triple_captain',
            BENCH_BOOST: 'bench_boost',
            TOP_SCORER: 'top_scorer',
            CLEAN_SHEET: 'clean_sheet',
            DIFFERENTIAL: 'differential',
            TRANSFER_IN: 'transfer_in',
            TRANSFER_OUT: 'transfer_out',
            POINTS_TARGET: 'points_target',
            RANK_TARGET: 'rank_target',
            HAT_TRICK: 'hat_trick',
            RED_CARD: 'red_card',
            OWN_GOAL: 'own_goal',
            PENALTY_SAVE: 'penalty_save',
            ASSIST_KING: 'assist_king'
        };
        
        // Scoring system for different prediction types
        this.scoringSystem = {
            captain: { correct: 50, partial: 20 },
            triple_captain: { correct: 100, partial: 40 },
            bench_boost: { correct: 40, partial: 15 },
            top_scorer: { correct: 75, partial: 30 },
            clean_sheet: { correct: 30, partial: 10 },
            differential: { correct: 60, partial: 25 },
            transfer_in: { correct: 35, partial: 15 },
            transfer_out: { correct: 35, partial: 15 },
            points_target: { correct: 45, partial: 20 },
            rank_target: { correct: 55, partial: 25 },
            hat_trick: { correct: 150, partial: 0 },
            red_card: { correct: 80, partial: 0 },
            own_goal: { correct: 100, partial: 0 },
            penalty_save: { correct: 120, partial: 0 },
            assist_king: { correct: 65, partial: 25 }
        };
        
        // Limits per gameweek (optional - can be unlimited)
        this.predictionLimits = {
            maxPerType: 3, // Max predictions of same type per gameweek
            maxTotal: 20, // Max total predictions per gameweek
            bonusSlots: 5 // Extra slots for premium users
        };
        
        this.predictionCallbacks = new Set();
        this.init();
    }

    /**
     * Initialize enhanced predictions system
     */
    async init() {
        await this.initDatabase();
        
        // Listen for auth state changes
        if (window.fplAuth) {
            fplAuth.onAuthStateChange((isAuthenticated, user) => {
                if (isAuthenticated) {
                    this.loadUserPredictions(user.id);
                } else {
                    this.clearPredictions();
                }
            });
        }
        
        // Set up real-time updates
        this.setupRealtimeTracking();
    }

    /**
     * Initialize database with enhanced schema
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FPLUltraPredictionsDB', 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Enhanced predictions store
                if (!db.objectStoreNames.contains('predictions')) {
                    const store = db.createObjectStore('predictions', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    store.createIndex('userId', 'userId', { unique: false });
                    store.createIndex('gameweek', 'gameweek', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('userGameweekType', ['userId', 'gameweek', 'type'], { unique: false });
                }
                
                // Results store with enhanced tracking
                if (!db.objectStoreNames.contains('results')) {
                    const resultsStore = db.createObjectStore('results', { 
                        keyPath: 'predictionId' 
                    });
                    resultsStore.createIndex('userId', 'userId', { unique: false });
                    resultsStore.createIndex('gameweek', 'gameweek', { unique: false });
                    resultsStore.createIndex('accuracy', 'accuracy', { unique: false });
                }
                
                // Achievements store
                if (!db.objectStoreNames.contains('achievements')) {
                    const achievementsStore = db.createObjectStore('achievements', { 
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    achievementsStore.createIndex('userId', 'userId', { unique: false });
                    achievementsStore.createIndex('type', 'type', { unique: false });
                    achievementsStore.createIndex('unlockedAt', 'unlockedAt', { unique: false });
                }
            };
        });
    }

    /**
     * Submit a new prediction (allows multiple per gameweek)
     */
    async submitPrediction(predictionData) {
        if (!fplAuth.isAuthenticated()) {
            return {
                success: false,
                message: 'Please login to submit predictions'
            };
        }

        try {
            const user = fplAuth.getCurrentUser();
            const gameweek = await this.getCurrentGameweek();

            // Check prediction limits (optional)
            const limitCheck = await this.checkPredictionLimits(user.id, gameweek, predictionData.type);
            if (!limitCheck.allowed) {
                return {
                    success: false,
                    message: limitCheck.message,
                    limitsReached: true
                };
            }

            // Validate prediction
            const validation = this.validatePrediction(predictionData);
            if (!validation.valid) {
                return {
                    success: false,
                    message: validation.message
                };
            }

            // Calculate potential points
            const potentialPoints = this.calculatePotentialPoints(predictionData);

            // Create enhanced prediction object
            const prediction = {
                userId: user.id,
                username: user.username,
                gameweek: gameweek,
                type: predictionData.type,
                data: {
                    playerId: predictionData.playerId || null,
                    playerName: predictionData.playerName || null,
                    team: predictionData.team || null,
                    value: predictionData.value || null,
                    details: predictionData.details || {},
                    confidence: predictionData.confidence || 50,
                    stake: predictionData.stake || 10 // Points wagered
                },
                timestamp: Date.now(),
                status: 'pending',
                points: 0,
                potentialPoints: potentialPoints,
                deadline: this.getGameweekDeadline(gameweek),
                tags: predictionData.tags || [],
                visibility: predictionData.visibility || 'private' // private, friends, public
            };

            // Save to database
            const savedPrediction = await this.savePrediction(prediction);

            // Update user stats
            await this.updateUserStats(user.id, 'predictions_made');
            
            // Check for achievements
            await this.checkAchievements(user.id, savedPrediction);

            // Add to local cache
            this.userPredictions.push(savedPrediction);
            
            // Notify listeners
            this.notifyPredictionsUpdate();

            return {
                success: true,
                prediction: savedPrediction,
                message: `Prediction submitted! Potential: ${potentialPoints} points`,
                remainingSlots: limitCheck.remaining
            };
        } catch (error) {
            console.error('Prediction submission error:', error);
            return {
                success: false,
                message: 'Failed to submit prediction'
            };
        }
    }

    /**
     * Check prediction limits
     */
    async checkPredictionLimits(userId, gameweek, type) {
        // Get all user predictions for this gameweek
        const gameweekPredictions = await this.getUserGameweekPredictions(userId, gameweek);
        
        // Count predictions by type
        const typeCount = gameweekPredictions.filter(p => p.type === type).length;
        const totalCount = gameweekPredictions.length;
        
        // Check if user is premium (would be determined by subscription status)
        const isPremium = await this.isUserPremium(userId);
        const maxTotal = this.predictionLimits.maxTotal + (isPremium ? this.predictionLimits.bonusSlots : 0);
        
        // Check limits
        if (typeCount >= this.predictionLimits.maxPerType) {
            return {
                allowed: false,
                message: `You've reached the maximum ${this.predictionLimits.maxPerType} predictions of this type for this gameweek`,
                remaining: 0
            };
        }
        
        if (totalCount >= maxTotal) {
            return {
                allowed: false,
                message: `You've reached your maximum ${maxTotal} predictions for this gameweek`,
                remaining: 0
            };
        }
        
        return {
            allowed: true,
            remaining: maxTotal - totalCount - 1
        };
    }

    /**
     * Get all predictions for a user in a specific gameweek
     */
    async getUserGameweekPredictions(userId, gameweek) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['predictions'], 'readonly');
            const store = transaction.objectStore('predictions');
            const index = store.index('userId');
            
            const request = index.getAll(userId);
            
            request.onsuccess = () => {
                const predictions = request.result || [];
                const filtered = predictions.filter(p => p.gameweek === gameweek);
                resolve(filtered);
            };
            
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Get active predictions grouped by type
     */
    async getActivePredictionsByType() {
        if (!fplAuth.isAuthenticated()) {
            return {};
        }

        const user = fplAuth.getCurrentUser();
        const gameweek = await this.getCurrentGameweek();
        const predictions = await this.getUserGameweekPredictions(user.id, gameweek);
        
        // Group by type
        const grouped = {};
        Object.values(this.predictionTypes).forEach(type => {
            grouped[type] = predictions.filter(p => p.type === type && p.status === 'pending');
        });
        
        return grouped;
    }

    /**
     * Calculate potential points based on prediction
     */
    calculatePotentialPoints(predictionData) {
        const basePoints = this.scoringSystem[predictionData.type]?.correct || 50;
        const confidenceMultiplier = 1 + (predictionData.confidence - 50) / 100; // 0.5x to 1.5x
        const stakeMultiplier = (predictionData.stake || 10) / 10; // Default 1x
        
        return Math.round(basePoints * confidenceMultiplier * stakeMultiplier);
    }

    /**
     * Update prediction result with partial scoring
     */
    async updatePredictionResult(predictionId, result) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['predictions', 'results'], 'readwrite');
            const predictionsStore = transaction.objectStore('predictions');
            const resultsStore = transaction.objectStore('results');
            
            // Get prediction
            const getRequest = predictionsStore.get(predictionId);
            
            getRequest.onsuccess = () => {
                const prediction = getRequest.result;
                if (!prediction) {
                    reject(new Error('Prediction not found'));
                    return;
                }
                
                // Calculate points based on accuracy
                let points = 0;
                let accuracy = 'miss';
                
                if (result.correct) {
                    points = this.scoringSystem[prediction.type]?.correct || 50;
                    accuracy = 'correct';
                } else if (result.partial) {
                    points = this.scoringSystem[prediction.type]?.partial || 20;
                    accuracy = 'partial';
                }
                
                // Apply confidence and stake multipliers
                const confidenceMultiplier = 1 + (prediction.data.confidence - 50) / 100;
                const stakeMultiplier = (prediction.data.stake || 10) / 10;
                points = Math.round(points * confidenceMultiplier * stakeMultiplier);
                
                // Update prediction
                prediction.status = result.correct ? 'success' : (result.partial ? 'partial' : 'failed');
                prediction.points = points;
                predictionsStore.put(prediction);
                
                // Save detailed result
                const resultData = {
                    predictionId: predictionId,
                    userId: prediction.userId,
                    gameweek: prediction.gameweek,
                    accuracy: accuracy,
                    points: points,
                    actual: result.actual,
                    expected: prediction.data,
                    details: result.details || {},
                    calculatedAt: Date.now()
                };
                
                resultsStore.put(resultData);
                
                // Update user stats
                this.updateUserStats(prediction.userId, 'total_points', points);
                if (result.correct) {
                    this.updateUserStats(prediction.userId, 'predictions_correct');
                } else if (result.partial) {
                    this.updateUserStats(prediction.userId, 'predictions_partial');
                }
                
                // Check for achievements
                this.checkResultAchievements(prediction.userId, resultData);
                
                resolve(resultData);
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Get prediction statistics with enhanced metrics
     */
    async getUserPredictionStats(userId = null) {
        if (!userId && fplAuth.isAuthenticated()) {
            userId = fplAuth.getCurrentUser().id;
        }

        const history = await this.getUserPredictionHistory(userId);
        
        if (history.length === 0) {
            return this.getEmptyStats();
        }

        // Calculate comprehensive statistics
        const stats = {
            totalPredictions: history.length,
            successful: history.filter(p => p.status === 'success').length,
            partial: history.filter(p => p.status === 'partial').length,
            failed: history.filter(p => p.status === 'failed').length,
            pending: history.filter(p => p.status === 'pending').length,
            totalPoints: history.reduce((sum, p) => sum + (p.points || 0), 0),
            averagePoints: 0,
            averageConfidence: history.reduce((sum, p) => sum + (p.data.confidence || 0), 0) / history.length,
            totalStaked: history.reduce((sum, p) => sum + (p.data.stake || 10), 0)
        };

        stats.averagePoints = Math.round(stats.totalPoints / stats.totalPredictions);
        stats.successRate = stats.totalPredictions > 0 
            ? ((stats.successful / (stats.successful + stats.partial + stats.failed)) * 100).toFixed(1)
            : 0;
        stats.partialRate = stats.totalPredictions > 0
            ? ((stats.partial / (stats.successful + stats.partial + stats.failed)) * 100).toFixed(1)
            : 0;

        // ROI (Return on Investment)
        stats.roi = stats.totalStaked > 0
            ? (((stats.totalPoints - stats.totalStaked) / stats.totalStaked) * 100).toFixed(1)
            : 0;

        // Best and worst predictions
        stats.bestPrediction = history.reduce((best, current) => 
            (current.points || 0) > (best?.points || 0) ? current : best, 
            null
        );
        
        stats.worstPrediction = history
            .filter(p => p.status === 'failed')
            .reduce((worst, current) => 
                (current.data.stake || 10) > (worst?.data.stake || 0) ? current : worst, 
                null
            );

        // Calculate streaks
        const streaks = this.calculateStreaks(history);
        stats.currentStreak = streaks.current;
        stats.bestStreak = streaks.best;
        
        // Stats by prediction type
        stats.byType = {};
        Object.values(this.predictionTypes).forEach(type => {
            const typePredictions = history.filter(p => p.type === type);
            if (typePredictions.length > 0) {
                const successful = typePredictions.filter(p => p.status === 'success').length;
                const partial = typePredictions.filter(p => p.status === 'partial').length;
                const total = successful + partial + typePredictions.filter(p => p.status === 'failed').length;
                
                stats.byType[type] = {
                    total: typePredictions.length,
                    successful: successful,
                    partial: partial,
                    successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : 0,
                    points: typePredictions.reduce((sum, p) => sum + (p.points || 0), 0),
                    averagePoints: Math.round(typePredictions.reduce((sum, p) => sum + (p.points || 0), 0) / typePredictions.length)
                };
            }
        });

        // Recent form (last 10 predictions)
        stats.recentForm = history
            .filter(p => p.status !== 'pending')
            .slice(0, 10)
            .map(p => {
                if (p.status === 'success') return 'W';
                if (p.status === 'partial') return 'D';
                return 'L';
            });

        // Weekly performance
        stats.weeklyPerformance = this.calculateWeeklyPerformance(history);

        return stats;
    }

    /**
     * Calculate weekly performance trends
     */
    calculateWeeklyPerformance(history) {
        const weeks = {};
        
        history.forEach(prediction => {
            const week = prediction.gameweek;
            if (!weeks[week]) {
                weeks[week] = {
                    gameweek: week,
                    predictions: 0,
                    points: 0,
                    successful: 0,
                    partial: 0,
                    failed: 0
                };
            }
            
            weeks[week].predictions++;
            weeks[week].points += prediction.points || 0;
            
            if (prediction.status === 'success') weeks[week].successful++;
            else if (prediction.status === 'partial') weeks[week].partial++;
            else if (prediction.status === 'failed') weeks[week].failed++;
        });
        
        return Object.values(weeks).sort((a, b) => b.gameweek - a.gameweek);
    }

    /**
     * Calculate prediction streaks
     */
    calculateStreaks(history) {
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        const sorted = history
            .filter(p => p.status !== 'pending')
            .sort((a, b) => b.timestamp - a.timestamp);
        
        sorted.forEach(p => {
            if (p.status === 'success' || p.status === 'partial') {
                tempStreak++;
                if (tempStreak > bestStreak) bestStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
        });
        
        // Current streak from most recent
        for (let p of sorted) {
            if (p.status === 'success' || p.status === 'partial') {
                currentStreak++;
            } else {
                break;
            }
        }
        
        return { current: currentStreak, best: bestStreak };
    }

    /**
     * Check and award achievements
     */
    async checkAchievements(userId, prediction) {
        const achievements = [];
        
        // Check various achievement conditions
        const stats = await this.getUserPredictionStats(userId);
        
        // First prediction
        if (stats.totalPredictions === 1) {
            achievements.push({
                type: 'first_prediction',
                title: 'First Steps',
                description: 'Made your first prediction',
                icon: '🎯'
            });
        }
        
        // Milestone predictions
        const milestones = [10, 50, 100, 500, 1000];
        if (milestones.includes(stats.totalPredictions)) {
            achievements.push({
                type: `predictions_${stats.totalPredictions}`,
                title: `${stats.totalPredictions} Predictions`,
                description: `Made ${stats.totalPredictions} total predictions`,
                icon: '🏆'
            });
        }
        
        // Perfect week (all predictions correct)
        if (stats.weeklyPerformance[0]?.successful === stats.weeklyPerformance[0]?.predictions && 
            stats.weeklyPerformance[0]?.predictions >= 5) {
            achievements.push({
                type: 'perfect_week',
                title: 'Perfect Week',
                description: 'All predictions correct in a gameweek',
                icon: '⭐'
            });
        }
        
        // High roller (high stake prediction)
        if (prediction.data.stake >= 50) {
            achievements.push({
                type: 'high_roller',
                title: 'High Roller',
                description: 'Made a high stake prediction',
                icon: '💎'
            });
        }
        
        // Save achievements
        for (const achievement of achievements) {
            await this.saveAchievement(userId, achievement);
        }
        
        return achievements;
    }

    /**
     * Save achievement to database
     */
    async saveAchievement(userId, achievement) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['achievements'], 'readwrite');
        const store = transaction.objectStore('achievements');
        
        store.add({
            userId: userId,
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            unlockedAt: Date.now()
        });
    }

    /**
     * Get user achievements
     */
    async getUserAchievements(userId) {
        if (!this.db) return [];
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['achievements'], 'readonly');
            const store = transaction.objectStore('achievements');
            const index = store.index('userId');
            
            const request = index.getAll(userId);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Check result-based achievements
     */
    async checkResultAchievements(userId, result) {
        const achievements = [];
        
        // Big win achievement
        if (result.points >= 100) {
            achievements.push({
                type: 'big_win',
                title: 'Big Win',
                description: 'Earned 100+ points from a single prediction',
                icon: '🎉'
            });
        }
        
        // Perfect prediction (exact match)
        if (result.accuracy === 'correct' && result.details.exactMatch) {
            achievements.push({
                type: 'perfect_prediction',
                title: 'Bullseye',
                description: 'Made a perfect exact prediction',
                icon: '🎯'
            });
        }
        
        // Save achievements
        for (const achievement of achievements) {
            await this.saveAchievement(userId, achievement);
        }
    }

    /**
     * Check if user is premium
     */
    async isUserPremium(userId) {
        // This would check subscription status
        // For now, return false (can be integrated with payment system)
        return false;
    }

    /**
     * Get empty stats object
     */
    getEmptyStats() {
        return {
            totalPredictions: 0,
            successful: 0,
            partial: 0,
            failed: 0,
            pending: 0,
            successRate: 0,
            partialRate: 0,
            totalPoints: 0,
            averagePoints: 0,
            averageConfidence: 0,
            totalStaked: 0,
            roi: 0,
            bestPrediction: null,
            worstPrediction: null,
            currentStreak: 0,
            bestStreak: 0,
            byType: {},
            recentForm: [],
            weeklyPerformance: []
        };
    }

    /**
     * Setup real-time tracking for live predictions
     */
    setupRealtimeTracking() {
        // Check predictions every minute during matches
        setInterval(() => {
            if (this.isMatchTime()) {
                this.checkLivePredictions();
            }
        }, 60000); // Every minute
    }

    /**
     * Check if it's match time
     */
    isMatchTime() {
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        
        // Typical match times (can be enhanced with actual fixture data)
        if (day === 6 || day === 0) { // Weekend
            return hour >= 12 && hour <= 23;
        } else { // Weekday
            return hour >= 19 && hour <= 23;
        }
    }

    /**
     * Check live predictions for real-time updates
     */
    async checkLivePredictions() {
        const activePredictions = await this.getActivePredictions();
        
        // This would connect to a live data feed
        // For now, just log
        console.log(`Checking ${activePredictions.length} active predictions...`);
    }

    /**
     * Get active predictions
     */
    async getActivePredictions() {
        if (!fplAuth.isAuthenticated()) {
            return [];
        }

        const user = fplAuth.getCurrentUser();
        const gameweek = await this.getCurrentGameweek();
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['predictions'], 'readonly');
            const store = transaction.objectStore('predictions');
            const index = store.index('userId');
            
            const request = index.getAll(user.id);
            
            request.onsuccess = () => {
                const predictions = request.result || [];
                const active = predictions.filter(p => 
                    p.gameweek === gameweek && p.status === 'pending'
                );
                resolve(active);
            };
            
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Get current gameweek
     */
    async getCurrentGameweek() {
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(1, diff + 1), 38);
    }

    /**
     * Get gameweek deadline
     */
    getGameweekDeadline(gameweek) {
        const now = new Date();
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        const deadline = new Date(now);
        deadline.setDate(deadline.getDate() + daysUntilSaturday);
        deadline.setHours(11, 30, 0, 0);
        return deadline.getTime();
    }

    /**
     * Other methods remain similar to original but without the single prediction restriction
     */
    
    // ... (Keep other utility methods like validatePrediction, getUserPredictionHistory, etc.)
}

// Create singleton instance
const fplUltraPredictions = new FPLUltraPredictionsSystem();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLUltraPredictionsSystem;
}