// Simple OCR Processor - Direct matching approach
// This focuses on finding exact matches and common patterns without complex preprocessing

function simpleProcessOCR(text, words, lines) {
    if (!window.transferSimPro || !window.transferSimPro.allPlayers) {
        console.error('Player data not loaded');
        return [];
    }
    
    const allPlayers = window.transferSimPro.allPlayers;
    const foundPlayers = [];
    const matchedIds = new Set();
    
    // Clean the entire text first
    const cleanedText = text
        .toUpperCase()
        .replace(/[^A-Z\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Split into potential player names (2-3 word combinations)
    const words_clean = cleanedText.split(' ').filter(w => w.length > 1);
    const potentialNames = [];
    
    // Single words (last names)
    words_clean.forEach(word => {
        if (word.length >= 3) {
            potentialNames.push(word);
        }
    });
    
    // Two word combinations (full names)
    for (let i = 0; i < words_clean.length - 1; i++) {
        potentialNames.push(`${words_clean[i]} ${words_clean[i + 1]}`);
    }
    
    // Three word combinations (for hyphenated names)
    for (let i = 0; i < words_clean.length - 2; i++) {
        potentialNames.push(`${words_clean[i]} ${words_clean[i + 1]} ${words_clean[i + 2]}`);
    }
    
    console.log('Potential names to check:', potentialNames);
    
    // Check each potential name against all players
    potentialNames.forEach(name => {
        const nameLower = name.toLowerCase();
        
        // Try to find exact matches first
        for (const player of allPlayers) {
            if (matchedIds.has(player.id)) continue;
            
            const lastName = player.second_name.toUpperCase();
            const firstName = player.first_name.toUpperCase();
            const fullName = `${firstName} ${lastName}`;
            const webName = (player.web_name || '').toUpperCase();
            
            // Exact last name match
            if (name === lastName) {
                matchedIds.add(player.id);
                foundPlayers.push(player);
                console.log(`Exact last name match: ${name} = ${player.second_name}`);
                break;
            }
            
            // Exact full name match
            if (name === fullName) {
                matchedIds.add(player.id);
                foundPlayers.push(player);
                console.log(`Exact full name match: ${name} = ${fullName}`);
                break;
            }
            
            // Exact web name match
            if (webName && name === webName) {
                matchedIds.add(player.id);
                foundPlayers.push(player);
                console.log(`Exact web name match: ${name} = ${webName}`);
                break;
            }
            
            // Common variations (remove spaces/hyphens)
            const nameNoSpace = name.replace(/[\s-]/g, '');
            const lastNameNoSpace = lastName.replace(/[\s-]/g, '');
            const fullNameNoSpace = fullName.replace(/[\s-]/g, '');
            
            if (nameNoSpace === lastNameNoSpace || nameNoSpace === fullNameNoSpace) {
                matchedIds.add(player.id);
                foundPlayers.push(player);
                console.log(`Match without spaces: ${name} = ${player.second_name}`);
                break;
            }
        }
    });
    
    // If we found less than 11 players, try partial matching for popular players
    if (foundPlayers.length < 11) {
        const popularPlayers = allPlayers
            .filter(p => !matchedIds.has(p.id))
            .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
            .slice(0, 100); // Top 100 most selected players
        
        potentialNames.forEach(name => {
            if (name.length < 4) return; // Skip short words for partial matching
            
            for (const player of popularPlayers) {
                if (matchedIds.has(player.id)) continue;
                
                const lastName = player.second_name.toUpperCase();
                const webName = (player.web_name || '').toUpperCase();
                
                // Check if the name contains or is contained by player name
                if ((lastName.includes(name) || name.includes(lastName)) && lastName.length > 3) {
                    // Only accept if it's a significant match
                    const matchRatio = Math.min(name.length, lastName.length) / Math.max(name.length, lastName.length);
                    if (matchRatio > 0.7) {
                        matchedIds.add(player.id);
                        foundPlayers.push(player);
                        console.log(`Partial match: ${name} ~ ${player.second_name} (${player.selected_by_percent}% owned)`);
                        break;
                    }
                }
            }
        });
    }
    
    // Sort by position and popularity
    foundPlayers.sort((a, b) => {
        if (a.element_type !== b.element_type) {
            return a.element_type - b.element_type;
        }
        return parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent);
    });
    
    // Limit to valid formation
    const formation = { 1: 2, 2: 5, 3: 5, 4: 3 };
    const finalSquad = [];
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    foundPlayers.forEach(player => {
        if (counts[player.element_type] < formation[player.element_type] && finalSquad.length < 15) {
            counts[player.element_type]++;
            finalSquad.push(player);
        }
    });
    
    console.log(`Simple OCR: Found ${finalSquad.length} players`);
    return finalSquad;
}

// Create a manual team builder interface
function createManualTeamBuilder() {
    if (!window.transferSimPro || !window.transferSimPro.allPlayers) {
        alert('Player data not loaded. Please refresh the page.');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'advanced-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
    `;
    
    const allPlayers = window.transferSimPro.allPlayers;
    
    // Group players by position and sort by ownership
    const playersByPosition = {
        1: allPlayers.filter(p => p.element_type === 1).sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)),
        2: allPlayers.filter(p => p.element_type === 2).sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)),
        3: allPlayers.filter(p => p.element_type === 3).sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)),
        4: allPlayers.filter(p => p.element_type === 4).sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
    };
    
    const selectedPlayers = [];
    const maxPerPosition = { 1: 2, 2: 5, 3: 5, 4: 3 };
    const positionNames = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 15px; padding: 20px; width: 90%; max-width: 1200px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #333;">🏗️ Build Your Team Manually</h2>
                <button onclick="this.closest('.advanced-modal').remove()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">✖ Close</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <input type="text" id="playerQuickSearch" placeholder="🔍 Quick search for any player..." style="width: 100%; padding: 12px; font-size: 16px; border: 2px solid #667eea; border-radius: 8px;">
                <div id="quickSearchResults" style="display: none; position: absolute; background: white; border: 2px solid #667eea; border-radius: 8px; max-height: 300px; overflow-y: auto; width: 100%; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"></div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <h3>Available Players</h3>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        ${Object.entries(positionNames).map(([pos, name]) => 
                            `<button onclick="showPositionPlayersManual(${pos})" class="pos-btn-${pos}" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">${name}</button>`
                        ).join('')}
                    </div>
                    <div id="availablePlayersList" style="height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
                        <!-- Players will be loaded here -->
                    </div>
                </div>
                
                <div>
                    <h3>Your Squad (<span id="squadCount">0</span>/15)</h3>
                    <div id="selectedSquadList" style="height: 400px; overflow-y: auto; border: 2px solid #667eea; border-radius: 8px; padding: 10px; background: #f8f9fa;">
                        <div style="color: #999; text-align: center; padding: 20px;">No players selected yet</div>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button onclick="confirmManualSquad()" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 16px;">
                    ✅ Add Squad to Simulator
                </button>
                <button onclick="clearManualSquad()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    🗑️ Clear All
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store data globally for the modal
    window.manualTeamBuilder = {
        modal: modal,
        playersByPosition: playersByPosition,
        selectedPlayers: selectedPlayers,
        maxPerPosition: maxPerPosition,
        positionNames: positionNames
    };
    
    // Show GK by default
    showPositionPlayersManual(1);
    
    // Setup quick search
    const searchInput = document.getElementById('playerQuickSearch');
    const searchResults = document.getElementById('quickSearchResults');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }
        
        const matches = allPlayers.filter(p => 
            p.second_name.toLowerCase().includes(query) ||
            p.first_name.toLowerCase().includes(query) ||
            (p.web_name && p.web_name.toLowerCase().includes(query))
        ).slice(0, 20);
        
        if (matches.length > 0) {
            searchResults.innerHTML = matches.map(p => `
                <div onclick="addPlayerToManualSquad(${p.id})" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.first_name} ${p.second_name}</strong>
                        <span style="color: #666; font-size: 0.9rem;">(${positionNames[p.element_type]})</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #667eea; font-weight: 600;">£${(p.now_cost / 10).toFixed(1)}m</div>
                        <div style="font-size: 0.8rem; color: #999;">${p.selected_by_percent}% owned</div>
                    </div>
                </div>
            `).join('');
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div style="padding: 10px; color: #999;">No players found</div>';
            searchResults.style.display = 'block';
        }
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

function showPositionPlayersManual(position) {
    if (!window.manualTeamBuilder) return;
    
    const { playersByPosition, positionNames, selectedPlayers } = window.manualTeamBuilder;
    const players = playersByPosition[position];
    const selectedIds = new Set(selectedPlayers.map(p => p.id));
    
    // Update button styles
    document.querySelectorAll('[class^="pos-btn-"]').forEach(btn => {
        btn.style.background = '#667eea';
    });
    document.querySelector(`.pos-btn-${position}`).style.background = '#764ba2';
    
    const listDiv = document.getElementById('availablePlayersList');
    listDiv.innerHTML = players.slice(0, 50).map(p => `
        <div onclick="addPlayerToManualSquad(${p.id})" style="padding: 10px; cursor: pointer; border: 1px solid #eee; border-radius: 5px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center; ${selectedIds.has(p.id) ? 'opacity: 0.5; background: #f0f0f0;' : 'background: white;'}">
            <div>
                <strong>${p.first_name} ${p.second_name}</strong>
                <div style="font-size: 0.9rem; color: #666;">${p.team_name || 'Unknown Team'}</div>
            </div>
            <div style="text-align: right;">
                <div style="color: #667eea; font-weight: 600;">£${(p.now_cost / 10).toFixed(1)}m</div>
                <div style="font-size: 0.8rem; color: #999;">${p.selected_by_percent}% | ${p.total_points}pts</div>
            </div>
        </div>
    `).join('');
}

function addPlayerToManualSquad(playerId) {
    if (!window.manualTeamBuilder || !window.transferSimPro) return;
    
    const { selectedPlayers, maxPerPosition } = window.manualTeamBuilder;
    const player = window.transferSimPro.allPlayers.find(p => p.id === playerId);
    
    if (!player) return;
    
    // Check if already selected
    if (selectedPlayers.find(p => p.id === playerId)) {
        alert('Player already in squad!');
        return;
    }
    
    // Check position limit
    const positionCount = selectedPlayers.filter(p => p.element_type === player.element_type).length;
    if (positionCount >= maxPerPosition[player.element_type]) {
        alert(`Maximum ${maxPerPosition[player.element_type]} ${window.manualTeamBuilder.positionNames[player.element_type]} players allowed!`);
        return;
    }
    
    // Check total squad size
    if (selectedPlayers.length >= 15) {
        alert('Squad is full (15 players maximum)!');
        return;
    }
    
    selectedPlayers.push(player);
    updateManualSquadDisplay();
    
    // Hide search results if open
    document.getElementById('quickSearchResults').style.display = 'none';
    document.getElementById('playerQuickSearch').value = '';
}

function updateManualSquadDisplay() {
    if (!window.manualTeamBuilder) return;
    
    const { selectedPlayers, positionNames } = window.manualTeamBuilder;
    const squadList = document.getElementById('selectedSquadList');
    const squadCount = document.getElementById('squadCount');
    
    squadCount.textContent = selectedPlayers.length;
    
    if (selectedPlayers.length === 0) {
        squadList.innerHTML = '<div style="color: #999; text-align: center; padding: 20px;">No players selected yet</div>';
        return;
    }
    
    // Group by position
    const grouped = { 1: [], 2: [], 3: [], 4: [] };
    selectedPlayers.forEach(p => grouped[p.element_type].push(p));
    
    squadList.innerHTML = Object.entries(grouped).map(([pos, players]) => {
        if (players.length === 0) return '';
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="color: #667eea; margin: 5px 0;">${positionNames[pos]}</h4>
                ${players.map(p => `
                    <div style="padding: 8px; background: white; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${p.first_name} ${p.second_name}</strong>
                            <span style="color: #666; font-size: 0.9rem;">(£${(p.now_cost / 10).toFixed(1)}m)</span>
                        </div>
                        <button onclick="removeFromManualSquad(${p.id})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">✖</button>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

function removeFromManualSquad(playerId) {
    if (!window.manualTeamBuilder) return;
    
    const { selectedPlayers } = window.manualTeamBuilder;
    const index = selectedPlayers.findIndex(p => p.id === playerId);
    
    if (index !== -1) {
        selectedPlayers.splice(index, 1);
        updateManualSquadDisplay();
    }
}

function clearManualSquad() {
    if (!window.manualTeamBuilder) return;
    
    window.manualTeamBuilder.selectedPlayers.length = 0;
    updateManualSquadDisplay();
}

function confirmManualSquad() {
    if (!window.manualTeamBuilder || !window.transferSimPro) return;
    
    const { selectedPlayers, modal } = window.manualTeamBuilder;
    
    if (selectedPlayers.length === 0) {
        alert('Please select at least one player!');
        return;
    }
    
    // Reset current squad
    window.transferSimPro.resetTeam();
    
    // Add players to squad
    let added = 0;
    selectedPlayers.forEach(player => {
        if (window.transferSimPro.addPlayerFromImage(player)) {
            added++;
        }
    });
    
    if (added > 0) {
        window.transferSimPro.updateSquadDisplay();
        window.transferSimPro.updateDisplay();
        window.transferSimPro.updateCharts();
        window.transferSimPro.showNotification(
            `✅ Added ${added} players to squad!`,
            'success'
        );
    }
    
    // Close modal
    modal.remove();
    window.manualTeamBuilder = null;
}

// Make functions globally available
window.simpleProcessOCR = simpleProcessOCR;
window.createManualTeamBuilder = createManualTeamBuilder;
window.showPositionPlayersManual = showPositionPlayersManual;
window.addPlayerToManualSquad = addPlayerToManualSquad;
window.removeFromManualSquad = removeFromManualSquad;
window.clearManualSquad = clearManualSquad;
window.confirmManualSquad = confirmManualSquad;
window.updateManualSquadDisplay = updateManualSquadDisplay;