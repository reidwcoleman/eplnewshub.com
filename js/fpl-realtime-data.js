/**
 * FPL Real-Time Data Manager
 * Handles live data fetching, caching, and WebSocket connections
 */

class FPLRealtimeDataManager {
    constructor() {
        this.apiEndpoints = {
            bootstrap: 'https://fantasy.premierleague.com/api/bootstrap-static/',
            fixtures: 'https://fantasy.premierleague.com/api/fixtures/',
            playerDetail: 'https://fantasy.premierleague.com/api/element-summary/',
            live: 'https://fantasy.premierleague.com/api/event/{event}/live/',
            teams: 'https://fantasy.premierleague.com/api/entry/{teamId}/',
            history: 'https://fantasy.premierleague.com/api/entry/{teamId}/history/',
            transfers: 'https://fantasy.premierleague.com/api/entry/{teamId}/transfers/'
        };
        
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.wsConnection = null;
        this.updateCallbacks = new Set();
        this.isOnline = navigator.onLine;
        this.rateLimiter = new RateLimiter();
        
        this.init();
    }

    init() {
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
        
        // Set up periodic data refresh
        this.startAutoRefresh();
        
        // Initialize IndexedDB for persistent caching
        this.initIndexedDB();
    }

    /**
     * Initialize IndexedDB for persistent caching
     */
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('FPLDataCache', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('players')) {
                    const store = db.createObjectStore('players', { keyPath: 'id' });
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('team', 'team', { unique: false });
                    store.createIndex('position', 'position', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('fixtures')) {
                    db.createObjectStore('fixtures', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('cache')) {
                    db.createObjectStore('cache', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Fetch data with caching and error handling
     */
    async fetchWithCache(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // Check memory cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }
        
        // Check IndexedDB cache if offline
        if (!this.isOnline) {
            return this.getFromIndexedDB(cacheKey);
        }
        
        // Apply rate limiting
        await this.rateLimiter.throttle();
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Store in both memory and IndexedDB
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            this.saveToIndexedDB(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error('Fetch error:', error);
            
            // Try to get from IndexedDB as fallback
            const cachedData = await this.getFromIndexedDB(cacheKey);
            if (cachedData) {
                console.log('Using cached data due to fetch error');
                return cachedData;
            }
            
            throw error;
        }
    }

    /**
     * Save data to IndexedDB
     */
    async saveToIndexedDB(key, data) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        
        store.put({
            key,
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get data from IndexedDB
     */
    async getFromIndexedDB(key) {
        if (!this.db) return null;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['cache'], 'readonly');
            const store = transaction.objectStore('cache');
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                if (result && Date.now() - result.timestamp < this.cacheExpiry * 2) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => resolve(null);
        });
    }

    /**
     * Get all players with real-time stats
     */
    async getAllPlayers() {
        try {
            const data = await this.fetchWithCache(this.apiEndpoints.bootstrap);
            
            // Process and enhance player data
            const players = data.elements.map(player => ({
                id: player.id,
                name: `${player.first_name} ${player.second_name}`,
                webName: player.web_name,
                team: data.teams.find(t => t.id === player.team)?.name || 'Unknown',
                teamShort: data.teams.find(t => t.id === player.team)?.short_name || 'UNK',
                position: this.getPositionName(player.element_type),
                price: player.now_cost / 10,
                points: player.total_points,
                form: parseFloat(player.form),
                ownership: parseFloat(player.selected_by_percent),
                transfersIn: player.transfers_in_event,
                transfersOut: player.transfers_out_event,
                news: player.news || '',
                status: player.status,
                photo: `https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.photo?.replace('.jpg', '')}.png`,
                stats: {
                    goals: player.goals_scored,
                    assists: player.assists,
                    cleanSheets: player.clean_sheets,
                    saves: player.saves,
                    yellowCards: player.yellow_cards,
                    redCards: player.red_cards,
                    bonus: player.bonus,
                    bps: player.bps,
                    influence: parseFloat(player.influence),
                    creativity: parseFloat(player.creativity),
                    threat: parseFloat(player.threat),
                    ictIndex: parseFloat(player.ict_index),
                    minutes: player.minutes,
                    xG: player.expected_goals || 0,
                    xA: player.expected_assists || 0,
                    xGI: player.expected_goal_involvements || 0
                },
                fixtures: {
                    next: this.getNextFixtures(player.team, data.fixtures),
                    difficulty: player.difficulty
                }
            }));
            
            // Save to IndexedDB for offline access
            this.savePlayers(players);
            
            return players;
        } catch (error) {
            console.error('Error fetching players:', error);
            
            // Return cached players if available
            return this.getCachedPlayers();
        }
    }

    /**
     * Get player detail with historical data
     */
    async getPlayerDetail(playerId) {
        try {
            const url = `${this.apiEndpoints.playerDetail}${playerId}/`;
            const data = await this.fetchWithCache(url);
            
            return {
                history: data.history.map(gw => ({
                    gameweek: gw.round,
                    points: gw.total_points,
                    minutes: gw.minutes,
                    goals: gw.goals_scored,
                    assists: gw.assists,
                    bonus: gw.bonus,
                    bps: gw.bps,
                    influence: parseFloat(gw.influence),
                    creativity: parseFloat(gw.creativity),
                    threat: parseFloat(gw.threat),
                    value: gw.value / 10,
                    selected: gw.selected,
                    transfersIn: gw.transfers_in,
                    transfersOut: gw.transfers_out
                })),
                fixtures: data.fixtures.map(f => ({
                    id: f.id,
                    opponent: f.is_home ? f.team_a_name : f.team_h_name,
                    difficulty: f.difficulty,
                    isHome: f.is_home,
                    kickoff: new Date(f.kickoff_time)
                }))
            };
        } catch (error) {
            console.error('Error fetching player detail:', error);
            return null;
        }
    }

    /**
     * Get live gameweek data
     */
    async getLiveData(gameweek) {
        try {
            const url = this.apiEndpoints.live.replace('{event}', gameweek);
            const data = await this.fetchWithCache(url, { cache: 'no-cache' });
            
            return data.elements.map(player => ({
                id: player.id,
                stats: player.stats,
                explain: player.explain
            }));
        } catch (error) {
            console.error('Error fetching live data:', error);
            return [];
        }
    }

    /**
     * Initialize WebSocket connection for real-time updates
     */
    connectWebSocket() {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            return;
        }
        
        // Using a mock WebSocket URL - replace with actual if available
        const wsUrl = 'wss://fpl-realtime.example.com/ws';
        
        try {
            this.wsConnection = new WebSocket(wsUrl);
            
            this.wsConnection.onopen = () => {
                console.log('WebSocket connected');
                this.subscribeToUpdates();
            };
            
            this.wsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealtimeUpdate(data);
            };
            
            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            this.wsConnection.onclose = () => {
                console.log('WebSocket disconnected');
                // Attempt to reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
        }
    }

    /**
     * Handle real-time updates
     */
    handleRealtimeUpdate(data) {
        // Update cache with new data
        if (data.type === 'player_update') {
            this.updatePlayerCache(data.player);
        } else if (data.type === 'price_change') {
            this.handlePriceChange(data);
        } else if (data.type === 'live_points') {
            this.handleLivePoints(data);
        }
        
        // Notify all registered callbacks
        this.updateCallbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Update callback error:', error);
            }
        });
    }

    /**
     * Register callback for real-time updates
     */
    onUpdate(callback) {
        this.updateCallbacks.add(callback);
        
        return () => {
            this.updateCallbacks.delete(callback);
        };
    }

    /**
     * Start automatic data refresh
     */
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            if (this.isOnline) {
                this.refreshData();
            }
        }, 5 * 60 * 1000);
        
        // Initial refresh
        this.refreshData();
    }

    /**
     * Refresh all cached data
     */
    async refreshData() {
        try {
            console.log('Refreshing FPL data...');
            
            // Clear expired cache entries
            this.cleanCache();
            
            // Fetch fresh data
            await this.getAllPlayers();
            
            // Notify listeners
            this.updateCallbacks.forEach(callback => {
                callback({ type: 'data_refreshed', timestamp: Date.now() });
            });
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    /**
     * Clean expired cache entries
     */
    cleanCache() {
        const now = Date.now();
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Handle online/offline status
     */
    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        
        if (isOnline) {
            console.log('Connection restored - refreshing data');
            this.refreshData();
            this.connectWebSocket();
        } else {
            console.log('Connection lost - using cached data');
            if (this.wsConnection) {
                this.wsConnection.close();
            }
        }
    }

    /**
     * Helper function to get position name
     */
    getPositionName(elementType) {
        const positions = {
            1: 'GKP',
            2: 'DEF',
            3: 'MID',
            4: 'FWD'
        };
        return positions[elementType] || 'Unknown';
    }

    /**
     * Helper function to get next fixtures
     */
    getNextFixtures(teamId, fixtures) {
        if (!fixtures) return [];
        
        return fixtures
            .filter(f => (f.team_h === teamId || f.team_a === teamId) && !f.finished)
            .slice(0, 5)
            .map(f => ({
                opponent: f.team_h === teamId ? f.team_a : f.team_h,
                isHome: f.team_h === teamId,
                difficulty: f.team_h === teamId ? f.team_h_difficulty : f.team_a_difficulty
            }));
    }

    /**
     * Save players to IndexedDB
     */
    async savePlayers(players) {
        if (!this.db) return;
        
        const transaction = this.db.transaction(['players'], 'readwrite');
        const store = transaction.objectStore('players');
        
        players.forEach(player => {
            store.put(player);
        });
    }

    /**
     * Get cached players from IndexedDB
     */
    async getCachedPlayers() {
        if (!this.db) return [];
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['players'], 'readonly');
            const store = transaction.objectStore('players');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        if (this.wsConnection) {
            this.wsConnection.close();
        }
        
        this.cache.clear();
        this.updateCallbacks.clear();
    }
}

/**
 * Rate limiter to prevent API abuse
 */
class RateLimiter {
    constructor(maxRequests = 10, timeWindow = 60000) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
    }

    async throttle() {
        const now = Date.now();
        
        // Remove old requests outside the time window
        this.requests = this.requests.filter(time => now - time < this.timeWindow);
        
        if (this.requests.length >= this.maxRequests) {
            // Calculate wait time
            const oldestRequest = this.requests[0];
            const waitTime = this.timeWindow - (now - oldestRequest) + 100;
            
            console.log(`Rate limit reached. Waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.requests.push(now);
    }
}

// Initialize the data manager
const fplDataManager = new FPLRealtimeDataManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLRealtimeDataManager;
}