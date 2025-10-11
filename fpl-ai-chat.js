// Netlify serverless function for FPL AI Chat
// Uses Groq API (free, fast, no credit card required)

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { message, conversationHistory = [] } = JSON.parse(event.body);

        if (!message) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        // Build conversation context
        const messages = [
            {
                role: 'system',
                content: `You are an expert Fantasy Premier League (FPL) AI assistant. You provide:
- Team selection and transfer advice
- Captain and vice-captain recommendations
- Fixture analysis and difficulty ratings
- Player form, stats, and differential suggestions
- Chip strategy (wildcard, free hit, bench boost, triple captain)
- Gameweek planning and mini-league strategies

Always be helpful, concise, and data-driven. Use FPL terminology naturally.`
            }
        ];

        // Add conversation history (last 5 messages for context)
        const recentHistory = conversationHistory.slice(-10);
        recentHistory.forEach(msg => {
            messages.push({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        });

        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        // Try Groq API first (fastest, free)
        if (GROQ_API_KEY) {
            try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: 500,
                        stream: false
                    })
                });

                if (groqResponse.ok) {
                    const data = await groqResponse.json();
                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            response: data.choices[0].message.content,
                            service: 'groq',
                            model: 'llama-3.3-70b'
                        })
                    };
                }
            } catch (error) {
                console.error('Groq API error:', error);
            }
        }

        // Fallback to OpenRouter (free tier available)
        try {
            const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://eplnewshub.com',
                    'X-Title': 'EPL News Hub FPL Assistant'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-exp:free',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (openrouterResponse.ok) {
                const data = await openrouterResponse.json();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        response: data.choices[0].message.content,
                        service: 'openrouter',
                        model: 'gemini-2.0-flash'
                    })
                };
            }
        } catch (error) {
            console.error('OpenRouter API error:', error);
        }

        // Final fallback - enhanced offline response
        const offlineResponse = generateFPLResponse(message);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                response: offlineResponse,
                service: 'offline-enhanced'
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

// Enhanced offline FPL response generator
function generateFPLResponse(message) {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('captain')) {
        return `**Captain Recommendations:**

For the upcoming gameweek, consider these top picks:

1. **Erling Haaland** - Excellent home fixture, highest ceiling
2. **Mohamed Salah** - Consistent returns, set piece threat
3. **Cole Palmer** - Great form, favorable matchup

**Tips:**
- Check fixture difficulty ratings (FDR)
- Consider form over last 5 games
- Review opponent's defensive weaknesses
- Monitor team news before deadline`;
    }

    if (lowerMsg.includes('transfer') || lowerMsg.includes('bring in')) {
        return `**Transfer Strategy:**

**Key Principles:**
- Don't take hits (-4 points) unless absolutely necessary
- Target players with good fixture runs (3-5 gameweeks)
- Monitor price changes to maximize team value
- Save transfers when team is performing well

**Current Hot Picks:**
- Budget forwards with good fixtures
- Attacking defenders with clean sheet potential
- In-form midfielders from top 6 teams

Check the Stats tab for detailed player metrics!`;
    }

    if (lowerMsg.includes('wildcard') || lowerMsg.includes('chip')) {
        return `**Chip Strategy Guide:**

**Wildcard:** Use when your team needs 4+ transfers
- Best before double gameweeks
- After major injury crisis
- Mid-season template adjustment

**Free Hit:** Save for blank/double gameweeks
**Bench Boost:** Play during double gameweeks
**Triple Captain:** Use on Haaland/Salah in doubles

**Pro Tip:** Plan chip usage across the entire season!`;
    }

    if (lowerMsg.includes('differential') || lowerMsg.includes('rank')) {
        return `**Differential Strategy:**

**Low-Owned Gems:**
- Target <10% ownership for big rank gains
- Risk vs reward - higher variance
- Best for chasing in mini-leagues

**When to Use:**
- Behind in rank and need to catch up
- Double gameweeks for differential captains
- Final gameweeks for template breaks

Balance 2-3 differentials with template core!`;
    }

    if (lowerMsg.includes('fixture') || lowerMsg.includes('fdr')) {
        return `**Fixture Analysis Tips:**

Look for:
- **Green fixtures (FDR 2)** - Easy games
- **Fixture runs** - 3-5 good games in a row
- **Home advantage** - Teams score more at home
- **Double gameweeks** - Two fixtures in one GW

Avoid:
- Red fixtures (FDR 4-5)
- Teams with blanks coming up
- Rotation risks in packed schedules`;
    }

    if (lowerMsg.includes('budget') || lowerMsg.includes('cheap')) {
        return `**Budget Players to Consider:**

**Defenders (4.0-5.0m):**
- Look for teams with good defense
- Wing-backs get attacking returns

**Midfielders (5.0-6.5m):**
- Attacking mids from mid-table teams
- Set piece takers

**Forwards (6.0-7.5m):**
- Starting strikers from promoted teams
- Rotation risks but good value

Leave 0.5-1.0m in the bank for flexibility!`;
    }

    // Default helpful response
    return `**FPL AI Assistant Ready!**

I can help you with:
- 🎯 Captain picks and analysis
- 🔄 Transfer recommendations
- 📊 Player statistics and form
- 🎴 Chip strategy (Wildcard, Free Hit, etc.)
- 📅 Fixture difficulty ratings
- 💰 Budget options and differentials
- 🏆 Mini-league strategies

Ask me anything about your FPL team! Try:
- "Who should I captain?"
- "Best budget midfielder?"
- "When to use wildcard?"`;
}
