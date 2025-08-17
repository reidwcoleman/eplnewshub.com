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
                // Process strategies sequentially to avoid freezing
                const strategies = [];
                
                // Try high contrast first (usually best)
                try {
                    const result = await ocrWithHighContrast(img);
                    strategies.push(result);
                    
                    // If we got good results, skip other heavy processing
                    if (result.length >= 11) {
                        console.log('Got enough players from high contrast, skipping other methods');
                    } else {
                        // Try inverted if needed
                        const inverted = await ocrWithInversion(img);
                        strategies.push(inverted);
                    }
                } catch (err) {
                    console.log('High contrast failed:', err);
                }
                
                // Only try regions if we need more players
                if (strategies.flat().length < 11) {
                    try {
                        const regions = await ocrWithRegions(img);
                        strategies.push(regions);
                    } catch (err) {
                        console.log('Region OCR failed:', err);
                    }
                }
                
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

// Strategy 1: High contrast preprocessing - OPTIMIZED
async function ocrWithHighContrast(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Moderate scale for balance between quality and performance
    const scale = 1.5;
    canvas.width = Math.min(img.width * scale, 2000); // Cap at 2000px width
    canvas.height = Math.min(img.height * scale, 2000); // Cap at 2000px height
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Simple contrast enhancement without heavy loops
    ctx.filter = 'contrast(200%) brightness(110%)';
    ctx.drawImage(canvas, 0, 0);
    
    // Get image data for simple thresholding
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple fixed threshold - much faster than adaptive
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const value = gray > 160 ? 255 : 0;
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

// Strategy 3: Focus on specific regions where player names typically appear - OPTIMIZED
async function ocrWithRegions(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Just focus on the main squad area
    const region = { x: 0.1, y: 0.2, width: 0.8, height: 0.6 };
    
    const regionWidth = Math.min(img.width * region.width, 1500);
    const regionHeight = Math.min(img.height * region.height, 1500);
    const startX = img.width * region.x;
    const startY = img.height * region.y;
    
    canvas.width = regionWidth;
    canvas.height = regionHeight;
    
    ctx.drawImage(img, startX, startY, img.width * region.width, img.height * region.height, 0, 0, regionWidth, regionHeight);
    
    // Simple contrast filter
    ctx.filter = 'contrast(150%)';
    ctx.drawImage(canvas, 0, 0);
    
    return performOCR(canvas.toDataURL(), 'main-region');
}

// Removed heavy ocrWithDifferentModes function to prevent freezing

// Perform OCR on processed image with timeout
async function performOCR(imageSrc, strategy) {
    let worker = null;
    
    try {
        // Create worker with timeout
        worker = await Promise.race([
            Tesseract.createWorker('eng'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Worker creation timeout')), 10000))
        ]);
        
        // Simple settings for speed
        await worker.setParameters({
            tessedit_pageseg_mode: '6',
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -\''
        });
        
        // Recognize with timeout
        const { data } = await Promise.race([
            worker.recognize(imageSrc),
            new Promise((_, reject) => setTimeout(() => reject(new Error('OCR timeout')), 15000))
        ]);
        
        const results = extractPlayersFromText(data.text, strategy);
        
        // Terminate worker
        if (worker) {
            await worker.terminate();
        }
        
        return results;
        
    } catch (error) {
        console.error(`OCR failed for strategy ${strategy}:`, error);
        
        // Make sure to terminate worker on error
        if (worker) {
            try {
                await worker.terminate();
            } catch (e) {
                console.log('Failed to terminate worker:', e);
            }
        }
        
        return [];
    }
}

// Extract player names from OCR text with better filtering
function extractPlayersFromText(text, source) {
    if (!window.transferSimPro || !window.transferSimPro.allPlayers) {
        return [];
    }
    
    const allPlayers = window.transferSimPro.allPlayers;
    const foundPlayers = [];
    
    // UI elements to filter out (common in FPL screenshots)
    const uiElements = new Set([
        'POINTS', 'PTS', 'TEAM', 'SQUAD', 'PITCH', 'VIEW', 'GAMEWEEK', 'GW',
        'TRANSFERS', 'WILDCARD', 'BENCH', 'BOOST', 'CAPTAIN', 'VICE', 'TRIPLE',
        'FREE', 'HIT', 'CHIP', 'ACTIVE', 'BANK', 'VALUE', 'ITB', 'OVERALL',
        'RANK', 'TOTAL', 'AVERAGE', 'HIGHEST', 'PRICE', 'RISE', 'FALL',
        'FIXTURES', 'DEADLINE', 'SAVE', 'CONFIRM', 'CANCEL', 'BACK', 'NEXT',
        'HOME', 'AWAY', 'VERSUS', 'VS', 'FANTASY', 'PREMIER', 'LEAGUE', 'FPL',
        'AUTO', 'PICK', 'CLEAR', 'SELECTION', 'RESET', 'MY', 'YOUR', 'MAKE',
        'SUB', 'SUBSTITUTION', 'CHANGE', 'FORMATION', 'PLAYERS', 'REMAINING'
    ]);
    
    // Clean and normalize text - remove common OCR artifacts
    let cleanedText = text
        .replace(/[©®™]/g, '')
        .replace(/\|/g, 'l')
        .replace(/[_]/g, '')
        .replace(/\s+/g, ' ');
    
    // Split into lines and filter
    const lines = cleanedText.split('\n')
        .map(line => line.trim())
        .filter(line => {
            // Filter out lines that are too short or too long
            if (line.length < 2 || line.length > 40) return false;
            
            // Filter out lines with too many numbers (likely stats)
            const numbers = (line.match(/\d/g) || []).length;
            if (numbers > line.length * 0.5) return false;
            
            // Filter out lines with prices (£X.Xm format)
            if (/£\d+\.\d+m/i.test(line)) return false;
            
            // Filter out percentage values
            if (/\d+\.\d+%/.test(line)) return false;
            
            return true;
        });
    
    // Patterns for player names with priority
    const namePatterns = [
        { pattern: /^([A-Z][a-z]+(?:-[A-Z][a-z]+)+)$/gm, priority: 10 }, // Hyphenated names (highest priority)
        { pattern: /^([A-Z][a-z]+ [A-Z][a-z]+)$/gm, priority: 9 },        // Full names
        { pattern: /^([A-Z][a-z]{2,})$/gm, priority: 7 },                 // Single capitalized words
        { pattern: /^([A-Z]{2,4})$/gm, priority: 8 },                     // Initials like TAA
        { pattern: /([A-Z][a-z]+ [A-Z]\.)/g, priority: 6 },               // Names with initials
        { pattern: /([A-Z]\. [A-Z][a-z]+)/g, priority: 6 }                // Initial then surname
    ];
    
    const potentialNamesWithPriority = [];
    
    // Process each line
    lines.forEach(line => {
        // Skip if line contains UI elements
        const upperLine = line.toUpperCase();
        let isUI = false;
        for (const element of uiElements) {
            if (upperLine === element || upperLine.includes(` ${element} `) || 
                upperLine.startsWith(element + ' ') || upperLine.endsWith(' ' + element)) {
                isUI = true;
                break;
            }
        }
        if (isUI) return;
        
        // Try each pattern
        namePatterns.forEach(({ pattern, priority }) => {
            const matches = line.matchAll(pattern);
            for (const match of matches) {
                const name = match[1].trim();
                if (name.length >= 3 && name.length <= 30) {
                    // Additional validation
                    if (!/\d{2,}/.test(name) && // No multiple digits
                        !/[^A-Za-z\s'-]/.test(name)) { // Only valid name characters
                        potentialNamesWithPriority.push({
                            name: name.toUpperCase(),
                            priority: priority,
                            original: name
                        });
                    }
                }
            }
        });
        
        // Also try to extract from lines that might have extra text
        const words = line.split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const word = words[i].replace(/[^A-Za-z'-]/g, '');
            
            // Check if it looks like a surname (capitalized, 3+ letters)
            if (/^[A-Z][a-z]{2,}/.test(word) && !uiElements.has(word.toUpperCase())) {
                // Check next word for possible first name
                if (i < words.length - 1) {
                    const nextWord = words[i + 1].replace(/[^A-Za-z'-]/g, '');
                    if (/^[A-Z][a-z]{2,}/.test(nextWord)) {
                        potentialNamesWithPriority.push({
                            name: `${word} ${nextWord}`.toUpperCase(),
                            priority: 8,
                            original: `${word} ${nextWord}`
                        });
                    }
                }
                
                // Add single word too
                potentialNamesWithPriority.push({
                    name: word.toUpperCase(),
                    priority: 5,
                    original: word
                });
            }
        }
    });
    
    // Sort by priority and deduplicate
    const uniqueNames = new Map();
    potentialNamesWithPriority
        .sort((a, b) => b.priority - a.priority)
        .forEach(item => {
            if (!uniqueNames.has(item.name)) {
                uniqueNames.set(item.name, item);
            }
        });
    
    console.log(`Strategy ${source} found ${uniqueNames.size} potential names after filtering`);
    
    // Match against player database with confidence scoring
    const matchedIds = new Set();
    
    uniqueNames.forEach((item, name) => {
        const player = findBestMatch(name, allPlayers, matchedIds);
        if (player) {
            matchedIds.add(player.id);
            foundPlayers.push({
                ...player,
                matchSource: source,
                matchedName: name,
                matchPriority: item.priority
            });
        }
    });
    
    return foundPlayers;
}

// Find best matching player for a name with improved accuracy
function findBestMatch(name, allPlayers, excludeIds) {
    // Pre-process name for better matching
    const processedName = name
        .replace(/'/g, '')  // Remove apostrophes
        .replace(/^MC/i, 'MAC')  // Handle Mc/Mac variations
        .replace(/\s+/g, ' ')
        .trim();
    
    // Build match candidates with scores
    const candidates = [];
    
    for (const player of allPlayers) {
        if (excludeIds.has(player.id)) continue;
        
        const lastName = player.second_name.toUpperCase().replace(/'/g, '');
        const firstName = player.first_name.toUpperCase().replace(/'/g, '');
        const fullName = `${firstName} ${lastName}`;
        const webName = (player.web_name || '').toUpperCase().replace(/'/g, '');
        
        let score = 0;
        let matchType = '';
        
        // Exact matches (highest score)
        if (processedName === lastName) {
            score = 100;
            matchType = 'exact-last';
        } else if (processedName === fullName) {
            score = 100;
            matchType = 'exact-full';
        } else if (webName && processedName === webName) {
            score = 100;
            matchType = 'exact-web';
        }
        
        // Check without spaces/hyphens
        const nameClean = processedName.replace(/[\s-]/g, '');
        const lastNameClean = lastName.replace(/[\s-]/g, '');
        const fullNameClean = fullName.replace(/[\s-]/g, '');
        const webNameClean = webName.replace(/[\s-]/g, '');
        
        if (score === 0) {
            if (nameClean === lastNameClean) {
                score = 95;
                matchType = 'clean-last';
            } else if (nameClean === fullNameClean) {
                score = 95;
                matchType = 'clean-full';
            } else if (webNameClean && nameClean === webNameClean) {
                score = 95;
                matchType = 'clean-web';
            }
        }
        
        // First name only match (lower score)
        if (score === 0 && processedName === firstName) {
            score = 70;
            matchType = 'first-name';
        }
        
        // Partial matches with length check
        if (score === 0 && processedName.length >= 4) {
            // Check if one contains the other
            if (lastName.includes(processedName)) {
                score = 60 + (processedName.length / lastName.length) * 20;
                matchType = 'partial-last';
            } else if (processedName.includes(lastName) && lastName.length >= 4) {
                score = 50 + (lastName.length / processedName.length) * 20;
                matchType = 'contains-last';
            }
        }
        
        // Boost score based on player popularity
        if (score > 0) {
            const popularity = parseFloat(player.selected_by_percent) || 0;
            const popularityBoost = Math.min(10, popularity / 5); // Max 10 point boost
            score += popularityBoost;
            
            candidates.push({
                player: player,
                score: score,
                matchType: matchType,
                popularity: popularity
            });
        }
    }
    
    // Extended abbreviations and nicknames
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
        'MGW': 'GIBBS-WHITE',
        'JROD': 'RODRIGUEZ',
        'BRUNO': 'FERNANDES',
        'RASH': 'RASHFORD',
        'MADDERS': 'MADDISON',
        'TRIPS': 'TRIPPIER',
        'ROBBO': 'ROBERTSON',
        'ALISSON': 'BECKER',
        'EDERSON': 'MORAES',
        'NUNEZ': 'NUÑEZ',
        'DIAS': 'DÍAZ',
        'JOAO': 'JOÃO PEDRO',
        'CHILWELL': 'CHILWELL',
        'JAMES': 'JAMES',
        'CANCELO': 'CANCELO'
    };
    
    // Check abbreviations if no good match yet
    if (candidates.length === 0 || Math.max(...candidates.map(c => c.score)) < 70) {
        const abbrevTarget = abbreviations[processedName];
        if (abbrevTarget) {
            for (const player of allPlayers) {
                if (!excludeIds.has(player.id)) {
                    const playerName = `${player.first_name} ${player.second_name}`.toUpperCase();
                    if (playerName.includes(abbrevTarget) || player.second_name.toUpperCase() === abbrevTarget) {
                        candidates.push({
                            player: player,
                            score: 90,
                            matchType: 'abbreviation',
                            popularity: parseFloat(player.selected_by_percent) || 0
                        });
                        break;
                    }
                }
            }
        }
    }
    
    // Sort candidates by score and return best match
    if (candidates.length > 0) {
        candidates.sort((a, b) => {
            if (Math.abs(a.score - b.score) < 5) {
                // If scores are close, prefer more popular player
                return b.popularity - a.popularity;
            }
            return b.score - a.score;
        });
        
        // Only return if score is good enough
        if (candidates[0].score >= 50) {
            console.log(`Matched "${name}" to "${candidates[0].player.second_name}" (score: ${candidates[0].score.toFixed(1)}, type: ${candidates[0].matchType})`);
            return candidates[0].player;
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