/**
 * Ads.txt Update Script for Ezoic
 * Fetches the latest ads.txt content from Ezoic's managed service
 * Run this periodically to keep your ads.txt up to date
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const DOMAIN = 'eplnewshub.com';
const EZOIC_ADS_TXT_URL = `https://srv.adstxtmanager.com/19390/${DOMAIN}`;
const LOCAL_ADS_TXT_PATH = path.join(__dirname, 'ads.txt');

// Your Google AdSense publisher ID
const YOUR_ADSENSE_ID = 'pub-6480210605786899';

// Backup the current ads.txt before updating
function backupCurrentFile() {
    if (fs.existsSync(LOCAL_ADS_TXT_PATH)) {
        const backupPath = LOCAL_ADS_TXT_PATH + '.backup';
        fs.copyFileSync(LOCAL_ADS_TXT_PATH, backupPath);
        console.log('✓ Backed up current ads.txt to ads.txt.backup');
    }
}

// Fetch ads.txt from Ezoic
function fetchEzoicAdsTxt() {
    return new Promise((resolve, reject) => {
        https.get(EZOIC_ADS_TXT_URL, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve(data);
            });
            
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Ensure your AdSense ID is included
function ensureAdSenseId(content) {
    const adSenseLine = `google.com, ${YOUR_ADSENSE_ID}, DIRECT, f08c47fec0942fa0`;
    
    if (!content.includes(YOUR_ADSENSE_ID)) {
        // Add your AdSense ID at the top
        return `# Your Google AdSense Account\n${adSenseLine}\n\n${content}`;
    }
    
    return content;
}

// Add header comments
function addHeaderComments(content) {
    const header = `# Ezoic Ads.txt File
# Domain: ${DOMAIN}
# Last Updated: ${new Date().toISOString().split('T')[0]}
# Auto-updated from: ${EZOIC_ADS_TXT_URL}

`;
    
    return header + content;
}

// Main update function
async function updateAdsTxt() {
    console.log('================================');
    console.log('Ads.txt Update Script for Ezoic');
    console.log('================================\n');
    
    try {
        // Backup current file
        backupCurrentFile();
        
        // Fetch from Ezoic
        console.log(`Fetching ads.txt from Ezoic for ${DOMAIN}...`);
        let content = await fetchEzoicAdsTxt();
        
        // Check if we got valid content
        if (!content || content.length < 10) {
            console.log('\n⚠️  Warning: Received empty or invalid content from Ezoic');
            console.log('Using fallback content with standard Ezoic entries...\n');
            
            // Use fallback content
            content = getFallbackContent();
        }
        
        // Ensure your AdSense ID is included
        content = ensureAdSenseId(content);
        
        // Add header comments
        content = addHeaderComments(content);
        
        // Write to file
        fs.writeFileSync(LOCAL_ADS_TXT_PATH, content, 'utf8');
        
        console.log('✓ Successfully updated ads.txt');
        console.log(`✓ File saved to: ${LOCAL_ADS_TXT_PATH}`);
        
        // Show summary
        const lines = content.split('\n').filter(line => line && !line.startsWith('#'));
        console.log(`\nSummary:`);
        console.log(`- Total entries: ${lines.length}`);
        console.log(`- File size: ${Buffer.byteLength(content, 'utf8')} bytes`);
        
    } catch (error) {
        console.error('✗ Error updating ads.txt:', error.message);
        console.log('\n⚠️  Using fallback content...');
        
        // Write fallback content on error
        const fallbackContent = addHeaderComments(ensureAdSenseId(getFallbackContent()));
        fs.writeFileSync(LOCAL_ADS_TXT_PATH, fallbackContent, 'utf8');
        console.log('✓ Fallback ads.txt created');
    }
    
    console.log('\n================================');
    console.log('Update Complete!');
    console.log('================================');
    console.log('\nNext steps:');
    console.log('1. Commit and push ads.txt to your repository');
    console.log('2. Verify at: https://eplnewshub.com/ads.txt');
    console.log('3. Check Ezoic dashboard for validation');
    console.log('4. Set up a cron job or GitHub Action to run this weekly');
}

// Fallback content if Ezoic's service is unavailable
function getFallbackContent() {
    return `# Your Google AdSense Account
google.com, ${YOUR_ADSENSE_ID}, DIRECT, f08c47fec0942fa0

# Ezoic Main Account
google.com, pub-6396844742497208, DIRECT, f08c47fec0942fa0
google.com, pub-6396844742497208, RESELLER, f08c47fec0942fa0
google.com, pub-7439041255533808, RESELLER, f08c47fec0942fa0

# Ezoic Core Partners
rubiconproject.com, 19398, RESELLER, 0bfd66d529a55807
pubmatic.com, 157599, RESELLER, 5d62403b186f2ace
openx.com, 540804929, RESELLER, 6a698e2ec38604c6
districtm.io, 102098, RESELLER, 3fd707be9c4527c3
appnexus.com, 11924, RESELLER, f5ab79cb980f11d1
rhythmone.com, 3948367200, RESELLER, a670c89d4a324e47
contextweb.com, 562499, RESELLER, 89ff185a4c4e857c
indexexchange.com, 192410, RESELLER, 50b1c356f2c5c8fc
sovrn.com, 262973, RESELLER, fafdf38b16bf6b2b
amazon-adsystem.com, 3735, RESELLER
media.net, 8CUN37DCC, RESELLER
conversantmedia.com, 100270, RESELLER, 03113cd04947736d
synacor.com, 82431, RESELLER, e108f11b2cdf7d5b
yahoo.com, 59189, RESELLER`;
}

// Run the update
updateAdsTxt();