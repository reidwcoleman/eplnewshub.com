/**
 * Script to update all article pages with Ezoic integration
 * Run this with Node.js to update all article HTML files
 */

const fs = require('fs');
const path = require('path');

// Directory containing articles
const articlesDir = path.join(__dirname, 'articles');

// Ezoic integration HTML to add after opening head tag
const ezoicIntegration = `    <!-- Ezoic Integration - MUST be at very top of head -->
    <div include="../ezoic-integration.html"></div>
    
`;

// Function to update a single HTML file
function updateHTMLFile(filePath) {
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if Ezoic is already integrated
        if (content.includes('ezoic-integration.html')) {
            console.log(`✓ Skipped (already integrated): ${path.basename(filePath)}`);
            return;
        }
        
        // Find the position right after <head>
        const headIndex = content.indexOf('<head>');
        if (headIndex === -1) {
            console.log(`✗ Error: No <head> tag found in ${path.basename(filePath)}`);
            return;
        }
        
        // Insert Ezoic integration after <head>
        const insertPosition = headIndex + 6; // Length of '<head>'
        content = content.slice(0, insertPosition) + '\n' + ezoicIntegration + content.slice(insertPosition);
        
        // Write the updated content back
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated: ${path.basename(filePath)}`);
        
    } catch (error) {
        console.error(`✗ Error updating ${filePath}:`, error.message);
    }
}

// Function to update all HTML files in articles directory
function updateAllArticles() {
    console.log('Starting Ezoic integration update for all articles...\n');
    
    // Get all files in articles directory
    const files = fs.readdirSync(articlesDir);
    
    // Filter for HTML files
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`Found ${htmlFiles.length} HTML files in articles directory\n`);
    
    // Update each HTML file
    htmlFiles.forEach(file => {
        const filePath = path.join(articlesDir, file);
        updateHTMLFile(filePath);
    });
    
    console.log('\n✅ Ezoic integration update complete!');
}

// Also update main pages
function updateMainPages() {
    console.log('\nUpdating main pages...\n');
    
    const mainPages = [
        'stats.html',
        'fpl.html',
        'news.html',
        'polls.html',
        'social.html',
        'player-data.html',
        'player-data-enhanced.html',
        'player-predictor.html',
        'transfer-simulator.html',
        'transfer-simulator-pro.html',
        'fpl_24_25.html',
        'latest_transfer_news_and_rumours_june_7th_2024.html',
        'latest_transfer_news_august_2024.html',
        'players_to_watch_euro_2024.html'
    ];
    
    mainPages.forEach(page => {
        const filePath = path.join(__dirname, page);
        if (fs.existsSync(filePath)) {
            updateHTMLFile(filePath);
        } else {
            console.log(`✗ File not found: ${page}`);
        }
    });
}

// Run the updates
console.log('=================================');
console.log('Ezoic Integration Update Script');
console.log('=================================\n');

updateAllArticles();
updateMainPages();

console.log('\n=================================');
console.log('Update Complete!');
console.log('=================================');
console.log('\nNext steps:');
console.log('1. Test the integration on a few pages');
console.log('2. Check that ads display correctly');
console.log('3. Verify premium users don\'t see ads');
console.log('4. Monitor Ezoic dashboard for ad performance');