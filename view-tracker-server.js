// View Tracker Server - Stores and retrieves article view counts
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'article-views.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data file if it doesn't exist
async function initializeDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify({}, null, 2));
        console.log('Created article-views.json');
    }
}

// Read view data
async function getViewData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading view data:', error);
        return {};
    }
}

// Write view data
async function saveViewData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving view data:', error);
        return false;
    }
}

// Get article identifier from URL
function getArticleId(url) {
    // Extract article name from URL path
    const match = url.match(/articles\/([^\/\?#]+\.html)/);
    if (match) return match[1];
    
    // For main pages
    if (url.includes('/index.html') || url === '/') return 'homepage';
    
    // Default to full path
    return url.replace(/[^a-zA-Z0-9\-_]/g, '-');
}

// Track unique visitors using IP and user agent
const uniqueVisitors = new Map();

function isUniqueVisit(articleId, ip, userAgent) {
    const visitorKey = `${articleId}-${ip}-${userAgent}`;
    const lastVisit = uniqueVisitors.get(visitorKey);
    const now = Date.now();
    
    // Consider it unique if more than 1 hour has passed
    if (!lastVisit || now - lastVisit > 3600000) {
        uniqueVisitors.set(visitorKey, now);
        return true;
    }
    return false;
}

// ROUTES

// Get view count for an article
app.get('/api/views/:articleId', async (req, res) => {
    const articleId = decodeURIComponent(req.params.articleId);
    const viewData = await getViewData();
    
    const article = viewData[articleId] || { count: 0, lastUpdated: null };
    
    res.json({
        articleId,
        views: article.count,
        lastUpdated: article.lastUpdated
    });
});

// Get all view counts
app.get('/api/views', async (req, res) => {
    const viewData = await getViewData();
    
    // Convert to array and sort by views
    const articles = Object.entries(viewData)
        .map(([id, data]) => ({
            articleId: id,
            views: data.count,
            lastUpdated: data.lastUpdated
        }))
        .sort((a, b) => b.views - a.views);
    
    res.json({
        total: articles.length,
        articles
    });
});

// Increment view count for an article
app.post('/api/views', async (req, res) => {
    const { url, articleId: providedId, forceIncrement } = req.body;
    
    if (!url && !providedId) {
        return res.status(400).json({ error: 'URL or articleId required' });
    }
    
    const articleId = providedId || getArticleId(url);
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Check if this is a unique visit (unless forced)
    if (!forceIncrement && !isUniqueVisit(articleId, ip, userAgent)) {
        const viewData = await getViewData();
        const article = viewData[articleId] || { count: 0 };
        return res.json({
            articleId,
            views: article.count,
            incremented: false,
            message: 'Already counted within the hour'
        });
    }
    
    const viewData = await getViewData();
    
    if (!viewData[articleId]) {
        viewData[articleId] = {
            count: 0,
            firstView: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }
    
    viewData[articleId].count++;
    viewData[articleId].lastUpdated = new Date().toISOString();
    
    const saved = await saveViewData(viewData);
    
    if (saved) {
        res.json({
            articleId,
            views: viewData[articleId].count,
            incremented: true
        });
    } else {
        res.status(500).json({ error: 'Failed to save view count' });
    }
});

// Reset view count for an article (admin only - should add auth)
app.delete('/api/views/:articleId', async (req, res) => {
    const articleId = decodeURIComponent(req.params.articleId);
    const viewData = await getViewData();
    
    if (viewData[articleId]) {
        delete viewData[articleId];
        await saveViewData(viewData);
        res.json({ success: true, message: 'View count reset' });
    } else {
        res.status(404).json({ error: 'Article not found' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'view-tracker',
        timestamp: new Date().toISOString()
    });
});

// Initialize and start server
initializeDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`View tracker server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
});

// Cleanup old visitor entries every hour
setInterval(() => {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    for (const [key, timestamp] of uniqueVisitors.entries()) {
        if (timestamp < oneHourAgo) {
            uniqueVisitors.delete(key);
        }
    }
}, 3600000);