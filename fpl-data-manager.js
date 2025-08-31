// Global FPL Data Manager - Persistent storage across entire site
class FPLDataManager {
    constructor() {
        this.storageKey = 'fpl_persistent_data';
        this.data = this.loadData();
        
        // Make globally accessible
        window.fplData = this;
        
        console.log('FPL Data Manager initialized with data:', this.data);
    }

    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                console.log('Loaded persistent data:', data);
                return data;
            }
        } catch (e) {
            console.error('Error loading data:', e);
        }
        
        // Default data structure
        return {
            players: {},
            general: [],
            teams: {},
            fixtures: {},
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }

    saveData() {
        this.data.lastUpdated = new Date().toISOString();
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('Data saved successfully:', this.data);
            
            // Trigger event for other parts of site to update
            window.dispatchEvent(new CustomEvent('fplDataUpdated', { 
                detail: this.data 
            }));
            
            return true;
        } catch (e) {
            console.error('Error saving data:', e);
            return false;
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
        return this.data.players[key] || null;
    }

    getAllPlayers() {
        return Object.values(this.data.players);
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
        const playerNames = Object.keys(this.data.players);
        
        for (const key of playerNames) {
            if (lower.includes(key)) {
                return this.data.players[key];
            }
        }
        
        // Also check full names
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
            totalPlayers: Object.keys(this.data.players).length,
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