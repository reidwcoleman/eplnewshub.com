#!/usr/bin/env node

// Startup script for FPL AI Assistant with persistent data
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting FPL AI Assistant System...');

// Check if data file exists
const dataFile = path.join(__dirname, 'fpl-persistent-data.json');
if (!fs.existsSync(dataFile)) {
    console.log('📁 Creating initial data file...');
    const defaultData = {
        players: {},
        general: [],
        teams: {},
        fixtures: {},
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(dataFile, JSON.stringify(defaultData, null, 2));
    console.log('✅ Data file created');
}

// Start the data server
console.log('🖥️  Starting data persistence server...');
const server = spawn('node', ['data-server.js'], {
    cwd: __dirname,
    stdio: 'inherit'
});

server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
});

server.on('exit', (code) => {
    console.log(`🛑 Server stopped with code ${code}`);
});

// Instructions
console.log('\n📋 FPL AI Assistant System Status:');
console.log('   ✅ Data persistence server: Running on http://localhost:3001');
console.log('   ✅ Static files: Ready to serve');
console.log('   ✅ Global data storage: Active');
console.log('\n🌐 How it works:');
console.log('   • Users can feed information to the AI assistant');
console.log('   • All fed data is stored permanently on the server');
console.log('   • Everyone who visits gets access to community data');
console.log('   • AI responses use this shared knowledge base');
console.log('\n📖 To test:');
console.log('   1. Open fpl-ai-assistant.html in a web browser');
console.log('   2. Click "Feed Data" mode');
console.log('   3. Enter: "Haaland scored 2 goals and got 12 points"');
console.log('   4. Switch back to chat mode and ask about Haaland');
console.log('   5. The AI will use your fed data in responses');
console.log('\nPress Ctrl+C to stop the server');

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down FPL AI Assistant System...');
    server.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    server.kill();
    process.exit(0);
});