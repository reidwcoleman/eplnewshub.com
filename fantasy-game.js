// Fantasy Premier League Game JavaScript

// Current team state
let currentTeam = {
    players: [],
    budget: 100.0, // £100m budget
    formation: '3-5-2',
    totalValue: 0
};

// Player database with current Premier League players
const playerDatabase = {
    GK: [
        {id: 1, name: 'Alisson Becker', team: 'LIV', price: 5.5, stats: {saves: 89, cleanSheets: 12}},
        {id: 2, name: 'Ederson', team: 'MCI', price: 5.2, stats: {saves: 67, cleanSheets: 15}},
        {id: 3, name: 'David Raya', team: 'ARS', price: 5.1, stats: {saves: 102, cleanSheets: 11}},
        {id: 4, name: 'Andre Onana', team: 'MUN', price: 4.8, stats: {saves: 118, cleanSheets: 8}},
        {id: 5, name: 'Nick Pope', team: 'NEW', price: 4.6, stats: {saves: 134, cleanSheets: 7}},
        {id: 6, name: 'Robert Sanchez', team: 'CHE', price: 4.4, stats: {saves: 95, cleanSheets: 9}},
        {id: 7, name: 'Guglielmo Vicario', team: 'TOT', price: 4.5, stats: {saves: 112, cleanSheets: 8}},
        {id: 8, name: 'Jordan Pickford', team: 'EVE', price: 4.3, stats: {saves: 126, cleanSheets: 6}},
        {id: 9, name: 'Alphonse Areola', team: 'WHU', price: 4.2, stats: {saves: 98, cleanSheets: 5}},
        {id: 10, name: 'Mark Flekken', team: 'BRE', price: 4.1, stats: {saves: 87, cleanSheets: 7}}
    ],
    DEF: [
        {id: 11, name: 'Virgil van Dijk', team: 'LIV', price: 6.1, stats: {goals: 3, assists: 2, cleanSheets: 12}},
        {id: 12, name: 'William Saliba', team: 'ARS', price: 5.8, stats: {goals: 2, assists: 1, cleanSheets: 11}},
        {id: 13, name: 'Ruben Dias', team: 'MCI', price: 5.7, stats: {goals: 1, assists: 3, cleanSheets: 15}},
        {id: 14, name: 'Josko Gvardiol', team: 'MCI', price: 5.6, stats: {goals: 4, assists: 2, cleanSheets: 15}},
        {id: 15, name: 'Gabriel Magalhaes', team: 'ARS', price: 5.5, stats: {goals: 5, assists: 1, cleanSheets: 11}},
        {id: 16, name: 'Antonee Robinson', team: 'FUL', price: 4.8, stats: {goals: 2, assists: 6, cleanSheets: 4}},
        {id: 17, name: 'Lewis Dunk', team: 'BHA', price: 4.5, stats: {goals: 3, assists: 2, cleanSheets: 6}},
        {id: 18, name: 'Jarrad Branthwaite', team: 'EVE', price: 4.6, stats: {goals: 2, assists: 1, cleanSheets: 6}},
        {id: 19, name: 'Fabian Schar', team: 'NEW', price: 4.7, stats: {goals: 4, assists: 2, cleanSheets: 7}},
        {id: 20, name: 'Marc Guehi', team: 'CRY', price: 4.4, stats: {goals: 1, assists: 2, cleanSheets: 5}},
        {id: 21, name: 'Yerry Mina', team: 'BHA', price: 4.3, stats: {goals: 2, assists: 1, cleanSheets: 6}},
        {id: 22, name: 'Trent Alexander-Arnold', team: 'LIV', price: 7.2, stats: {goals: 3, assists: 12, cleanSheets: 12}},
        {id: 23, name: 'Kyle Walker', team: 'MCI', price: 5.4, stats: {goals: 1, assists: 4, cleanSheets: 15}},
        {id: 24, name: 'Ben White', team: 'ARS', price: 5.3, stats: {goals: 2, assists: 3, cleanSheets: 11}},
        {id: 25, name: 'Kieran Trippier', team: 'NEW', price: 5.1, stats: {goals: 2, assists: 8, cleanSheets: 7}}
    ],
    MID: [
        {id: 26, name: 'Mohamed Salah', team: 'LIV', price: 12.8, stats: {goals: 21, assists: 14, points: 218}},
        {id: 27, name: 'Cole Palmer', team: 'CHE', price: 10.2, stats: {goals: 15, assists: 11, points: 152}},
        {id: 28, name: 'Bukayo Saka', team: 'ARS', price: 9.7, stats: {goals: 12, assists: 9, points: 148}},
        {id: 29, name: 'Bruno Fernandes', team: 'MUN', price: 8.3, stats: {goals: 9, assists: 12, points: 134}},
        {id: 30, name: 'Martin Odegaard', team: 'ARS', price: 8.1, stats: {goals: 8, assists: 10, points: 125}},
        {id: 31, name: 'Phil Foden', team: 'MCI', price: 8.9, stats: {goals: 11, assists: 7, points: 142}},
        {id: 32, name: 'Bernardo Silva', team: 'MCI', price: 7.8, stats: {goals: 7, assists: 9, points: 118}},
        {id: 33, name: 'Bryan Mbeumo', team: 'BRE', price: 6.2, stats: {goals: 13, assists: 6, points: 143}},
        {id: 34, name: 'Morgan Gibbs-White', team: 'NFO', price: 5.9, stats: {goals: 8, assists: 7, points: 101}},
        {id: 35, name: 'James Maddison', team: 'TOT', price: 7.9, stats: {goals: 6, assists: 8, points: 89}},
        {id: 36, name: 'Eberechi Eze', team: 'CRY', price: 6.8, stats: {goals: 9, assists: 5, points: 92}},
        {id: 37, name: 'Jarrod Bowen', team: 'WHU', price: 7.1, stats: {goals: 11, assists: 4, points: 98}},
        {id: 38, name: 'Anthony Gordon', team: 'NEW', price: 6.5, stats: {goals: 8, assists: 8, points: 87}},
        {id: 39, name: 'Dejan Kulusevski', team: 'TOT', price: 6.9, stats: {goals: 7, assists: 9, points: 94}},
        {id: 40, name: 'Son Heung-min', team: 'TOT', price: 9.1, stats: {goals: 12, assists: 6, points: 126}}
    ],
    FWD: [
        {id: 41, name: 'Erling Haaland', team: 'MCI', price: 15.1, stats: {goals: 24, assists: 3, points: 245}},
        {id: 42, name: 'Alexander Isak', team: 'NEW', price: 8.9, stats: {goals: 17, assists: 4, points: 159}},
        {id: 43, name: 'Chris Wood', team: 'NEW', price: 6.8, stats: {goals: 20, assists: 2, points: 167}},
        {id: 44, name: 'Nicolas Jackson', team: 'CHE', price: 7.4, stats: {goals: 14, assists: 5, points: 123}},
        {id: 45, name: 'Darwin Nunez', team: 'LIV', price: 7.8, stats: {goals: 13, assists: 7, points: 118}},
        {id: 46, name: 'Yoane Wissa', team: 'BRE', price: 6.1, stats: {goals: 12, assists: 3, points: 139}},
        {id: 47, name: 'Ollie Watkins', team: 'AVL', price: 8.2, stats: {goals: 15, assists: 6, points: 132}},
        {id: 48, name: 'Kai Havertz', team: 'ARS', price: 8.0, stats: {goals: 11, assists: 4, points: 108}},
        {id: 49, name: 'Dominic Solanke', team: 'TOT', price: 7.6, stats: {goals: 9, assists: 3, points: 87}},
        {id: 50, name: 'Jamie Vardy', team: 'LEI', price: 5.8, stats: {goals: 8, assists: 2, points: 72}},
        {id: 51, name: 'Jean-Philippe Mateta', team: 'CRY', price: 6.3, stats: {goals: 10, assists: 4, points: 89}},
        {id: 52, name: 'Raul Jimenez', team: 'FUL', price: 6.0, stats: {goals: 9, assists: 3, points: 78}}
    ]
};

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
document.addEventListener('DOMContentLoaded', function() {
    updateTeamSummary();
});

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
    
    switch (position) {
        case 'GK':
            return `${player.stats.saves} saves • ${player.stats.cleanSheets} clean sheets`;
        case 'DEF':
            return `${player.stats.goals} goals • ${player.stats.assists} assists • ${player.stats.cleanSheets} clean sheets`;
        case 'MID':
        case 'FWD':
            return `${player.stats.goals} goals • ${player.stats.assists} assists`;
        default:
            return '';
    }
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
    `;
    
    // Update click handler to allow player replacement
    slot.onclick = () => showPlayerSelector(position, slotNumber);
}

// Get team logo abbreviation
function getTeamLogo(team) {
    const teamLogos = {
        'MCI': 'MC', 'LIV': 'LIV', 'ARS': 'ARS', 'CHE': 'CHE', 'MUN': 'MU',
        'TOT': 'TOT', 'NEW': 'NEW', 'BRE': 'BRE', 'WHU': 'WHU', 'AVL': 'AVL',
        'BHA': 'BHA', 'EVE': 'EVE', 'FUL': 'FUL', 'CRY': 'CRY', 'LEI': 'LEI',
        'NFO': 'NFO', 'WOL': 'WOL', 'BOU': 'BOU', 'SOU': 'SOU', 'IPS': 'IPS'
    };
    return teamLogos[team] || team;
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
    const query = document.getElementById('player-search').value.toLowerCase().trim();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.position;
    
    let players = activeFilter === 'ALL' ? getAllPlayers() : playerDatabase[activeFilter];
    
    if (query) {
        players = players.filter(player => 
            player.name.toLowerCase().includes(query) || 
            player.team.toLowerCase().includes(query)
        );
    }
    
    const playerList = document.getElementById('player-list');
    
    if (players.length === 0) {
        playerList.innerHTML = '<div class="no-players">No players found</div>';
        return;
    }
    
    // Sort players by price (descending)
    const sortedPlayers = [...players].sort((a, b) => b.price - a.price);
    
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