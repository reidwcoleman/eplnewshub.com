// Script to import FPL player data from player-data-2.html into the global database
const fs = require('fs');
const path = require('path');

console.log('🔄 Importing FPL player data into global database...');

async function importPlayerData() {
    try {
        // Read the FPL API data
        const playerDataFile = path.join(__dirname, 'player-data-2.html');
        const rawData = fs.readFileSync(playerDataFile, 'utf8');
        
        // Parse JSON data
        const fplData = JSON.parse(rawData);
        console.log('✅ Successfully parsed FPL API data');
        
        // Load existing persistent data
        const persistentDataFile = path.join(__dirname, 'fpl-persistent-data.json');
        let persistentData;
        
        try {
            persistentData = JSON.parse(fs.readFileSync(persistentDataFile, 'utf8'));
            console.log('✅ Loaded existing persistent data');
        } catch (e) {
            console.log('📁 Creating new persistent data structure');
            persistentData = {
                players: {},
                general: [],
                teams: {},
                fixtures: {},
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
        }
        
        // Extract key players and their data
        const topPlayers = fplData.elements
            .filter(player => 
                player.selected_by_percent > 5 || // Popular players
                player.total_points > 30 ||       // High scorers
                player.now_cost > 80 ||           // Premium players
                ['Haaland', 'Salah', 'Palmer', 'Saka', 'Son', 'Watkins', 'Isak', 'Gordon', 'Bruno', 'Foden'].includes(player.second_name)
            )
            .slice(0, 50); // Top 50 players
        
        console.log(`🏃‍♂️ Found ${topPlayers.length} key players to import`);
        
        // Convert FPL data to our format
        let importCount = 0;
        topPlayers.forEach(player => {
            const playerKey = player.second_name.toLowerCase();
            const playerName = player.second_name;
            
            // Build comprehensive player info
            const playerInfo = [];
            const stats = {};
            
            // Add current form and points info
            if (player.total_points > 0) {
                playerInfo.push({
                    text: `Has ${player.total_points} total points this season with ${player.points_per_game} points per game`,
                    data: {
                        points: player.total_points,
                        ppg: parseFloat(player.points_per_game)
                    },
                    timestamp: new Date().toISOString()
                });
                stats.totalPoints = player.total_points;
                stats.ppg = parseFloat(player.points_per_game);
            }
            
            // Add price info
            if (player.now_cost) {
                const price = player.now_cost / 10; // Convert from tenths to millions
                playerInfo.push({
                    text: `Currently priced at £${price}m (${player.selected_by_percent}% ownership)`,
                    data: {
                        price: price,
                        ownership: parseFloat(player.selected_by_percent)
                    },
                    timestamp: new Date().toISOString()
                });
                stats.price = price;
                stats.ownership = parseFloat(player.selected_by_percent);
            }
            
            // Add injury/status info
            if (player.news && player.news.trim() !== '') {
                playerInfo.push({
                    text: `Latest news: ${player.news}`,
                    data: {
                        status: player.status === 'i' ? 'injured' : 'fit',
                        news: player.news
                    },
                    timestamp: player.news_added || new Date().toISOString()
                });
                
                if (player.status === 'i') {
                    stats.status = 'injured';
                }
            }
            
            // Add form info if good
            if (parseFloat(player.form) > 3) {
                playerInfo.push({
                    text: `In good form with ${player.form} form rating`,
                    data: {
                        form: parseFloat(player.form)
                    },
                    timestamp: new Date().toISOString()
                });
                stats.form = parseFloat(player.form);
            }
            
            // Add transfer activity if significant
            if (player.transfers_in_event > 50000) {
                playerInfo.push({
                    text: `High transfer activity: ${player.transfers_in_event} transfers in this gameweek`,
                    data: {
                        transfersIn: player.transfers_in_event
                    },
                    timestamp: new Date().toISOString()
                });
            }
            
            // Only add if we have meaningful info
            if (playerInfo.length > 0) {
                persistentData.players[playerKey] = {
                    name: playerName,
                    info: playerInfo,
                    stats: stats,
                    created: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    source: 'fpl_api_import'
                };
                importCount++;
            }
        });
        
        // Add some general FPL insights
        const totalPlayers = fplData.elements.length;
        const avgPrice = fplData.elements.reduce((sum, p) => sum + p.now_cost, 0) / totalPlayers / 10;
        
        persistentData.general.push({
            text: `FPL database contains ${totalPlayers} players with average price £${avgPrice.toFixed(1)}m`,
            timestamp: new Date().toISOString()
        });
        
        // Update metadata
        persistentData.lastUpdated = new Date().toISOString();
        
        // Save updated data
        fs.writeFileSync(persistentDataFile, JSON.stringify(persistentData, null, 2));
        
        console.log(`✅ Successfully imported ${importCount} players into global database`);
        console.log(`📊 Database now contains ${Object.keys(persistentData.players).length} total players`);
        console.log(`📝 Added ${persistentData.general.length} general insights`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error importing player data:', error);
        return false;
    }
}

// Run the import
importPlayerData().then(success => {
    if (success) {
        console.log('🎉 Player data import completed successfully!');
        console.log('🌐 FPL AI assistant now has comprehensive player database');
    } else {
        console.log('💥 Import failed');
    }
});