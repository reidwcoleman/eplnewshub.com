const fetch = require('node-fetch');

// Search for FPL news using multiple strategies
async function searchFPLNews(query) {
    const results = [];

    // Strategy 1: Try Brave Search API if available (free tier: 2000 queries/month)
    if (process.env.BRAVE_SEARCH_API_KEY) {
        try {
            const braveResults = await searchWithBrave(query);
            if (braveResults.length > 0) {
                return { success: true, results: braveResults, source: 'Brave Search' };
            }
        } catch (error) {
            console.error('Brave Search failed:', error.message);
        }
    }

    // Strategy 2: Google Search (free, no key required - works from server side)
    try {
        const googleResults = await searchWithGoogle(query);
        if (googleResults.length > 0) {
            return { success: true, results: googleResults, source: 'Google Search' };
        }
    } catch (error) {
        console.error('Google Search failed:', error.message);
    }

    // Strategy 3: Scrape specific FPL news sites (free, no key required)
    try {
        const scrapedResults = await scrapeFPLSites(query);
        if (scrapedResults.length > 0) {
            return { success: true, results: scrapedResults, source: 'FPL Official API' };
        }
    } catch (error) {
        console.error('FPL scraping failed:', error.message);
    }

    // Strategy 4: Use DuckDuckGo for general FPL queries
    try {
        const ddgResults = await searchWithDuckDuckGo(query);
        if (ddgResults.length > 0) {
            return { success: true, results: ddgResults, source: 'DuckDuckGo' };
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

// Google Search (free, works from server-side, no CORS issues)
async function searchWithGoogle(query) {
    const searchQuery = encodeURIComponent(`FPL ${query} site:reddit.com OR site:fantasy.premierleague.com OR site:premierleague.com`);
    const url = `https://www.google.com/search?q=${searchQuery}&num=5`;

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    });

    if (!response.ok) {
        throw new Error(`Google search error: ${response.status}`);
    }

    const html = await response.text();
    const results = parseGoogleResults(html);
    return results;
}

// Parse Google HTML results
function parseGoogleResults(html) {
    const results = [];

    // Simple regex-based parsing (works without external dependencies)
    // Match Google search result divs
    const resultPattern = /<div class="[^"]*g[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?<cite[^>]*>([\s\S]*?)<\/cite>[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/gi;

    let match;
    let count = 0;
    while ((match = resultPattern.exec(html)) && count < 5) {
        const title = match[1].replace(/<[^>]+>/g, '').trim();
        const url = match[2].replace(/<[^>]+>/g, '').trim();
        const description = match[3].replace(/<[^>]+>/g, '').trim();

        if (title && url) {
            results.push({
                title: title.substring(0, 150),
                description: description.substring(0, 300) || 'No description available',
                url: url.startsWith('http') ? url : `https://${url}`,
                date: 'From Google Search'
            });
            count++;
        }
    }

    // Fallback: simpler pattern if the above doesn't work
    if (results.length === 0) {
        const simplePattern = /<a[^>]*href="\/url\?q=([^"&]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let simpleMatch;
        let simpleCount = 0;

        while ((simpleMatch = simplePattern.exec(html)) && simpleCount < 5) {
            const url = decodeURIComponent(simpleMatch[1]);
            const title = simpleMatch[2].replace(/<[^>]+>/g, '').trim();

            if (url.startsWith('http') && !url.includes('google.com') && title.length > 10) {
                results.push({
                    title: title.substring(0, 150),
                    description: 'Latest FPL news from Google',
                    url: url,
                    date: 'From Google Search'
                });
                simpleCount++;
            }
        }
    }

    return results;
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
