// Search server to handle Google search requests from FPL AI Assistant
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve static files from current directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'fpl-ai-assistant.html'));
});

// Search endpoint using WebSearch functionality
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        
        console.log(`🔍 Server searching for: ${query}`);
        
        // Simulate Google search with realistic FPL results
        // In a real implementation, you would use Google Custom Search API
        const searchResults = await performGoogleSearch(query);
        
        res.json({
            query: query,
            results: searchResults,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            error: 'Search failed',
            results: []
        });
    }
});

async function performGoogleSearch(query) {
    // Simulate realistic Google search results for FPL queries
    const lowerQuery = query.toLowerCase();
    
    // Player-specific search results
    if (lowerQuery.includes('haaland')) {
        if (lowerQuery.includes('injury')) {
            return [
                'Erling Haaland has returned to Manchester City training following a minor ankle knock and is expected to be fit for the next Premier League fixture',
                'Pep Guardiola confirms Haaland trained fully yesterday and should be available for selection this weekend'
            ];
        } else if (lowerQuery.includes('form')) {
            return [
                'Haaland has scored 4 goals in his last 3 Premier League appearances, showing excellent form in front of goal',
                'The Norwegian striker has the highest expected goals (xG) among all Premier League forwards over the past month'
            ];
        } else if (lowerQuery.includes('transfer')) {
            return [
                'Haaland is being transferred in by over 200,000 FPL managers this week following his recent goal streak',
                'The Man City striker remains the most popular premium forward despite his high price tag'
            ];
        }
    }
    
    if (lowerQuery.includes('palmer')) {
        if (lowerQuery.includes('injury')) {
            return [
                'Cole Palmer is still recovering from a groin injury sustained in training, with Chelsea medical staff being cautious about his return',
                'Enzo Maresca provided no definitive timeline for Palmer return, saying the club will not rush him back'
            ];
        } else if (lowerQuery.includes('form')) {
            return [
                'Palmer was in exceptional form before his injury, recording 3 goals and 2 assists in 4 games',
                'Chelsea have struggled creatively without Palmer, highlighting his importance to their attack'
            ];
        }
    }
    
    if (lowerQuery.includes('salah')) {
        if (lowerQuery.includes('form')) {
            return [
                'Mohamed Salah continues his strong start to the season with 5 goals and 3 assists in recent matches',
                'Liverpool manager Arne Slot praised Salah fitness and consistency, calling him key to their title ambitions'
            ];
        } else if (lowerQuery.includes('transfer')) {
            return [
                'Salah remains one of the most transferred-in players week after week due to his consistent returns',
                'FPL managers are backing the Egyptian King despite his high price, with ownership climbing steadily'
            ];
        }
    }
    
    if (lowerQuery.includes('saka')) {
        if (lowerQuery.includes('injury')) {
            return [
                'Bukayo Saka is progressing well from his hamstring injury but Arsenal are taking no risks with their star winger',
                'Mikel Arteta expects Saka to return within the next 1-2 weeks, depending on how he responds to training'
            ];
        }
    }
    
    if (lowerQuery.includes('semenyo')) {
        if (lowerQuery.includes('form')) {
            return [
                'Antoine Semenyo has been Bournemouth most consistent performer with 4 goals in 6 games',
                'The Ghanaian forward has become essential to Bournemouth attack under Andoni Iraola system'
            ];
        }
    }
    
    // Generic FPL search results
    if (lowerQuery.includes('captain')) {
        return [
            'Top FPL captain picks this week include Haaland, Salah, and Palmer based on fixtures and form',
            'Premium forwards dominating captain selection with over 60% of top managers backing Haaland'
        ];
    }
    
    if (lowerQuery.includes('transfer')) {
        return [
            'Most popular FPL transfers this week show managers moving towards in-form budget options',
            'Injury concerns driving transfer activity as managers look to avoid price drops'
        ];
    }
    
    if (lowerQuery.includes('wildcard')) {
        return [
            'FPL experts suggest holding wildcards until double gameweeks become clearer around GW28-30',
            'Current template suggests waiting for more fixture information before activating wildcard'
        ];
    }
    
    // Default search results
    return [
        `Latest Fantasy Premier League insights and analysis for ${query.split(' ')[0]}`,
        'FPL community discussing optimal strategies based on current form and fixtures',
        'Expert FPL advice recommends data-driven decisions for better long-term results'
    ];
}

// Start server
app.listen(PORT, () => {
    console.log(`🔍 FPL Search Server running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
});

module.exports = app;