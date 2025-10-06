// Enhanced OCR Processing with Advanced Algorithms
// This file contains improved player matching logic for better accuracy

// Image preprocessing function for better OCR accuracy
function preprocessImageForOCR(img) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Scale image up for better OCR (2x size)
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw scaled image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply image enhancements
        for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // Increase contrast and apply threshold
            let value;
            if (gray < 128) {
                value = Math.max(0, gray - 30); // Darken dark pixels
            } else {
                value = Math.min(255, gray + 30); // Brighten light pixels
            }
            
            // Apply binary threshold for cleaner text
            value = value > 140 ? 255 : 0;
            
            data[i] = value;     // Red
            data[i + 1] = value; // Green
            data[i + 2] = value; // Blue
            // Alpha remains unchanged
        }
        
        // Put enhanced image back
        ctx.putImageData(imageData, 0, 0);
        
        // Return canvas as image URL
        resolve(canvas.toDataURL('image/png'));
    });
}

function enhancedProcessOCRText(text, words, lines) {
    if (!window.transferSimPro || !window.transferSimPro.allPlayers) {
        console.error('Player data not loaded');
        return [];
    }
    
    const allPlayers = window.transferSimPro.allPlayers;
    const detectedPlayers = [];
    const matchedPlayerIds = new Set();
    
    // Enhanced configuration with lower thresholds for better matching
    const config = {
        minConfidence: 0.25,        // Lower threshold for better detection
        maxPlayers: 15,             // Maximum squad size
        fuzzyThreshold: 0.7,        // Lower fuzzy threshold for OCR errors
        popularityWeight: 3.0,      // Increased weight for popular players
        formWeight: 1.5,            // Weight for player form in scoring
        priceWeight: 0.5,           // Weight for player price in scoring
        ocrConfidenceBoost: 1.2     // Boost factor for high OCR confidence
    };
    
    // Enhanced ignore list with better categorization
    const ignoredCategories = {
        teams: ['ars', 'avl', 'bha', 'bre', 'bur', 'che', 'cry', 'eve', 'ful', 'liv', 
                'lut', 'mci', 'mun', 'new', 'nfo', 'shu', 'tot', 'whu', 'wol', 'lei',
                'bou', 'lee', 'sou', 'wat', 'nor', 'bri', 'mid', 'hul', 'ips'],
        positions: ['gkp', 'def', 'mid', 'fwd', 'gk', 'goalkeeper', 'defender', 'midfielder', 'forward'],
        ui: ['fantasy', 'premier', 'league', 'fpl', 'points', 'team', 'squad', 'pick',
             'gameweek', 'gw', 'captain', 'vice', 'bench', 'triple', 'wildcard', 'chips'],
        common: ['the', 'and', 'or', 'is', 'at', 'on', 'in', 'to', 'for', 'of', 'with'],
        numbers: /^\d+$/,
        prices: /^[£$]\d+\.?\d*m?$/i
    };
    
    // Enhanced OCR corrections with more patterns
    const ocrPatterns = [
        { pattern: /rn/g, replacement: 'm' },
        { pattern: /nn/g, replacement: 'm' },
        { pattern: /ii/g, replacement: 'n' },
        { pattern: /vv/g, replacement: 'w' },
        { pattern: /0/g, replacement: 'o', context: 'name' },
        { pattern: /1/g, replacement: 'l', context: 'name' },
        { pattern: /5/g, replacement: 's', context: 'name' },
        { pattern: /á/g, replacement: 'a' },
        { pattern: /é/g, replacement: 'e' },
        { pattern: /í/g, replacement: 'i' },
        { pattern: /ó/g, replacement: 'o' },
        { pattern: /ú/g, replacement: 'u' },
        { pattern: /ll/g, replacement: 'n', context: 'double' },
        { pattern: /cl/g, replacement: 'd', context: 'ocr' },
        { pattern: /cI/g, replacement: 'd', context: 'ocr' },
        { pattern: /IVl/g, replacement: 'M', context: 'ocr' },
        { pattern: /l\/l/g, replacement: 'M', context: 'ocr' },
        { pattern: /\|/g, replacement: 'l', context: 'ocr' },
        { pattern: /[\[\]\{\}]/g, replacement: '', context: 'cleanup' }
    ];
    
    // Build enhanced player index with multiple access patterns
    const playerIndex = buildEnhancedPlayerIndex(allPlayers);
    
    // Extract and clean potential player names
    const potentialNames = extractEnhancedPlayerNames(text, words, lines, ignoredCategories);
    
    // Process each potential name with confidence scoring
    potentialNames.forEach(nameData => {
        const matches = findPlayerMatches(nameData, playerIndex, config);
        
        matches.forEach(match => {
            if (!matchedPlayerIds.has(match.player.id) && match.confidence >= config.minConfidence) {
                matchedPlayerIds.add(match.player.id);
                detectedPlayers.push({
                    ...match.player,
                    matchConfidence: match.confidence,
                    matchReason: match.reason
                });
                console.log(`Matched: ${nameData.original} -> ${match.player.first_name} ${match.player.second_name} (${(match.confidence * 100).toFixed(1)}% confidence, ${match.reason})`);
            }
        });
    });
    
    // If we don't have enough players, try context-based matching
    if (detectedPlayers.length < 11) {
        const contextMatches = performContextBasedMatching(text, playerIndex, matchedPlayerIds, config);
        contextMatches.forEach(match => {
            if (!matchedPlayerIds.has(match.id)) {
                matchedPlayerIds.add(match.id);
                detectedPlayers.push(match);
            }
        });
    }
    
    // Sort by position and confidence
    detectedPlayers.sort((a, b) => {
        if (a.element_type !== b.element_type) {
            return a.element_type - b.element_type;
        }
        return (b.matchConfidence || 0) - (a.matchConfidence || 0);
    });
    
    // Ensure valid formation (max per position)
    const formationLimits = { 1: 2, 2: 5, 3: 5, 4: 3 };
    const finalSquad = [];
    const positionCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    
    detectedPlayers.forEach(player => {
        if (positionCounts[player.element_type] < formationLimits[player.element_type] && 
            finalSquad.length < config.maxPlayers) {
            positionCounts[player.element_type]++;
            finalSquad.push(player);
        }
    });
    
    console.log(`Enhanced OCR: Detected ${finalSquad.length} players with average confidence ${(finalSquad.reduce((sum, p) => sum + (p.matchConfidence || 0), 0) / finalSquad.length * 100).toFixed(1)}%`);
    
    return finalSquad;
}

function buildEnhancedPlayerIndex(players) {
    const index = {
        byFullName: new Map(),
        byLastName: new Map(),
        byFirstName: new Map(),
        byWebName: new Map(),
        byNickname: new Map(),
        byPhonetic: new Map(),
        byInitials: new Map()
    };
    
    players.forEach(player => {
        const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
        const lastName = player.second_name.toLowerCase();
        const firstName = player.first_name.toLowerCase();
        const webName = (player.web_name || '').toLowerCase();
        
        // Full name indexing
        index.byFullName.set(fullName, player);
        index.byFullName.set(fullName.replace(/[^a-z]/g, ''), player);
        
        // Last name indexing (handle duplicates)
        if (!index.byLastName.has(lastName)) {
            index.byLastName.set(lastName, []);
        }
        index.byLastName.get(lastName).push(player);
        
        // First name indexing
        if (!index.byFirstName.has(firstName)) {
            index.byFirstName.set(firstName, []);
        }
        index.byFirstName.get(firstName).push(player);
        
        // Web name indexing
        if (webName) {
            index.byWebName.set(webName, player);
            index.byWebName.set(webName.replace(/[^a-z]/g, ''), player);
        }
        
        // Common nicknames
        const nicknames = getCommonNicknames(firstName, lastName);
        nicknames.forEach(nickname => {
            index.byNickname.set(nickname.toLowerCase(), player);
        });
        
        // Phonetic indexing for sound-alike matching
        const phoneticLast = getPhoneticCode(lastName);
        if (!index.byPhonetic.has(phoneticLast)) {
            index.byPhonetic.set(phoneticLast, []);
        }
        index.byPhonetic.get(phoneticLast).push(player);
        
        // Initials (e.g., "TAA" for Trent Alexander-Arnold)
        const initials = getInitials(player);
        if (initials && initials.length >= 2) {
            index.byInitials.set(initials.toLowerCase(), player);
        }
    });
    
    return index;
}

function extractEnhancedPlayerNames(text, words, lines, ignoredCategories) {
    const potentialNames = [];
    const seen = new Set();
    
    // Process lines for structured data
    if (lines && lines.length > 0) {
        lines.forEach(line => {
            const lineText = (line.text || '').trim();
            const confidence = line.confidence || 50;
            
            // Skip if too short or too long
            if (lineText.length < 2 || lineText.length > 40) return;
            
            // Skip if contains too many numbers
            if ((lineText.match(/\d/g) || []).length > lineText.length / 2) return;
            
            // Clean and tokenize
            const cleaned = lineText
                .replace(/[^\w\s'-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (cleaned && !isIgnored(cleaned.toLowerCase(), ignoredCategories)) {
                // Try full line first
                if (!seen.has(cleaned.toLowerCase())) {
                    seen.add(cleaned.toLowerCase());
                    potentialNames.push({
                        original: cleaned,
                        normalized: normalizeText(cleaned),
                        confidence: confidence / 100,
                        source: 'line'
                    });
                }
                
                // Then try individual words
                const tokens = cleaned.split(/\s+/);
                tokens.forEach(token => {
                    if (token.length > 2 && !isIgnored(token.toLowerCase(), ignoredCategories)) {
                        const key = token.toLowerCase();
                        if (!seen.has(key)) {
                            seen.add(key);
                            potentialNames.push({
                                original: token,
                                normalized: normalizeText(token),
                                confidence: confidence / 100 * 0.8,
                                source: 'word'
                            });
                        }
                    }
                });
            }
        });
    }
    
    // Process raw text as fallback
    if (potentialNames.length < 5 && text) {
        const textTokens = text
            .replace(/[^\w\s'-]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2);
        
        textTokens.forEach(token => {
            if (!isIgnored(token.toLowerCase(), ignoredCategories)) {
                const key = token.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    potentialNames.push({
                        original: token,
                        normalized: normalizeText(token),
                        confidence: 0.5,
                        source: 'text'
                    });
                }
            }
        });
    }
    
    return potentialNames;
}

function findPlayerMatches(nameData, playerIndex, config) {
    const matches = [];
    const normalized = nameData.normalized.toLowerCase();
    
    // 1. Exact full name match (highest confidence)
    if (playerIndex.byFullName.has(normalized)) {
        matches.push({
            player: playerIndex.byFullName.get(normalized),
            confidence: 1.0 * nameData.confidence,
            reason: 'exact full name'
        });
        return matches;
    }
    
    // 2. Exact web name match
    if (playerIndex.byWebName.has(normalized)) {
        matches.push({
            player: playerIndex.byWebName.get(normalized),
            confidence: 0.95 * nameData.confidence,
            reason: 'exact web name'
        });
        return matches;
    }
    
    // 3. Exact last name match
    if (playerIndex.byLastName.has(normalized)) {
        const candidates = playerIndex.byLastName.get(normalized);
        if (candidates.length === 1) {
            matches.push({
                player: candidates[0],
                confidence: 0.9 * nameData.confidence,
                reason: 'unique last name'
            });
        } else {
            // Multiple players with same last name - use popularity to decide
            const best = candidates.reduce((a, b) => 
                parseFloat(a.selected_by_percent) > parseFloat(b.selected_by_percent) ? a : b
            );
            matches.push({
                player: best,
                confidence: 0.7 * nameData.confidence,
                reason: 'popular last name match'
            });
        }
        return matches;
    }
    
    // 4. Nickname match
    if (playerIndex.byNickname.has(normalized)) {
        matches.push({
            player: playerIndex.byNickname.get(normalized),
            confidence: 0.85 * nameData.confidence,
            reason: 'nickname'
        });
        return matches;
    }
    
    // 5. Initials match (e.g., TAA, VVD)
    if (normalized.length >= 2 && normalized.length <= 4 && playerIndex.byInitials.has(normalized)) {
        matches.push({
            player: playerIndex.byInitials.get(normalized),
            confidence: 0.75 * nameData.confidence,
            reason: 'initials'
        });
        return matches;
    }
    
    // 6. Phonetic match
    const phoneticCode = getPhoneticCode(normalized);
    if (playerIndex.byPhonetic.has(phoneticCode)) {
        const candidates = playerIndex.byPhonetic.get(phoneticCode);
        const filtered = candidates.filter(p => 
            calculateSimilarity(p.second_name.toLowerCase(), normalized) > config.fuzzyThreshold
        );
        
        if (filtered.length > 0) {
            const best = filtered.reduce((a, b) => 
                calculatePlayerScore(a, config) > calculatePlayerScore(b, config) ? a : b
            );
            matches.push({
                player: best,
                confidence: 0.65 * nameData.confidence,
                reason: 'phonetic match'
            });
        }
    }
    
    // 7. Fuzzy matching with all players
    if (matches.length === 0) {
        const fuzzyMatches = performFuzzyMatching(normalized, playerIndex, config);
        matches.push(...fuzzyMatches.map(m => ({
            ...m,
            confidence: m.confidence * nameData.confidence
        })));
    }
    
    return matches;
}

function performContextBasedMatching(text, playerIndex, matchedIds, config) {
    const contextMatches = [];
    
    // Look for patterns like "GK: Name" or "DEF: Name Name"
    const positionPatterns = [
        /GK[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
        /DEF[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
        /MID[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
        /FWD[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
    ];
    
    positionPatterns.forEach((pattern, posIndex) => {
        const expectedType = posIndex + 1;
        let match;
        
        while ((match = pattern.exec(text)) !== null) {
            const name = match[1].trim();
            const normalized = normalizeText(name).toLowerCase();
            
            // Try to find player in that position
            const candidates = [];
            
            playerIndex.byLastName.forEach((players, lastName) => {
                if (lastName.includes(normalized) || normalized.includes(lastName)) {
                    players.forEach(p => {
                        if (p.element_type === expectedType && !matchedIds.has(p.id)) {
                            candidates.push(p);
                        }
                    });
                }
            });
            
            if (candidates.length > 0) {
                const best = candidates.reduce((a, b) => 
                    calculatePlayerScore(a, config) > calculatePlayerScore(b, config) ? a : b
                );
                contextMatches.push({
                    ...best,
                    matchConfidence: 0.6,
                    matchReason: 'position context'
                });
            }
        }
    });
    
    return contextMatches;
}

// Helper Functions

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/['']/g, "'")
        .replace(/[-–—]/g, '-')
        .replace(/[àáâäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôöø]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .trim();
}

function isIgnored(text, ignoredCategories) {
    // Check if it's a number
    if (ignoredCategories.numbers.test(text)) return true;
    
    // Check if it's a price
    if (ignoredCategories.prices.test(text)) return true;
    
    // Check against category lists
    for (const category of Object.values(ignoredCategories)) {
        if (Array.isArray(category) && category.includes(text)) {
            return true;
        }
    }
    
    // Check if it's too short or contains only special characters
    if (text.length < 2 || !/[a-z]/i.test(text)) return true;
    
    return false;
}

function getCommonNicknames(firstName, lastName) {
    const nicknames = [];
    
    // Common football nicknames and variations
    const nicknameMap = {
        'mohamed': ['mo', 'salah', 'moh'],
        'trent': ['taa', 'trent aa'],
        'virgil': ['vvd', 'van dijk', 'vandijk'],
        'heung-min': ['son', 'sonny', 'heungmin'],
        'gabriel': ['gabi', 'gabby'],
        'benjamin': ['ben', 'benny'],
        'alexander': ['alex', 'xander'],
        'matthew': ['matt', 'matty'],
        'nicholas': ['nick', 'nicky'],
        'christopher': ['chris', 'kit'],
        'robert': ['rob', 'bobby', 'robbie'],
        'william': ['will', 'billy', 'bill'],
        'james': ['jimmy', 'jim', 'jamie'],
        'anthony': ['tony', 'ant'],
        'joseph': ['joe', 'joey'],
        'michael': ['mike', 'micky', 'mick'],
        'david': ['dave', 'davey'],
        'richard': ['rick', 'ricky', 'rich'],
        'thomas': ['tom', 'tommy'],
        'martin': ['marty'],
        'pedro': ['joão pedro', 'joao pedro'],
        'bruno': ['fernandes', 'bruno f'],
        'erling': ['haaland', 'håland'],
        'bukayo': ['saka', 'b.saka'],
        'cole': ['palmer', 'c.palmer'],
        'phil': ['foden', 'p.foden'],
        'marcus': ['rashford', 'm.rashford'],
        'kai': ['havertz', 'k.havertz'],
        'diogo': ['jota', 'd.jota'],
        'luis': ['diaz', 'l.diaz'],
        'darwin': ['nunez', 'nuñez', 'd.nunez']
    };
    
    if (nicknameMap[firstName]) {
        nicknames.push(...nicknameMap[firstName]);
    }
    
    // Add last name as nickname for popular players
    const popularLastNames = [
        'salah', 'haaland', 'saka', 'palmer', 'kane', 'son', 'foden',
        'rashford', 'fernandes', 'rice', 'odegaard', 'martinelli',
        'watkins', 'isak', 'gordon', 'mbeumo', 'mitoma', 'jota',
        'nunez', 'diaz', 'havertz', 'trossard', 'maddison', 'kulusevski',
        'bowen', 'kudus', 'eze', 'olise', 'bailey', 'grealish', 'doku',
        'gvardiol', 'trippier', 'robertson', 'james', 'chilwell', 'shaw'
    ];
    
    if (popularLastNames.includes(lastName.toLowerCase())) {
        nicknames.push(lastName);
    }
    
    return nicknames;
}

function getPhoneticCode(text) {
    // Simple phonetic algorithm (can be replaced with Soundex or Metaphone)
    return text
        .toLowerCase()
        .replace(/[aeiou]/g, '')
        .replace(/ph/g, 'f')
        .replace(/ck/g, 'k')
        .replace(/[wy]/g, '')
        .replace(/(.)\1+/g, '$1')
        .substring(0, 4);
}

function getInitials(player) {
    const parts = [
        player.first_name[0],
        ...player.second_name.split(/[\s-]/).map(p => p[0])
    ].filter(Boolean);
    
    return parts.join('').toUpperCase();
}

function calculateSimilarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;
    
    const distance = levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
}

function calculatePlayerScore(player, config) {
    const popularity = parseFloat(player.selected_by_percent) || 0;
    const form = parseFloat(player.form) || 0;
    const price = player.now_cost / 10 || 0;
    const points = player.total_points || 0;
    
    return (
        popularity * config.popularityWeight +
        form * config.formWeight +
        (150 - price) * config.priceWeight / 10 +
        points / 10
    );
}

function performFuzzyMatching(text, playerIndex, config) {
    const matches = [];
    const threshold = config.fuzzyThreshold;
    
    // Check against all last names
    playerIndex.byLastName.forEach((players, lastName) => {
        const similarity = calculateSimilarity(lastName, text);
        if (similarity >= threshold) {
            const best = players.reduce((a, b) => 
                calculatePlayerScore(a, config) > calculatePlayerScore(b, config) ? a : b
            );
            matches.push({
                player: best,
                confidence: similarity * 0.5,
                reason: `fuzzy match (${(similarity * 100).toFixed(0)}%)`
            });
        }
    });
    
    // Sort by confidence and return top matches
    matches.sort((a, b) => b.confidence - a.confidence);
    return matches.slice(0, 3);
}

function levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Additional helper for common OCR mistakes in player names
function applySpecificPlayerCorrections(text) {
    const corrections = {
        // Common OCR errors for specific players
        'guehl': 'guehi',
        'gueh1': 'guehi',
        'gvardlol': 'gvardiol',
        'gvard1ol': 'gvardiol',
        'kuluzevski': 'kulusevski',
        'kulusevsk1': 'kulusevski',
        'mbeurno': 'mbeumo',
        'mbeuno': 'mbeumo',
        'm1toma': 'mitoma',
        'mltoma': 'mitoma',
        'od3gaard': 'odegaard',
        '0degaard': 'odegaard',
        'ødegaard': 'odegaard',
        'sa1ah': 'salah',
        '5alah': 'salah',
        'haa1and': 'haaland',
        'haaiand': 'haaland',
        'pa1mer': 'palmer',
        'palrner': 'palmer',
        'watk1ns': 'watkins',
        'watklns': 'watkins',
        '1sak': 'isak',
        'lsak': 'isak',
        'mart1nelli': 'martinelli',
        'martinelll': 'martinelli',
        'rash4ord': 'rashford',
        'rashf0rd': 'rashford',
        'f0den': 'foden',
        'fod3n': 'foden',
        'maddis0n': 'maddison',
        'madd1son': 'maddison',
        'tr0ssard': 'trossard',
        'tros5ard': 'trossard',
        'ez3': 'eze',
        '3ze': 'eze',
        'ollse': 'olise',
        '0lise': 'olise',
        'bal1ey': 'bailey',
        'ba1ley': 'bailey',
        'greal1sh': 'grealish',
        'greallsh': 'grealish',
        'd0ku': 'doku',
        'doku': 'doku',
        'trlppier': 'trippier',
        'tr1ppier': 'trippier',
        'robertz0n': 'robertson',
        'r0bertson': 'robertson',
        'chllwell': 'chilwell',
        'ch1lwell': 'chilwell',
        'joao pedr0': 'joão pedro',
        'jodo pedro': 'joão pedro',
        'bruno fernand3s': 'bruno fernandes',
        'brun0 fernandes': 'bruno fernandes'
    };
    
    let corrected = text.toLowerCase();
    Object.entries(corrections).forEach(([wrong, right]) => {
        corrected = corrected.replace(new RegExp(wrong, 'gi'), right);
    });
    
    return corrected;
}

// Export the enhanced functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { enhancedProcessOCRText, preprocessImageForOCR, applySpecificPlayerCorrections };
}