// Optimized FPL Data Service with aggressive caching and performance improvements
class FPLDataServiceOptimized {
    constructor() {
        this.cache = new Map();
        this.localStorage = window.localStorage;
        this.cacheVersion = 'v2.0';
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes for live data
        this.staticCacheTimeout = 24 * 60 * 60 * 1000; // 24 hours for static data
        this.baseUrl = 'https://fantasy.premierleague.com/api';
        this.corsProxies = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/'
        ];
        this.currentProxyIndex = 0;
        this.isLoadingData = false;
        this.loadPromise = null;
        this.mockDataOnly = false;
        
        // Initialize with cached data immediately
        this.initializeFromCache();
    }

    initializeFromCache() {
        try {
            // Load from localStorage immediately
            const cachedData = this.getLocalStorage('fpl_bootstrap_data');
            if (cachedData && this.isDataFresh(cachedData.timestamp, this.cacheTimeout)) {
                this.cache.set('bootstrap', cachedData);
                console.log('Loaded FPL data from localStorage cache');
            }
        } catch (error) {
            console.log('Cache initialization error:', error);
        }
    }

    // Get data from localStorage with version checking
    getLocalStorage(key) {
        try {
            const item = this.localStorage.getItem(key);
            if (!item) return null;
            
            const data = JSON.parse(item);
            if (data.version !== this.cacheVersion) {
                this.localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (error) {
            console.error('localStorage read error:', error);
            return null;
        }
    }

    // Save data to localStorage with version
    setLocalStorage(key, data) {
        try {
            const item = {
                ...data,
                version: this.cacheVersion,
                timestamp: Date.now()
            };
            this.localStorage.setItem(key, JSON.stringify(item));
        } catch (error) {
            console.error('localStorage write error:', error);
            // Clear old data if storage is full
            if (error.name === 'QuotaExceededError') {
                this.clearOldCache();
                try {
                    this.localStorage.setItem(key, JSON.stringify(item));
                } catch (retryError) {
                    console.error('Failed to save after clearing cache:', retryError);
                }
            }
        }
    }

    clearOldCache() {
        const keysToKeep = ['user', 'membership'];
        const keys = Object.keys(this.localStorage);
        keys.forEach(key => {
            if (!keysToKeep.some(keep => key.includes(keep)) && key.startsWith('fpl_')) {
                this.localStorage.removeItem(key);
            }
        });
    }

    isDataFresh(timestamp, timeout) {
        return Date.now() - timestamp < timeout;
    }

    async fetchWithRetry(url, retries = 2) {
        for (let i = 0; i <= retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                if (i === retries) throw error;
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1))); // Exponential backoff
            }
        }
        throw new Error('All fetch attempts failed');
    }

    async fetchWithCORS(endpoint) {
        const url = `${this.baseUrl}/${endpoint}`;
        
        // Try direct fetch first
        try {
            return await this.fetchWithRetry(url);
        } catch (error) {
            console.log('Direct fetch failed, trying CORS proxy...');
        }

        // Try CORS proxies
        for (let i = 0; i < this.corsProxies.length; i++) {
            const proxyIndex = (this.currentProxyIndex + i) % this.corsProxies.length;
            const proxy = this.corsProxies[proxyIndex];
            
            try {
                const proxyUrl = proxy + encodeURIComponent(url);
                const data = await this.fetchWithRetry(proxyUrl, 1); // Less retries for proxies
                this.currentProxyIndex = proxyIndex;
                return data;
            } catch (error) {
                console.log(`Proxy ${proxy} failed`);
            }
        }
        
        throw new Error('All fetch attempts failed');
    }

    async getBootstrapData(forceRefresh = false) {
        // Return cached data immediately if available and fresh
        if (!forceRefresh && this.cache.has('bootstrap')) {
            const cached = this.cache.get('bootstrap');
            if (this.isDataFresh(cached.timestamp, this.cacheTimeout)) {
                console.log('Returning cached bootstrap data');
                return cached.data;
            }
        }

        // If already loading, return the existing promise
        if (this.isLoadingData && this.loadPromise) {
            console.log('Already loading data, returning existing promise');
            return this.loadPromise;
        }

        // Start new load
        this.isLoadingData = true;
        this.loadPromise = this.loadBootstrapData(forceRefresh);
        
        try {
            const result = await this.loadPromise;
            return result;
        } finally {
            this.isLoadingData = false;
            this.loadPromise = null;
        }
    }

    async loadBootstrapData(forceRefresh) {
        try {
            // Check localStorage first (unless force refresh)
            if (!forceRefresh) {
                const localData = this.getLocalStorage('fpl_bootstrap_data');
                if (localData && this.isDataFresh(localData.timestamp, this.cacheTimeout)) {
                    this.cache.set('bootstrap', localData);
                    return localData.data;
                }
            }

            console.log('Fetching fresh bootstrap data...');
            const data = await this.fetchWithCORS('bootstrap-static/');
            
            // Cache in memory and localStorage
            const cacheEntry = {
                data: data,
                timestamp: Date.now()
            };
            this.cache.set('bootstrap', cacheEntry);
            this.setLocalStorage('fpl_bootstrap_data', cacheEntry);
            
            return data;
        } catch (error) {
            console.error('Failed to fetch bootstrap data:', error);
            
            // Try to return stale cache if available
            const staleCache = this.cache.get('bootstrap') || this.getLocalStorage('fpl_bootstrap_data');
            if (staleCache) {
                console.log('Returning stale cache data');
                return staleCache.data;
            }
            
            // Return comprehensive mock data as last resort
            console.log('Returning mock data');
            return this.getMockBootstrapData();
        }
    }

    async getFixtures() {
        // Check cache first
        if (this.cache.has('fixtures')) {
            const cached = this.cache.get('fixtures');
            if (this.isDataFresh(cached.timestamp, this.cacheTimeout)) {
                return cached.data;
            }
        }

        try {
            const data = await this.fetchWithCORS('fixtures/');
            
            // Cache the result
            const cacheEntry = {
                data: data,
                timestamp: Date.now()
            };
            this.cache.set('fixtures', cacheEntry);
            this.setLocalStorage('fpl_fixtures', cacheEntry);
            
            return data;
        } catch (error) {
            console.error('Failed to fetch fixtures:', error);
            
            // Check localStorage for stale data
            const staleCache = this.getLocalStorage('fpl_fixtures');
            if (staleCache) {
                return staleCache.data;
            }
            
            return this.getMockFixtures();
        }
    }

    async getGameweekLive(gameweek) {
        const cacheKey = `gw_live_${gameweek}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (this.isDataFresh(cached.timestamp, 60000)) { // 1 minute cache for live data
                return cached.data;
            }
        }

        try {
            const data = await this.fetchWithCORS(`event/${gameweek}/live/`);
            
            // Cache the result
            const cacheEntry = {
                data: data,
                timestamp: Date.now()
            };
            this.cache.set(cacheKey, cacheEntry);
            
            return data;
        } catch (error) {
            console.error('Failed to fetch gameweek live data:', error);
            return { elements: [] };
        }
    }

    // Preload essential data in the background
    async preloadData() {
        try {
            // Load bootstrap data in background if not cached
            if (!this.cache.has('bootstrap')) {
                this.getBootstrapData();
            }
            
            // Preload fixtures
            setTimeout(() => {
                this.getFixtures();
            }, 1000);
        } catch (error) {
            console.error('Preload error:', error);
        }
    }

    formatPrice(value) {
        return `£${(value / 10).toFixed(1)}m`;
    }

    isDataLive() {
        const cached = this.cache.get('bootstrap');
        if (!cached) return false;
        return this.isDataFresh(cached.timestamp, 60000); // Consider live if less than 1 minute old
    }

    getLastUpdateTime() {
        const cached = this.cache.get('bootstrap');
        if (!cached) return 'Never';
        
        const date = new Date(cached.timestamp);
        return date.toLocaleTimeString();
    }

    clearCache() {
        this.cache.clear();
        // Clear localStorage FPL data
        const keys = Object.keys(this.localStorage);
        keys.forEach(key => {
            if (key.startsWith('fpl_')) {
                this.localStorage.removeItem(key);
            }
        });
    }

    // Lightweight mock data for immediate display
    getMockBootstrapData() {
        return {
            events: this.getMockEvents(),
            teams: this.getMockTeams(),
            elements: this.getMockPlayers(),
            element_types: [
                { id: 1, plural_name: "Goalkeepers", singular_name: "Goalkeeper" },
                { id: 2, plural_name: "Defenders", singular_name: "Defender" },
                { id: 3, plural_name: "Midfielders", singular_name: "Midfielder" },
                { id: 4, plural_name: "Forwards", singular_name: "Forward" }
            ]
        };
    }

    getMockEvents() {
        const events = [];
        for (let i = 1; i <= 38; i++) {
            events.push({
                id: i,
                name: `Gameweek ${i}`,
                finished: i < 15,
                is_current: i === 15,
                is_next: i === 16
            });
        }
        return events;
    }

    getMockTeams() {
        return [
            { id: 1, name: "Arsenal", short_name: "ARS", strength: 4 },
            { id: 2, name: "Aston Villa", short_name: "AVL", strength: 3 },
            { id: 3, name: "Bournemouth", short_name: "BOU", strength: 2 },
            { id: 4, name: "Brentford", short_name: "BRE", strength: 3 },
            { id: 5, name: "Brighton", short_name: "BHA", strength: 3 },
            { id: 6, name: "Chelsea", short_name: "CHE", strength: 4 },
            { id: 7, name: "Crystal Palace", short_name: "CRY", strength: 2 },
            { id: 8, name: "Everton", short_name: "EVE", strength: 2 },
            { id: 9, name: "Fulham", short_name: "FUL", strength: 2 },
            { id: 10, name: "Ipswich", short_name: "IPS", strength: 1 },
            { id: 11, name: "Leicester", short_name: "LEI", strength: 2 },
            { id: 12, name: "Liverpool", short_name: "LIV", strength: 5 },
            { id: 13, name: "Man City", short_name: "MCI", strength: 5 },
            { id: 14, name: "Newcastle", short_name: "NEW", strength: 4 },
            { id: 15, name: "Nottingham Forest", short_name: "NFO", strength: 2 },
            { id: 16, name: "Southampton", short_name: "SOU", strength: 1 },
            { id: 17, name: "Spurs", short_name: "TOT", strength: 4 },
            { id: 18, name: "West Ham", short_name: "WHU", strength: 3 },
            { id: 19, name: "Wolves", short_name: "WOL", strength: 2 },
            { id: 20, name: "Man Utd", short_name: "MUN", strength: 4 }
        ];
    }

    getMockPlayers() {
        // Return a smaller set of key players for faster initial load
        return [
            {
                id: 1,
                first_name: "Mohamed",
                second_name: "Salah",
                team: 12,
                element_type: 3,
                now_cost: 130,
                total_points: 142,
                form: "7.2",
                selected_by_percent: "45.3",
                minutes: 1420,
                goals_scored: 12,
                assists: 8,
                clean_sheets: 0,
                bonus: 18
            },
            {
                id: 2,
                first_name: "Erling",
                second_name: "Haaland",
                team: 13,
                element_type: 4,
                now_cost: 150,
                total_points: 156,
                form: "8.1",
                selected_by_percent: "62.1",
                minutes: 1380,
                goals_scored: 18,
                assists: 3,
                clean_sheets: 0,
                bonus: 22
            },
            {
                id: 3,
                first_name: "Cole",
                second_name: "Palmer",
                team: 6,
                element_type: 3,
                now_cost: 105,
                total_points: 128,
                form: "6.8",
                selected_by_percent: "38.7",
                minutes: 1350,
                goals_scored: 10,
                assists: 9,
                clean_sheets: 0,
                bonus: 15
            }
        ];
    }

    getMockFixtures() {
        const fixtures = [];
        const teams = this.getMockTeams();
        
        for (let gw = 1; gw <= 5; gw++) {
            for (let i = 0; i < teams.length; i += 2) {
                fixtures.push({
                    id: gw * 10 + i/2,
                    event: gw,
                    team_h: teams[i].id,
                    team_a: teams[i+1].id,
                    team_h_difficulty: Math.floor(Math.random() * 5) + 1,
                    team_a_difficulty: Math.floor(Math.random() * 5) + 1,
                    kickoff_time: new Date(Date.now() + gw * 7 * 24 * 60 * 60 * 1000).toISOString(),
                    finished: false,
                    started: false
                });
            }
        }
        
        return fixtures;
    }
}

// Create singleton instance
const FPLDataService = FPLDataServiceOptimized;

// Auto-initialize and preload on page load
if (typeof window !== 'undefined') {
    window.FPLDataService = FPLDataServiceOptimized;
    
    // Start preloading data as soon as the service loads
    const service = new FPLDataServiceOptimized();
    setTimeout(() => {
        service.preloadData();
    }, 100);
}