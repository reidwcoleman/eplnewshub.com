// Simple Node.js server for FPL persistent data storage
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'fpl-persistent-data.json');

// CORS headers for frontend
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

class DataServer {
    constructor() {
        this.server = http.createServer(this.handleRequest.bind(this));
        this.initializeDataFile();
    }

    async initializeDataFile() {
        try {
            await fs.access(DATA_FILE);
            console.log('Data file exists');
        } catch (e) {
            // Create default data file
            const defaultData = {
                players: {},
                general: [],
                teams: {},
                fixtures: {},
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
            console.log('Created default data file');
        }
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const method = req.method;

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            res.writeHead(200, corsHeaders);
            res.end();
            return;
        }

        try {
            if (parsedUrl.pathname === '/api/data' && method === 'GET') {
                await this.getData(res);
            } else if (parsedUrl.pathname === '/api/data' && method === 'POST') {
                await this.saveData(req, res);
            } else {
                res.writeHead(404, corsHeaders);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }

    async getData(res) {
        try {
            const data = await fs.readFile(DATA_FILE, 'utf8');
            res.writeHead(200, corsHeaders);
            res.end(data);
            console.log('Data sent to client');
        } catch (error) {
            console.error('Error reading data:', error);
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ error: 'Failed to read data' }));
        }
    }

    async saveData(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const newData = JSON.parse(body);
                
                // Validate data structure
                if (!newData.players || !newData.general) {
                    throw new Error('Invalid data structure');
                }

                // Read existing data
                const existingData = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
                
                // Merge with existing data
                const mergedData = this.mergeData(existingData, newData);
                
                // Save merged data
                await fs.writeFile(DATA_FILE, JSON.stringify(mergedData, null, 2));
                
                console.log('Data saved successfully');
                res.writeHead(200, corsHeaders);
                res.end(JSON.stringify({ success: true, data: mergedData }));
                
            } catch (error) {
                console.error('Error saving data:', error);
                res.writeHead(400, corsHeaders);
                res.end(JSON.stringify({ error: 'Failed to save data' }));
            }
        });
    }

    mergeData(existing, incoming) {
        const merged = { ...existing };
        
        // Merge players (incoming takes precedence for newer updates)
        if (incoming.players) {
            for (const [key, player] of Object.entries(incoming.players)) {
                if (!merged.players[key] || 
                    new Date(player.lastUpdated) > new Date(merged.players[key].lastUpdated || 0)) {
                    merged.players[key] = player;
                }
            }
        }
        
        // Merge general info (combine and deduplicate)
        if (incoming.general) {
            const combined = [...(merged.general || []), ...incoming.general];
            const unique = combined.filter((item, index, arr) => 
                arr.findIndex(i => i.text === item.text && i.timestamp === item.timestamp) === index
            );
            merged.general = unique.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Keep only last 100 general items
            if (merged.general.length > 100) {
                merged.general = merged.general.slice(-100);
            }
        }
        
        // Update timestamp
        merged.lastUpdated = new Date().toISOString();
        
        return merged;
    }

    start() {
        this.server.listen(PORT, () => {
            console.log(`FPL Data Server running on http://localhost:${PORT}`);
            console.log(`Data file: ${DATA_FILE}`);
        });
    }
}

// Start the server
const dataServer = new DataServer();
dataServer.start();

module.exports = DataServer;