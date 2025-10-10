/**
 * FPL Predictions System
 * Handles prediction submission, tracking, and history for authenticated users
 */

class FPLPredictionsSystem {
    constructor() {
        this.db = null;
        this.currentPrediction = null;
        this.userPredictions = [];
        this.predictionTypes = {
            CAPTAIN: 'captain',
            TRIPLE_CAPTAIN: 'triple_captain',
            BENCH_BOOST: 'bench_boost',
            TOP_SCORER: 'top_scorer',
            CLEAN_SHEET: 'clean_sheet',
            DIFFERENTIAL: 'differential',
            TRANSFER: 'transfer',
            POINTS_TARGET: 'points_target',
            RANK_TARGET: 'rank_target'
        };
        this.predictionCallbacks = new Set();
        
        this.init();
    }

    /**
     * Initialize predictions system
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
        
        // Listen for user data events
        window.addEventListener('fpl-user-data-loaded', (event) => {
            if (event.detail && event.detail.predictions) {
                this.userPredictions = event.detail.predictions;
                this.notifyPredictionsUpdate();
            }
        });
    }

    /**
     * Initialize database
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FPLPredictionsDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Predictions store
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
                }
                
                // Prediction results store
                if (!db.objectStoreNames.contains('results')) {
                    const resultsStore = db.createObjectStore('results', { 
                        keyPath: 'predictionId' 
                    });
                    resultsStore.createIndex('userId', 'userId', { unique: false });
                    resultsStore.createIndex('gameweek', 'gameweek', { unique: false });
                }
            };
        });
    }

    /**
     * Submit a new prediction
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

            // Check if user already has a prediction for this gameweek and type
            const existingPrediction = await this.getUserPredictionForGameweek(
                user.id, 
                gameweek, 
                predictionData.type
            );

            if (existingPrediction && !predictionData.allowOverwrite) {
                return {
                    success: false,
                    message: 'You already have a prediction for this gameweek. Only one prediction per gameweek is allowed.',
                    existing: existingPrediction
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

            // Create prediction object
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
                    confidence: predictionData.confidence || 50
                },
                timestamp: Date.now(),
                status: 'pending',
                points: 0,
                deadline: this.getGameweekDeadline(gameweek)
            };

            // Save to database
            const savedPrediction = await this.savePrediction(prediction);

            // Update user stats
            await this.updateUserStats(user.id, 'predictions_made');

            // Add to local cache
            this.userPredictions.push(savedPrediction);
            
            // Notify listeners
            this.notifyPredictionsUpdate();

            return {
                success: true,
                prediction: savedPrediction,
                message: 'Prediction submitted successfully!'
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
     * Get user's prediction history
     */
    async getUserPredictionHistory(userId = null) {
        if (!userId && fplAuth.isAuthenticated()) {
            userId = fplAuth.getCurrentUser().id;
        }

        if (!userId) {
            return [];
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction(['predictions', 'results'], 'readonly');
            const predictionsStore = transaction.objectStore('predictions');
            const resultsStore = transaction.objectStore('results');
            
            const index = predictionsStore.index('userId');
            const request = index.getAll(userId);
            
            request.onsuccess = async () => {
                const predictions = request.result || [];
                
                // Fetch results for each prediction
                const predictionsWithResults = await Promise.all(
                    predictions.map(async (prediction) => {
                        const result = await this.getPredictionResult(prediction.id);
                        return {
                            ...prediction,
                            result: result,
                            success: result ? result.success : null,
                            pointsEarned: result ? result.points : 0
                        };
                    })
                );

                // Sort by timestamp (most recent first)
                predictionsWithResults.sort((a, b) => b.timestamp - a.timestamp);
                
                resolve(predictionsWithResults);
            };
            
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Get prediction statistics
     */
    async getUserPredictionStats(userId = null) {
        if (!userId && fplAuth.isAuthenticated()) {
            userId = fplAuth.getCurrentUser().id;
        }

        const history = await this.getUserPredictionHistory(userId);
        
        if (history.length === 0) {
            return {
                totalPredictions: 0,
                successRate: 0,
                totalPoints: 0,
                averageConfidence: 0,
                bestPrediction: null,
                currentStreak: 0,
                bestStreak: 0,
                byType: {},
                recentForm: []
            };
        }

        // Calculate statistics
        const stats = {
            totalPredictions: history.length,
            successful: history.filter(p => p.success === true).length,
            failed: history.filter(p => p.success === false).length,
            pending: history.filter(p => p.status === 'pending').length,
            totalPoints: history.reduce((sum, p) => sum + (p.pointsEarned || 0), 0),
            averageConfidence: history.reduce((sum, p) => sum + (p.data.confidence || 0), 0) / history.length
        };

        stats.successRate = stats.totalPredictions > 0 
            ? ((stats.successful / (stats.successful + stats.failed)) * 100).toFixed(1)
            : 0;

        // Find best prediction
        stats.bestPrediction = history.reduce((best, current) => 
            (current.pointsEarned || 0) > (best?.pointsEarned || 0) ? current : best, 
            null
        );

        // Calculate streaks
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        history.forEach(p => {
            if (p.success === true) {
                tempStreak++;
                if (tempStreak > bestStreak) bestStreak = tempStreak;
            } else if (p.success === false) {
                tempStreak = 0;
            }
        });
        
        // Current streak (from most recent)
        for (let p of history) {
            if (p.status === 'pending') continue;
            if (p.success === true) {
                currentStreak++;
            } else {
                break;
            }
        }

        stats.currentStreak = currentStreak;
        stats.bestStreak = bestStreak;

        // Stats by prediction type
        stats.byType = {};
        Object.values(this.predictionTypes).forEach(type => {
            const typePredictions = history.filter(p => p.type === type);
            if (typePredictions.length > 0) {
                const successful = typePredictions.filter(p => p.success === true).length;
                stats.byType[type] = {
                    total: typePredictions.length,
                    successful: successful,
                    successRate: ((successful / typePredictions.length) * 100).toFixed(1),
                    points: typePredictions.reduce((sum, p) => sum + (p.pointsEarned || 0), 0)
                };
            }
        });

        // Recent form (last 5 predictions)
        stats.recentForm = history
            .filter(p => p.status !== 'pending')
            .slice(0, 5)
            .map(p => p.success ? 'W' : 'L');

        return stats;
    }

    /**
     * Get active predictions for current gameweek
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
     * Update prediction result
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
                
                // Update prediction status
                prediction.status = result.success ? 'success' : 'failed';
                prediction.points = result.points || 0;
                predictionsStore.put(prediction);
                
                // Save result details
                const resultData = {
                    predictionId: predictionId,
                    userId: prediction.userId,
                    gameweek: prediction.gameweek,
                    success: result.success,
                    points: result.points || 0,
                    actual: result.actual,
                    expected: prediction.data,
                    calculatedAt: Date.now()
                };
                
                resultsStore.put(resultData);
                
                // Update user stats
                this.updateUserStats(prediction.userId, 'total_points', result.points);
                if (result.success) {
                    this.updateUserStats(prediction.userId, 'predictions_correct');
                }
                
                resolve(resultData);
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Validate prediction data
     */
    validatePrediction(data) {
        // Check prediction type
        if (!Object.values(this.predictionTypes).includes(data.type)) {
            return { valid: false, message: 'Invalid prediction type' };
        }

        // Type-specific validation
        switch (data.type) {
            case this.predictionTypes.CAPTAIN:
            case this.predictionTypes.TRIPLE_CAPTAIN:
            case this.predictionTypes.TOP_SCORER:
            case this.predictionTypes.DIFFERENTIAL:
                if (!data.playerId || !data.playerName) {
                    return { valid: false, message: 'Player selection required' };
                }
                break;
                
            case this.predictionTypes.CLEAN_SHEET:
                if (!data.team) {
                    return { valid: false, message: 'Team selection required' };
                }
                break;
                
            case this.predictionTypes.POINTS_TARGET:
            case this.predictionTypes.RANK_TARGET:
                if (!data.value || data.value <= 0) {
                    return { valid: false, message: 'Valid target value required' };
                }
                break;
        }

        // Validate confidence
        if (data.confidence && (data.confidence < 0 || data.confidence > 100)) {
            return { valid: false, message: 'Confidence must be between 0 and 100' };
        }

        return { valid: true };
    }

    /**
     * Get user prediction for specific gameweek
     */
    async getUserPredictionForGameweek(userId, gameweek, type) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['predictions'], 'readonly');
            const store = transaction.objectStore('predictions');
            const index = store.index('userId');
            
            const request = index.getAll(userId);
            
            request.onsuccess = () => {
                const predictions = request.result || [];
                const found = predictions.find(p => 
                    p.gameweek === gameweek && 
                    p.type === type &&
                    p.status === 'pending'
                );
                resolve(found || null);
            };
            
            request.onerror = () => resolve(null);
        });
    }

    /**
     * Save prediction to database
     */
    async savePrediction(prediction) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['predictions'], 'readwrite');
            const store = transaction.objectStore('predictions');
            
            const request = store.add(prediction);
            
            request.onsuccess = () => {
                prediction.id = request.result;
                
                // Save to user data as well
                this.saveToUserData(prediction);
                
                resolve(prediction);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save prediction to user data store
     */
    async saveToUserData(prediction) {
        const userData = {
            userId: prediction.userId,
            predictions: this.userPredictions,
            lastUpdated: Date.now()
        };
        
        // Update in IndexedDB
        const transaction = this.db.transaction(['userData'], 'readwrite');
        const store = transaction.objectStore('userData');
        store.put(userData);
        
        // Update localStorage for quick access
        localStorage.setItem('fpl_user_predictions', JSON.stringify(this.userPredictions));
    }

    /**
     * Load user predictions
     */
    async loadUserPredictions(userId) {
        const predictions = await this.getUserPredictionHistory(userId);
        this.userPredictions = predictions;
        this.notifyPredictionsUpdate();
    }

    /**
     * Clear predictions (on logout)
     */
    clearPredictions() {
        this.userPredictions = [];
        this.currentPrediction = null;
        localStorage.removeItem('fpl_user_predictions');
        this.notifyPredictionsUpdate();
    }

    /**
     * Get current gameweek
     */
    async getCurrentGameweek() {
        // This would normally fetch from FPL API
        // For demo, calculate based on season start
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(1, diff + 1), 38);
    }

    /**
     * Get gameweek deadline
     */
    getGameweekDeadline(gameweek) {
        // This would normally fetch from FPL API
        // For demo, assume Saturday 11:30 AM deadline
        const now = new Date();
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        const deadline = new Date(now);
        deadline.setDate(deadline.getDate() + daysUntilSaturday);
        deadline.setHours(11, 30, 0, 0);
        return deadline.getTime();
    }

    /**
     * Get prediction result from database
     */
    async getPredictionResult(predictionId) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['results'], 'readonly');
            const store = transaction.objectStore('results');
            
            const request = store.get(predictionId);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => resolve(null);
        });
    }

    /**
     * Update user statistics
     */
    async updateUserStats(userId, stat, value = 1) {
        // Update user stats in auth system
        if (fplAuth && fplAuth.isAuthenticated()) {
            const user = fplAuth.getCurrentUser();
            if (!user.stats) user.stats = {};
            
            if (stat === 'total_points') {
                user.stats[stat] = (user.stats[stat] || 0) + value;
            } else {
                user.stats[stat] = (user.stats[stat] || 0) + 1;
            }
            
            await fplAuth.updateProfile({ stats: user.stats });
        }
    }

    /**
     * Register prediction update callback
     */
    onPredictionsUpdate(callback) {
        this.predictionCallbacks.add(callback);
        
        return () => {
            this.predictionCallbacks.delete(callback);
        };
    }

    /**
     * Notify prediction updates
     */
    notifyPredictionsUpdate() {
        this.predictionCallbacks.forEach(callback => {
            try {
                callback(this.userPredictions);
            } catch (error) {
                console.error('Prediction callback error:', error);
            }
        });
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(type = 'all', limit = 10) {
        // This would normally fetch from a server
        // For demo, generate mock leaderboard
        return [
            { rank: 1, username: 'FPLMaster', points: 2847, predictions: 145, successRate: 68 },
            { rank: 2, username: 'TheOracle', points: 2756, predictions: 132, successRate: 71 },
            { rank: 3, username: 'DataDriven', points: 2698, predictions: 158, successRate: 65 },
            // Add current user if authenticated
            ...(fplAuth.isAuthenticated() ? [{
                rank: 42,
                username: fplAuth.getCurrentUser().username,
                points: fplAuth.getCurrentUser().stats?.total_points || 0,
                predictions: fplAuth.getCurrentUser().stats?.predictions_made || 0,
                successRate: 0,
                isCurrentUser: true
            }] : [])
        ].slice(0, limit);
    }

    /**
     * Export prediction history
     */
    exportHistory(format = 'json') {
        const history = this.userPredictions;
        
        if (format === 'json') {
            const dataStr = JSON.stringify(history, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `fpl-predictions-${Date.now()}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        } else if (format === 'csv') {
            // Convert to CSV
            const csv = this.convertToCSV(history);
            const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csv);
            
            const exportFileDefaultName = `fpl-predictions-${Date.now()}.csv`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    }

    /**
     * Convert predictions to CSV
     */
    convertToCSV(predictions) {
        const headers = ['Date', 'Gameweek', 'Type', 'Player/Team', 'Confidence', 'Status', 'Points'];
        
        const rows = predictions.map(p => [
            new Date(p.timestamp).toLocaleDateString(),
            p.gameweek,
            p.type,
            p.data.playerName || p.data.team || p.data.value,
            p.data.confidence + '%',
            p.status,
            p.pointsEarned || 0
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// Create singleton instance
const fplPredictions = new FPLPredictionsSystem();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLPredictionsSystem;
}