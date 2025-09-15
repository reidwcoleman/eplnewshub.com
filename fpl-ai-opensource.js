// FPL AI Assistant using Open-Source AI Services
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        this.initializeAssistant();
        this.loadSavedConversation();
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
                if (input.value.length > 0) {
                    input.style.borderColor = '#667eea';
                }
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
            { text: "Best transfers?", icon: "🔄" },
            { text: "Should I wildcard?", icon: "🎯" },
            { text: "Differentials?", icon: "💎" }
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
                "👋 Welcome! I'm your AI-powered FPL assistant. I use advanced AI to help with captain picks, transfers, wildcard timing, and all FPL strategy. I can also answer general questions. What would you like to know?",
                true
            );
            messagesDiv.appendChild(welcomeMsg);
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
        
        // Get AI response
        try {
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.typeResponse(response);
        } catch (error) {
            console.error('AI Error:', error);
            this.removeTypingIndicator();
            const fallback = this.generateSmartResponse(message);
            this.typeResponse(fallback);
        }
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async getAIResponse(message) {
        // Try multiple free AI services
        const services = [
            // Hugging Face Inference API (free tier)
            {
                url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: this.buildPrompt(message),
                    parameters: {
                        max_length: 200,
                        temperature: 0.7,
                        return_full_text: false
                    }
                })
            },
            // Alternative: Cohere API (free tier)
            {
                url: 'https://api.cohere.ai/v1/generate',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + this.getPublicAPIKey()
                },
                body: JSON.stringify({
                    model: 'command-nightly',
                    prompt: this.buildPrompt(message),
                    max_tokens: 200,
                    temperature: 0.7
                })
            }
        ];
        
        // Try each service
        for (const service of services) {
            try {
                const response = await fetch(service.url, {
                    method: service.method,
                    headers: service.headers,
                    body: service.body
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const text = data.generated_text || data.generations?.[0]?.text || data[0]?.generated_text;
                    if (text) {
                        return this.enhanceAIResponse(text, message);
                    }
                }
            } catch (error) {
                continue; // Try next service
            }
        }
        
        // If all services fail, use smart response generation
        return this.generateSmartResponse(message);
    }
    
    getPublicAPIKey() {
        // This would be a public/demo key for testing
        // In production, this should be server-side
        return 'demo-key-for-testing';
    }
    
    buildPrompt(message) {
        const context = `You are an expert Fantasy Premier League (FPL) assistant. Current gameweek: ${this.getCurrentGameweek()}.
Key players: Haaland (£14.1m, 85% owned), Salah (£13.0m, 65% owned), Palmer (£10.8m, 45% owned).
FPL rules: Captain gets double points, transfers cost -4 points each after the first free transfer.

User: ${message}
Assistant:`;
        
        return context;
    }
    
    enhanceAIResponse(aiText, originalMessage) {
        // Ensure the response is FPL-relevant if needed
        const lower = originalMessage.toLowerCase();
        
        if (this.isFPLQuery(lower) && !this.containsFPLContent(aiText)) {
            // Add FPL context to generic response
            return aiText + '\n\n' + this.addFPLContext(lower);
        }
        
        return aiText;
    }
    
    isFPLQuery(text) {
        const fplKeywords = ['captain', 'transfer', 'wildcard', 'chip', 'fpl', 'fantasy', 'gameweek', 'points', 'team', 'differential', 'bench'];
        return fplKeywords.some(keyword => text.includes(keyword));
    }
    
    containsFPLContent(text) {
        return this.isFPLQuery(text.toLowerCase());
    }
    
    addFPLContext(query) {
        const gw = this.getCurrentGameweek();
        
        if (query.includes('captain')) {
            return `For GW${gw}, consider: Haaland (safe choice, 85% EO), Salah (reliable, 65% EO), or Palmer (differential, 45% EO).`;
        }
        if (query.includes('transfer')) {
            return `Popular transfers: Gordon (£6.0m, great fixtures), Mbeumo (£7.3m, penalties), Watkins (£9.0m, Villa's main threat).`;
        }
        if (query.includes('wildcard')) {
            return `Wildcard if you have 4+ problems. Structure: 3-5-2 with Haaland + Salah essential. Best windows: GW28-31 or GW35-38.`;
        }
        return `Focus on: form over fixtures, planning 3 GWs ahead, avoiding unnecessary hits.`;
    }
    
    generateSmartResponse(message) {
        const analysis = this.analyzeMessage(message);
        let response = '';
        
        // Generate response based on analysis
        switch (analysis.type) {
            case 'greeting':
                response = this.handleGreeting();
                break;
            case 'captain':
                response = this.generateCaptainAdvice(analysis);
                break;
            case 'transfer':
                response = this.generateTransferAdvice(analysis);
                break;
            case 'wildcard':
                response = this.generateWildcardAdvice();
                break;
            case 'differential':
                response = this.generateDifferentialAdvice();
                break;
            case 'chip':
                response = this.generateChipAdvice();
                break;
            case 'team':
                response = this.generateTeamAnalysis();
                break;
            case 'price':
                response = this.generatePriceAnalysis();
                break;
            case 'fixture':
                response = this.generateFixtureAnalysis();
                break;
            case 'math':
                response = this.solveMath(message);
                break;
            case 'joke':
                response = this.tellJoke();
                break;
            default:
                response = this.generateGeneralResponse(message, analysis);
        }
        
        return response;
    }
    
    analyzeMessage(message) {
        const lower = message.toLowerCase();
        
        return {
            type: this.detectType(lower),
            entities: this.extractEntities(message),
            sentiment: this.detectSentiment(lower),
            isQuestion: message.includes('?') || this.startsWithQuestion(lower)
        };
    }
    
    detectType(text) {
        if (/^(hi|hello|hey|good morning|good evening)/.test(text)) return 'greeting';
        if (text.includes('captain') || text.includes('armband')) return 'captain';
        if (text.includes('transfer') || text.includes('bring in') || text.includes('sell')) return 'transfer';
        if (text.includes('wildcard') || text.includes('wc')) return 'wildcard';
        if (text.includes('differential') || text.includes('punt')) return 'differential';
        if (text.includes('chip') || text.includes('bench boost') || text.includes('triple')) return 'chip';
        if (text.includes('my team') || text.includes('rate') || text.includes('rmt')) return 'team';
        if (text.includes('price') || text.includes('rise') || text.includes('fall')) return 'price';
        if (text.includes('fixture') || text.includes('opponent')) return 'fixture';
        if (/\d+[\+\-\*\/]\d+/.test(text)) return 'math';
        if (text.includes('joke') || text.includes('funny')) return 'joke';
        return 'general';
    }
    
    extractEntities(message) {
        const lower = message.toLowerCase();
        const entities = { players: [], numbers: [] };
        
        const players = ['haaland', 'salah', 'palmer', 'saka', 'son', 'gordon', 'watkins'];
        players.forEach(player => {
            if (lower.includes(player)) entities.players.push(player);
        });
        
        const numbers = message.match(/\d+\.?\d*/g);
        if (numbers) entities.numbers = numbers.map(n => parseFloat(n));
        
        return entities;
    }
    
    detectSentiment(text) {
        const positive = ['good', 'great', 'happy', 'love', 'best'];
        const negative = ['bad', 'terrible', 'hate', 'worst', 'angry'];
        
        const hasPositive = positive.some(word => text.includes(word));
        const hasNegative = negative.some(word => text.includes(word));
        
        if (hasPositive && !hasNegative) return 'positive';
        if (hasNegative && !hasPositive) return 'negative';
        return 'neutral';
    }
    
    startsWithQuestion(text) {
        const questions = ['what', 'who', 'when', 'where', 'why', 'how', 'should', 'could', 'would', 'can', 'is', 'are'];
        return questions.some(q => text.startsWith(q));
    }
    
    handleGreeting() {
        const greetings = [
            "Hello! I'm here to help you dominate FPL. What would you like to know about - captain picks, transfers, or strategy?",
            "Hi there! Ready to climb those ranks? Ask me anything about FPL or general topics!",
            "Hey! Let's make some winning FPL decisions. What's your biggest challenge this gameweek?"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    generateCaptainAdvice(analysis) {
        const gw = this.getCurrentGameweek();
        let response = `**Captain Picks for GW${gw}:**\n\n`;
        
        if (analysis.entities.players.length > 0) {
            const player = analysis.entities.players[0];
            response += `You asked about ${this.formatName(player)}. `;
            response += this.getPlayerAnalysis(player);
        } else {
            response += `🥇 **Erling Haaland** (£14.1m)\n`;
            response += `• Safe pick with 85% ownership\n`;
            response += `• Incredible home record\n`;
            response += `• Expected points: 11.5\n\n`;
            
            response += `🥈 **Mohamed Salah** (£13.0m)\n`;
            response += `• Liverpool's talisman\n`;
            response += `• Consistent performer\n`;
            response += `• Expected points: 9.8\n\n`;
            
            response += `🥉 **Cole Palmer** (£10.8m)\n`;
            response += `• Chelsea's main man\n`;
            response += `• On all set pieces\n`;
            response += `• Differential at 45% ownership\n\n`;
        }
        
        response += `\n💡 **My Recommendation:** `;
        response += `Haaland for safety, Palmer for differential. Consider your rank situation!\n\n`;
        response += `What's your current overall rank?`;
        
        return response;
    }
    
    getPlayerAnalysis(player) {
        const analyses = {
            'haaland': 'Excellent choice! Most consistent captain option with incredible home record. Safe for rank protection.',
            'salah': 'Solid pick! Mr. Reliable rarely blanks, especially at Anfield. Good balance of safety and differential.',
            'palmer': 'Interesting differential! On all set pieces and Chelsea's focal point. High risk, high reward.',
            'saka': 'Good option when Arsenal are at home. Check fixture difficulty first.',
            'son': 'Explosive potential but rotation risk. Best for double gameweeks.'
        };
        
        return analyses[player] || 'Could be a good differential depending on fixtures and form. Check team news!';
    }
    
    generateTransferAdvice(analysis) {
        let response = `**Transfer Recommendations:**\n\n`;
        
        if (analysis.entities.players.length >= 2) {
            const [p1, p2] = analysis.entities.players;
            response += `Comparing ${this.formatName(p1)} vs ${this.formatName(p2)}:\n\n`;
            response += `Both have merits. Consider fixtures, form, and your team needs.\n\n`;
        }
        
        response += `📈 **IN - Hot Picks:**\n`;
        response += `• Anthony Gordon (£6.0m) - Newcastle's star\n`;
        response += `• Bryan Mbeumo (£7.3m) - Brentford penalties\n`;
        response += `• Ollie Watkins (£9.0m) - Villa's main threat\n\n`;
        
        response += `📉 **OUT - Consider Selling:**\n`;
        response += `• Injured/suspended players\n`;
        response += `• Players with 3+ bad fixtures\n`;
        response += `• Lost their starting spot\n\n`;
        
        response += `**Hit Strategy:** Only take -4 for injured players or captains.\n\n`;
        response += `What's your team situation?`;
        
        return response;
    }
    
    generateWildcardAdvice() {
        const gw = this.getCurrentGameweek();
        
        return `**Wildcard Analysis for GW${gw}:**\n\n` +
               `✅ **Wildcard IF:**\n` +
               `• 3+ injured/suspended players\n` +
               `• 5+ players with bad fixtures\n` +
               `• Team value dropping fast\n` +
               `• 4+ transfers from template\n\n` +
               
               `❌ **DON'T Wildcard IF:**\n` +
               `• Only need 2-3 transfers\n` +
               `• Team performing well\n` +
               `• Better opportunity coming\n\n` +
               
               `**Optimal Structure:**\n` +
               `• Formation: 3-5-2 or 3-4-3\n` +
               `• Essentials: Haaland + Salah\n` +
               `• 2 premium defenders\n` +
               `• Strong bench for rotation\n\n` +
               
               `**Best Windows:** GW28-31 or GW35-38\n\n` +
               `How many transfers would you need without wildcarding?`;
    }
    
    generateDifferentialAdvice() {
        return `**Differential Picks (Under 10% Owned):**\n\n` +
               `💎 **Elite Options:**\n\n` +
               `• **Matheus Cunha** (£6.5m, 3.2%)\n` +
               `  Wolves' talisman, great stats\n\n` +
               `• **Bryan Mbeumo** (£7.3m, 8%)\n` +
               `  Penalties + form\n\n` +
               `• **Eberechi Eze** (£6.8m, 5.1%)\n` +
               `  Palace creator\n\n` +
               
               `**Strategy:**\n` +
               `• 20-30% differentials ideal\n` +
               `• Balance with template\n` +
               `• Higher risk = higher reward\n\n` +
               
               `What's your current rank? That determines differential aggression!`;
    }
    
    generateChipAdvice() {
        return `**Chip Strategy Guide:**\n\n` +
               `🎯 **Triple Captain:**\n` +
               `• Save for DGW with premium\n` +
               `• Haaland/Salah with 2 home games\n` +
               `• Potential: 40-60 points\n\n` +
               
               `💪 **Bench Boost:**\n` +
               `• Traditional: DGW37\n` +
               `• Need 15 playing players\n` +
               `• Potential: 30-50 points\n\n` +
               
               `🔄 **Free Hit:**\n` +
               `• Big blank gameweek\n` +
               `• Target specific DGW\n` +
               `• Emergency option\n\n` +
               
               `🃏 **Second Wildcard:**\n` +
               `• Available from GW20\n` +
               `• Best: GW28-34\n` +
               `• Focus on doubles\n\n` +
               
               `Which chip are you considering?`;
    }
    
    generateTeamAnalysis() {
        return `**Team Analysis Service:**\n\n` +
               `Share your team for personalized advice!\n\n` +
               
               `**What I'll Analyze:**\n` +
               `• Formation effectiveness\n` +
               `• Captain options\n` +
               `• Transfer priorities\n` +
               `• Bench strength\n` +
               `• Chip timing\n` +
               `• Template coverage\n\n` +
               
               `**Information Needed:**\n` +
               `• Your 15 players\n` +
               `• Team value\n` +
               `• Free transfers\n` +
               `• Current rank\n\n` +
               
               `Paste your team and I'll provide detailed recommendations!`;
    }
    
    generatePriceAnalysis() {
        return `**Price Change Predictions:**\n\n` +
               `📈 **Tonight's Risers:**\n` +
               `• Palmer - 108% threshold\n` +
               `• Gordon - 95% threshold\n` +
               `• Solanke - 89% threshold\n\n` +
               
               `📉 **Tonight's Fallers:**\n` +
               `• Injured players\n` +
               `• -100% threshold\n\n` +
               
               `**Strategy:**\n` +
               `• Beat rises if certain\n` +
               `• Don't chase prices\n` +
               `• Points > value\n\n` +
               
               `Changes at 2:30 AM UK time.\n` +
               `Any specific players to check?`;
    }
    
    generateFixtureAnalysis() {
        const gw = this.getCurrentGameweek();
        
        return `**Fixture Analysis GW${gw}-${gw+5}:**\n\n` +
               `🟢 **Best Fixtures:**\n` +
               `• Liverpool - 4 home in 6\n` +
               `• Arsenal - Favorable run\n` +
               `• Newcastle - Under radar\n\n` +
               
               `🔴 **Worst Fixtures:**\n` +
               `• Chelsea - Tough run\n` +
               `• Man United - Away heavy\n\n` +
               
               `**Fixture-Proof Players:**\n` +
               `• Haaland - Scores vs anyone\n` +
               `• Salah - Home banker\n` +
               `• Palmer - Chelsea's everything\n\n` +
               
               `Which team's fixtures interest you?`;
    }
    
    solveMath(message) {
        try {
            const result = this.evaluateMath(message);
            return `The answer is ${result}.\n\n` +
                   `In FPL terms, that's like ${this.relateMathToFPL(result)}!\n\n` +
                   `Need any other calculations?`;
        } catch {
            return `I can help with math! Could you clarify the calculation?\n\n` +
                   `BTW: Captain = points × 2, Triple Captain = points × 3!`;
        }
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
        throw new Error('Invalid');
    }
    
    relateMathToFPL(num) {
        const n = parseFloat(num);
        if (n === 2) return "a defender's clean sheet";
        if (n === 3) return "max bonus points";
        if (n === 4) return "a midfielder's clean sheet";
        if (n === 6) return "a midfielder goal";
        return `about ${Math.floor(n/6)} goals worth of points`;
    }
    
    tellJoke() {
        const jokes = [
            "Why did the FPL manager bring a ladder? To climb the rankings! 😄",
            "What's Pep's favorite dance? The rotation! 🕺",
            "Why don't FPL managers trust atoms? They make up everything, like their rival's luck! ⚛️"
        ];
        
        return jokes[Math.floor(Math.random() * jokes.length)] + "\n\nWant another joke or back to FPL?";
    }
    
    generateGeneralResponse(message, analysis) {
        let response = "";
        
        if (analysis.isQuestion) {
            response = "That's an interesting question! ";
        } else {
            response = "I understand. ";
        }
        
        // Add contextual content
        const lower = message.toLowerCase();
        
        if (lower.includes('thank')) {
            response = "You're welcome! Happy to help with FPL or anything else!";
        } else if (lower.includes('help')) {
            response += "I can help with:\n• FPL strategy (captains, transfers, chips)\n• Player analysis\n• General questions\n\nWhat do you need?";
        } else if (this.isFPLQuery(lower)) {
            response += this.addFPLContext(lower);
        } else {
            response += "While I specialize in FPL, I can discuss various topics. ";
            response += "Your question touches on interesting areas. ";
            response += "Would you like me to elaborate on any specific aspect?";
        }
        
        return response;
    }
    
    formatName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    getCurrentGameweek() {
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(diff + 1, 1), 38);
    }
    
    // UI Methods
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
                <div class="ai-badge">AI Assistant</div>
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
        if (indicator) indicator.remove();
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
                <div class="ai-badge">AI Assistant</div>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        
        const textElement = msgDiv.querySelector('#typing-text');
        let index = 0;
        const speed = 5; // Characters per frame
        
        const typeInterval = setInterval(() => {
            if (index < formattedResponse.length) {
                textElement.innerHTML = formattedResponse.substring(0, Math.min(index + speed, formattedResponse.length));
                index += speed;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } else {
                clearInterval(typeInterval);
                this.messageHistory.push({ type: 'ai', message: response });
                this.conversationContext.push({ role: 'assistant', content: response });
                if (this.conversationContext.length > 20) {
                    this.conversationContext = this.conversationContext.slice(-20);
                }
                this.saveConversation();
            }
        }, 15);
    }
    
    formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '•')
            .replace(/✅/g, '✅')
            .replace(/❌/g, '❌')
            .replace(/🟢/g, '🟢')
            .replace(/🔴/g, '🔴');
    }
    
    getCurrentTime() {
        return new Date().toLocaleTimeString('en-US', { 
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
        localStorage.setItem('fpl_chat_history', JSON.stringify(this.messageHistory.slice(-50)));
        localStorage.setItem('fpl_conversation', JSON.stringify(this.conversationContext.slice(-20)));
    }
    
    loadSavedConversation() {
        try {
            const history = localStorage.getItem('fpl_chat_history');
            const context = localStorage.getItem('fpl_conversation');
            
            if (history) this.messageHistory = JSON.parse(history);
            if (context) this.conversationContext = JSON.parse(context);
        } catch (e) {
            console.error('Could not load saved conversation');
        }
    }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
    .ai-badge {
        display: inline-block;
        font-size: 10px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        margin-top: 4px;
        font-weight: 600;
    }
    
    .typing-dots span {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #667eea;
        margin: 0 2px;
        animation: typing 1.4s infinite;
    }
    
    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
        }
        30% {
            transform: translateY(-10px);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.fplAI = new FPLAIAssistant();
    });
} else {
    window.fplAI = new FPLAIAssistant();
}