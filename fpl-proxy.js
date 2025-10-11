// Netlify function to proxy FPL API requests and bypass CORS

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get the endpoint from query params (default to bootstrap-static)
        const endpoint = event.queryStringParameters?.endpoint || 'bootstrap-static';

        const fplApiUrl = `https://fantasy.premierleague.com/api/${endpoint}/`;

        console.log(`Proxying request to: ${fplApiUrl}`);

        const response = await fetch(fplApiUrl, {
            headers: {
                'User-Agent': 'EPL News Hub FPL Tools',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`FPL API responded with ${response.status}`);
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('FPL Proxy Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to fetch FPL data',
                message: error.message
            })
        };
    }
};
