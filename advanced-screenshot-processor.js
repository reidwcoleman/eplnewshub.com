// Advanced Screenshot Processor - Multi-pass OCR with region detection
// Uses different OCR strategies to maximize accuracy

async function processScreenshotAdvanced(imageFile) {
    return new Promise(async (resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            img.src = e.target.result;
            
            await new Promise(imgResolve => {
                img.onload = imgResolve;
            });
            
            try {
                // Try multiple OCR strategies in parallel
                const strategies = await Promise.all([
                    ocrWithHighContrast(img),
                    ocrWithInversion(img),
                    ocrWithRegions(img),
                    ocrWithDifferentModes(img)
                ]);
                
                // Combine and deduplicate results
                const allPlayers = combineOCRResults(strategies);
                
                console.log(`Advanced OCR found ${allPlayers.length} unique players`);
                resolve(allPlayers);
                
            } catch (error) {
                console.error('Advanced OCR failed:', error);
                reject(error);
            }
        };
        
        reader.readAsDataURL(imageFile);
    });
}

// Strategy 1: High contrast preprocessing
async function ocrWithHighContrast(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Apply high contrast
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // Strong threshold for high contrast
        const value = gray > 180 ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return performOCR(canvas.toDataURL(), 'high-contrast');
}

// Strategy 2: Inverted colors
async function ocrWithInversion(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Invert colors
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];       // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    return performOCR(canvas.toDataURL(), 'inverted');
}

// Strategy 3: Focus on specific regions where player names typically appear
async function ocrWithRegions(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // FPL screenshots typically have player names in specific regions
    // Try extracting just the middle section where squad is displayed
    const regions = [
        { x: 0.1, y: 0.2, width: 0.8, height: 0.6 }, // Main squad area
        { x: 0.2, y: 0.3, width: 0.6, height: 0.5 }, // Center focus
        { x: 0, y: 0.25, width: 1, height: 0.5 }     // Middle half
    ];
    
    const allResults = [];
    
    for (const region of regions) {
        const regionWidth = img.width * region.width;
        const regionHeight = img.height * region.height;
        const startX = img.width * region.x;
        const startY = img.height * region.y;
        
        canvas.width = regionWidth;
        canvas.height = regionHeight;
        
        ctx.drawImage(img, startX, startY, regionWidth, regionHeight, 0, 0, regionWidth, regionHeight);
        
        // Also apply contrast to the region
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const value = gray > 150 ? 255 : gray < 100 ? 0 : gray;
            data[i] = data[i + 1] = data[i + 2] = value;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const result = await performOCR(canvas.toDataURL(), `region-${regions.indexOf(region)}`);
        allResults.push(...result);
    }
    
    return allResults;
}

// Strategy 4: Different OCR modes and configurations
async function ocrWithDifferentModes(img) {
    const results = [];
    
    // Try different page segmentation modes
    const modes = [
        { mode: '3', description: 'Fully automatic page segmentation' },
        { mode: '6', description: 'Uniform block of text' },
        { mode: '11', description: 'Sparse text' },
        { mode: '12', description: 'Sparse text with OSD' }
    ];
    
    for (const config of modes) {
        try {
            const worker = await Tesseract.createWorker('eng');
            
            await worker.setParameters({
                tessedit_pageseg_mode: config.mode,
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -\'',
            });
            
            const { data } = await worker.recognize(img.src);
            
            const players = extractPlayersFromText(data.text, `mode-${config.mode}`);
            results.push(...players);
            
            await worker.terminate();
        } catch (error) {
            console.log(`Mode ${config.mode} failed:`, error);
        }
    }
    
    return results;
}

// Perform OCR on processed image
async function performOCR(imageSrc, strategy) {
    try {
        const worker = await Tesseract.createWorker('eng');
        
        // Use optimal settings for player names
        await worker.setParameters({
            tessedit_pageseg_mode: '6',
            preserve_interword_spaces: '0',
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -\'ñüöäéíóú'
        });
        
        const { data } = await worker.recognize(imageSrc);
        await worker.terminate();
        
        return extractPlayersFromText(data.text, strategy);
        
    } catch (error) {
        console.error(`OCR failed for strategy ${strategy}:`, error);
        return [];
    }
}

// Extract player names from OCR text
function extractPlayersFromText(text, source) {
    if (!window.transferSimPro || !window.transferSimPro.allPlayers) {
        return [];
    }
    
    const allPlayers = window.transferSimPro.allPlayers;
    const foundPlayers = [];
    
    // Clean and normalize text
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 1);
    
    // Common patterns in FPL screenshots
    const patterns = [
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gm,  // Capitalized names
        /([A-Z][a-z]+-[A-Z][a-z]+)/g,           // Hyphenated names
        /([A-Z]{2,4})/g,                        // Initials (TAA, VVD, etc)
        /([A-Z][a-z]+)/g                        // Single words
    ];
    
    const potentialNames = new Set();
    
    // Extract using patterns
    patterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const name = match[1].trim();
            if (name.length >= 3 && name.length <= 30) {
                potentialNames.add(name.toUpperCase());
            }
        }
    });
    
    // Also check each line as a potential name
    lines.forEach(line => {
        const cleaned = line.replace(/[^A-Za-z\s-']/g, '').trim();
        if (cleaned.length >= 3 && cleaned.length <= 30) {
            potentialNames.add(cleaned.toUpperCase());
            
            // Also add individual words from the line
            const words = cleaned.split(/\s+/);
            words.forEach(word => {
                if (word.length >= 3) {
                    potentialNames.add(word.toUpperCase());
                }
            });
        }
    });
    
    console.log(`Strategy ${source} found ${potentialNames.size} potential names`);
    
    // Match against player database
    const matchedIds = new Set();
    
    potentialNames.forEach(name => {
        // Try different matching strategies
        const player = findBestMatch(name, allPlayers, matchedIds);
        if (player) {
            matchedIds.add(player.id);
            foundPlayers.push({
                ...player,
                matchSource: source,
                matchedName: name
            });
        }
    });
    
    return foundPlayers;
}

// Find best matching player for a name
function findBestMatch(name, allPlayers, excludeIds) {
    // Quick exact match check first
    for (const player of allPlayers) {
        if (excludeIds.has(player.id)) continue;
        
        const lastName = player.second_name.toUpperCase();
        const fullName = `${player.first_name} ${player.second_name}`.toUpperCase();
        const webName = (player.web_name || '').toUpperCase();
        
        if (name === lastName || name === fullName || name === webName) {
            return player;
        }
        
        // Check without spaces/hyphens
        const nameClean = name.replace(/[\s-]/g, '');
        const lastNameClean = lastName.replace(/[\s-]/g, '');
        const fullNameClean = fullName.replace(/[\s-]/g, '');
        
        if (nameClean === lastNameClean || nameClean === fullNameClean) {
            return player;
        }
    }
    
    // Common abbreviations and nicknames
    const abbreviations = {
        'TAA': 'ALEXANDER-ARNOLD',
        'VVD': 'VAN DIJK',
        'KDB': 'DE BRUYNE',
        'DCL': 'CALVERT-LEWIN',
        'AWB': 'WAN-BISSAKA',
        'JWP': 'WARD-PROWSE',
        'ASM': 'SAINT-MAXIMIN',
        'CHO': 'HUDSON-ODOI',
        'ESR': 'SMITH ROWE',
        'MGW': 'GIBBS-WHITE'
    };
    
    if (abbreviations[name]) {
        const targetName = abbreviations[name];
        for (const player of allPlayers) {
            if (!excludeIds.has(player.id) && player.second_name.toUpperCase().includes(targetName)) {
                return player;
            }
        }
    }
    
    // Fuzzy match for popular players only
    if (name.length >= 4) {
        const popularPlayers = allPlayers
            .filter(p => !excludeIds.has(p.id) && parseFloat(p.selected_by_percent) > 5)
            .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent));
        
        for (const player of popularPlayers) {
            const lastName = player.second_name.toUpperCase();
            
            // Check if name is contained in player name or vice versa
            if ((lastName.includes(name) || name.includes(lastName)) && 
                Math.abs(lastName.length - name.length) <= 2) {
                return player;
            }
        }
    }
    
    return null;
}

// Combine results from multiple OCR strategies
function combineOCRResults(strategies) {
    const playerMap = new Map();
    const playerCounts = new Map();
    
    // Count how many strategies found each player
    strategies.forEach(strategyResults => {
        strategyResults.forEach(player => {
            const count = playerCounts.get(player.id) || 0;
            playerCounts.set(player.id, count + 1);
            
            if (!playerMap.has(player.id)) {
                playerMap.set(player.id, player);
            }
        });
    });
    
    // Sort by confidence (number of strategies that found the player)
    const sortedPlayers = Array.from(playerMap.values()).sort((a, b) => {
        const countA = playerCounts.get(a.id);
        const countB = playerCounts.get(b.id);
        
        if (countA !== countB) {
            return countB - countA; // Higher count = more confident
        }
        
        // Secondary sort by position and popularity
        if (a.element_type !== b.element_type) {
            return a.element_type - b.element_type;
        }
        
        return parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent);
    });
    
    // Apply formation limits
    const formation = { 1: 2, 2: 5, 3: 5, 4: 3 };
    const finalSquad = [];
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    sortedPlayers.forEach(player => {
        if (counts[player.element_type] < formation[player.element_type] && finalSquad.length < 15) {
            counts[player.element_type]++;
            const confidence = playerCounts.get(player.id);
            finalSquad.push({
                ...player,
                confidence: confidence,
                confidenceText: `Found by ${confidence} method${confidence > 1 ? 's' : ''}`
            });
        }
    });
    
    return finalSquad;
}

// Create an enhanced UI for reviewing detected players
function showAdvancedPlayerReview(detectedPlayers) {
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
    
    const positions = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };
    const playersByPosition = { 1: [], 2: [], 3: [], 4: [] };
    
    detectedPlayers.forEach(p => {
        if (playersByPosition[p.element_type]) {
            playersByPosition[p.element_type].push(p);
        }
    });
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 15px; padding: 20px; width: 90%; max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #333;">📸 Review Detected Players (${detectedPlayers.length} found)</h2>
                <button onclick="this.closest('.advanced-modal').remove()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">✖ Close</button>
            </div>
            
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <p style="margin: 0; color: #666;">
                    ✅ = High confidence (found by multiple methods)<br>
                    ⚠️ = Medium confidence (found by some methods)<br>
                    ❓ = Low confidence (found by one method)
                </p>
            </div>
            
            ${Object.entries(playersByPosition).map(([pos, players]) => {
                if (players.length === 0) return '';
                
                return `
                    <div style="margin-bottom: 20px;">
                        <h3 style="color: #667eea; margin-bottom: 10px;">${positions[pos]} (${players.length})</h3>
                        <div style="display: grid; gap: 10px;">
                            ${players.map(p => `
                                <div style="padding: 10px; background: ${p.confidence >= 3 ? '#d4edda' : p.confidence >= 2 ? '#fff3cd' : '#f8d7da'}; border: 1px solid ${p.confidence >= 3 ? '#c3e6cb' : p.confidence >= 2 ? '#ffeeba' : '#f5c6cb'}; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>${p.confidence >= 3 ? '✅' : p.confidence >= 2 ? '⚠️' : '❓'} ${p.first_name} ${p.second_name}</strong>
                                        <div style="font-size: 0.9rem; color: #666;">
                                            ${p.team_name} • £${(p.now_cost / 10).toFixed(1)}m • ${p.selected_by_percent}% owned
                                        </div>
                                        <div style="font-size: 0.8rem; color: #999;">
                                            ${p.confidenceText || 'Detected'}
                                        </div>
                                    </div>
                                    <button onclick="removeDetectedPlayer(${p.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Remove</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
                <button onclick="addMissingPlayers()" style="margin-right: 10px; padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    ➕ Add Missing Players
                </button>
                <button onclick="confirmDetectedSquad()" style="padding: 10px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                    ✅ Confirm Squad
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store for manipulation
    window.reviewedPlayers = detectedPlayers;
    window.reviewModal = modal;
}

// Helper functions for the review modal
window.removeDetectedPlayer = function(playerId) {
    if (window.reviewedPlayers) {
        window.reviewedPlayers = window.reviewedPlayers.filter(p => p.id !== playerId);
        if (window.reviewModal) {
            window.reviewModal.remove();
        }
        showAdvancedPlayerReview(window.reviewedPlayers);
    }
};

window.addMissingPlayers = function() {
    if (window.reviewModal) {
        window.reviewModal.remove();
    }
    createManualTeamBuilder();
};

window.confirmDetectedSquad = function() {
    if (!window.reviewedPlayers || !window.transferSimPro) return;
    
    // Reset and add players
    window.transferSimPro.resetTeam();
    
    let added = 0;
    window.reviewedPlayers.forEach(player => {
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
    
    if (window.reviewModal) {
        window.reviewModal.remove();
    }
};

// Export functions
window.processScreenshotAdvanced = processScreenshotAdvanced;
window.showAdvancedPlayerReview = showAdvancedPlayerReview;