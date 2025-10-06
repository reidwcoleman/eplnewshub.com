// FPL AI Assistant - OpenAI API Proxy Server
// This server acts as a proxy to securely handle OpenAI API requests
// Run this on your backend to protect your API key

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://eplnewshub.com', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json());

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// FPL-specific system prompt
const FPL_SYSTEM_PROMPT = `You are an expert Fantasy Premier League (FPL) assistant with deep knowledge of:
- Player statistics, form, and fixtures
- Transfer strategies and timing
- Captain selections and differentials
- Chip usage (Wildcard, Bench Boost, Triple Captain, Free Hit)
- Price predictions and team value management
- Mini-league strategies and rank climbing tactics

You also have general knowledge and can answer any question naturally. When discussing FPL:
- Provide data-driven insights
- Consider current gameweek and fixtures
- Give specific player recommendations
- Explain reasoning behind advice
- Be conversational and helpful

Current Season: 2024/25
Current Gameweek: Calculate based on date (season started Aug 16, 2024)`;

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        
        if (!OPENAI_API_KEY) {
            // Fallback response if no API key
            return res.json({
                response: "I'm currently running in demo mode. To enable full AI capabilities, please configure the OpenAI API key on the server.",
                error: false
            });
        }
        
        // Prepare messages for OpenAI
        const messages = [
            { role: 'system', content: FPL_SYSTEM_PROMPT },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];
        
        // Make request to OpenAI
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-3.5-turbo', // or 'gpt-4' for better responses
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                presence_penalty: 0.6,
                frequency_penalty: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const aiResponse = response.data.choices[0].message.content;
        
        res.json({
            response: aiResponse,
            error: false
        });
        
    } catch (error) {
        console.error('OpenAI API Error:', error.response?.data || error.message);
        
        // Fallback to intelligent response without API
        const fallbackResponse = generateFallbackResponse(req.body.message);
        
        res.json({
            response: fallbackResponse,
            error: false,
            fallback: true
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        apiConfigured: !!OPENAI_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// Generate intelligent fallback response when API is unavailable
function generateFallbackResponse(message) {
    const lower = message.toLowerCase();
    
    // FPL-specific responses
    if (lower.includes('captain')) {
        return "For captaincy decisions, consider players with: home fixtures, good form, and favorable opponent defensive stats. Haaland and Salah are typically safe choices, while players like Palmer or Saka can be good differentials. What's your current team looking like?";
    }
    
    if (lower.includes('transfer')) {
        return "Transfer strategy depends on your team's needs. Focus on: fixing injuries first, targeting good fixtures, and building team value over time. Are you looking to address a specific position or planning ahead for future gameweeks?";
    }
    
    if (lower.includes('wildcard')) {
        return "Wildcard timing is crucial. Best times are typically: during international breaks, before fixture swings, or when you need 4+ transfers. The key is planning it 2-3 weeks in advance. How many issues does your current team have?";
    }
    
    if (lower.includes('differential')) {
        return "Good differentials have low ownership (<10%) but high potential. Look for: players returning from injury, those with fixture swings, or talented players in improving teams. Players like Gordon, Mbeumo, or Eze often fit this profile.";
    }
    
    // General responses
    if (lower.includes('hello') || lower.includes('hi')) {
        return "Hello! I'm your FPL AI assistant. I can help with captain picks, transfers, wildcard strategy, or any other FPL questions. I can also chat about general topics. What would you like to discuss?";
    }
    
    return "I'm here to help with FPL strategy and general questions. While I'm currently running without full AI capabilities, I can still provide advice on captains, transfers, wildcards, and more. What specifically would you like to know?";
}

// Start server
app.listen(PORT, () => {
    console.log(`FPL AI Proxy Server running on port ${PORT}`);
    console.log(`OpenAI API Key configured: ${!!OPENAI_API_KEY}`);
    if (!OPENAI_API_KEY) {
        console.log('⚠️  Warning: No OpenAI API key found. Add OPENAI_API_KEY to your .env file');
        console.log('The server will run in fallback mode with limited responses.');
    }
});

module.exports = app;