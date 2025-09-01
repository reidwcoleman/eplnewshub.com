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
        // Build general AI assistant system prompt
        const systemPrompt = `You are a helpful, knowledgeable AI assistant. You can help with:
- General questions and conversations
- Coding and technical problems
- Creative writing and brainstorming
- Analysis and explanations
- Math and science questions
- And many other topics

Provide helpful, accurate, and engaging responses. Be conversational but informative.

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
    
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
        return "Hello! I'm a local AI assistant powered by Llama. How can I help you today?";
    } else if (lowerQuery.includes('code') || lowerQuery.includes('programming')) {
        return "I'd be happy to help with coding questions! What programming language or problem are you working with?";
    } else if (lowerQuery.includes('write') || lowerQuery.includes('story')) {
        return "I can help with creative writing! What kind of story or content would you like to create?";
    } else if (lowerQuery.includes('explain') || lowerQuery.includes('how')) {
        return "I love explaining things! What topic would you like me to break down for you?";
    } else if (lowerQuery.includes('math') || lowerQuery.includes('calculate')) {
        return "I can help with math problems and calculations. What would you like me to work through?";
    }
    
    return "I'm here to help with questions, conversations, coding, writing, explanations, and more. What would you like to explore?";
}

// Serve static files from current directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'fpl-ai-assistant.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🦙 Llama AI Server running on port ${PORT}`);
    console.log(`🌐 Access at: http://localhost:${PORT}`);
    console.log(`🧠 Using Ollama Llama 3.2 model for AI responses`);
});

module.exports = app;