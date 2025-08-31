// Demo script to test complex paragraph parsing functionality

// Test paragraph
const testParagraph = "Haaland scored twice and got 12 points, while Palmer is now on penalties for Chelsea and scored a penalty. Meanwhile, Salah picked up an injury and is out for 2 weeks, but Gordon's price rose to 7.6m last night due to his great form.";

console.log("🧠 Testing Complex Paragraph Parsing");
console.log("=" .repeat(50));
console.log("Input paragraph:");
console.log(testParagraph);
console.log("");

// Enhanced player database with more variations
const playerDatabase = {
    'haaland': ['haaland', 'erling', 'norwegian', 'city striker', 'man city forward', 'erling haaland'],
    'salah': ['salah', 'mo', 'mohamed', 'egyptian', 'liverpool winger', 'mohamed salah', 'mo salah'],
    'palmer': ['palmer', 'cole', 'chelsea midfielder', 'cole palmer', 'blues midfielder'],
    'gordon': ['gordon', 'anthony', 'newcastle winger', 'anthony gordon', 'toon winger']
};

// Advanced text segmentation with player-aware splitting
function smartSplit(text) {
    const segments = [];
    
    // Find player mentions first to guide splitting
    const playerMentions = [];
    for (const [key, variations] of Object.entries(playerDatabase)) {
        for (const variation of variations) {
            const regex = new RegExp(`\\b${variation}\\b`, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                playerMentions.push({
                    player: key,
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0]
                });
            }
        }
    }
    
    // Sort by position
    playerMentions.sort((a, b) => a.start - b.start);
    console.log("🏃‍♂️ Found players at positions:", playerMentions);
    
    // Split by transition words and punctuation, then find segments with players
    const possibleSplits = [
        ...text.split(/\s*(?:while|meanwhile|but|however|also|additionally)\s+/i),
        ...text.split(/,\s+/),
        ...text.split(/\.\s+/),
        ...text.split(/\s+and\s+(?=\w+(?:\s+\w+)?\s+(?:scored|got|is|was|will|has|have))/i)
    ];
    
    // For each possible split, check if it contains a player and useful info
    possibleSplits.forEach(split => {
        const trimmed = split.replace(/^[,;.\s]+|[,;.\s]+$/g, '').trim();
        if (trimmed.length > 15) {
            // Check if this segment has a player
            const hasPlayer = Object.entries(playerDatabase).some(([key, variations]) => 
                variations.some(v => trimmed.toLowerCase().includes(v))
            );
            
            const hasUsefulInfo = /\d+/.test(trimmed) || 
                                /(injured|out|fit|penalty|captain|goal|assist|point|price|rose|fell)/i.test(trimmed);
            
            if (hasPlayer || hasUsefulInfo) {
                segments.push(trimmed);
            }
        }
    });
    
    return segments.filter((s, i, arr) => arr.indexOf(s) === i); // Remove duplicates
}

const cleanSegments = smartSplit(testParagraph);

console.log("📝 Text segments after smart splitting:");
cleanSegments.forEach((segment, i) => {
    console.log(`${i + 1}. "${segment}"`);
});
console.log("");

// Analyze each segment
function analyzeTextSegment(segment, playerDatabase) {
    const lower = segment.toLowerCase();
    let foundPlayer = null;
    let playerKey = null;
    
    // Find player in segment
    for (const [key, variations] of Object.entries(playerDatabase)) {
        for (const variation of variations) {
            if (lower.includes(variation)) {
                foundPlayer = key.charAt(0).toUpperCase() + key.slice(1);
                playerKey = key;
                break;
            }
        }
        if (foundPlayer) break;
    }
    
    // Extract numerical data
    const data = extractPlayerData(segment);
    
    // Determine if this segment contains useful information
    const hasUsefulInfo = foundPlayer || 
                        segment.length > 15 || 
                        /\d+/.test(segment) ||
                        /(injured|out|fit|available|penalty|captain|goal|assist|point)/i.test(segment);
    
    return {
        type: foundPlayer ? 'player' : 'general',
        text: segment.trim(),
        player: foundPlayer,
        playerKey: playerKey,
        data: data,
        isValid: hasUsefulInfo,
        confidence: calculateConfidence(segment, foundPlayer)
    };
}

function extractPlayerData(info) {
    const data = {};
    
    // Points patterns
    const pointsPatterns = [
        /(\d+)\s*points?/i,
        /scored\s*(\d+)\s*points?/i,
        /got\s*(\d+)\s*points?/i,
        /earned\s*(\d+)\s*points?/i
    ];
    
    for (const pattern of pointsPatterns) {
        const match = info.match(pattern);
        if (match) {
            data.points = parseInt(match[1]);
            break;
        }
    }
    
    // Goals patterns  
    const goalPatterns = [
        /(\d+)\s*goals?/i,
        /scored\s*(\d+)\s*(?:goals?)?/i,
        /netted\s*(\d+)/i,
        /(\d+)\s*(?:goal|strike)s?/i,
        /scored\s*twice/i, // Special case for "twice"
        /scored\s*once/i   // Special case for "once"
    ];
    
    for (const pattern of goalPatterns) {
        const match = info.match(pattern);
        if (match) {
            if (info.toLowerCase().includes('twice')) {
                data.goals = 2;
            } else if (!info.toLowerCase().includes('point')) { // Avoid confusing "scored 12 points" with goals
                data.goals = parseInt(match[1]);
            }
            break;
        }
    }
    
    // Price patterns
    const pricePatterns = [
        /(?:price|cost|value).*?£?(\d+\.\d+)m?/i,
        /£(\d+\.\d+)m/i,
        /(\d+\.\d+)m.*?(?:price|cost)/i,
        /rose to\s*£?(\d+\.\d+)m?/i,
        /fell to\s*£?(\d+\.\d+)m?/i
    ];
    
    for (const pattern of pricePatterns) {
        const match = info.match(pattern);
        if (match) {
            data.price = parseFloat(match[1]);
            break;
        }
    }
    
    // Status patterns (injury, fitness, etc.)
    if (/(?:injured|hurt|out|unavailable|doubt)/i.test(info)) {
        data.status = 'injured';
    } else if (/(?:fit|available|ready|back)/i.test(info)) {
        data.status = 'fit';
    }
    
    // Special roles (penalties, captain, etc.)
    if (/(?:penalty|penalties|pen)/i.test(info)) {
        data.penalties = true;
    }
    
    return data;
}

function calculateConfidence(segment, foundPlayer) {
    let confidence = 0.3; // Base confidence
    
    if (foundPlayer) confidence += 0.4;
    if (/\d+/.test(segment)) confidence += 0.2; // Contains numbers
    if (/(goal|assist|point|price|injured)/i.test(segment)) confidence += 0.3;
    if (segment.length > 20) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
}

// Run the analysis with deduplication
const playerResults = new Map(); // Track best result per player
const generalResults = [];

cleanSegments.forEach(segment => {
    const analysis = analyzeTextSegment(segment, playerDatabase);
    if (analysis.isValid) {
        if (analysis.player) {
            // For player-specific info, keep the most detailed one per player
            const existing = playerResults.get(analysis.player);
            if (!existing || analysis.confidence > existing.confidence || 
                Object.keys(analysis.data).length > Object.keys(existing.data).length) {
                playerResults.set(analysis.player, analysis);
            }
        } else {
            // For general info, keep all unique pieces
            if (!generalResults.some(r => r.text === analysis.text)) {
                generalResults.push(analysis);
            }
        }
    }
});

// Combine results
const results = [...playerResults.values(), ...generalResults];

console.log("🎯 Final parsing results:");
console.log("=" .repeat(30));
results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.type.toUpperCase()}${result.player ? ` - ${result.player}` : ''}`);
    console.log(`   📝 Text: "${result.text}"`);
    console.log(`   📊 Data: ${JSON.stringify(result.data)}`);
    console.log(`   🎯 Confidence: ${Math.round(result.confidence * 100)}%`);
    console.log("");
});

console.log(`✅ Successfully parsed ${results.length} pieces of information from the paragraph!`);
console.log("Each piece would be stored separately in the global database for all users.");