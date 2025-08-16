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

// Strategy 1: High contrast preprocessing with edge enhancement
async function ocrWithHighContrast(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Scale up for better OCR
    const scale = 2;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    // Use better image scaling
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Apply sharpening filter first
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const output = new Uint8ClampedArray(data);
    
    // Sharpen the image
    const sharpenKernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];
    
    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            for (let c = 0; c < 3; c++) {
                let value = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * canvas.width + (x + kx)) * 4 + c;
                        value += data[idx] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
                    }
                }
                output[(y * canvas.width + x) * 4 + c] = Math.min(255, Math.max(0, value));
            }
        }
    }
    
    // Apply adaptive thresholding
    for (let i = 0; i < output.length; i += 4) {
        const gray = 0.299 * output[i] + 0.587 * output[i + 1] + 0.114 * output[i + 2];
        
        // Adaptive threshold based on local brightness
        let localBrightness = 0;
        let count = 0;
        const radius = 20;
        const idx = i / 4;
        const x = idx % canvas.width;
        const y = Math.floor(idx / canvas.width);
        
        for (let dy = -radius; dy <= radius; dy += 5) {
            for (let dx = -radius; dx <= radius; dx += 5) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                    const nidx = (ny * canvas.width + nx) * 4;
                    localBrightness += 0.299 * data[nidx] + 0.587 * data[nidx + 1] + 0.114 * data[nidx + 2];
                    count++;
                }
            }
        }
        
        const threshold = count > 0 ? localBrightness / count : 128;
        const value = gray > threshold * 0.9 ? 255 : 0;
        output[i] = output[i + 1] = output[i + 2] = value;
    }
    
    const finalData = new ImageData(output, canvas.width, canvas.height);
    ctx.putImageData(finalData, 0, 0);
    
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