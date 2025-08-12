// Simple Development Server for EPL News Hub
// Run with: node dev-server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf'
};

// Create server
const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to index.html for root
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Security: prevent directory traversal
    pathname = pathname.replace(/\.\./g, '');
    
    // Get file path
    const filePath = path.join(__dirname, pathname);
    
    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>');
            console.log(`404: ${pathname}`);
            return;
        }
        
        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
                console.error(`Error reading file: ${err}`);
                return;
            }
            
            // Get file extension
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            
            // Set headers
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            });
            
            res.end(data);
            console.log(`200: ${pathname}`);
        });
    });
});

// Start server
server.listen(PORT, HOST, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║     EPL News Hub Development Server            ║
║                                                ║
║     🚀 Server running at:                      ║
║     http://localhost:${PORT}                      ║
║                                                ║
║     📝 Development Features:                   ║
║     - Test mode automatically enabled          ║
║     - Stripe test keys active                  ║
║     - Development banner visible               ║
║                                                ║
║     🔧 Keyboard Shortcuts:                    ║
║     - Ctrl+Shift+D: Toggle dev mode           ║
║     - Ctrl+Shift+T: Show test cards           ║
║                                                ║
║     💳 Test Card: 4242 4242 4242 4242         ║
║                                                ║
║     Press Ctrl+C to stop the server           ║
║                                                ║
╚════════════════════════════════════════════════╝
    `);
    
    // Open browser automatically (optional)
    const platform = process.platform;
    const openCommand = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${openCommand} http://localhost:${PORT}/membership.html?dev=true`);
});