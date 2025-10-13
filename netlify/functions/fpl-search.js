const fetch = require('node-fetch');

// Search for FPL news using multiple strategies
async function searchFPLNews(query) {
    const results = [];

    // Strategy 1: Try Brave Search API if available (free tier: 2000 queries/month)
    if (process.env.BRAVE_SEARCH_API_KEY) {
        try {
            const braveResults = await searchWithBrave(query);
            if (braveResults.length > 0) {
                return { success: true, results: braveResults, source: 'brave' };
            }
        } catch (error) {
            console.error('Brave Search failed:', error.message);
        }
    }

    // Strategy 2: Scrape specific FPL news sites (free, no key required)
    try {
        const scrapedResults = await scrapeFPLSites(query);
        if (scrapedResults.length > 0) {
            return { success: true, results: scrapedResults, source: 'scraper' };
        }
    } catch (error) {
        console.error('Scraping failed:', error.message);
    }

    // Strategy 3: Use DuckDuckGo for general FPL queries
    try {
        const ddgResults = await searchWithDuckDuckGo(query);
        if (ddgResults.length > 0) {
            return { success: true, results: ddgResults, source: 'duckduckgo' };
        }
    } catch (error) {
        console.error('DuckDuckGo failed:', error.message);
    }

    return { success: false, results: [], source: 'none' };
}

// Brave Search API
async function searchWithBrave(query) {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=FPL ${query}`, {
        headers: {
            'Accept': 'application/json',
            'X-Subscription-Token': process.env.BRAVE_SEARCH_API_KEY
        }
    });

    if (!response.ok) {
        throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();
    return data.web?.results?.slice(0, 5).map(r => ({
        title: r.title,
        description: r.description,
        url: r.url,
        date: r.age || 'Recent'
    })) || [];
}

// Scrape FPL-specific sites
async function scrapeFPLSites(query) {
    const results = [];

    // Scrape FPL official site news
    try {
        const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
        if (response.ok) {
            const data = await response.json();

            // Get player news
            if (data.elements) {
                const players = data.elements
                    .filter(p => p.news && p.news.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 3);

                players.forEach(p => {
                    results.push({
                        title: `${p.web_name} - ${p.news}`,
                        description: `Status: ${p.status}. Chance of playing: ${p.chance_of_playing_next_round}%`,
                        url: `https://fantasy.premierleague.com/`,
                        date: 'Live from FPL API'
                    });
                });
            }

            // Get gameweek info
            if (data.events) {
                const currentGW = data.events.find(e => e.is_current);
                if (currentGW) {
                    results.push({
                        title: `Gameweek ${currentGW.id} - ${currentGW.name}`,
                        description: `Deadline: ${new Date(currentGW.deadline_time).toLocaleString()}`,
                        url: 'https://fantasy.premierleague.com/',
                        date: 'Current Gameweek'
                    });
                }
            }
        }
    } catch (error) {
        console.error('FPL API scraping failed:', error.message);
    }

    return results;
}

// DuckDuckGo Instant Answer API (free, no key)
async function searchWithDuckDuckGo(query) {
    const response = await fetch(`https://api.duckduckgo.com/?q=FPL ${query}&format=json`);

    if (!response.ok) {
        throw new Error(`DuckDuckGo error: ${response.status}`);
    }

    const data = await response.json();
    const results = [];

    // Get abstract (main answer)
    if (data.Abstract) {
        results.push({
            title: data.Heading || 'FPL Information',
            description: data.Abstract,
            url: data.AbstractURL || 'https://fantasy.premierleague.com/',
            date: 'DuckDuckGo Answer'
        });
    }

    // Get related topics
    if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 3).forEach(topic => {
            if (topic.Text && topic.FirstURL) {
                results.push({
                    title: topic.Text.substring(0, 100),
                    description: topic.Text,
                    url: topic.FirstURL,
                    date: 'Related Topic'
                });
            }
        });
    }

    return results;
}

// Main handler
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        const { query } = JSON.parse(event.body);

        if (!query || !query.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Query is required' }),
            };
        }

        console.log(`Searching for FPL news: ${query}`);
        const searchResults = await searchFPLNews(query);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(searchResults),
        };

    } catch (error) {
        console.error('Search function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            }),
        };
    }
};
