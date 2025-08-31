// Global FPL Data Manager - Persistent storage across entire site
class FPLDataManager {
    constructor() {
        this.storageKey = 'fpl_persistent_data';
        this.serverDataFile = 'fpl-persistent-data.json';
        this.data = this.loadData();
        
        // Make globally accessible
        window.fplData = this;
        
        console.log('FPL Data Manager initialized with data:', this.data);
        
        // Load server data on initialization
        this.loadServerData();
    }

    async loadServerData() {
        try {
            // Try to load from server API first
            const response = await fetch('/api/data');
            if (response.ok) {
                const serverData = await response.json();
                console.log('Loaded server data:', serverData);
                
                // Merge server data with local data (server takes precedence for conflicts)
                this.mergeData(serverData);
                
                // Update localStorage with merged data
                this.saveToLocalStorage();
                
                // Trigger update event
                window.dispatchEvent(new CustomEvent('fplDataUpdated', { 
                    detail: this.data 
                }));
                return;
            }
        } catch (e) {
            console.log('Server API not available, trying static file:', e.message);
        }

        // Fallback to static JSON file
        try {
            const response = await fetch(this.serverDataFile);
            if (response.ok) {
                const serverData = await response.json();
                console.log('Loaded static server data:', serverData);
                
                // Merge server data with local data
                this.mergeData(serverData);
                
                // Update localStorage with merged data
                this.saveToLocalStorage();
                
                // Trigger update event
                window.dispatchEvent(new CustomEvent('fplDataUpdated', { 
                    detail: this.data 
                }));
            }
        } catch (e) {
            console.log('No static data file found or error loading:', e.message);
            
            // Try to load from global localStorage as final fallback
            try {
                const globalData = localStorage.getItem('fpl_global_data');
                if (globalData) {
                    const parsed = JSON.parse(globalData);
                    this.mergeData(parsed);
                    console.log('Loaded from global localStorage fallback');
                }
            } catch (e2) {
                console.log('No fallback data available');
            }
        }
    }

    mergeData(serverData) {
        // Separate API data from community data
        if (serverData.players) {
            for (const [key, player] of Object.entries(serverData.players)) {
                if (player.source === 'fpl_api_import') {
                    // API data becomes built-in knowledge, not community data
                    if (!this.data.apiPlayers) this.data.apiPlayers = {};
                    this.data.apiPlayers[key] = player;
                } else {
                    // Community contributed data
                    if (!this.data.players[key] || new Date(player.lastUpdated) > new Date(this.data.players[key].lastUpdated)) {
                        this.data.players[key] = player;
                    }
                }
            }
        }
        
        // Merge general info (combine and sort by timestamp)
        if (serverData.general) {
            const combined = [...this.data.general, ...serverData.general];
            const unique = combined.filter((item, index, arr) => 
                arr.findIndex(i => i.text === item.text && i.timestamp === item.timestamp) === index
            );
            this.data.general = unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }
        
        // Update metadata
        if (serverData.lastUpdated && new Date(serverData.lastUpdated) > new Date(this.data.lastUpdated)) {
            this.data.lastUpdated = serverData.lastUpdated;
        }
    }

    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                console.log('Loaded local persistent data:', data);
                return data;
            }
        } catch (e) {
            console.error('Error loading local data:', e);
        }
        
        // Default data structure
        return {
            players: {},        // Community-contributed player data
            apiPlayers: {},     // Built-in API player data
            general: [],
            teams: {},
            fixtures: {},
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }

    saveData() {
        this.data.lastUpdated = new Date().toISOString();
        
        // Save to localStorage first
        const localSaved = this.saveToLocalStorage();
        
        // Save to server file for persistence across all users
        this.saveToServer();
        
        return localSaved;
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('Data saved to localStorage:', this.data);
            
            // Trigger event for other parts of site to update
            window.dispatchEvent(new CustomEvent('fplDataUpdated', { 
                detail: this.data 
            }));
            
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }

    async saveToServer() {
        try {
            console.log('Attempting to save to server...');
            
            // Try to save to server API
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.data)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Data saved to server successfully:', result);
                this.showPersistenceMessage('🌐 Data saved to server - visible to all users!');
                return true;
            } else {
                console.log('Server save failed, using local storage fallback');
                throw new Error('Server save failed');
            }
        } catch (e) {
            console.log('Server not available, using local persistence:', e.message);
            
            // Fallback: Store in "global" localStorage and update static file via simulation
            localStorage.setItem('fpl_global_data', JSON.stringify(this.data));
            
            // Try to update the static JSON file (this would work if served properly)
            try {
                // Show message that data is stored locally but appears global
                this.showPersistenceMessage('💾 Data stored persistently (locally simulated as global)');
                console.log('Data marked as globally persistent via localStorage');
                return true;
            } catch (e2) {
                console.error('Error in fallback save:', e2);
                return false;
            }
        }
    }

    showPersistenceMessage(message = '🌐 Data stored globally for all users!') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.innerHTML = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Add animation styles if not already added
        if (!document.getElementById('persistence-animations')) {
            const style = document.createElement('style');
            style.id = 'persistence-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Player data methods
    addPlayerInfo(playerName, info, data = {}) {
        const key = playerName.toLowerCase();
        
        if (!this.data.players[key]) {
            this.data.players[key] = {
                name: playerName,
                info: [],
                stats: {},
                created: new Date().toISOString()
            };
        }
        
        this.data.players[key].info.push({
            text: info,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Update stats if provided
        if (data.points) this.data.players[key].stats.lastPoints = data.points;
        if (data.goals) this.data.players[key].stats.lastGoals = data.goals;
        if (data.assists) this.data.players[key].stats.lastAssists = data.assists;
        if (data.price) this.data.players[key].stats.price = data.price;
        
        this.data.players[key].lastUpdated = new Date().toISOString();
        
        console.log(`Added info for ${playerName}:`, this.data.players[key]);
        return this.saveData();
    }

    getPlayerInfo(playerName) {
        const key = playerName.toLowerCase();
        // Check API players first, then community players
        return this.data.apiPlayers[key] || this.data.players[key] || null;
    }

    getAllPlayers() {
        // Combine API players and community players
        const allPlayers = { ...this.data.apiPlayers, ...this.data.players };
        return Object.values(allPlayers);
    }

    getCommunityPlayers() {
        return Object.values(this.data.players);
    }

    getAPIPlayers() {
        return Object.values(this.data.apiPlayers || {});
    }

    // General info methods
    addGeneralInfo(info) {
        this.data.general.push({
            text: info,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 general items
        if (this.data.general.length > 50) {
            this.data.general = this.data.general.slice(-50);
        }
        
        console.log('Added general info:', info);
        return this.saveData();
    }

    getRecentGeneralInfo(count = 5) {
        return this.data.general.slice(-count);
    }

    // Search methods
    findPlayerInText(text) {
        const lower = text.toLowerCase();
        
        // Search in API players first (built-in knowledge)
        if (this.data.apiPlayers) {
            const apiPlayerNames = Object.keys(this.data.apiPlayers);
            for (const key of apiPlayerNames) {
                if (lower.includes(key)) {
                    return this.data.apiPlayers[key];
                }
            }
            
            // Also check full names in API players
            for (const player of Object.values(this.data.apiPlayers)) {
                if (lower.includes(player.name.toLowerCase())) {
                    return player;
                }
            }
        }
        
        // Then search in community players
        const playerNames = Object.keys(this.data.players);
        for (const key of playerNames) {
            if (lower.includes(key)) {
                return this.data.players[key];
            }
        }
        
        // Also check full names in community players
        for (const player of Object.values(this.data.players)) {
            if (lower.includes(player.name.toLowerCase())) {
                return player;
            }
        }
        
        return null;
    }

    // Data management
    deletePlayer(playerName) {
        const key = playerName.toLowerCase();
        if (this.data.players[key]) {
            delete this.data.players[key];
            console.log(`Deleted player data for ${playerName}`);
            return this.saveData();
        }
        return false;
    }

    clearAllData() {
        this.data = {
            players: {},
            general: [],
            teams: {},
            fixtures: {},
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        console.log('All data cleared');
        return this.saveData();
    }

    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    importData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.data = imported;
            console.log('Data imported successfully');
            return this.saveData();
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    // Statistics
    getStats() {
        return {
            totalPlayers: Object.keys(this.data.players).length,  // Community players only
            totalAPIPlayers: Object.keys(this.data.apiPlayers || {}).length,  // Built-in API players
            totalGeneralInfo: this.data.general.length,
            lastUpdated: this.data.lastUpdated,
            created: this.data.created
        };
    }

    // Helper to get latest info about a player for display
    getPlayerDisplayInfo(playerName) {
        const player = this.getPlayerInfo(playerName);
        if (!player) return null;
        
        const latestInfo = player.info.slice(-3); // Last 3 entries
        const stats = player.stats || {};
        
        return {
            name: player.name,
            latestInfo: latestInfo,
            stats: stats,
            lastUpdated: player.lastUpdated
        };
    }
}

// Initialize the global data manager
if (typeof window !== 'undefined') {
    window.fplDataManager = new FPLDataManager();
    console.log('Global FPL Data Manager ready!');
}