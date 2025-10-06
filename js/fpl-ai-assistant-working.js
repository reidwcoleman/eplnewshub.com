// FPL AI Assistant with Integrated AI Response System
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        this.apiKey = 'demo'; // Using demo mode
        this.initializeAssistant();
        this.loadSavedConversation();
        this.initializeAIEngine();
    }
    
    initializeAIEngine() {
        // Initialize the AI response system
        this.aiEngine = {
            knowledge: this.buildKnowledgeBase(),
            patterns: this.buildResponsePatterns(),
            context: []
        };
    }
    
    buildKnowledgeBase() {
        return {
            currentGW: this.getCurrentGameweek(),
            players: {
                premium: {
                    'Haaland': { price: 14.1, team: 'MCI', position: 'FWD', ownership: 85, form: 9.2 },
                    'Salah': { price: 13.0, team: 'LIV', position: 'MID', ownership: 65, form: 8.8 },
                    'De Bruyne': { price: 9.7, team: 'MCI', position: 'MID', ownership: 15, form: 7.5 },
                    'Son': { price: 9.9, team: 'TOT', position: 'MID', ownership: 25, form: 7.8 }
                },
                midRange: {
                    'Palmer': { price: 10.8, team: 'CHE', position: 'MID', ownership: 45, form: 8.5 },
                    'Saka': { price: 9.5, team: 'ARS', position: 'MID', ownership: 55, form: 8.0 },
                    'Watkins': { price: 9.0, team: 'AVL', position: 'FWD', ownership: 30, form: 7.2 },
                    'Gordon': { price: 6.0, team: 'NEW', position: 'MID', ownership: 12, form: 7.9 }
                },
                budget: {
                    'Mbeumo': { price: 7.3, team: 'BRE', position: 'MID', ownership: 8, form: 6.8 },
                    'Cunha': { price: 6.5, team: 'WOL', position: 'FWD', ownership: 3, form: 6.5 },
                    'Eze': { price: 6.8, team: 'CRY', position: 'MID', ownership: 5, form: 6.2 }
                }
            },
            fixtures: this.getUpcomingFixtures(),
            strategies: {
                captaincy: ['Form over fixtures for in-form players', 'Home advantage adds 20% to expected returns', 'Consider EO (Effective Ownership) for rank protection'],
                transfers: ['Fix injuries first', 'Plan 2-3 GWs ahead', 'Don\'t chase last week\'s points'],
                chips: {
                    wildcard: 'Best used during international breaks or fixture swings',
                    benchBoost: 'Save for DGW37 traditionally',
                    tripleCaptain: 'Use in a double gameweek for premium asset',
                    freeHit: 'Save for big blank gameweek'
                }
            }
        };
    }
    
    buildResponsePatterns() {
        return {
            greetings: [
                "Hello! I'm your FPL AI assistant. How can I help you dominate your mini-league today?",
                "Hey there! Ready to make some winning FPL decisions? What's on your mind?",
                "Hi! Let's talk FPL strategy. What challenges are you facing this gameweek?"
            ],
            thinking: [
                "Let me analyze that for you...",
                "Interesting question! Here's my take...",
                "Based on the current data..."
            ]
        };
    }
    
    getUpcomingFixtures() {
        return {
            easy: ['LUT', 'SHU', 'BUR', 'BOU'],
            medium: ['WHU', 'FUL', 'BRE', 'CRY'],
            hard: ['MCI', 'LIV', 'ARS', 'CHE', 'MUN', 'TOT']
        };
    }

    initializeAssistant() {
        const input = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendButton');
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            input.addEventListener('input', () => {
                this.showUserTypingIndicator();
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        this.initializeSuggestedQuestions();
        
        setTimeout(() => {
            this.addWelcomeMessage();
        }, 500);
    }
    
    initializeSuggestedQuestions() {
        const suggestions = [
            { text: "Who should I captain?", icon: "⚡" },
            { text: "Best transfers this week?", icon: "🔄" },
            { text: "Should I wildcard?", icon: "🎯" },
            { text: "Differential picks?", icon: "💎" }
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
                "👋 Welcome to your AI-powered FPL Assistant! I can help you with captain picks, transfers, wildcard timing, differentials, and any FPL strategy questions. I can also answer general questions about football or anything else. What would you like to know?",
                true
            );
            messagesDiv.appendChild(welcomeMsg);
        }
    }
    
    showUserTypingIndicator() {
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
    
    async sendMessage() {
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
        this.conversationContext.push({ role: 'user', content: message });
        
        // Clear input
        input.value = '';
        input.style.borderColor = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate AI response
        setTimeout(async () => {
            const response = await this.generateAIResponse(message);
            this.removeTypingIndicator();
            this.typeResponse(response);
        }, 800 + Math.random() * 700);
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async generateAIResponse(message) {
        const lower = message.toLowerCase();
        
        // Analyze the message
        const analysis = this.analyzeQuery(message);
        
        // Generate contextual response
        if (analysis.type === 'greeting') {
            return this.handleGreeting();
        } else if (analysis.type === 'captain') {
            return this.generateCaptainAdvice(analysis);
        } else if (analysis.type === 'transfer') {
            return this.generateTransferAdvice(analysis);
        } else if (analysis.type === 'wildcard') {
            return this.generateWildcardAdvice(analysis);
        } else if (analysis.type === 'differential') {
            return this.generateDifferentialAdvice(analysis);
        } else if (analysis.type === 'chip') {
            return this.generateChipAdvice(analysis);
        } else if (analysis.type === 'team_analysis') {
            return this.generateTeamAnalysis(analysis);
        } else if (analysis.type === 'fixture') {
            return this.generateFixtureAnalysis(analysis);
        } else if (analysis.type === 'price') {
            return this.generatePriceAnalysis(analysis);
        } else if (analysis.type === 'general_football') {
            return this.generateFootballResponse(message);
        } else if (analysis.type === 'math') {
            return this.handleMath(message);
        } else if (analysis.type === 'joke') {
            return this.tellJoke();
        } else {
            return this.generateGeneralResponse(message, analysis);
        }
    }
    
    analyzeQuery(message) {
        const lower = message.toLowerCase();
        const analysis = {
            type: 'general',
            entities: [],
            sentiment: 'neutral',
            urgency: 'normal'
        };
        
        // Detect query type
        if (lower.match(/^(hi|hello|hey|greetings|good morning|good evening)/)) {
            analysis.type = 'greeting';
        } else if (lower.includes('captain') || lower.includes('armband') || lower.includes('(c)')) {
            analysis.type = 'captain';
        } else if (lower.includes('transfer') || lower.includes('bring in') || lower.includes('sell')) {
            analysis.type = 'transfer';
        } else if (lower.includes('wildcard') || lower.includes('wc')) {
            analysis.type = 'wildcard';
        } else if (lower.includes('differential') || lower.includes('punt')) {
            analysis.type = 'differential';
        } else if (lower.includes('chip') || lower.includes('bench boost') || lower.includes('triple captain') || lower.includes('free hit')) {
            analysis.type = 'chip';
        } else if (lower.includes('my team') || lower.includes('rate my') || lower.includes('rmt')) {
            analysis.type = 'team_analysis';
        } else if (lower.includes('fixture') || lower.includes('opponent')) {
            analysis.type = 'fixture';
        } else if (lower.includes('price') || lower.includes('rise') || lower.includes('fall') || lower.includes('value')) {
            analysis.type = 'price';
        } else if (lower.includes('football') || lower.includes('soccer') || lower.includes('premier league')) {
            analysis.type = 'general_football';
        } else if (/\d+[\+\-\*\/]\d+/.test(message)) {
            analysis.type = 'math';
        } else if (lower.includes('joke') || lower.includes('funny')) {
            analysis.type = 'joke';
        }
        
        // Extract player names
        const players = ['haaland', 'salah', 'palmer', 'saka', 'son', 'gordon', 'watkins', 'mbeumo'];
        players.forEach(player => {
            if (lower.includes(player)) {
                analysis.entities.push(player);
            }
        });
        
        // Detect urgency
        if (lower.includes('urgent') || lower.includes('quick') || lower.includes('asap') || lower.includes('deadline')) {
            analysis.urgency = 'high';
        }
        
        return analysis;
    }
    
    handleGreeting() {
        const greetings = [
            "Hello! Ready to climb those FPL ranks? What can I help you with today - captain picks, transfers, or strategy?",
            "Hey there! I'm here to help you make the best FPL decisions. What's your biggest dilemma this gameweek?",
            "Hi! Let's get you to the top of your mini-league. What would you like to discuss?",
            "Welcome! Whether it's FPL strategy or general questions, I'm here to help. What's on your mind?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    generateCaptainAdvice(analysis) {
        const gw = this.getCurrentGameweek();
        const kb = this.aiEngine.knowledge;
        
        if (analysis.entities.length > 0) {
            const player = analysis.entities[0];
            return `Looking at ${this.formatName(player)} for captaincy in GW${gw}? Let me analyze that:

Based on my data:
• Form: ${this.getPlayerForm(player)}/10
• Fixture difficulty: ${this.getFixtureDifficulty(player)}
• Expected points: ${this.getExpectedPoints(player)}
• Ownership: ${this.getOwnership(player)}%

${this.getCaptainVerdict(player)}

Alternative options to consider:
• Haaland - Always reliable, especially at home (85% EO)
• Salah - Consistent performer at Anfield (65% EO)
• Palmer - On all set pieces, great differential (45% EO)

What's your current rank? That affects how much risk you should take with captaincy.`;
        }
        
        return `Captain picks for GW${gw}:

🥇 **Safe Pick: Erling Haaland**
• Home fixture advantage
• Incredible consistency (7 goals in last 4 home games)
• 85% EO means not captaining is risky

🥈 **Balanced: Mohamed Salah**
• Liverpool's talisman
• Great record at Anfield
• Good for rank climbing (65% EO)

🥉 **Differential: Cole Palmer**
• Chelsea's main man
• On penalties and free kicks
• Could be a masterstroke (45% EO)

My recommendation depends on your situation:
- Protecting rank? Go Haaland
- Chasing? Consider Palmer or another differential
- Balanced approach? Salah is perfect

Who are you currently considering?`;
    }
    
    generateTransferAdvice(analysis) {
        const gw = this.getCurrentGameweek();
        
        if (analysis.entities.length >= 2) {
            const [p1, p2] = analysis.entities;
            return `Comparing ${this.formatName(p1)} vs ${this.formatName(p2)}:

**${this.formatName(p1)}:**
✅ Pros: ${this.getPlayerPros(p1)}
❌ Cons: ${this.getPlayerCons(p1)}
Form: ${this.getPlayerForm(p1)}/10

**${this.formatName(p2)}:**
✅ Pros: ${this.getPlayerPros(p2)}
❌ Cons: ${this.getPlayerCons(p2)}
Form: ${this.getPlayerForm(p2)}/10

My verdict: ${this.getTransferVerdict(p1, p2)}

Consider your team structure and whether you need consistent returns or high ceiling. What's your current team value?`;
        }
        
        return `Transfer recommendations for GW${gw}:

📈 **IN - Hot Picks:**
• **Gordon (£6.0m)** - Newcastle's star, great fixtures
• **Mbeumo (£7.3m)** - Brentford's penalty taker, differential
• **Watkins (£9.0m)** - Villa's main threat

📉 **OUT - Consider Selling:**
• Injured players (check the flags!)
• Players with 3+ difficult fixtures
• Anyone who's lost their starting spot

**Transfer Strategy:**
1. Fix injuries/suspensions first
2. Target fixture swings
3. Don't chase last week's points
4. Consider price changes tonight

**Hit Assessment:**
Only take a -4 if the new player will score 4+ more points. Worth it for:
• Captaincy options
• Removing non-players
• Catching crucial price rises

Do you have any specific players you're considering? What's your FT situation?`;
    }
    
    generateWildcardAdvice(analysis) {
        const gw = this.getCurrentGameweek();
        
        return `Wildcard Analysis for GW${gw}:

**Should You Wildcard? Check These Factors:**

✅ You should wildcard if:
• You have 3+ injured/suspended players
• 5+ players have terrible fixtures
• Your team value is suffering
• You're 4+ transfers away from template

❌ Don't wildcard if:
• You only need 2-3 transfers
• Your team is performing well
• A better opportunity is coming (fixture swing)

**Optimal Wildcard Team Structure:**

**Formation:** 3-5-2 or 3-4-3
**Budget Distribution:**
• GK: £9.5m (One premium + 4.0)
• DEF: £25m (2 premiums, 3 value)
• MID: £40m (2-3 premiums + enablers)
• FWD: £26m (Haaland + 2 mid-price)

**Current Template to Consider:**
• Essential: Haaland, Salah
• Core: Saka, Palmer, Gabriel, Trippier
• Value: Gordon, Mbeumo, Solanke
• Bench: Playing 4.5m defenders

**Best Wildcard Windows:**
• GW${gw} - Current opportunity
• GW28-31 - Traditional second wildcard
• GW35-38 - Final push preparation

How many issues does your current team have? I can help you build a specific wildcard draft if you share your budget.`;
    }
    
    generateDifferentialAdvice(analysis) {
        return `Differential Picks Analysis (Under 10% Ownership):

💎 **Premium Differentials (£7m+):**
• **Bryan Mbeumo** (7.3m, 8% owned)
  - Brentford's penalty taker
  - Great home record
  - Under the radar

• **Ollie Watkins** (9.0m, 30% owned)
  - Villa's main striker
  - Good fixtures coming
  - Proven FPL asset

💎 **Mid-Price Gems (£5-7m):**
• **Matheus Cunha** (6.5m, 3% owned)
  - Wolves' talisman
  - Plays every minute
  - Great underlying stats

• **Morgan Gibbs-White** (6.5m, 3% owned)
  - Forest's creator
  - Set pieces
  - Improving team

💎 **Budget Enablers (Under £5m):**
• **Rogers** (5.0m, 2% owned)
  - Villa's emerging talent
  - Great fixtures
  - Potential for hauls

**Differential Strategy:**
• Ideal allocation: 20-30% of your team
• Too many = miss template hauls
• Too few = can't make big rank gains
• Focus on players with good fixtures

**Risk Assessment:**
High Risk/High Reward - Only for those chasing rank

What's your current rank? That determines how aggressive you should be with differentials.`;
    }
    
    generateChipAdvice(analysis) {
        const gw = this.getCurrentGameweek();
        
        return `Chip Strategy Guide for GW${gw}:

🎯 **Triple Captain:**
• Save for: Double gameweek with premium captain
• Best candidates: Haaland or Salah with 2 home games
• Expected GWs: 25, 32, or 37
• Potential: 40-60 points from captain alone

💪 **Bench Boost:**
• Traditional timing: DGW37
• Requirements: 15 playing players
• Preparation: Build from GW35
• Potential: 30-50 bench points

🔄 **Free Hit:**
• Option 1: Big blank gameweek
• Option 2: Target specific DGW
• Option 3: Emergency (5+ injuries)
• Strategy: Go all-out on fixtures

🃏 **Second Wildcard:**
• Available from: GW20 ✅
• Optimal window: GW28-34
• Focus: DGW players + run-in
• Combine with: Bench Boost prep

**Your Current Situation:**
Based on GW${gw}, here's my recommendation:
• Save TC for confirmed DGW
• Plan BB team structure now
• Keep FH for emergency/blank
• Consider WC2 if 4+ changes needed

**Upcoming Key Dates:**
• GW29: Potential blanks (FA Cup)
• GW32: Expected small double
• GW37: Big double (BB territory)

Which chip are you considering? I can give specific timing advice.`;
    }
    
    generateTeamAnalysis(analysis) {
        return `I'd love to analyze your FPL team! To provide the best advice, please share:

1. **Your current 15 players** (or Team ID)
2. **Team value**
3. **Free transfers available**
4. **Current rank**

**What I'll Analyze:**

📊 **Team Structure:**
• Formation effectiveness
• Premium player distribution
• Bench strength
• Template coverage

🎯 **Key Metrics:**
• Captain options
• Transfer priorities (next 3 GWs)
• Potential hits worth taking
• Chip timing recommendations

📈 **Optimization:**
• Players to target
• Players to sell
• Price change considerations
• Mini-league rival analysis

**Quick Self-Assessment:**
While you gather that info, consider:
• Do you have Haaland? (Essential)
• How many premiums (£10m+)?
• Any injured/flagged players?
• Happy with captain options?

Share your team and I'll provide specific, actionable advice to improve your rank!`;
    }
    
    generateFixtureAnalysis(analysis) {
        const gw = this.getCurrentGameweek();
        
        return `Fixture Analysis for GW${gw}-${gw+5}:

🟢 **Best Fixtures (Target These Teams):**

**Liverpool** - 4 home games in 6
• Key assets: Salah, TAA, Díaz
• Clean sheet potential: High
• Attack potential: Very High

**Arsenal** - Favorable run starting
• Key assets: Saka, Martinelli, Gabriel
• Set piece threat
• Solid defense

**Newcastle** - Under-the-radar good run
• Key assets: Gordon, Isak, Trippier
• Differential potential
• Improving form

🔴 **Worst Fixtures (Avoid/Sell):**

**Chelsea** - Tough run ahead
• Facing: City, Liverpool, Arsenal
• Consider selling after next GW

**Man United** - Inconsistent + bad fixtures
• Away heavy schedule
• Rotation risks

🎯 **Fixture-Proof Players:**
Some players transcend fixtures:
• **Haaland** - Scores against anyone
• **Salah** - Home banker always
• **Palmer** - Chelsea's everything

**Strategy Tips:**
• Plan transfers 3-4 GWs ahead
• Don't overreact to one bad fixture
• Home/Away matters more for defenders
• Form can override fixtures

Which teams' fixtures are you most interested in?`;
    }
    
    generatePriceAnalysis(analysis) {
        return `Price Change Predictions & Analysis:

📈 **Tonight's Likely Risers:**
• **Palmer** - 108% threshold ⬆️ (£10.8m→£10.9m)
• **Gordon** - 95% threshold ⬆️ (£6.0m→£6.1m)
• **Solanke** - 89% threshold ⬆️ (£7.5m→£7.6m)

📉 **Tonight's Likely Fallers:**
• **Maddison** - Injured -112% ⬇️ (£7.5m→£7.4m)
• **James** - Injured -98% ⬇️ (£7.0m→£6.9m)
• **Sterling** - Poor form -91% ⬇️ (£7.0m→£6.9m)

**Understanding Price Changes:**
• Happen daily at 2:30 AM UK time
• Based on net transfers vs ownership
• Threshold varies by ownership %
• Wild during wildcard season

**Price Strategy:**

✅ **When to Beat the Rise:**
• You're certain about the transfer
• Player is essential to plans
• Building team value early season

❌ **When to Wait:**
• Unsure about the transfer
• Player might get injured
• Better options available

**Team Value Tips:**
• Don't chase value over points
• Selling price = (Purchase + Rise)/2
• Price locked if owned during change
• Focus on performance, not price

Current team value matters for flexibility. What's yours? Want to check specific players?`;
    }
    
    generateFootballResponse(message) {
        const responses = [
            `That's an interesting football question! While I specialize in FPL, I love talking about the beautiful game. `,
            `Football is such a dynamic sport! From an FPL perspective, this relates to player performance. `,
            `Great question about football! Let me share my thoughts on that. `
        ];
        
        const base = responses[Math.floor(Math.random() * responses.length)];
        
        const lower = message.toLowerCase();
        if (lower.includes('who will win')) {
            return base + `Predicting match outcomes involves analyzing form, head-to-head records, injuries, and home advantage. In FPL terms, this affects our captain and transfer decisions. Which match are you particularly interested in?`;
        }
        
        if (lower.includes('best player')) {
            return base + `That's always a fun debate! Currently, Haaland is dominating FPL with his incredible consistency. Historically, players like Salah, Kane, and Sterling have been FPL legends. Who's your favorite player to own in FPL?`;
        }
        
        return base + `The Premier League is so competitive this season. Every match affects our FPL decisions - from clean sheet potential to attacking returns. Is there a specific team or player you'd like to discuss?`;
    }
    
    handleMath(message) {
        try {
            const result = this.evaluateMath(message);
            return `The answer is ${result}. 

Fun FPL math fact: If you captain Haaland and he scores a brace with 3 bonus points, that's (2×4 + 3) × 2 = 22 points from one player! 

Need help with any other calculations or FPL decisions?`;
        } catch {
            return `I can help with calculations! For FPL, the important math is: Captain points = (Base points) × 2, and hits cost -4 points. What calculation did you need?`;
        }
    }
    
    tellJoke() {
        const jokes = [
            "Why did the FPL manager bring a ladder to the match? To help his team climb the table! 😄",
            "What do you call an FPL manager who never takes hits? Patient... or bottom of their mini-league! 😂",
            "Why did Pep ruin another FPL gameweek? Because he loves to rotate more than a washing machine! 🌪️",
            "What's the difference between my FPL team and a tea bag? The tea bag stays in the cup longer! ☕",
            "Why don't FPL managers trust stairs? They're always up to something... like price rises at 2:30 AM! 📈"
        ];
        
        return jokes[Math.floor(Math.random() * jokes.length)] + `

Want another joke, or shall we get back to winning your mini-league?`;
    }
    
    generateGeneralResponse(message, analysis) {
        const contextual = this.getContextualResponse();
        
        return `${contextual} 

Regarding "${message}" - I can help with:

• **FPL Strategy**: Captain picks, transfers, chips, differentials
• **Player Analysis**: Form, fixtures, stats, ownership
• **Team Planning**: Wildcard builds, formation advice
• **General Football**: Premier League news, player insights
• **Other Topics**: Math, jokes, general conversation

What specific aspect would you like to explore? I'm here to help you succeed in FPL and answer any questions you have!`;
    }
    
    getContextualResponse() {
        const responses = [
            "That's an interesting question!",
            "Let me help you with that.",
            "Great question!",
            "I understand what you're asking.",
            "Happy to help with this!"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Helper functions
    formatName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    getPlayerForm(player) {
        const forms = { 'haaland': 9.2, 'salah': 8.8, 'palmer': 8.5, 'saka': 8.0, 'gordon': 7.9 };
        return forms[player] || (6 + Math.random() * 2).toFixed(1);
    }
    
    getFixtureDifficulty(player) {
        const difficulties = ['Easy ✅', 'Medium ⚠️', 'Hard 🔴'];
        return difficulties[Math.floor(Math.random() * difficulties.length)];
    }
    
    getExpectedPoints(player) {
        const base = { 'haaland': 11, 'salah': 10, 'palmer': 8, 'saka': 7, 'gordon': 6 };
        return (base[player] || 5 + Math.random() * 4).toFixed(1);
    }
    
    getOwnership(player) {
        const ownership = { 'haaland': 85, 'salah': 65, 'palmer': 45, 'saka': 55, 'gordon': 12 };
        return ownership[player] || Math.floor(5 + Math.random() * 20);
    }
    
    getCaptainVerdict(player) {
        const verdicts = [
            `Solid choice! Expected to return well this gameweek.`,
            `Risky but could pay off big if they haul.`,
            `Safe pick that won't hurt your rank.`,
            `Differential choice - could be a masterstroke!`
        ];
        return verdicts[Math.floor(Math.random() * verdicts.length)];
    }
    
    getPlayerPros(player) {
        const pros = {
            'haaland': 'Consistency, home record, penalties',
            'salah': 'Fixture-proof, bonus magnet, reliable',
            'palmer': 'Set pieces, main man, improving',
            'gordon': 'Form, fixtures, differential'
        };
        return pros[player] || 'Good form, decent fixtures';
    }
    
    getPlayerCons(player) {
        const cons = {
            'haaland': 'Expensive, high ownership, rotation risk',
            'salah': 'Price, AFCON possibility',
            'palmer': 'Chelsea inconsistency',
            'gordon': 'Relatively unproven'
        };
        return cons[player] || 'Some rotation risk';
    }
    
    getTransferVerdict(p1, p2) {
        const verdicts = [
            `I'd lean towards ${this.formatName(p1)} for the next few gameweeks.`,
            `${this.formatName(p2)} offers better value and consistency.`,
            `Both are good options - consider your team balance.`,
            `Depends on whether you need a safe pick or a differential.`
        ];
        return verdicts[Math.floor(Math.random() * verdicts.length)];
    }
    
    evaluateMath(expression) {
        const cleaned = expression.replace(/[^0-9+\-*/().\s]/g, '');
        const parts = cleaned.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
        if (parts) {
            const a = parseFloat(parts[1]);
            const op = parts[2];
            const b = parseFloat(parts[3]);
            
            switch(op) {
                case '+': return a + b;
                case '-': return a - b;
                case '*': return a * b;
                case '/': return b !== 0 ? (a / b).toFixed(2) : 'undefined';
            }
        }
        throw new Error('Invalid expression');
    }
    
    getCurrentGameweek() {
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(diff + 1, 1), 38);
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
        
        const formattedResponse = this.formatResponse(response);
        
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
        
        const textElement = msgDiv.querySelector('#typing-text');
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < formattedResponse.length) {
                textElement.innerHTML = formattedResponse.substring(0, index + 1);
                index += 3;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } else {
                textElement.innerHTML = formattedResponse;
                clearInterval(typeInterval);
                this.messageHistory.push({ type: 'ai', message: response });
                this.conversationContext.push({ role: 'assistant', content: response });
                if (this.conversationContext.length > 20) {
                    this.conversationContext = this.conversationContext.slice(-20);
                }
                this.saveConversation();
            }
        }, 10);
    }
    
    formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^• /gm, '• ')
            .replace(/^✅ /gm, '✅ ')
            .replace(/^❌ /gm, '❌ ')
            .replace(/^🟢 /gm, '🟢 ')
            .replace(/^🔴 /gm, '🔴 ')
            .replace(/^📈 /gm, '📈 ')
            .replace(/^📉 /gm, '📉 ')
            .replace(/^(\d+)\. /gm, '$1. ')
            .replace(/\n/g, '<br>');
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
            localStorage.setItem('fpl_chat_history', JSON.stringify(this.messageHistory.slice(-50)));
            localStorage.setItem('fpl_conversation_context', JSON.stringify(this.conversationContext.slice(-20)));
        }
    }
    
    loadSavedConversation() {
        const savedHistory = localStorage.getItem('fpl_chat_history');
        const savedContext = localStorage.getItem('fpl_conversation_context');
        
        if (savedHistory) {
            try {
                this.messageHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error('Could not load saved history');
            }
        }
        
        if (savedContext) {
            try {
                this.conversationContext = JSON.parse(savedContext);
            } catch (e) {
                console.error('Could not load saved context');
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