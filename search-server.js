// AI server to handle Ollama LLM requests from FPL AI Assistant
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ollama API integration
async function queryOllama(prompt, context = "") {
    try {
        // Build comprehensive FPL system prompt
        const systemPrompt = `You are an expert Fantasy Premier League (FPL) assistant with deep knowledge of:
- Player statistics, form, and performance metrics
- Gameweek strategy and optimal timing for transfers/captains
- FPL rules, chips usage (Wildcard, Free Hit, Bench Boost, Triple Captain)
- Price changes and market dynamics
- Fixture analysis and team rotation risks

Provide specific, actionable advice. Use data-driven reasoning. Be concise but comprehensive.

${context ? `Additional Context: ${context}` : ''}

User Question: ${prompt}

Response:`;

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3.2:1b',
                prompt: systemPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                    num_predict: 400,
                    stop: ["User Question:", "Context:"]
                }
            })
        });

        if (response.ok) {
            const data = await response.json();
            return data.response?.trim();
        } else {
            console.log('Ollama API not available (status:', response.status, '), using fallback');
            return null;
        }
    } catch (error) {
        console.log('Ollama API error:', error.message);
        return null;
    }
}

// Enhanced AI endpoint using Ollama
app.post('/api/ai-query', async (req, res) => {
    try {
        const { query, context } = req.body;
        
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        
        console.log(`🤖 AI query: ${query}`);
        
        // Try Ollama first
        const ollamaResponse = await queryOllama(query, context);
        
        if (ollamaResponse) {
            res.json({
                response: ollamaResponse,
                source: 'ollama-llama3.1',
                timestamp: new Date().toISOString()
            });
        } else {
            // Fallback to rule-based responses
            const fallbackResponse = generateFallbackResponse(query);
            res.json({
                response: fallbackResponse,
                source: 'fallback',
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('AI query error:', error);
        res.status(500).json({ 
            error: 'AI query failed',
            response: 'Sorry, I encountered an error processing your question.'
        });
    }
});

function generateFallbackResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('haaland')) {
        return "Haaland is one of the top premium forwards in FPL, known for his consistent goal-scoring record at Manchester City.";
    } else if (lowerQuery.includes('salah')) {
        return "Salah remains a reliable FPL pick with consistent attacking returns for Liverpool.";
    } else if (lowerQuery.includes('captain')) {
        return "For captaincy, consider players with good fixtures, form, and high ownership. Premium forwards and midfielders often make the best captain choices.";
    } else if (lowerQuery.includes('transfer')) {
        return "Make transfers based on player form, fixtures, and price changes. Avoid knee-jerk reactions and plan ahead.";
    } else if (lowerQuery.includes('wildcard') || lowerQuery.includes('free hit')) {
        return "Chips should be used strategically during double gameweeks or when your team needs major restructuring.";
    }
    
    return "I can help with FPL strategy, player analysis, transfers, captaincy advice, and more. What specific aspect would you like to discuss?";
}

// Serve static files from current directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'fpl-ai-assistant.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🤖 FPL AI Server running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`🧠 Using Ollama Llama 3.1 model for AI responses`);
});

module.exports = app;