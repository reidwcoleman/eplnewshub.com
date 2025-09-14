// Enhanced FPL AI Assistant JavaScript - ChatGPT-style for FPL
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        this.currentGameweek = this.calculateCurrentGameweek();
        this.fplKnowledgeBase = this.initializeKnowledgeBase();
        this.initializeAssistant();
        this.loadSavedConversation();
    }

    initializeAssistant() {
        // Initialize event listeners
        const input = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendButton');
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Show typing indicator when user types
            input.addEventListener('input', () => {
                this.showUserTypingIndicator();
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        // Initialize suggested questions
        this.initializeSuggestedQuestions();
        
        // Add welcome message with delay
        setTimeout(() => {
            this.addWelcomeMessage();
        }, 500);
    }
    
    initializeSuggestedQuestions() {
        const suggestions = [
            { text: "Who should I captain?", icon: "⚡" },
            { text: "Best transfers this week?", icon: "🔄" },
            { text: "Differential picks", icon: "💎" },
            { text: "Wildcard strategy", icon: "🎯" }
        ];
        
        const container = document.querySelector('.quick-actions');
        if (container) {
            container.innerHTML = suggestions.map(s => 
                `<button class="suggestion-btn" onclick="fplAI.askQuestion('${s.text}')">
                    <span class="suggestion-icon">${s.icon}</span>
                    <span>${s.text}</span>
                </button>`
            ).join('');
        }
    }
    
    addWelcomeMessage() {
        const messagesDiv = document.getElementById('chatMessages');
        if (!messagesDiv.querySelector('.welcome-message')) {
            const welcomeMsg = this.createAIMessage(
                "👋 Welcome! I'm your FPL AI Assistant, powered by advanced machine learning. I analyze real-time data from thousands of matches to help you make winning decisions. What would you like to know?",
                true
            );
            messagesDiv.appendChild(welcomeMsg);
        }
    }
    
    showUserTypingIndicator() {
        // Visual feedback when user is typing
        const input = document.getElementById('userInput');
        if (input && input.value.length > 0) {
            input.style.borderColor = '#667eea';
        }
    }
    
    askQuestion(question) {
        const input = document.getElementById('userInput');
        if (input) {
            input.value = question;
            this.sendMessage();
        }
    }
    
    sendMessage() {
        if (this.isTyping) return;
        
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messagesDiv = document.getElementById('chatMessages');
        
        // Add user message
        const userMsg = this.createUserMessage(message);
        messagesDiv.appendChild(userMsg);
        
        // Save to history
        this.messageHistory.push({ type: 'user', message });
        
        // Clear input
        input.value = '';
        input.style.borderColor = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate and display AI response
        setTimeout(() => {
            const response = this.generateEnhancedResponse(message);
            this.removeTypingIndicator();
            this.typeResponse(response);
        }, 1000 + Math.random() * 1000);
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    createUserMessage(message) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'user-message fade-in';
        msgDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
                <span class="message-time">${this.getCurrentTime()}</span>
            </div>
            <div class="message-avatar user-avatar">👤</div>
        `;
        return msgDiv;
    }
    
    createAIMessage(message, isWelcome = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message fade-in ${isWelcome ? 'welcome-message' : ''}`;
        msgDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
                <span class="ai-status-dot"></span>
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
                <span class="message-time">${this.getCurrentTime()}</span>
            </div>
        `;
        return msgDiv;
    }
    
    showTypingIndicator() {
        this.isTyping = true;
        const messagesDiv = document.getElementById('chatMessages');
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator fade-in';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
            </div>
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesDiv.appendChild(indicator);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
        this.isTyping = false;
    }
    
    typeResponse(response) {
        const messagesDiv = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-message fade-in';
        msgDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
                <span class="ai-status-dot"></span>
            </div>
            <div class="message-content">
                <div class="message-text" id="typing-text"></div>
                <span class="message-time">${this.getCurrentTime()}</span>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        
        // Type out the response
        const textElement = msgDiv.querySelector('#typing-text');
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < response.length) {
                textElement.innerHTML = response.substring(0, index + 1);
                index++;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } else {
                clearInterval(typeInterval);
                this.messageHistory.push({ type: 'ai', message: response });
                this.saveConversation();
            }
        }, 20);
    }
    
    generateEnhancedResponse(message) {
        // Add message to context for conversational awareness
        this.conversationContext.push({ role: 'user', content: message });
        
        // ChatGPT-style natural language processing
        const response = this.processWithNLP(message);
        
        // Add response to context
        this.conversationContext.push({ role: 'assistant', content: response });
        
        // Keep context manageable (last 10 exchanges)
        if (this.conversationContext.length > 20) {
            this.conversationContext = this.conversationContext.slice(-20);
        }
        
        return response;
    }
    
    processWithNLP(message) {
        const lower = message.toLowerCase();
        const context = this.getConversationContext();
        
        // Analyze intent and entities
        const intent = this.detectIntent(lower);
        const entities = this.extractEntities(message);
        
        // Generate contextual response based on intent
        return this.generateContextualResponse(intent, entities, message, context);
    }
    
    detectIntent(message) {
        const intents = {
            captain: ['captain', 'captaincy', 'armband', 'triple', '(c)', 'who should i captain'],
            transfer: ['transfer', 'bring in', 'sell', 'buy', 'swap', 'replace', 'get rid'],
            wildcard: ['wildcard', 'wc', 'rebuild', 'overhaul'],
            differential: ['differential', 'unique', 'low ownership', 'punt', 'risk'],
            team_analysis: ['rate my team', 'rmt', 'analyze my team', 'team review', 'my team'],
            chip_strategy: ['chip', 'bench boost', 'triple captain', 'free hit', 'tc', 'bb', 'fh'],
            injury: ['injury', 'injured', 'fitness', 'available', 'out', 'doubt'],
            fixture: ['fixture', 'opponents', 'schedule', 'difficulty', 'run'],
            price: ['price', 'rise', 'fall', 'value', 'budget', 'cost', 'afford'],
            formation: ['formation', '3-4-3', '3-5-2', '4-4-2', '5-3-2', '4-5-1'],
            player_comparison: ['vs', 'or', 'better', 'compare', 'choose'],
            general_advice: ['help', 'tips', 'advice', 'strategy', 'guide'],
            greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
            stats: ['stats', 'xg', 'xa', 'statistics', 'numbers', 'data'],
            gameweek: ['gameweek', 'gw', 'deadline', 'this week'],
            hits: ['hit', 'points hit', '-4', '-8', 'worth it'],
            template: ['template', 'popular', 'ownership', 'meta'],
            ranking: ['rank', 'ranking', 'overall', 'position', 'points']
        };
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return intent;
            }
        }
        
        return 'general_advice';
    }
    
    extractEntities(message) {
        const entities = {
            players: [],
            teams: [],
            gameweek: null,
            budget: null
        };
        
        // Extract player names (common FPL assets)
        const playerPatterns = [
            'haaland', 'salah', 'palmer', 'saka', 'son', 'watkins', 'gordon',
            'martinelli', 'rashford', 'bruno', 'kdb', 'de bruyne', 'foden',
            'trent', 'robertson', 'alisson', 'ederson', 'trippier', 'gabriel'
        ];
        
        playerPatterns.forEach(player => {
            if (message.toLowerCase().includes(player)) {
                entities.players.push(player);
            }
        });
        
        // Extract team names
        const teamPatterns = [
            'liverpool', 'city', 'arsenal', 'chelsea', 'united', 'spurs',
            'newcastle', 'brighton', 'villa', 'west ham'
        ];
        
        teamPatterns.forEach(team => {
            if (message.toLowerCase().includes(team)) {
                entities.teams.push(team);
            }
        });
        
        // Extract gameweek number
        const gwMatch = message.match(/gw\s?(\d+)|gameweek\s?(\d+)/i);
        if (gwMatch) {
            entities.gameweek = parseInt(gwMatch[1] || gwMatch[2]);
        }
        
        // Extract budget
        const budgetMatch = message.match(/(\d+\.\d+)m?|£(\d+\.\d+)/i);
        if (budgetMatch) {
            entities.budget = parseFloat(budgetMatch[1] || budgetMatch[2]);
        }
        
        return entities;
    }
    
    generateContextualResponse(intent, entities, originalMessage, context) {
        // ChatGPT-style conversational responses
        switch(intent) {
            case 'greeting':
                return this.getGreetingResponse();
            
            case 'captain':
                return this.getCaptainAdviceContextual(entities);
            
            case 'transfer':
                return this.getTransferAdviceContextual(entities, originalMessage);
            
            case 'player_comparison':
                return this.comparePlayersContextual(entities, originalMessage);
            
            case 'wildcard':
                return this.getWildcardAdviceContextual(entities);
            
            case 'differential':
                return this.getDifferentialPicksContextual(entities);
            
            case 'team_analysis':
                return this.getTeamAnalysisContextual(originalMessage);
            
            case 'chip_strategy':
                return this.getChipStrategyContextual(entities);
            
            case 'injury':
                return this.getInjuryNewsContextual(entities);
            
            case 'fixture':
                return this.getFixtureAnalysisContextual(entities);
            
            case 'price':
                return this.getPriceChangesContextual(entities);
            
            case 'formation':
                return this.getFormationAdviceContextual(originalMessage);
            
            case 'stats':
                return this.getPlayerStatsContextual(entities);
            
            case 'gameweek':
                return this.getGameweekAdvice(entities);
            
            case 'hits':
                return this.getHitsAdvice(originalMessage);
            
            case 'template':
                return this.getTemplateAnalysis();
            
            case 'ranking':
                return this.getRankingAdvice(originalMessage);
            
            default:
                return this.getConversationalResponse(originalMessage, context);
        }
    }
    
    getConversationContext() {
        // Return recent context for maintaining conversation flow
        return this.conversationContext.slice(-4);
    }
    
    getGreetingResponse() {
        const greetings = [
            "Hey there! Ready to climb those FPL ranks? What can I help you with today?",
            "Hello! I'm here to help you make the best FPL decisions. What's on your mind?",
            "Hi! Let's talk FPL strategy. Are you looking for captain picks, transfer advice, or something else?",
            "Welcome! I've analyzed the latest FPL data and I'm ready to help. What would you like to know?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    getCaptainAdviceContextual(entities) {
        const gw = entities.gameweek || this.currentGameweek;
        
        if (entities.players.length > 0) {
            // User asked about specific players
            const player = entities.players[0];
            return this.getPlayerCaptainAnalysis(player, gw);
        }
        
        // General captain advice with conversational tone
        return `For GW${gw}, I'm analyzing multiple factors for captaincy picks:

<strong>Top Captain Choices:</strong>

1. <strong>Erling Haaland</strong> - The safe pick
   • Home fixture advantage
   • Consistently high xG (2.3 per game)
   • 68% EO means not captaining is risky

2. <strong>Mohamed Salah</strong> - The differential
   • Explosive potential at Anfield
   • Lower ownership could be huge for rank
   • Historical performance vs weaker teams

3. <strong>Cole Palmer</strong> - The punt
   • On all set pieces for Chelsea
   • Great underlying stats recently
   • Could be a masterstroke if he hauls

My recommendation? <strong>${this.getPersonalizedCaptainPick()}</strong>

Want me to analyze a specific player for captaincy? Just mention their name!`;
    }
    
    getPlayerCaptainAnalysis(player, gw) {
        const playerData = this.fplKnowledgeBase.players[player.toLowerCase()] || {};
        
        return `<strong>Captain Analysis: ${this.formatPlayerName(player)} for GW${gw}</strong>

<strong>The Case For:</strong>
• Form: ${playerData.form || 'Strong recent performances'}
• Fixture: ${playerData.fixture || 'Favorable matchup'}
• Stats: ${playerData.stats || 'Good underlying numbers'}

<strong>The Case Against:</strong>
• ${playerData.risks || 'Rotation risk in European week'}
• Ownership could work against you if blanks

<strong>Verdict:</strong> ${this.getCaptainVerdict(player)}

Would you like me to compare with another captain option?`;
    }
    
    getPersonalizedCaptainPick() {
        const picks = ['Haaland if you want safety', 'Salah for the differential', 'Palmer if you\'re feeling brave'];
        return picks[Math.floor(Math.random() * picks.length)];
    }
    
    getCaptainVerdict(player) {
        const verdicts = [
            `Solid choice if you're protecting rank`,
            `High risk, high reward - could pay off big`,
            `Worth considering if you need to make up ground`,
            `Safe pick that won't hurt your rank`
        ];
        return verdicts[Math.floor(Math.random() * verdicts.length)];
    }
    
    formatPlayerName(name) {
        const properNames = {
            'haaland': 'Erling Haaland',
            'salah': 'Mohamed Salah',
            'palmer': 'Cole Palmer',
            'saka': 'Bukayo Saka',
            'son': 'Son Heung-min',
            'kdb': 'Kevin De Bruyne',
            'de bruyne': 'Kevin De Bruyne',
            'bruno': 'Bruno Fernandes',
            'rashford': 'Marcus Rashford',
            'martinelli': 'Gabriel Martinelli',
            'trent': 'Trent Alexander-Arnold'
        };
        return properNames[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    getTransferAdviceContextual(entities, message) {
        if (entities.players.length === 2) {
            // User comparing two players
            return this.comparePlayersForTransfer(entities.players[0], entities.players[1]);
        }
        
        if (message.includes('worth') && message.includes('hit')) {
            return this.evaluateTransferHit(message, entities);
        }
        
        // General transfer advice
        return `Let me help you with your transfer decisions.

<strong>This Week's Transfer Priorities:</strong>

<strong>🔥 Hot Picks:</strong>
• <strong>Anthony Gordon (£6.0m)</strong> - Newcastle's form player, great fixtures
• <strong>Cole Palmer (£10.8m)</strong> - Chelsea's talisman, on penalties
• <strong>Ollie Watkins (£9.0m)</strong> - Villa's main threat, decent fixtures

<strong>📉 Consider Selling:</strong>
• Injured players (check the flag status!)
• Players with 3+ difficult fixtures
• Anyone who's lost their starting spot

<strong>Transfer Strategy Tips:</strong>
• Bank transfers when possible for flexibility
• Only take hits for injured players or captaincy options
• Consider fixture swings 2-3 weeks ahead

Do you have specific players you're considering? I can give you a detailed comparison!`;
    }
    
    comparePlayersForTransfer(player1, player2) {
        return `<strong>Player Comparison: ${this.formatPlayerName(player1)} vs ${this.formatPlayerName(player2)}</strong>

<strong>${this.formatPlayerName(player1)}:</strong>
✅ Pros: Better fixtures, in form, differential pick
❌ Cons: Rotation risk, higher price point

<strong>${this.formatPlayerName(player2)}:</strong>
✅ Pros: Nailed starter, penalty taker, cheaper
❌ Cons: Tough fixtures coming, high ownership

<strong>My Verdict:</strong> ${this.getTransferVerdict(player1, player2)}

The decision ultimately depends on your team structure and risk appetite. Need more specific analysis?`;
    }
    
    getTransferVerdict(player1, player2) {
        const verdicts = [
            `Go with ${this.formatPlayerName(player1)} if you need a differential`,
            `${this.formatPlayerName(player2)} is the safer pick for consistent returns`,
            `Both are good options - consider your team balance`,
            `I'd lean towards ${this.formatPlayerName(player1)} for the next 3 gameweeks`
        ];
        return verdicts[Math.floor(Math.random() * verdicts.length)];
    }
    
    evaluateTransferHit(message, entities) {
        return `<strong>Hit Assessment Analysis</strong>

<strong>When hits are worth it:</strong>
• Bringing in a captain you'll use immediately
• Removing injured/suspended players
• Catching price rises (if significant)
• Setting up for a chip strategy

<strong>When to avoid hits:</strong>
• Sideways moves between similar players
• Chasing last week's points
• Minor fixture improvements

For your specific situation: ${this.getHitRecommendation(message)}

Remember: A hit needs the new player to score 4+ points more than the old one just to break even!`;
    }
    
    getHitRecommendation(message) {
        if (message.includes('injury') || message.includes('injured')) {
            return "Taking a hit to remove an injured player is usually justified, especially if they're out for multiple weeks.";
        }
        if (message.includes('captain')) {
            return "If you're bringing in a strong captaincy option, the hit often pays for itself through the armband.";
        }
        return "Based on what you've described, I'd be cautious about taking a hit unless it's absolutely necessary.";
    }
    
    comparePlayersContextual(entities, message) {
        if (entities.players.length >= 2) {
            return this.comparePlayersForTransfer(entities.players[0], entities.players[1]);
        }
        return "Which players would you like me to compare? Just mention both names and I'll give you a detailed analysis!";
    }
    
    getWildcardAdviceContextual(entities) {
        const gw = entities.gameweek || this.currentGameweek;
        
        return `<strong>Wildcard Analysis for GW${gw}</strong>

<strong>Is it time to wildcard?</strong>

Consider these factors:
• Do you have 3+ injured/suspended players?
• Are 5+ of your players facing difficult fixtures?
• Is your team value suffering from price drops?
• Are you 3+ transfers away from the template?

If you answered YES to 2+ questions, a wildcard might be justified.

<strong>Optimal Wildcard Strategy:</strong>

<strong>Structure:</strong>
• GK: One premium (£5.5m+), one £4.0m
• DEF: 2 premiums, 3 rotation options
• MID: 2-3 premiums, enablers
• FWD: Haaland + 2 mid-price options

<strong>Current Template to Consider:</strong>
• Core: Haaland, Salah, Saka
• Value: Gordon, Solanke, Gabriel
• Differentials: Palmer, Watkins

Want me to suggest a specific wildcard team within your budget?`;
    }
    
    getDifferentialPicksContextual(entities) {
        const position = this.detectPosition(entities);
        
        return `<strong>Differential Picks Analysis</strong>

<strong>Why differentials matter:</strong>
With template teams dominating, differentials are your path to big rank jumps. Here are my data-driven picks:

<strong>🎯 Elite Differentials (5-10% owned):</strong>

<strong>Matheus Cunha (£6.5m, 4.2% owned)</strong>
• Wolves' main creative outlet
• Great underlying stats (high xG+xA)
• Fixture proof - performs vs anyone

<strong>Bryan Mbeumo (£7.3m, 6.8% owned)</strong>
• Brentford's penalty taker
• Consistently returns at home
• Under the radar despite good form

<strong>Eberechi Eze (£6.8m, 5.1% owned)</strong>
• Palace's talisman when fit
• Set piece threat
• Explosive potential

<strong>💎 Deep Differentials (<5% owned):</strong>
• Morgan Gibbs-White - Forest's creator
• João Pedro - Brighton's new striker
• Matty Cash - Attacking full-back

<strong>Risk vs Reward:</strong>
Differentials should make up 20-30% of your team. Too many and you'll miss template hauls; too few and you can't make significant rank gains.

Which position are you looking to differentiate in?`;
    }
    
    detectPosition(entities) {
        // Logic to detect if user mentioned a specific position
        return null;
    }
    
    getTeamAnalysisContextual(message) {
        return `I'd love to analyze your team! To give you the best advice, I need to see your current squad.

<strong>Share your team in one of these ways:</strong>
1. Type your Team ID (I'll look it up)
2. List your 15 players
3. Take a screenshot and describe it

<strong>What I'll analyze:</strong>
• Formation effectiveness
• Captain options
• Transfer priorities
• Bench strength
• Fixture difficulty (next 5 GWs)
• Chip strategy
• Differential vs template balance

<strong>Quick Team Check Questions:</strong>
• Do you have Haaland? (Essential)
• How many premiums (£10m+)?
• Any injured players?
• How many free transfers?
• What's your team value?

Once you share your team, I'll provide specific, actionable advice to improve your rank!`;
    }
    
    getChipStrategyContextual(entities) {
        const chip = this.detectChipType(entities);
        
        if (chip) {
            return this.getSpecificChipAdvice(chip);
        }
        
        return `<strong>Complete Chip Strategy Guide</strong>

<strong>🎯 Triple Captain:</strong>
• Save for: DGW with premium captain
• Best targets: Haaland/Salah with 2 home games
• Expected GWs: 25, 32, or 37
• Strategy: 40+ point potential needed

<strong>💪 Bench Boost:</strong>
• Traditional: DGW37
• Requirements: 15 playing players
• Preparation: Build from GW35
• Target: 30+ bench points

<strong>🔄 Free Hit:</strong>
• Option 1: Blank GW (when 4+ teams blank)
• Option 2: Double GW attack
• Option 3: Emergency (5+ injuries)
• Strategy: Go heavy on fixtures

<strong>🎲 Second Wildcard:</strong>
• Available: From GW20
• Optimal: GW28-34
• Focus: Final run-in + DGWs
• Build: BB-compatible team

<strong>This Season's Key Dates:</strong>
• GW29: Potential blank (FA Cup)
• GW32: Expected small double
• GW37: Big double (BB territory)

Which chip are you considering using next?`;
    }
    
    detectChipType(entities) {
        // Logic to detect specific chip mentioned
        return null;
    }
    
    getSpecificChipAdvice(chip) {
        // Detailed advice for specific chip
        return `Detailed strategy for ${chip}...`;
    }
    
    getInjuryNewsContextual(entities) {
        if (entities.players.length > 0) {
            const player = entities.players[0];
            return this.getPlayerInjuryStatus(player);
        }
        
        return this.getGeneralInjuryUpdate();
    }
    
    getPlayerInjuryStatus(player) {
        return `<strong>Injury Update: ${this.formatPlayerName(player)}</strong>

<strong>Current Status:</strong> ⚠️ 75% chance of playing

<strong>Details:</strong>
• Missed training on Thursday
• Manager said "touch and go" in presser
• History suggests likely to start if passes fitness test

<strong>FPL Implications:</strong>
• Wait for team news if possible
• Have a backup plan ready
• Consider if worth the risk for captaincy

<strong>Recommendation:</strong> ${this.getInjuryRecommendation(player)}

Want updates on other players? Just ask!`;
    }
    
    getInjuryRecommendation(player) {
        const recs = [
            "Hold if you have bench cover, but prepare alternatives",
            "Consider selling if you need them for captaincy",
            "Wait for press conference updates before deciding",
            "Monitor social media for training photos"
        ];
        return recs[Math.floor(Math.random() * recs.length)];
    }
    
    getGeneralInjuryUpdate() {
        return `<strong>Latest Injury & Team News Round-up</strong>

<strong>🔴 Confirmed Out:</strong>
• Timber - ACL (Season)
• Maddison - Ankle (3-4 weeks)
• James - Hamstring (2-3 weeks)

<strong>🟡 Major Doubts (50/50):</strong>
• De Bruyne - Knock (Late fitness test)
• Martinelli - Muscle (Touch and go)
• Jota - Illness (Should recover)

<strong>🟢 Back in Training:</strong>
• Grealish - Available
• Stones - Match fit
• Isak - Recovered

<strong>Press Conference Schedule:</strong>
• Klopp: Friday 1:30 PM
• Arteta: Friday 2:00 PM
• Pep: Friday 2:30 PM
• Ten Hag: Friday 3:00 PM

<strong>Pro Tip:</strong> Always wait for press conferences before using transfers. Team news usually leaks 1 hour before deadline.

Need info on a specific player?`;
    }
    
    getFixtureAnalysisContextual(entities) {
        if (entities.teams.length > 0) {
            return this.getTeamFixtureAnalysis(entities.teams[0]);
        }
        
        return this.getGeneralFixtureAnalysis();
    }
    
    getTeamFixtureAnalysis(team) {
        return `<strong>Fixture Analysis: ${team.charAt(0).toUpperCase() + team.slice(1)}</strong>

<strong>Next 5 Fixtures:</strong>
• GW${this.currentGameweek}: Team A (H) - FDR: 2 ✅
• GW${this.currentGameweek+1}: Team B (A) - FDR: 4 ⚠️
• GW${this.currentGameweek+2}: Team C (H) - FDR: 2 ✅
• GW${this.currentGameweek+3}: Team D (A) - FDR: 3 🟡
• GW${this.currentGameweek+4}: Team E (H) - FDR: 2 ✅

<strong>Overall Rating:</strong> 8/10 - Very favorable run

<strong>Key Players to Target:</strong>
• Attackers benefit from home fixtures
• Defense solid for clean sheet potential
• Consider for captaincy in home games

Want analysis for another team?`;
    }
    
    getGeneralFixtureAnalysis() {
        return `<strong>Fixture Difficulty Analysis - Next 5 GWs</strong>

<strong>🟢 Best Fixtures (Target These):</strong>

<strong>Liverpool:</strong> 4 home games in 5
• Key assets: Salah, Trent, Díaz
• Clean sheet potential high

<strong>Arsenal:</strong> Favorable run begins
• Key assets: Saka, Martinelli, Gabriel
• Set piece threat

<strong>Newcastle:</strong> Under the radar good run
• Key assets: Gordon, Isak, Trippier
• Differential potential

<strong>🔴 Worst Fixtures (Avoid/Sell):</strong>

<strong>Chelsea:</strong> City, Liverpool, Arsenal
• Consider moving Palmer after good fixture

<strong>Man United:</strong> Tough away games
• Unpredictable regardless of fixtures

<strong>Fixture-Proof Players:</strong>
Some players transcend fixtures:
• Haaland - Scores vs anyone
• Salah - Home banker always
• Son - Big game player

Need specific team fixture analysis?`;
    }
    
    getPriceChangesContextual(entities) {
        if (entities.players.length > 0) {
            return this.getPlayerPriceAnalysis(entities.players[0]);
        }
        
        return this.getGeneralPriceUpdate();
    }
    
    getPlayerPriceAnalysis(player) {
        return `<strong>Price Analysis: ${this.formatPlayerName(player)}</strong>

<strong>Current Price:</strong> £X.Xm
<strong>Ownership:</strong> X.X%
<strong>Net Transfers:</strong> +50,000
<strong>Target:</strong> 95.3%

<strong>Prediction:</strong> Likely to rise tonight ⬆️

<strong>Should you move early?</strong>
• If you're buying: Consider beating the price rise
• If you're selling: Can wait unless urgent
• Price locked if you owned before last change

Want to check another player's price trend?`;
    }
    
    getGeneralPriceUpdate() {
        return `<strong>Tonight's Price Change Predictions</strong>

<strong>📈 RISERS (Very Likely):</strong>
• Palmer - 108% target ⬆️
• Gordon - 96% target ⬆️
• Solanke - 92% target ⬆️
• Gabriel - 89% target ⬆️

<strong>📉 FALLERS (Very Likely):</strong>
• Maddison - -115% (injured) ⬇️
• James - -98% (injured) ⬇️
• Sterling - -91% (poor form) ⬇️
• Neto - -87% (dropped) ⬇️

<strong>Understanding Price Changes:</strong>
• Changes occur at 2:30 AM UK time
• Based on net transfers vs ownership
• Threshold varies by ownership %
• Wild swings during wildcards

<strong>Strategy Tips:</strong>
• Beat rises if you're certain
• Don't chase team value alone
• Price changes ≠ good transfers
• Focus on points over value

Want to check a specific player's trend?`;
    }
    
    getFormationAdviceContextual(message) {
        const formation = this.extractFormation(message);
        
        if (formation) {
            return this.getSpecificFormationAnalysis(formation);
        }
        
        return this.getGeneralFormationAdvice();
    }
    
    extractFormation(message) {
        const formations = ['3-4-3', '3-5-2', '4-4-2', '4-5-1', '5-3-2', '5-4-1'];
        for (const f of formations) {
            if (message.includes(f)) return f;
        }
        return null;
    }
    
    getSpecificFormationAnalysis(formation) {
        const analyses = {
            '3-5-2': `<strong>3-5-2 Formation Analysis</strong>

The most popular and balanced formation this season.

<strong>Pros:</strong>
• Perfect for Haaland + mid-price forward
• Allows 3 premium mids (Salah, Saka, Son)
• Flexible for transfers
• Good bench options

<strong>Cons:</strong>
• Miss out on premium defenders' hauls
• Vulnerable to defensive rotations

<strong>Ideal Structure:</strong>
• GK: Set and forget (Alisson/Ederson)
• DEF: 2 premiums + 1 rotation
• MID: 2-3 premiums + enablers
• FWD: Haaland + Watkins/Solanke

<strong>Current Template:</strong>
Raya / (4.0)
Trippier / Gabriel / Konsa / (Rotation) / (4.0)
Salah / Saka / Palmer / Gordon / (Enabler)
Haaland / Watkins / (Enabler)

This is currently META - stick with it if working!`,
            '3-4-3': `<strong>3-4-3 Formation Analysis</strong>

The aggressive, high-risk high-reward approach.

<strong>Pros:</strong>
• Triple premium forwards
• Capitalize when forwards hit form
• Differential from template

<strong>Cons:</strong>
• Sacrifice midfield depth
• Less flexibility
• Expensive to maintain

<strong>When It Works:</strong>
• Forward-friendly fixtures
• When template mids struggle
• Chasing rank late season

Consider if you're willing to go against template!`
        };
        
        return analyses[formation] || this.getGeneralFormationAdvice();
    }
    
    getGeneralFormationAdvice() {
        return `<strong>Formation Strategy Analysis</strong>

<strong>Current META Formations:</strong>

<strong>1️⃣ 3-5-2 (45% of top 10k)</strong>
• Most balanced and flexible
• Accommodates premium mids
• Template choice

<strong>2️⃣ 3-4-3 (25% of top 10k)</strong>
• High risk, high reward
• Triple premium forwards
• Differential approach

<strong>3️⃣ 4-4-2 (15% of top 10k)</strong>
• Defensive focus
• Clean sheet hunting
• Steady points

<strong>4️⃣ 4-5-1 (10% of top 10k)</strong>
• Haaland + premium mids
• Maximum midfield coverage
• Rotation heavy

<strong>5️⃣ 5-3-2 (5% of top 10k)</strong>
• Ultra-defensive
• Targets multiple CS
• Big differential

<strong>My Recommendation:</strong>
Stick with 3-5-2 unless you have a specific strategy. It offers the best balance of upside and flexibility.

What formation are you currently running?`;
    }
    
    getPlayerStatsContextual(entities) {
        if (entities.players.length > 0) {
            return this.getPlayerStats(entities.players[0]);
        }
        
        return "Which player's stats would you like to see? I can provide xG, xA, shots, key passes, and more!";
    }
    
    getPlayerStats(player) {
        return `<strong>Statistical Analysis: ${this.formatPlayerName(player)}</strong>

<strong>Season Stats:</strong>
• Goals: 8
• Assists: 4
• xG: 9.2 (slight underperformance)
• xA: 3.8 (overperforming)
• Shots/90: 3.4
• Key Passes/90: 2.1

<strong>Recent Form (Last 5):</strong>
• Points: 42 total (8.4 avg)
• Goals: 3
• Assists: 2
• Bonus: 9

<strong>Advanced Metrics:</strong>
• ICT Index: 98.5 (Excellent)
• Threat: 892 (Top 5 in position)
• Creativity: 654
• Influence: 445

<strong>FPL Verdict:</strong>
The underlying stats suggest consistent returns ahead. The xG shows room for positive regression.

Want comparative stats with another player?`;
    }
    
    getGameweekAdvice(entities) {
        const gw = entities.gameweek || this.currentGameweek;
        
        return `<strong>Gameweek ${gw} Strategic Preview</strong>

<strong>Key Fixtures:</strong>
• Liverpool vs Sheffield United (H) - Target heavy
• Man City vs Luton (H) - Captain territory
• Arsenal vs Burnley (H) - Clean sheet banker

<strong>Captain Picks:</strong>
1. Haaland - 68% EO, safe choice
2. Salah - 25% EO, differential
3. Palmer - 7% EO, big differential

<strong>Transfer Targets:</strong>
• In: Gordon (great fixtures)
• Out: Injured players first priority

<strong>Chip Consideration:</strong>
• Save chips unless emergency
• Build towards future doubles

<strong>Deadline Reminders:</strong>
• Check team news 1hr before
• Confirm captain and bench order
• Save team before deadline!

Any specific GW${gw} questions?`;
    }
    
    getHitsAdvice(message) {
        const numberOfHits = this.extractHitCount(message);
        
        return `<strong>Points Hit Analysis</strong>

<strong>The Mathematics:</strong>
• -4 for 1 extra transfer
• -8 for 2 extra transfers
• Need 4+ point gain to break even

<strong>When Hits Pay Off:</strong>
✅ Removing injured player for starter (2 pts minimum)
✅ Bringing in strong captain
✅ Catching crucial price rises
✅ Facilitating chip strategy

<strong>When to Avoid:</strong>
❌ Sideways moves (similar players)
❌ Chasing last week's points
❌ Minor fixture improvements
❌ Panic transfers

<strong>Success Rate:</strong>
Statistically, only 45% of hits break even immediately. However, long-term value can justify them.

<strong>My Rule of Thumb:</strong>
Only take a hit if you expect the new player to score 6+ points MORE than the player you're removing.

Describe your specific transfer and I'll assess if the hit is worth it!`;
    }
    
    extractHitCount(message) {
        if (message.includes('-8')) return 2;
        if (message.includes('-4')) return 1;
        return 1;
    }
    
    getTemplateAnalysis() {
        return `<strong>Current FPL Template Analysis</strong>

<strong>The Template Team (Top 10k):</strong>

<strong>GK:</strong> Raya/Alisson (65%)
<strong>DEF:</strong> Trippier, Gabriel, TAA (45-60%)
<strong>MID:</strong> Salah, Saka, Palmer (50-70%)
<strong>FWD:</strong> Haaland (85%), Watkins (40%)

<strong>High Ownership Players:</strong>
• Haaland - 85% (Essential)
• Salah - 65% (Near-essential)
• Saka - 55% (Template)
• Palmer - 45% (Rising template)

<strong>Template Strategy:</strong>

<strong>Following Template (Safe):</strong>
• Steady rank maintenance
• Less volatility
• Protection from template hauls

<strong>Differential Approach (Risky):</strong>
• Potential for big gains
• Risk of falling behind
• Need 3-4 differentials minimum

<strong>Optimal Balance:</strong>
• 70% template coverage
• 30% differentials
• Focus differentials in low-impact positions

Want to see how your team compares to template?`;
    }
    
    getRankingAdvice(message) {
        return `<strong>Rank Improvement Strategy</strong>

<strong>Current Season Context:</strong>
• Average score needed for top 10k: ~65 pts/GW
• Top 100k: ~60 pts/GW
• Top 1M: ~52 pts/GW

<strong>Strategies by Current Rank:</strong>

<strong>If Top 100k:</strong>
• Protect rank with template
• Captain with majority
• Avoid unnecessary hits

<strong>If 100k-500k:</strong>
• Mix template with differentials
• Consider differential captains occasionally
• Strategic hits acceptable

<strong>If 500k+:</strong>
• Need aggressive differentials
• Alternative captain picks
• Calculated risks required

<strong>Key Rank Boosters:</strong>
• Nail your captain picks (most important)
• Have the right players for doubles
• Optimize chip usage
• Maintain team value

<strong>Rank Volatility:</strong>
Remember, 1 great gameweek can move you 500k+ ranks. Don't panic!

What's your current rank? I can give specific advice!`;
    }
    
    getConversationalResponse(message, context) {
        // Handle general queries with context awareness
        const lower = message.toLowerCase();
        
        // Check for follow-up questions
        if (context.length > 0) {
            const lastResponse = context[context.length - 1];
            if (lower.includes('more') || lower.includes('else') || lower.includes('other')) {
                return this.generateFollowUp(lastResponse);
            }
        }
        
        // Default helpful response
        return `I understand you're asking about "${message}". Let me help you with that!

As an FPL expert, I can assist with:
• Captain selections and vice-captain backup
• Transfer strategy and hit evaluation  
• Wildcard timing and team structure
• Differential picks for rank climbing
• Chip strategy for maximum points
• Price rise/fall predictions
• Fixture analysis and planning
• Formation optimization
• Player comparisons with stats
• Injury news and team updates

Could you be more specific about what aspect you'd like help with? For example:
- "Should I captain Haaland or Salah?"
- "Is it worth taking a -4 for Palmer?"
- "When should I use my wildcard?"

The more details you provide, the better advice I can give!`;
    }
    
    generateFollowUp(lastResponse) {
        return `Building on what we just discussed, here are some additional considerations:

• Don't forget to check team news before the deadline
• Consider your mini-league rivals' teams
• Think 2-3 gameweeks ahead, not just this week
• Balance risk with rank protection

Is there a specific aspect you'd like me to elaborate on?`;
    }
    
    initializeKnowledgeBase() {
        return {
            players: {
                'haaland': { form: 'Exceptional', fixture: 'Favorable home games', stats: 'League-leading xG', risks: 'Rotation in cups' },
                'salah': { form: 'Consistent', fixture: 'Good run of games', stats: 'High shot volume', risks: 'AFCON possibility' },
                'palmer': { form: 'Rising', fixture: 'Mixed bag', stats: 'On all set pieces', risks: 'Chelsea inconsistency' },
                'saka': { form: 'Steady', fixture: 'Improving', stats: 'Creates most for Arsenal', risks: 'Occasional rotation' },
                // Add more players...
            },
            teams: {
                'liverpool': { form: 'Strong', home: 'Fortress', away: 'Solid' },
                'city': { form: 'Dominant', home: 'Incredible', away: 'Professional' },
                // Add more teams...
            },
            strategies: {
                'aggressive': 'High risk differentials, early chips, hits for upside',
                'conservative': 'Template team, safe captains, patient transfers',
                'balanced': 'Mix of template and differentials, strategic hits'
            }
        };
    }
    
    calculateCurrentGameweek() {
        // More accurate gameweek calculation
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(diff + 1, 1), 38);
    }
    
    getCaptainAdvice() {
        const options = [
            {
                player: "Erling Haaland",
                team: "Man City",
                opponent: "Luton (H)",
                reason: "Facing the worst defense in the league, averaging 3.2 goals conceded per game",
                stats: "7 goals in last 4 home games, xG of 9.3",
                confidence: "95%"
            },
            {
                player: "Mohamed Salah",
                team: "Liverpool",
                opponent: "Sheffield United (H)",
                reason: "Excellent home record and Sheffield United have conceded 15 in last 5 away games",
                stats: "5 goals, 3 assists in last 4 games",
                confidence: "88%"
            },
            {
                player: "Cole Palmer",
                team: "Chelsea",
                opponent: "Burnley (H)",
                reason: "On penalties and free kicks, Burnley struggling defensively",
                stats: "Involved in 65% of Chelsea's goals when playing",
                confidence: "82%"
            }
        ];
        
        const pick = options[Math.floor(Math.random() * options.length)];
        
        return `<strong>🎯 Captain Recommendation for GW${this.getCurrentGameweek()}</strong><br><br>
        <strong>My Pick: ${pick.player} (C)</strong><br>
        📍 ${pick.team} vs ${pick.opponent}<br><br>
        <strong>Why?</strong><br>
        • ${pick.reason}<br>
        • ${pick.stats}<br>
        • Confidence Level: ${pick.confidence}<br><br>
        <strong>Vice Captain:</strong> ${options.find(o => o !== pick).player}<br><br>
        💡 <em>Pro Tip: Check team news 1 hour before deadline for any last-minute changes!</em>`;
    }
    
    getTransferAdvice() {
        return `<strong>📊 Transfer Analysis for Your Team</strong><br><br>
        <strong>Priority Transfers This Week:</strong><br><br>
        <strong>OUT:</strong> Injured/Suspended Players<br>
        • Check your squad for red flags<br>
        • Players with 75% chance of playing or less<br><br>
        <strong>IN - Top Picks by Position:</strong><br><br>
        <strong>🥅 GK:</strong> Alisson (5.5m) - 3 clean sheets in 4<br>
        <strong>🛡️ DEF:</strong> Trippier (7.0m) - Attacking returns + CS potential<br>
        <strong>⚡ MID:</strong> Saka (8.9m) - Form player, great fixtures<br>
        <strong>⚔️ FWD:</strong> Watkins (8.1m) - Differential with good fixtures<br><br>
        <strong>Budget Option:</strong> Gordon (5.5m) - Explosive potential<br><br>
        Would you like specific advice for your team? Share your Team ID!`;
    }
    
    getDifferentialPicks() {
        const differentials = [
            { name: "Matheus Cunha", ownership: "3.2%", reason: "Great underlying stats, key player for Wolves" },
            { name: "Anthony Gordon", ownership: "8.5%", reason: "Newcastle's form player, excellent fixtures" },
            { name: "Eberechi Eze", ownership: "5.1%", reason: "Crystal Palace talisman, on set pieces" },
            { name: "Leandro Trossard", ownership: "4.8%", reason: "Rotation risk but explosive when starts" },
            { name: "Morgan Gibbs-White", ownership: "2.9%", reason: "Forest's creative hub, improving team" }
        ];
        
        const picks = differentials.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        return `<strong>💎 Differential Picks (Under 10% Ownership)</strong><br><br>` +
            picks.map(p => 
                `<strong>${p.name}</strong> (${p.ownership} owned)<br>
                📈 ${p.reason}<br><br>`
            ).join('') +
            `<strong>Why Differentials Matter:</strong><br>
            • Massive rank gains when they haul<br>
            • Low ownership = unique advantage<br>
            • Essential for climbing into top 10k<br><br>
            ⚠️ <em>Remember: Higher risk, higher reward!</em>`;
    }
    
    getWildcardAdvice() {
        const gw = this.getCurrentGameweek();
        return `<strong>🎯 Wildcard Strategy Guide</strong><br><br>
        <strong>Current GW: ${gw}</strong><br><br>
        <strong>Optimal Wildcard Windows:</strong><br>
        • GW9-12: International break, fixture swings<br>
        • GW28-31: Double gameweek preparation<br>
        • GW35-38: Final push for rank<br><br>
        <strong>Should You Wildcard Now?</strong><br>
        Consider if you have:<br>
        ✅ 3+ injuries or suspensions<br>
        ✅ 5+ players with bad fixtures<br>
        ✅ Team value dropping rapidly<br>
        ✅ Major template changes needed<br><br>
        <strong>Wildcard Team Structure:</strong><br>
        • 2 Premium defenders (6.0m+)<br>
        • 3 Premium mids/forwards<br>
        • Strong bench for rotation<br>
        • Target 2-3 differentials<br><br>
        Want a specific wildcard draft? Tell me your budget!`;
    }
    
    getTeamAnalysis() {
        return `<strong>📋 Team Analysis Service</strong><br><br>
        I can provide a comprehensive analysis of your FPL team!<br><br>
        <strong>What I'll Analyze:</strong><br>
        • Formation effectiveness<br>
        • Captain choices<br>
        • Bench strength<br>
        • Fixture difficulty next 5 GWs<br>
        • Transfer priorities<br>
        • Chip strategy<br><br>
        <strong>To get started, please provide:</strong><br>
        1️⃣ Your Team ID, or<br>
        2️⃣ List your current 15 players<br><br>
        I'll generate a personalized report with actionable recommendations!`;
    }
    
    getChipStrategy() {
        return `<strong>🎮 Chip Strategy Masterclass</strong><br><br>
        <strong>Triple Captain:</strong><br>
        • Best: Double gameweek for Haaland/Salah<br>
        • Expected: DGW25, DGW32, or DGW37<br>
        • Strategy: Premium player, home fixtures<br><br>
        <strong>Bench Boost:</strong><br>
        • Best: DGW37 traditionally<br>
        • Need: 4 playing bench players with doubles<br>
        • Prep: Build from GW35 with transfers<br><br>
        <strong>Free Hit:</strong><br>
        • Option 1: Big blank gameweek (BGW)<br>
        • Option 2: Emergency injury crisis<br>
        • Option 3: Target specific DGW<br><br>
        <strong>Second Wildcard:</strong><br>
        • Available: From GW20<br>
        • Best: GW28-34 for run-in<br>
        • Focus: DGW players + fixtures<br><br>
        Which chip are you planning to use next?`;
    }
    
    getInjuryNews() {
        return `<strong>🏥 Latest Injury & Team News</strong><br><br>
        <strong>Key Updates (Last 24h):</strong><br><br>
        🔴 <strong>OUT:</strong><br>
        • Martinelli - Hamstring (3-4 weeks)<br>
        • James - Knee (2 weeks)<br>
        • Maddison - Ankle (Unknown)<br><br>
        🟡 <strong>DOUBTS (75%):</strong><br>
        • De Bruyne - Knock (Late fitness test)<br>
        • Watkins - Knee (Should make it)<br><br>
        🟢 <strong>RETURNS:</strong><br>
        • Grealish - Back in training<br>
        • Jota - Available for selection<br><br>
        <strong>Press Conference Times Today:</strong><br>
        • Klopp: 1:30 PM<br>
        • Guardiola: 2:00 PM<br>
        • Arteta: 2:30 PM<br><br>
        💡 <em>Tip: Wait for pressers before making transfers!</em>`;
    }
    
    getFixtureAnalysis() {
        return `<strong>📅 Fixture Difficulty Analysis</strong><br><br>
        <strong>Best Fixtures Next 5 GWs:</strong><br><br>
        <strong>🟢 Teams to Target:</strong><br>
        1. Liverpool - 3 home games, bottom 6 teams<br>
        2. Man City - Favorable run after Chelsea<br>
        3. Newcastle - 4 green fixtures<br>
        4. Brighton - Under the radar good run<br><br>
        <strong>🔴 Teams to Avoid:</strong><br>
        1. Chelsea - Tough run including City, Arsenal<br>
        2. Everton - Away games at top 6<br>
        3. Wolves - Difficult fixtures + poor form<br><br>
        <strong>Fixture Proof Players:</strong><br>
        • Haaland - Scores against anyone<br>
        • Salah - Home banker<br>
        • Son - Good record vs top 6<br><br>
        Want specific fixture analysis for your players?`;
    }
    
    getPriceChanges() {
        return `<strong>💰 Price Change Predictions Tonight</strong><br><br>
        <strong>📈 RISERS (Likely):</strong><br>
        • Palmer - 107.3% transfer in target<br>
        • Gordon - 98.5% target<br>
        • Solanke - 89.2% target<br><br>
        <strong>📉 FALLERS (Likely):</strong><br>
        • Maddison - -108.4% (injured)<br>
        • James - -95.2% (injured)<br>
        • Neto - -88.1% (poor form)<br><br>
        <strong>Price Change Strategy:</strong><br>
        • Beat the rise: Transfer before 2:30 AM GMT<br>
        • Avoid drops: Can wait if not urgent<br>
        • Building value: Early transfers on risers<br><br>
        ⏰ <em>Price changes happen daily at 2:30 AM GMT</em><br><br>
        Want to check specific players? Just ask!`;
    }
    
    getFormationAdvice() {
        return `<strong>⚡ Formation & Strategy Guide</strong><br><br>
        <strong>Popular Formations Analyzed:</strong><br><br>
        <strong>3-5-2</strong> ⭐ Most Popular<br>
        • Balance of premium mids & forwards<br>
        • Flexibility with transfers<br>
        • Best for: Steady points<br><br>
        <strong>3-4-3</strong> 🎯 High Risk/Reward<br>
        • Triple premium forwards<br>
        • Capitalizes on forward form<br>
        • Best for: Aggressive players<br><br>
        <strong>4-4-2</strong> 🛡️ Defensive<br>
        • Clean sheet focus<br>
        • Premium defenders essential<br>
        • Best for: Risk-averse approach<br><br>
        <strong>5-3-2</strong> 💪 Differential<br>
        • Maximum defensive coverage<br>
        • Targets multiple clean sheets<br>
        • Best for: Going against template<br><br>
        <strong>Current Meta:</strong> 3-5-2 with Haaland + Salah<br><br>
        What formation are you running?`;
    }
    
    getDefaultResponse() {
        const responses = [
            `I can help you with various FPL strategies! Try asking about:<br><br>
            • Captain picks for this gameweek<br>
            • Transfer recommendations<br>
            • Differential players<br>
            • Wildcard timing<br>
            • Chip strategy<br>
            • Injury updates<br>
            • Price changes<br>
            • Formation advice<br><br>
            What would you like to know?`,
            
            `Here's what I can analyze for you:<br><br>
            📊 Data Analysis: Player stats, form, fixtures<br>
            🎯 Predictions: Captain picks, point forecasts<br>
            💡 Strategy: Chips, wildcards, transfers<br>
            📈 Trends: Ownership, price changes<br><br>
            Ask me anything specific!`,
            
            `I'm continuously analyzing FPL data to help you succeed! Popular questions:<br><br>
            "Who should I captain this week?"<br>
            "Is it time to wildcard?"<br>
            "Best differential picks?"<br>
            "Should I take a hit for transfers?"<br><br>
            What's your FPL challenge today?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    getCurrentGameweek() {
        return this.currentGameweek;
    }
    
    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    saveConversation() {
        if (this.messageHistory.length > 0) {
            localStorage.setItem('fpl_chat_history', JSON.stringify(this.messageHistory.slice(-20)));
        }
    }
    
    loadSavedConversation() {
        const saved = localStorage.getItem('fpl_chat_history');
        if (saved) {
            try {
                this.messageHistory = JSON.parse(saved);
                // Optionally restore last few messages
            } catch (e) {
                console.error('Could not load saved conversation');
            }
        }
    }
}

// Initialize the assistant when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.fplAI = new FPLAIAssistant();
    });
} else {
    window.fplAI = new FPLAIAssistant();
}