const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// FPL context to make the AI more specialized
const FPL_CONTEXT = `You are an expert Fantasy Premier League (FPL) assistant. You provide strategic advice about:
- Player transfers and captain choices
- Team selection and formation
- Fixture analysis and player form
- Price changes and budget management
- Differential picks and mini-league strategies
Always give concise, actionable FPL advice based on current data and trends.`;

// Ollama API endpoint
app.post('/api/fpl-ai', async (req, res) => {
    try {
        const { message, context = '' } = req.body;
        
        // Build the prompt with FPL context
        const prompt = `${FPL_CONTEXT}\n\nUser's FPL Question: ${message}\n${context ? `\nAdditional Context: ${context}` : ''}\n\nFPL Expert Response:`;
        
        // Call Ollama API
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'mistral',
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 500
            }
        });
        
        res.json({
            success: true,
            response: response.data.response,
            model: 'mistral'
        });
        
    } catch (error) {
        console.error('Ollama API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get FPL advice. Please make sure Ollama is running.',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check if Ollama is running
        const response = await axios.get('http://localhost:11434/api/tags');
        res.json({
            success: true,
            status: 'Ollama server is running',
            models: response.data.models || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'Ollama server is not running',
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`FPL AI Server running on http://localhost:${PORT}`);
    console.log('Make sure Ollama is running: ollama serve');
});