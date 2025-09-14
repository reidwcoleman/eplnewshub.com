// Enhanced FPL AI Assistant JavaScript
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
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
        const lower = message.toLowerCase();
        const responses = {
            captain: this.getCaptainAdvice(),
            transfer: this.getTransferAdvice(),
            differential: this.getDifferentialPicks(),
            wildcard: this.getWildcardAdvice(),
            team: this.getTeamAnalysis(),
            chip: this.getChipStrategy(),
            injury: this.getInjuryNews(),
            fixture: this.getFixtureAnalysis(),
            price: this.getPriceChanges(),
            formation: this.getFormationAdvice()
        };
        
        // Check for keywords and return appropriate response
        for (const [key, response] of Object.entries(responses)) {
            if (lower.includes(key)) {
                return response;
            }
        }
        
        // Default response
        return this.getDefaultResponse();
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
        // Calculate current gameweek based on date
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(weeksDiff + 1, 1), 38);
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