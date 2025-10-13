const fetch = require('node-fetch');

// FPL-focused system prompt that allows answering any question
const FPL_SYSTEM_PROMPT = `You are an expert Fantasy Premier League (FPL) AI assistant with deep knowledge of football tactics, player statistics, and FPL strategy. While you specialize in FPL content, you can answer any question the user asks.

Your primary expertise includes:
- FPL strategy and tactics (captain picks, transfers, wildcards, chips)
- Premier League players, teams, fixtures, and form analysis
- Points predictions and differential picks
- Budget optimization and team building
- Gameweek planning and long-term strategy
- Historical FPL data and trends

For FPL questions, provide detailed, data-driven advice with specific player recommendations when relevant. For non-FPL questions, provide helpful, accurate responses while maintaining a friendly, knowledgeable tone.

Keep responses concise (2-4 paragraphs max) and actionable. Use bullet points for lists. Be conversational and encouraging.`;

// Try multiple AI providers for redundancy
async function callGroq(messages) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    return {
        response: data.choices[0].message.content,
        service: 'groq'
    };
}

async function callOpenRouter(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://eplnewshub.com',
            'X-Title': 'EPL News Hub FPL Assistant',
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    return {
        response: data.choices[0].message.content,
        service: 'openrouter'
    };
}

async function callOpenAI(messages) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return {
        response: data.choices[0].message.content,
        service: 'openai'
    };
}

async function callAnthropic(messages) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: systemMessage ? systemMessage.content : FPL_SYSTEM_PROMPT,
            messages: conversationMessages,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    return {
        response: data.content[0].text,
        service: 'anthropic'
    };
}

// Main handler
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const { message, conversationHistory } = JSON.parse(event.body);

        if (!message || !message.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Message is required' }),
            };
        }

        // Build messages array with context
        const messages = [
            { role: 'system', content: FPL_SYSTEM_PROMPT }
        ];

        // Add conversation history (last 10 messages)
        if (conversationHistory && Array.isArray(conversationHistory)) {
            const recentHistory = conversationHistory.slice(-10);
            recentHistory.forEach(msg => {
                messages.push({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.text
                });
            });
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        // Try AI providers in order of preference
        let result;
        const providers = [
            { name: 'Groq', fn: callGroq },
            { name: 'OpenRouter', fn: callOpenRouter },
            { name: 'Anthropic', fn: callAnthropic },
            { name: 'OpenAI', fn: callOpenAI }
        ];

        let lastError;
        for (const provider of providers) {
            try {
                console.log(`Attempting to use ${provider.name}...`);
                result = await provider.fn(messages);
                console.log(`Successfully used ${provider.name}`);
                break;
            } catch (error) {
                console.error(`${provider.name} failed:`, error.message);
                lastError = error;
                continue;
            }
        }

        if (!result) {
            throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                success: true,
                response: result.response,
                service: result.service
            }),
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
                fallback: true
            }),
        };
    }
};
