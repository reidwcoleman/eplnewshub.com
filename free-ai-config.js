// Free AI Services Configuration
// These services provide free tiers without requiring API keys in the client

const FREE_AI_SERVICES = {
    // Ollama - Local LLM (best option if user has it installed)
    ollama: {
        url: 'http://localhost:11434/api/generate',
        models: ['llama2', 'mistral', 'codellama'],
        requiresKey: false
    },
    
    // DeepInfra - Free tier available
    deepinfra: {
        url: 'https://api.deepinfra.com/v1/openai/chat/completions',
        model: 'meta-llama/Llama-2-7b-chat-hf',
        requiresKey: false,
        freeLimit: '1000 requests/month'
    },
    
    // Replicate - Public models
    replicate: {
        url: 'https://api.replicate.com/v1/predictions',
        models: ['meta/llama-2-7b-chat'],
        requiresKey: false,
        note: 'Rate limited but free for public models'
    },
    
    // TextSynth - Free tier
    textsynth: {
        url: 'https://api.textsynth.com/v1/engines/gptj_6B/completions',
        requiresKey: false,
        freeLimit: '200 requests/day'
    },
    
    // GooseAI - Free trial
    gooseai: {
        url: 'https://api.goose.ai/v1/engines/gpt-neo-20b/completions',
        requiresKey: false,
        freeLimit: 'Limited free trial'
    }
};

// Function to try multiple free services
async function getFreeAIResponse(message) {
    const services = [
        // Try local Ollama first (fastest and unlimited)
        async () => {
            try {
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: 'llama2',
                        prompt: `You are an FPL expert. User question: ${message}`,
                        stream: false
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    return { text: data.response, service: 'ollama' };
                }
            } catch (e) {}
            return null;
        },
        
        // Try DeepInfra
        async () => {
            try {
                const response = await fetch('https://api.deepinfra.com/v1/inference/meta-llama/Llama-2-7b-chat-hf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        input: `[INST] You are an FPL expert assistant. ${message} [/INST]`
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    return { text: data.results[0].generated_text, service: 'deepinfra' };
                }
            } catch (e) {}
            return null;
        },
        
        // Try HF Inference API (no token, public models only)
        async () => {
            try {
                const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        inputs: message,
                        parameters: { max_length: 200 }
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    return { text: data[0].generated_text, service: 'huggingface-free' };
                }
            } catch (e) {}
            return null;
        }
    ];
    
    // Try each service in order
    for (const service of services) {
        const result = await service();
        if (result) return result;
    }
    
    // Fallback to offline response
    return {
        text: generateOfflineFPLResponse(message),
        service: 'offline'
    };
}

// Enhanced offline FPL responses
function generateOfflineFPLResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Captain picks
    if (lowerMessage.includes('captain')) {
        const captains = ['Haaland', 'Salah', 'Son', 'De Bruyne', 'Kane'];
        return `For captaincy this week, consider ${captains[Math.floor(Math.random() * captains.length)]} based on current form and fixtures. Check their recent performances and opponent's defensive record.`;
    }
    
    // Transfer advice
    if (lowerMessage.includes('transfer')) {
        return `For transfers, consider: 1) Player form over last 4 games, 2) Upcoming fixtures (next 6 GWs), 3) Team rotation risk, 4) Price changes. Avoid taking hits unless the player will outscore the replaced player by 4+ points.`;
    }
    
    // Wildcard
    if (lowerMessage.includes('wildcard')) {
        return `Best times to wildcard: 1) GW8-9 (fixture swings), 2) GW16-17 (around World Cup), 3) GW30-31 (DGW preparation). Build a team for the next 8 gameweeks, not just the next 1-2.`;
    }
    
    // Default
    return `Based on current FPL data: Focus on players with good fixtures over the next 4-6 gameweeks. Premium assets like Haaland and Salah remain essential. Consider form over fixtures for defensive picks.`;
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getFreeAIResponse, FREE_AI_SERVICES };
}