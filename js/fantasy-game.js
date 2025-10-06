// Fantasy Premier League Game JavaScript

// Current team state
let currentTeam = {
    players: [],
    budget: 100.0, // £100m budget
    formation: '3-5-2',
    totalValue: 0
};

// Live player database from FPL API
let playerDatabase = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: []
};

// Fixture data for next 3 gameweeks
let fixtureData = [];

// Team mapping for fixture display
let teamMapping = {};

// FPL Data Service instance
let fplService;

// Initialize FPL data
async function initializeFPLData() {
    try {
        fplService = new FPLDataService();
        const bootstrap = await fplService.getBootstrapData();
        const fixtures = await fplService.getUpcomingFixtures();
        
        // Clear existing database
        playerDatabase = { GK: [], DEF: [], MID: [], FWD: [] };
        fixtureData = fixtures;
        
        // Build team mapping
        teamMapping = {};
        bootstrap.teams.forEach(team => {
            teamMapping[team.id] = {
                short_name: team.short_name,
                name: team.name
            };
        });
        
        // Process ALL players from FPL API (not just a subset)
        bootstrap.elements.forEach(player => {
            const team = bootstrap.teams.find(t => t.id === player.team);
            const position = getPositionFromElementType(player.element_type);
            
            // Get next 3 fixtures for this player's team
            const teamFixtures = getNext3Fixtures(player.team, fixtures, bootstrap.teams);
            
            const processedPlayer = {
                id: player.id,
                name: `${player.first_name} ${player.second_name}`,
                web_name: player.web_name,
                team: team ? team.short_name : 'UNK',
                team_name: team ? team.name : 'Unknown',
                team_id: player.team,
                price: player.now_cost / 10, // Convert from pence to pounds
                element_type: player.element_type,
                stats: {
                    goals: player.goals_scored || 0,
                    assists: player.assists || 0,
                    points: player.total_points || 0,
                    saves: player.saves || 0,
                    cleanSheets: player.clean_sheets || 0,
                    form: parseFloat(player.form) || 0,
                    selected_by_percent: parseFloat(player.selected_by_percent) || 0,
                    minutes: player.minutes || 0,
                    bonus: player.bonus || 0,
                    yellow_cards: player.yellow_cards || 0,
                    red_cards: player.red_cards || 0
                },
                fixtures: teamFixtures,
                // Additional FPL data
                total_points: player.total_points,
                form: player.form,
                selected_by_percent: player.selected_by_percent,
                now_cost: player.now_cost,
                status: player.status,
                news: player.news || '',
                photo: player.photo || ''
            };
            
            if (playerDatabase[position]) {
                playerDatabase[position].push(processedPlayer);
            }
        });
        
        // Sort players by total points (descending) in each position for better relevance
        Object.keys(playerDatabase).forEach(position => {
            playerDatabase[position].sort((a, b) => b.stats.points - a.stats.points);
        });
        
        console.log('FPL player database loaded:', Object.keys(playerDatabase).map(pos => `${pos}: ${playerDatabase[pos].length}`));
        console.log('Total players loaded:', Object.values(playerDatabase).reduce((sum, pos) => sum + pos.length, 0));
        return true;
    } catch (error) {
        console.error('Failed to load FPL data:', error);
        
        // Load fallback static data
        loadFallbackPlayerData();
        return false;
    }
}

// Fallback static player data (comprehensive version for offline use)
function loadFallbackPlayerData() {
    playerDatabase = {
        GK: [
            {id: 1, name: 'Alisson Becker', web_name: 'Alisson', team: 'LIV', team_name: 'Liverpool', price: 5.5, stats: {saves: 89, cleanSheets: 12, points: 120, form: 5.2}, fixtures: [{opponent: 'MCI', is_home: true, difficulty: 4}, {opponent: 'ARS', is_home: false, difficulty: 3}]},
            {id: 2, name: 'Ederson', web_name: 'Ederson', team: 'MCI', team_name: 'Manchester City', price: 5.2, stats: {saves: 67, cleanSheets: 15, points: 130, form: 5.8}, fixtures: [{opponent: 'LIV', is_home: false, difficulty: 4}, {opponent: 'CHE', is_home: true, difficulty: 3}]},
            {id: 3, name: 'David Raya', web_name: 'Raya', team: 'ARS', team_name: 'Arsenal', price: 5.1, stats: {saves: 102, cleanSheets: 11, points: 115, form: 4.9}, fixtures: [{opponent: 'TOT', is_home: true, difficulty: 3}, {opponent: 'LIV', is_home: true, difficulty: 4}]},
            {id: 4, name: 'Andre Onana', web_name: 'Onana', team: 'MUN', team_name: 'Manchester Utd', price: 4.8, stats: {saves: 118, cleanSheets: 8, points: 95, form: 4.2}, fixtures: [{opponent: 'WHU', is_home: true, difficulty: 2}, {opponent: 'NEW', is_home: false, difficulty: 3}]},
            {id: 5, name: 'Nick Pope', web_name: 'Pope', team: 'NEW', team_name: 'Newcastle', price: 4.6, stats: {saves: 134, cleanSheets: 7, points: 85, form: 4.1}, fixtures: [{opponent: 'BRE', is_home: true, difficulty: 2}, {opponent: 'MUN', is_home: true, difficulty: 3}]},
            {id: 6, name: 'Robert Sanchez', web_name: 'Sánchez', team: 'CHE', team_name: 'Chelsea', price: 4.4, stats: {saves: 95, cleanSheets: 9, points: 90, form: 4.3}, fixtures: [{opponent: 'FUL', is_home: false, difficulty: 2}, {opponent: 'MCI', is_home: false, difficulty: 4}]},
            {id: 7, name: 'Guglielmo Vicario', web_name: 'Vicario', team: 'TOT', team_name: 'Tottenham', price: 4.5, stats: {saves: 112, cleanSheets: 8, points: 88, form: 4.0}, fixtures: [{opponent: 'ARS', is_home: false, difficulty: 4}, {opponent: 'EVE', is_home: true, difficulty: 2}]},
            {id: 8, name: 'Jordan Pickford', web_name: 'Pickford', team: 'EVE', team_name: 'Everton', price: 4.3, stats: {saves: 126, cleanSheets: 6, points: 82, form: 3.9}, fixtures: [{opponent: 'BOU', is_home: true, difficulty: 2}, {opponent: 'TOT', is_home: false, difficulty: 3}]},
            {id: 9, name: 'Matz Sels', web_name: 'Sels', team: 'NFO', team_name: 'Nottingham Forest', price: 4.4, stats: {saves: 145, cleanSheets: 10, points: 98, form: 4.5}, fixtures: [{opponent: 'CRY', is_home: true, difficulty: 2}, {opponent: 'AVL', is_home: false, difficulty: 3}]},
            {id: 10, name: 'Mark Flekken', web_name: 'Flekken', team: 'BRE', team_name: 'Brentford', price: 4.2, stats: {saves: 119, cleanSheets: 6, points: 84, form: 4.0}, fixtures: [{opponent: 'NEW', is_home: false, difficulty: 3}, {opponent: 'LEI', is_home: true, difficulty: 2}]}
        ],
        DEF: [
            {id: 11, name: 'Virgil van Dijk', web_name: 'van Dijk', team: 'LIV', team_name: 'Liverpool', price: 6.1, stats: {goals: 3, assists: 2, cleanSheets: 12, points: 145, form: 5.5}, fixtures: [{opponent: 'MCI', is_home: true, difficulty: 4}, {opponent: 'ARS', is_home: false, difficulty: 3}]},
            {id: 12, name: 'William Saliba', web_name: 'Saliba', team: 'ARS', team_name: 'Arsenal', price: 5.8, stats: {goals: 2, assists: 1, cleanSheets: 11, points: 135, form: 5.2}, fixtures: [{opponent: 'TOT', is_home: true, difficulty: 3}, {opponent: 'LIV', is_home: true, difficulty: 4}]},
            {id: 13, name: 'Ruben Dias', web_name: 'Rúben Dias', team: 'MCI', team_name: 'Manchester City', price: 5.7, stats: {goals: 1, assists: 3, cleanSheets: 15, points: 140, form: 5.3}, fixtures: [{opponent: 'LIV', is_home: false, difficulty: 4}, {opponent: 'CHE', is_home: true, difficulty: 3}]},
            {id: 14, name: 'Josko Gvardiol', web_name: 'Gvardiol', team: 'MCI', team_name: 'Manchester City', price: 5.6, stats: {goals: 4, assists: 2, cleanSheets: 15, points: 155, form: 6.1}, fixtures: [{opponent: 'LIV', is_home: false, difficulty: 4}, {opponent: 'CHE', is_home: true, difficulty: 3}]},
            {id: 15, name: 'Trent Alexander-Arnold', web_name: 'Alexander-Arnold', team: 'LIV', team_name: 'Liverpool', price: 7.2, stats: {goals: 3, assists: 12, cleanSheets: 12, points: 165, form: 6.8}, fixtures: [{opponent: 'MCI', is_home: true, difficulty: 4}, {opponent: 'ARS', is_home: false, difficulty: 3}]},
            {id: 16, name: 'Gabriel Magalhães', web_name: 'Gabriel', team: 'ARS', team_name: 'Arsenal', price: 5.9, stats: {goals: 4, assists: 1, cleanSheets: 11, points: 142, form: 5.4}, fixtures: [{opponent: 'TOT', is_home: true, difficulty: 3}, {opponent: 'LIV', is_home: true, difficulty: 4}]},
            {id: 17, name: 'Lewis Dunk', web_name: 'Dunk', team: 'BHA', team_name: 'Brighton', price: 4.8, stats: {goals: 2, assists: 2, cleanSheets: 8, points: 98, form: 4.2}, fixtures: [{opponent: 'WOL', is_home: true, difficulty: 2}, {opponent: 'SOU', is_home: false, difficulty: 2}]},
            {id: 18, name: 'Murillo', web_name: 'Murillo', team: 'NFO', team_name: 'Nottingham Forest', price: 4.9, stats: {goals: 3, assists: 3, cleanSheets: 10, points: 125, form: 5.8}, fixtures: [{opponent: 'CRY', is_home: true, difficulty: 2}, {opponent: 'AVL', is_home: false, difficulty: 3}]},
            {id: 19, name: 'Antonee Robinson', web_name: 'Robinson', team: 'FUL', team_name: 'Fulham', price: 4.7, stats: {goals: 1, assists: 4, cleanSheets: 7, points: 89, form: 4.3}, fixtures: [{opponent: 'CHE', is_home: true, difficulty: 3}, {opponent: 'IPS', is_home: false, difficulty: 2}]},
            {id: 20, name: 'Dan Burn', web_name: 'Burn', team: 'NEW', team_name: 'Newcastle', price: 4.5, stats: {goals: 1, assists: 2, cleanSheets: 7, points: 78, form: 3.8}, fixtures: [{opponent: 'BRE', is_home: true, difficulty: 2}, {opponent: 'MUN', is_home: true, difficulty: 3}]}
        ],
        MID: [
            {id: 26, name: 'Mohamed Salah', web_name: 'Salah', team: 'LIV', team_name: 'Liverpool', price: 12.8, stats: {goals: 21, assists: 14, points: 218, form: 7.2}, fixtures: [{opponent: 'MCI', is_home: true, difficulty: 4}, {opponent: 'ARS', is_home: false, difficulty: 3}]},
            {id: 27, name: 'Cole Palmer', web_name: 'Palmer', team: 'CHE', team_name: 'Chelsea', price: 10.2, stats: {goals: 15, assists: 11, points: 152, form: 6.8}, fixtures: [{opponent: 'FUL', is_home: false, difficulty: 2}, {opponent: 'MCI', is_home: false, difficulty: 4}]},
            {id: 28, name: 'Bukayo Saka', web_name: 'Saka', team: 'ARS', team_name: 'Arsenal', price: 9.7, stats: {goals: 12, assists: 9, points: 148, form: 6.5}, fixtures: [{opponent: 'TOT', is_home: true, difficulty: 3}, {opponent: 'LIV', is_home: true, difficulty: 4}]},
            {id: 29, name: 'Bruno Fernandes', web_name: 'Bruno F.', team: 'MUN', team_name: 'Manchester Utd', price: 8.3, stats: {goals: 9, assists: 12, points: 134, form: 5.9}, fixtures: [{opponent: 'WHU', is_home: true, difficulty: 2}, {opponent: 'NEW', is_home: false, difficulty: 3}]},
            {id: 30, name: 'Bryan Mbeumo', web_name: 'Mbeumo', team: 'BRE', team_name: 'Brentford', price: 6.2, stats: {goals: 13, assists: 6, points: 143, form: 7.1}, fixtures: [{opponent: 'NEW', is_home: false, difficulty: 3}, {opponent: 'LEI', is_home: true, difficulty: 2}]},
            {id: 31, name: 'Morgan Gibbs-White', web_name: 'Gibbs-White', team: 'NFO', team_name: 'Nottingham Forest', price: 6.1, stats: {goals: 7, assists: 9, points: 118, form: 6.2}, fixtures: [{opponent: 'CRY', is_home: true, difficulty: 2}, {opponent: 'AVL', is_home: false, difficulty: 3}]},
            {id: 32, name: 'Antoine Semenyo', web_name: 'Semenyo', team: 'BOU', team_name: 'Bournemouth', price: 5.4, stats: {goals: 9, assists: 3, points: 102, form: 5.8}, fixtures: [{opponent: 'EVE', is_home: false, difficulty: 2}, {opponent: 'WOL', is_home: true, difficulty: 2}]},
            {id: 33, name: 'Kaoru Mitoma', web_name: 'Mitoma', team: 'BHA', team_name: 'Brighton', price: 5.8, stats: {goals: 4, assists: 6, points: 87, form: 4.9}, fixtures: [{opponent: 'WOL', is_home: true, difficulty: 2}, {opponent: 'SOU', is_home: false, difficulty: 2}]},
            {id: 34, name: 'Marcus Rashford', web_name: 'Rashford', team: 'MUN', team_name: 'Manchester Utd', price: 6.8, stats: {goals: 8, assists: 4, points: 89, form: 4.1}, fixtures: [{opponent: 'WHU', is_home: true, difficulty: 2}, {opponent: 'NEW', is_home: false, difficulty: 3}]},
            {id: 35, name: 'Phil Foden', web_name: 'Foden', team: 'MCI', team_name: 'Manchester City', price: 9.2, stats: {goals: 6, assists: 8, points: 92, form: 4.8}, fixtures: [{opponent: 'LIV', is_home: false, difficulty: 4}, {opponent: 'CHE', is_home: true, difficulty: 3}]}
        ],
        FWD: [
            {id: 41, name: 'Erling Haaland', web_name: 'Haaland', team: 'MCI', team_name: 'Manchester City', price: 15.1, stats: {goals: 24, assists: 3, points: 245, form: 8.2}, fixtures: [{opponent: 'LIV', is_home: false, difficulty: 4}, {opponent: 'CHE', is_home: true, difficulty: 3}]},
            {id: 42, name: 'Alexander Isak', web_name: 'Isak', team: 'NEW', team_name: 'Newcastle', price: 8.9, stats: {goals: 17, assists: 4, points: 159, form: 7.1}, fixtures: [{opponent: 'BRE', is_home: true, difficulty: 2}, {opponent: 'MUN', is_home: true, difficulty: 3}]},
            {id: 43, name: 'Chris Wood', web_name: 'Wood', team: 'NFO', team_name: 'Nottingham Forest', price: 6.8, stats: {goals: 20, assists: 2, points: 167, form: 7.5}, fixtures: [{opponent: 'CRY', is_home: true, difficulty: 2}, {opponent: 'AVL', is_home: false, difficulty: 3}]},
            {id: 44, name: 'Yoane Wissa', web_name: 'Wissa', team: 'BRE', team_name: 'Brentford', price: 6.1, stats: {goals: 12, assists: 3, points: 139, form: 6.9}, fixtures: [{opponent: 'NEW', is_home: false, difficulty: 3}, {opponent: 'LEI', is_home: true, difficulty: 2}]},
            {id: 45, name: 'Ollie Watkins', web_name: 'Watkins', team: 'AVL', team_name: 'Aston Villa', price: 8.2, stats: {goals: 15, assists: 6, points: 132, form: 6.3}, fixtures: [{opponent: 'BOU', is_home: true, difficulty: 2}, {opponent: 'NFO', is_home: true, difficulty: 2}]},
            {id: 46, name: 'Nicolas Jackson', web_name: 'Jackson', team: 'CHE', team_name: 'Chelsea', price: 7.8, stats: {goals: 14, assists: 5, points: 128, form: 6.1}, fixtures: [{opponent: 'FUL', is_home: false, difficulty: 2}, {opponent: 'MCI', is_home: false, difficulty: 4}]},
            {id: 47, name: 'Dominic Solanke', web_name: 'Solanke', team: 'BOU', team_name: 'Bournemouth', price: 7.3, stats: {goals: 11, assists: 2, points: 98, form: 5.4}, fixtures: [{opponent: 'EVE', is_home: false, difficulty: 2}, {opponent: 'WOL', is_home: true, difficulty: 2}]},
            {id: 48, name: 'Danny Welbeck', web_name: 'Welbeck', team: 'BHA', team_name: 'Brighton', price: 5.9, stats: {goals: 9, assists: 3, points: 89, form: 5.1}, fixtures: [{opponent: 'WOL', is_home: true, difficulty: 2}, {opponent: 'SOU', is_home: false, difficulty: 2}]},
            {id: 49, name: 'Kai Havertz', web_name: 'Havertz', team: 'ARS', team_name: 'Arsenal', price: 8.1, stats: {goals: 11, assists: 7, points: 124, form: 5.9}, fixtures: [{opponent: 'TOT', is_home: true, difficulty: 3}, {opponent: 'LIV', is_home: true, difficulty: 4}]},
            {id: 50, name: 'Rasmus Højlund', web_name: 'Højlund', team: 'MUN', team_name: 'Manchester Utd', price: 6.9, stats: {goals: 8, assists: 2, points: 76, form: 4.2}, fixtures: [{opponent: 'WHU', is_home: true, difficulty: 2}, {opponent: 'NEW', is_home: false, difficulty: 3}]}
        ]
    };
}

// Convert FPL element_type to position string
function getPositionFromElementType(elementType) {
    const positions = {
        1: 'GK',
        2: 'DEF',
        3: 'MID',
        4: 'FWD'
    };
    return positions[elementType] || 'MID';
}

// Get next 3 fixtures for a team
function getNext3Fixtures(teamId, fixtures, teams) {
    const teamFixtures = fixtures
        .filter(fixture => fixture.team_h === teamId || fixture.team_a === teamId)
        .slice(0, 3)
        .map(fixture => {
            const isHome = fixture.team_h === teamId;
            const opponentId = isHome ? fixture.team_a : fixture.team_h;
            const opponent = teams.find(t => t.id === opponentId);
            const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;
            
            return {
                gameweek: fixture.event,
                opponent: opponent ? opponent.short_name : 'TBD',
                opponent_name: opponent ? opponent.name : 'TBD',
                is_home: isHome,
                difficulty: difficulty,
                kickoff_time: fixture.kickoff_time
            };
        });
    
    return teamFixtures;
}

// Team constraints
const teamConstraints = {
    minPlayers: 15,
    maxPlayers: 15,
    positions: {
        GK: {min: 2, max: 2},
        DEF: {min: 5, max: 5},
        MID: {min: 5, max: 5},
        FWD: {min: 3, max: 3}
    },
    maxPerTeam: 3,
    budget: 100.0
};

// Position slot mappings for formation 3-5-2
const positionSlots = {
    starting: {
        GK: 1,
        DEF: 3,
        MID: 5,
        FWD: 2
    },
    bench: {
        GK: 1,
        DEF: 1,
        MID: 1,
        FWD: 1
    }
};

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading message
    showLoadingMessage();
    
    // Initialize FPL data
    const fplLoaded = await initializeFPLData();
    
    if (fplLoaded) {
        console.log('✅ Live FPL data loaded successfully');
        hideLoadingMessage();
    } else {
        console.warn('⚠️ Using fallback player data');
        showFallbackMessage();
    }
    
    updateTeamSummary();
    
    // Setup search functionality
    setupSearchFunctionality();
});

// Setup search functionality
function setupSearchFunctionality() {
    // Add event listener for search input if it exists
    const searchInput = document.getElementById('player-search');
    if (searchInput) {
        searchInput.addEventListener('input', searchPlayers);
        searchInput.addEventListener('keyup', searchPlayers);
    }
    
    // Set up mutation observer to handle dynamically added search inputs
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const searchInput = node.querySelector ? node.querySelector('#player-search') : null;
                    if (searchInput) {
                        searchInput.addEventListener('input', searchPlayers);
                        searchInput.addEventListener('keyup', searchPlayers);
                    }
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Loading message functions
function showLoadingMessage() {
    const gameHeader = document.querySelector('.game-header');
    if (gameHeader) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'fpl-loading';
        loadingDiv.style.cssText = `
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
            color: white;
        `;
        loadingDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span>Loading live FPL player data...</span>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        gameHeader.appendChild(loadingDiv);
    }
}

function hideLoadingMessage() {
    const loadingDiv = document.getElementById('fpl-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

function showFallbackMessage() {
    const loadingDiv = document.getElementById('fpl-loading');
    if (loadingDiv) {
        loadingDiv.innerHTML = `
            <div style="color: #FFD700;">
                ⚠️ Using cached player data - Some prices may not be current
            </div>
        `;
        setTimeout(() => {
            loadingDiv.remove();
        }, 3000);
    }
}

// Show player selector modal
function showPlayerSelector(position, slotNumber) {
    const modal = document.getElementById('player-selector-modal');
    const title = document.getElementById('selector-title');
    
    title.textContent = `Select ${position}`;
    modal.style.display = 'flex';
    
    // Store current selection context
    modal.dataset.position = position;
    modal.dataset.slotNumber = slotNumber;
    
    // Filter and display players
    filterPlayers(position);
    
    // Reset search
    document.getElementById('player-search').value = '';
    
    // Reset filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-position="${position}"]`).classList.add('active');
}

// Close player selector modal
function closePlayerSelector() {
    const modal = document.getElementById('player-selector-modal');
    modal.style.display = 'none';
}

// Filter players by position
function filterPlayers(position) {
    const playerList = document.getElementById('player-list');
    const players = position === 'ALL' ? getAllPlayers() : playerDatabase[position];
    
    if (!players || players.length === 0) {
        playerList.innerHTML = '<div class="no-players">No players found</div>';
        return;
    }
    
    // Sort players by price (descending)
    const sortedPlayers = [...players].sort((a, b) => b.price - a.price);
    
    playerList.innerHTML = sortedPlayers.map(player => createPlayerOptionHTML(player)).join('');
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-position="${position}"]`).classList.add('active');
}

// Get all players from database
function getAllPlayers() {
    const allPlayers = [];
    Object.values(playerDatabase).forEach(positionPlayers => {
        allPlayers.push(...positionPlayers);
    });
    return allPlayers;
}

// Create HTML for player option
function createPlayerOptionHTML(player) {
    const isSelected = isPlayerSelected(player.id);
    const canAfford = canAffordPlayer(player);
    const teamCount = getTeamPlayerCount(player.team);
    const maxTeamReached = teamCount >= teamConstraints.maxPerTeam;
    
    const disabled = !canAfford || (maxTeamReached && !isSelected);
    const disabledClass = disabled ? 'disabled' : '';
    const selectedClass = isSelected ? 'selected' : '';
    
    return `
        <div class="player-option ${selectedClass} ${disabledClass}" 
             onclick="${disabled ? '' : `selectPlayer(${player.id})`}">
            <div class="player-info">
                <h4>${player.name}</h4>
                <div class="player-details">
                    ${player.team} • ${getPlayerPosition(player.id)}
                    ${disabled && !canAfford ? ' • Cannot afford' : ''}
                    ${disabled && maxTeamReached && !isSelected ? ' • Max 3 per team' : ''}
                </div>
                <div class="player-stats">
                    ${getPlayerStatsDisplay(player)}
                </div>
            </div>
            <div class="player-price-info">
                <div class="player-price">£${player.price}m</div>
            </div>
        </div>
    `;
}

// Get player position from database
function getPlayerPosition(playerId) {
    for (const [position, players] of Object.entries(playerDatabase)) {
        if (players.some(p => p.id === playerId)) {
            return position;
        }
    }
    return 'Unknown';
}

// Get player stats display
function getPlayerStatsDisplay(player) {
    const position = getPlayerPosition(player.id);
    let stats = '';
    
    switch (position) {
        case 'GK':
            stats = `${player.stats.saves} saves • ${player.stats.cleanSheets} CS • ${player.stats.points} pts`;
            break;
        case 'DEF':
            stats = `${player.stats.goals} goals • ${player.stats.assists} assists • ${player.stats.cleanSheets} CS • ${player.stats.points} pts`;
            break;
        case 'MID':
        case 'FWD':
            stats = `${player.stats.goals} goals • ${player.stats.assists} assists • ${player.stats.points} pts • Form: ${player.stats.form}`;
            break;
        default:
            stats = `${player.stats.points} pts • Form: ${player.stats.form}`;
    }
    
    // Add fixture information
    if (player.fixtures && player.fixtures.length > 0) {
        const fixtureText = player.fixtures.map(fixture => {
            const homeAway = fixture.is_home ? 'vs' : '@';
            const difficultyIcon = getDifficultyIcon(fixture.difficulty);
            return `${homeAway} ${fixture.opponent} ${difficultyIcon}`;
        }).join(', ');
        stats += `<br><span style="color: #666; font-size: 0.9em;">Next: ${fixtureText}</span>`;
    }
    
    return stats;
}

// Get difficulty icon based on difficulty rating
function getDifficultyIcon(difficulty) {
    if (difficulty <= 2) return '🟢';
    if (difficulty === 3) return '🟡';
    if (difficulty >= 4) return '🔴';
    return '';
}

// Check if player is already selected
function isPlayerSelected(playerId) {
    return currentTeam.players.some(p => p.id === playerId);
}

// Check if player can be afforded
function canAffordPlayer(player) {
    const remainingBudget = currentTeam.budget - currentTeam.totalValue;
    return player.price <= remainingBudget;
}

// Get count of players from specific team
function getTeamPlayerCount(team) {
    return currentTeam.players.filter(p => p.team === team).length;
}

// Select a player
function selectPlayer(playerId) {
    const player = findPlayerById(playerId);
    if (!player) return;
    
    const modal = document.getElementById('player-selector-modal');
    const position = modal.dataset.position;
    const slotNumber = parseInt(modal.dataset.slotNumber);
    
    // Check if we can afford this player
    if (!canAffordPlayer(player)) {
        alert('Cannot afford this player!');
        return;
    }
    
    // Check team constraints
    const teamCount = getTeamPlayerCount(player.team);
    if (teamCount >= teamConstraints.maxPerTeam && !isPlayerSelected(playerId)) {
        alert(`You can only have ${teamConstraints.maxPerTeam} players from the same team!`);
        return;
    }
    
    // Find existing player in this slot
    const existingPlayerIndex = currentTeam.players.findIndex(p => 
        p.slotPosition === position && p.slotNumber === slotNumber
    );
    
    // Remove existing player if any
    if (existingPlayerIndex !== -1) {
        currentTeam.players.splice(existingPlayerIndex, 1);
    }
    
    // Add new player with slot information
    const playerWithSlot = {
        ...player,
        slotPosition: position,
        slotNumber: slotNumber
    };
    
    currentTeam.players.push(playerWithSlot);
    
    // Update display
    updatePlayerSlot(position, slotNumber, player);
    updateTeamSummary();
    
    // Close modal
    closePlayerSelector();
}

// Find player by ID in database
function findPlayerById(playerId) {
    for (const players of Object.values(playerDatabase)) {
        const player = players.find(p => p.id === playerId);
        if (player) return player;
    }
    return null;
}

// Update player slot display
function updatePlayerSlot(position, slotNumber, player) {
    const isStarting = (
        (position === 'GK' && slotNumber <= positionSlots.starting.GK) ||
        (position === 'DEF' && slotNumber <= positionSlots.starting.DEF) ||
        (position === 'MID' && slotNumber <= positionSlots.starting.MID) ||
        (position === 'FWD' && slotNumber <= positionSlots.starting.FWD)
    );
    
    const slotSelector = isStarting ? 
        `.player-slot[data-position="${position}"]:nth-of-type(${slotNumber})` :
        `.bench-player[data-position="${position}"]`;
    
    const slot = document.querySelector(slotSelector);
    if (!slot) return;
    
    const playerCard = slot.querySelector('.player-card');
    playerCard.classList.remove('empty');
    playerCard.classList.add('filled');
    
    playerCard.innerHTML = `
        <div class="player-name">${player.name.split(' ').pop()}</div>
        <div class="player-price">£${player.price}m</div>
        <div class="team-logo">${getTeamLogo(player.team)}</div>
        ${getPlayerFixtureDisplay(player)}
    `;
    
    // Update click handler to allow player replacement
    slot.onclick = () => showPlayerSelector(position, slotNumber);
}

// Get team logo abbreviation
function getTeamLogo(team) {
    // Handle common abbreviations from FPL API
    const teamLogos = {
        'MCI': 'MC', 'MAN': 'MU', 'LIV': 'LIV', 'ARS': 'ARS', 'CHE': 'CHE', 
        'TOT': 'TOT', 'NEW': 'NEW', 'BRE': 'BRE', 'WHU': 'WHU', 'AVL': 'AVL',
        'BHA': 'BRI', 'EVE': 'EVE', 'FUL': 'FUL', 'CRY': 'CRY', 'LEI': 'LEI',
        'NFO': 'FOR', 'WOL': 'WOL', 'BOU': 'BOU', 'SOU': 'SOU', 'IPS': 'IPS'
    };
    return teamLogos[team] || team.substring(0, 3);
}

// Get player fixture display for starting XI
function getPlayerFixtureDisplay(player) {
    if (!player.fixtures || player.fixtures.length === 0) {
        return '<div class="player-fixtures" style="font-size: 0.7em; color: #666; margin-top: 2px;">No fixtures</div>';
    }
    
    const fixtureText = player.fixtures.slice(0, 2).map(fixture => {
        const homeAway = fixture.is_home ? 'vs' : '@';
        const difficultyIcon = getDifficultyIcon(fixture.difficulty);
        return `${homeAway}${fixture.opponent}${difficultyIcon}`;
    }).join(' ');
    
    return `<div class="player-fixtures" style="font-size: 0.7em; color: #666; margin-top: 2px;">${fixtureText}</div>`;
}

// Update team summary display
function updateTeamSummary() {
    // Calculate total value
    currentTeam.totalValue = currentTeam.players.reduce((sum, player) => sum + player.price, 0);
    
    // Calculate remaining budget
    const remainingBudget = currentTeam.budget - currentTeam.totalValue;
    
    // Update display
    document.getElementById('remaining-budget').textContent = `£${remainingBudget.toFixed(1)}m`;
    document.getElementById('selected-players').textContent = `${currentTeam.players.length}/${teamConstraints.minPlayers}`;
    document.getElementById('team-value').textContent = `£${currentTeam.totalValue.toFixed(1)}m`;
    
    // Enable/disable save button
    const saveBtn = document.getElementById('save-team-btn');
    const isTeamComplete = currentTeam.players.length === teamConstraints.minPlayers;
    const isValidTeam = validateTeamConstraints();
    
    if (saveBtn) {
        saveBtn.disabled = !isTeamComplete || !isValidTeam;
        saveBtn.style.opacity = (isTeamComplete && isValidTeam) ? '1' : '0.6';
    }
}

// Validate team constraints
function validateTeamConstraints() {
    const positionCounts = {GK: 0, DEF: 0, MID: 0, FWD: 0};
    const teamCounts = {};
    
    // Count players by position and team
    currentTeam.players.forEach(player => {
        const position = getPlayerPosition(player.id);
        positionCounts[position]++;
        
        teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
    });
    
    // Check position constraints
    for (const [position, constraints] of Object.entries(teamConstraints.positions)) {
        if (positionCounts[position] < constraints.min || positionCounts[position] > constraints.max) {
            return false;
        }
    }
    
    // Check team constraints
    for (const count of Object.values(teamCounts)) {
        if (count > teamConstraints.maxPerTeam) {
            return false;
        }
    }
    
    // Check budget
    if (currentTeam.totalValue > currentTeam.budget) {
        return false;
    }
    
    return true;
}

// Search players
function searchPlayers() {
    const searchInput = document.getElementById('player-search');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase().trim();
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.position : 'ALL';
    
    let players = activeFilter === 'ALL' ? getAllPlayers() : (playerDatabase[activeFilter] || []);
    
    if (query) {
        players = players.filter(player => {
            const searchableText = [
                player.name || '',
                player.web_name || '',
                player.team || '',
                player.team_name || ''
            ].join(' ').toLowerCase();
            
            return searchableText.includes(query);
        });
    }
    
    const playerList = document.getElementById('player-list');
    if (!playerList) return;
    
    if (players.length === 0) {
        playerList.innerHTML = '<div class="no-players">No players found matching your search</div>';
        return;
    }
    
    // Sort players by total points (descending) for better relevance
    const sortedPlayers = [...players].sort((a, b) => {
        // Prioritize players with higher points and form
        const aScore = (a.stats.points || 0) + (parseFloat(a.stats.form || 0) * 10);
        const bScore = (b.stats.points || 0) + (parseFloat(b.stats.form || 0) * 10);
        return bScore - aScore;
    });
    
    playerList.innerHTML = sortedPlayers.map(player => createPlayerOptionHTML(player)).join('');
}

// Save team
function saveTeam() {
    if (!validateTeamConstraints()) {
        alert('Team does not meet all constraints!');
        return;
    }
    
    if (currentTeam.players.length !== teamConstraints.minPlayers) {
        alert('You must select exactly 15 players!');
        return;
    }
    
    // Save to localStorage
    const teamData = {
        ...currentTeam,
        savedAt: new Date().toISOString(),
        teamName: `Team ${Date.now()}`
    };
    
    localStorage.setItem('fantasyTeam', JSON.stringify(teamData));
    alert('Team saved successfully!');
}

// Reset team
function resetTeam() {
    if (confirm('Are you sure you want to reset your team? This will remove all selected players.')) {
        currentTeam.players = [];
        currentTeam.totalValue = 0;
        
        // Reset all player slots
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('filled');
            card.classList.add('empty');
            
            const position = card.closest('[data-position]').dataset.position;
            card.innerHTML = `
                <div class="add-player">+</div>
                <div class="position-label">${position}</div>
            `;
        });
        
        updateTeamSummary();
    }
}

// Show my teams
function showMyTeams() {
    const savedTeam = localStorage.getItem('fantasyTeam');
    if (!savedTeam) {
        alert('No saved teams found!');
        return;
    }
    
    const team = JSON.parse(savedTeam);
    const savedDate = new Date(team.savedAt).toLocaleDateString();
    
    alert(`Saved Team: ${team.teamName}\nSaved: ${savedDate}\nPlayers: ${team.players.length}\nValue: £${team.totalValue.toFixed(1)}m`);
}

// Add CSS for disabled players
const style = document.createElement('style');
style.textContent = `
    .player-option.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .player-option.disabled:hover {
        background: white;
        border-color: #e9ecef;
    }
    
    .no-players {
        text-align: center;
        padding: 40px 20px;
        color: #666;
        font-style: italic;
    }
`;
document.head.appendChild(style);