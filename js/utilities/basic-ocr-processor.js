// Basic OCR Processor - Simple and reliable approach
// Focuses on extracting ANY text and finding player matches

async function basicProcessScreenshot(imageFile) {
    console.log('Starting basic OCR processing...');
    
    return new Promise(async (resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            img.src = e.target.result;
            
            await new Promise(imgResolve => {
                img.onload = imgResolve;
            });
            
            let worker = null;
            
            try {
                console.log('Creating Tesseract worker...');
                worker = await Tesseract.createWorker('eng');
                
                console.log('Starting OCR on image...');
                // Just use default settings for maximum compatibility
                const { data } = await worker.recognize(img.src);
                
                console.log(`OCR extracted ${data.text.length} characters`);
                console.log('Full OCR text:', data.text);
                
                // Process the text to find players
                const players = findPlayersInText(data.text);
                
                console.log(`Found ${players.length} players`);
                resolve(players);
                
            } catch (error) {
                console.error('Basic OCR error:', error);
                resolve([]); // Return empty array instead of rejecting
            } finally {
                if (worker) {
                    try {
                        await worker.terminate();
                    } catch (e) {
                        console.log('Error terminating worker:', e);
                    }
                }
            }
        };
        
        reader.readAsDataURL(imageFile);
    });
}

function findPlayersInText(text) {
    if (!window.transferSimPro || !window.transferSimPro.allPlayers) {
        console.error('Player data not available');
        return [];
    }
    
    const allPlayers = window.transferSimPro.allPlayers;
    const foundPlayers = [];
    const matchedIds = new Set();
    
    // Convert text to uppercase and split into words
    const words = text.toUpperCase()
        .replace(/[^A-Z\s-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3);
    
    console.log(`Processing ${words.length} words from OCR`);
    
    // Create a map of player names for quick lookup
    const playerMap = new Map();
    
    // Map last names
    allPlayers.forEach(player => {
        const lastName = player.second_name.toUpperCase();
        if (!playerMap.has(lastName)) {
            playerMap.set(lastName, []);
        }
        playerMap.get(lastName).push(player);
        
        // Also map web names
        if (player.web_name) {
            const webName = player.web_name.toUpperCase();
            if (!playerMap.has(webName)) {
                playerMap.set(webName, []);
            }
            playerMap.get(webName).push(player);
        }
    });
    
    // Common player name mappings
    const commonNames = {
        'SALAH': 'SALAH',
        'HAALAND': 'HAALAND',
        'SAKA': 'SAKA',
        'PALMER': 'PALMER',
        'WATKINS': 'WATKINS',
        'GORDON': 'GORDON',
        'ISAK': 'ISAK',
        'JACKSON': 'JACKSON',
        'SOLANKE': 'SOLANKE',
        'HAVERTZ': 'HAVERTZ',
        'RICE': 'RICE',
        'ODEGAARD': 'ODEGAARD',
        'ØDEGAARD': 'ODEGAARD',
        'MARTINELLI': 'MARTINELLI',
        'RASHFORD': 'RASHFORD',
        'FERNANDES': 'FERNANDES',
        'BRUNO': 'FERNANDES',
        'FODEN': 'FODEN',
        'TROSSARD': 'TROSSARD',
        'MADDISON': 'MADDISON',
        'KULUSEVSKI': 'KULUSEVSKI',
        'SON': 'SON',
        'MBEUMO': 'MBEUMO',
        'MITOMA': 'MITOMA',
        'JOTA': 'JOTA',
        'DIAZ': 'DIAZ',
        'NUNEZ': 'NUNEZ',
        'DARWIN': 'NUNEZ',
        'GREALISH': 'GREALISH',
        'DOKU': 'DOKU',
        'BOWEN': 'BOWEN',
        'KUDUS': 'KUDUS',
        'EZE': 'EZE',
        'OLISE': 'OLISE',
        'BAILEY': 'BAILEY',
        'GABRIEL': 'GABRIEL',
        'SALIBA': 'SALIBA',
        'WHITE': 'WHITE',
        'ZINCHENKO': 'ZINCHENKO',
        'TIMBER': 'TIMBER',
        'TRIPPIER': 'TRIPPIER',
        'ROBERTSON': 'ROBERTSON',
        'TAA': 'ALEXANDER-ARNOLD',
        'ALEXANDER': 'ALEXANDER-ARNOLD',
        'ARNOLD': 'ALEXANDER-ARNOLD',
        'VVD': 'VAN DIJK',
        'VANDIJK': 'VAN DIJK',
        'VIRGIL': 'VAN DIJK',
        'GVARDIOL': 'GVARDIOL',
        'WALKER': 'WALKER',
        'STONES': 'STONES',
        'DIAS': 'DIAS',
        'RUBEN': 'DIAS',
        'JAMES': 'JAMES',
        'REECE': 'JAMES',
        'CHILWELL': 'CHILWELL',
        'CUCURELLA': 'CUCURELLA',
        'SHAW': 'SHAW',
        'MARTINEZ': 'MARTINEZ',
        'LISANDRO': 'MARTINEZ',
        'EMILIANO': 'MARTINEZ',
        'RAYA': 'RAYA',
        'ALISSON': 'ALISSON',
        'EDERSON': 'EDERSON',
        'ONANA': 'ONANA',
        'PICKFORD': 'PICKFORD',
        'RAMSDALE': 'RAMSDALE',
        'SANCHEZ': 'SANCHEZ',
        'POPE': 'POPE',
        'MESLIER': 'MESLIER',
        'FABIANSKI': 'FABIANSKI',
        'LENO': 'LENO',
        'STEELE': 'STEELE',
        'PEDRO': 'PEDRO',
        'JOAO': 'PEDRO',
        'NETO': 'NETO',
        'MUDRYK': 'MUDRYK',
        'MADUEKE': 'MADUEKE',
        'STERLING': 'STERLING',
        'JESUS': 'JESUS',
        'NKETIAH': 'NKETIAH',
        'BRENTFORD': 'MBEUMO', // Common team name confusion
        'BRIGHTON': 'MITOMA',
        'CHELSEA': 'PALMER',
        'LIVERPOOL': 'SALAH',
        'MANCHESTER': 'HAALAND',
        'ARSENAL': 'SAKA',
        'TOTTENHAM': 'SON'
    };
    
    // Check each word against player names
    words.forEach(word => {
        // Skip if already found enough players
        if (foundPlayers.length >= 15) return;
        
        // Check common names first
        if (commonNames[word]) {
            const targetName = commonNames[word];
            const players = playerMap.get(targetName);
            if (players && players.length > 0) {
                // Pick the most popular player with this name
                const player = players.reduce((a, b) => 
                    parseFloat(a.selected_by_percent) > parseFloat(b.selected_by_percent) ? a : b
                );
                
                if (!matchedIds.has(player.id)) {
                    matchedIds.add(player.id);
                    foundPlayers.push(player);
                    console.log(`Matched common name: ${word} -> ${player.second_name}`);
                }
            }
        }
        
        // Check exact match in player map
        if (playerMap.has(word)) {
            const players = playerMap.get(word);
            if (players && players.length > 0) {
                // Pick the most popular player
                const player = players.reduce((a, b) => 
                    parseFloat(a.selected_by_percent) > parseFloat(b.selected_by_percent) ? a : b
                );
                
                if (!matchedIds.has(player.id)) {
                    matchedIds.add(player.id);
                    foundPlayers.push(player);
                    console.log(`Matched player: ${word} -> ${player.second_name}`);
                }
            }
        }
    });
    
    // If we found very few players, try partial matching for popular players
    if (foundPlayers.length < 5) {
        console.log('Trying partial matching for popular players...');
        
        const popularPlayers = allPlayers
            .filter(p => !matchedIds.has(p.id) && parseFloat(p.selected_by_percent) > 10)
            .sort((a, b) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent));
        
        words.forEach(word => {
            if (word.length < 4) return;
            
            popularPlayers.forEach(player => {
                if (matchedIds.has(player.id)) return;
                if (foundPlayers.length >= 15) return;
                
                const lastName = player.second_name.toUpperCase();
                
                // Check if the word is part of the player's name
                if (lastName.includes(word) || word.includes(lastName)) {
                    // Only match if it's a significant portion
                    if (word.length >= lastName.length * 0.6) {
                        matchedIds.add(player.id);
                        foundPlayers.push(player);
                        console.log(`Partial match: ${word} -> ${player.second_name}`);
                    }
                }
            });
        });
    }
    
    // Sort by position
    foundPlayers.sort((a, b) => {
        if (a.element_type !== b.element_type) {
            return a.element_type - b.element_type;
        }
        return parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent);
    });
    
    return foundPlayers;
}

// Export functions
window.basicProcessScreenshot = basicProcessScreenshot;
window.findPlayersInText = findPlayersInText;