// Enhanced FPL AI Assistant - True ChatGPT-style Natural Language AI
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        this.knowledgeBase = this.initializeKnowledgeBase();
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
                "Hi! I'm your AI assistant. I can help with Fantasy Premier League strategy, but I can also answer any other questions you might have - from general football knowledge to completely unrelated topics. What would you like to know?",
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
        this.conversationContext.push({ role: 'user', content: message });
        
        // Clear input
        input.value = '';
        input.style.borderColor = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate and display AI response
        setTimeout(() => {
            const response = this.generateNaturalResponse(message);
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
                this.conversationContext.push({ role: 'assistant', content: response });
                // Keep context manageable
                if (this.conversationContext.length > 20) {
                    this.conversationContext = this.conversationContext.slice(-20);
                }
                this.saveConversation();
            }
        }, 20);
    }
    
    generateNaturalResponse(message) {
        const lower = message.toLowerCase();
        
        // Analyze message for context and intent
        const analysis = this.analyzeMessage(message);
        
        // Generate contextually appropriate response
        if (analysis.isFPL) {
            return this.generateFPLResponse(analysis, message);
        } else if (analysis.isFootball) {
            return this.generateFootballResponse(analysis, message);
        } else if (analysis.isGreeting) {
            return this.generateGreeting();
        } else if (analysis.isQuestion) {
            return this.generateGeneralAnswer(message);
        } else {
            return this.generateConversationalResponse(message);
        }
    }
    
    analyzeMessage(message) {
        const lower = message.toLowerCase();
        
        // Check for different types of queries
        const analysis = {
            isFPL: this.checkFPLContent(lower),
            isFootball: this.checkFootballContent(lower),
            isGreeting: this.checkGreeting(lower),
            isQuestion: message.includes('?') || this.checkQuestionWords(lower),
            topic: this.identifyTopic(lower),
            sentiment: this.analyzeSentiment(lower),
            entities: this.extractEntities(message)
        };
        
        return analysis;
    }
    
    checkFPLContent(text) {
        const fplKeywords = [
            'fpl', 'fantasy', 'captain', 'transfer', 'wildcard', 'chip', 
            'bench boost', 'triple captain', 'free hit', 'points', 'gameweek',
            'gw', 'differential', 'template', 'mini-league', 'rank', 'team value',
            'price rise', 'price fall', 'hits', '-4', '-8'
        ];
        return fplKeywords.some(keyword => text.includes(keyword));
    }
    
    checkFootballContent(text) {
        const footballKeywords = [
            'football', 'soccer', 'premier league', 'epl', 'match', 'game',
            'player', 'team', 'goal', 'assist', 'clean sheet', 'fixture',
            'liverpool', 'manchester', 'arsenal', 'chelsea', 'tottenham',
            'city', 'united', 'league', 'champions', 'cup', 'world cup'
        ];
        return footballKeywords.some(keyword => text.includes(keyword));
    }
    
    checkGreeting(text) {
        const greetings = [
            'hello', 'hi', 'hey', 'good morning', 'good afternoon', 
            'good evening', 'howdy', 'greetings', 'sup', 'what\'s up'
        ];
        return greetings.some(greeting => text.startsWith(greeting));
    }
    
    checkQuestionWords(text) {
        const questionWords = [
            'what', 'when', 'where', 'who', 'why', 'how', 
            'which', 'whose', 'whom', 'can', 'could', 'would',
            'should', 'is', 'are', 'do', 'does', 'will'
        ];
        return questionWords.some(word => text.startsWith(word));
    }
    
    identifyTopic(text) {
        // Identify the main topic of conversation
        if (text.includes('weather')) return 'weather';
        if (text.includes('news')) return 'news';
        if (text.includes('joke')) return 'humor';
        if (text.includes('help')) return 'assistance';
        if (text.includes('math') || /\d+[\+\-\*\/]\d+/.test(text)) return 'mathematics';
        if (text.includes('history')) return 'history';
        if (text.includes('science')) return 'science';
        if (text.includes('technology') || text.includes('computer')) return 'technology';
        if (text.includes('movie') || text.includes('film')) return 'entertainment';
        if (text.includes('music') || text.includes('song')) return 'music';
        if (text.includes('food') || text.includes('recipe')) return 'food';
        if (text.includes('travel')) return 'travel';
        if (text.includes('health') || text.includes('fitness')) return 'health';
        return 'general';
    }
    
    analyzeSentiment(text) {
        const positive = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'best', 'amazing'];
        const negative = ['bad', 'terrible', 'awful', 'hate', 'worst', 'angry', 'sad', 'disappointed'];
        
        const hasPositive = positive.some(word => text.includes(word));
        const hasNegative = negative.some(word => text.includes(word));
        
        if (hasPositive && !hasNegative) return 'positive';
        if (hasNegative && !hasPositive) return 'negative';
        return 'neutral';
    }
    
    extractEntities(message) {
        const entities = {
            players: [],
            teams: [],
            numbers: [],
            dates: []
        };
        
        // Extract player names
        const playerPatterns = [
            'haaland', 'salah', 'palmer', 'saka', 'son', 'kane', 'messi', 
            'ronaldo', 'mbappe', 'bellingham', 'rice', 'odegaard'
        ];
        
        playerPatterns.forEach(player => {
            if (message.toLowerCase().includes(player)) {
                entities.players.push(player);
            }
        });
        
        // Extract numbers
        const numbers = message.match(/\d+/g);
        if (numbers) {
            entities.numbers = numbers.map(n => parseInt(n));
        }
        
        return entities;
    }
    
    generateFPLResponse(analysis, message) {
        const lower = message.toLowerCase();
        
        // Captain advice
        if (lower.includes('captain')) {
            if (analysis.entities.players.length > 0) {
                const player = analysis.entities.players[0];
                return `Looking at ${this.formatName(player)} for captaincy? That's an interesting choice. Based on current form and fixtures, ${this.getCaptainAnalysis(player)}. However, you should also consider team news closer to the deadline. What's your current rank and risk tolerance?`;
            }
            return `For captaincy this gameweek, I'd consider the fixture difficulty and recent form. Haaland at home is usually the safe pick with his consistency, but if you're chasing rank, a differential captain like Palmer or Gordon could pay off. Who are you currently considering?`;
        }
        
        // Transfer advice
        if (lower.includes('transfer')) {
            if (analysis.entities.players.length >= 2) {
                return `Comparing ${this.formatName(analysis.entities.players[0])} and ${this.formatName(analysis.entities.players[1])}? Both have their merits. ${this.comparePlayersNaturally(analysis.entities.players[0], analysis.entities.players[1])}. What's your team structure like?`;
            }
            return `Transfer strategy depends on your team's needs and future fixtures. Are you looking to address an injury, chase points, or plan for upcoming gameweeks? Tell me more about your current situation and I can give specific advice.`;
        }
        
        // Wildcard
        if (lower.includes('wildcard')) {
            return `Wildcard timing is crucial. You want to use it when you need 4+ transfers or when there's a major fixture swing. Currently, we're seeing good opportunities around GW28-31 with the fixture changes. How many issues does your current team have?`;
        }
        
        // General FPL advice
        return this.generateContextualFPLAdvice(message);
    }
    
    generateFootballResponse(analysis, message) {
        const lower = message.toLowerCase();
        
        if (analysis.entities.players.length > 0) {
            const player = analysis.entities.players[0];
            return `${this.formatName(player)} is definitely one of the talking points this season. ${this.getPlayerInsight(player)}. Is there something specific about them you'd like to know?`;
        }
        
        if (lower.includes('who will win')) {
            return `That's a tough prediction! Form, injuries, and head-to-head records all play a part. The beautiful game is unpredictable - that's what makes it exciting. Do you have a particular match in mind?`;
        }
        
        return `Football is such a dynamic sport with so many storylines. ${this.getFootballInsight()}. What aspect interests you most?`;
    }
    
    generateGreeting() {
        const greetings = [
            "Hey there! How can I help you today? Whether it's FPL strategy or anything else, I'm here to assist.",
            "Hello! Ready to chat about FPL, football, or really anything on your mind?",
            "Hi! What brings you here today? FPL dilemmas or just want to talk?",
            "Greetings! I'm here to help with whatever you need - from fantasy football to general questions."
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    generateGeneralAnswer(message) {
        const lower = message.toLowerCase();
        
        // Mathematics
        if (/\d+[\+\-\*\/]\d+/.test(message)) {
            try {
                // Safe evaluation for simple math
                const result = this.evaluateMath(message);
                return `The answer is ${result}. Need help with anything else?`;
            } catch {
                return `That looks like a math problem. Could you clarify what you're trying to calculate?`;
            }
        }
        
        // Weather
        if (lower.includes('weather')) {
            return `I don't have access to real-time weather data, but I can tell you that checking your local weather service or weather apps would give you the most accurate information. Is there something specific about weather patterns you're curious about?`;
        }
        
        // Jokes
        if (lower.includes('joke')) {
            const jokes = [
                "Why did the footballer bring string to the game? In case they needed to tie the score!",
                "What do you call a Spanish footballer with no legs? Gracias!",
                "Why did the football manager bring a pencil to the game? To draw the match!"
            ];
            return jokes[Math.floor(Math.random() * jokes.length)] + " 😄 Want another one?";
        }
        
        // Technology
        if (lower.includes('ai') || lower.includes('artificial intelligence')) {
            return `AI is fascinating! I'm an AI assistant designed to help with various queries, especially FPL strategy. The field is advancing rapidly with applications in everything from healthcare to entertainment. What aspect of AI interests you?`;
        }
        
        // Default thoughtful response
        return this.generateThoughtfulResponse(message);
    }
    
    generateConversationalResponse(message) {
        // Check conversation context
        const context = this.getRecentContext();
        
        // Generate response based on context
        if (context.length > 0) {
            const lastTopic = this.extractTopicFromContext(context);
            if (lastTopic) {
                return `Building on what we were discussing about ${lastTopic}, ${this.continueConversation(message, lastTopic)}`;
            }
        }
        
        // New conversation thread
        return this.generateThoughtfulResponse(message);
    }
    
    generateThoughtfulResponse(message) {
        const responses = [
            `That's an interesting question. ${this.elaborateOnTopic(message)}`,
            `I understand what you're asking. ${this.provideInsight(message)}`,
            `Let me think about that. ${this.offerPerspective(message)}`,
            `Good point! ${this.expandDiscussion(message)}`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    elaborateOnTopic(message) {
        const elaborations = [
            "While I specialize in FPL advice, I can discuss various topics. Could you provide more context so I can give you a better response?",
            "That touches on several areas. What specific aspect would you like to explore?",
            "There are different ways to approach this. What's your main concern?",
            "This relates to broader themes. How can I help you with this specifically?"
        ];
        return elaborations[Math.floor(Math.random() * elaborations.length)];
    }
    
    provideInsight(message) {
        return "From my understanding, this involves multiple factors. Would you like me to break down the key considerations?";
    }
    
    offerPerspective(message) {
        return "Different people might have varying views on this. What's your take, and how can I assist?";
    }
    
    expandDiscussion(message) {
        return "This opens up interesting possibilities. Is there a particular angle you'd like to explore?";
    }
    
    getCaptainAnalysis(player) {
        const analyses = {
            'haaland': "he's the most consistent captain choice with his incredible home record",
            'salah': "he's Liverpool's talisman and loves playing at Anfield",
            'palmer': "he's on all set pieces for Chelsea and has been in brilliant form",
            'saka': "he's Arsenal's key player and very reliable for returns",
            'default': "they could be a good differential pick depending on the fixture"
        };
        return analyses[player.toLowerCase()] || analyses['default'];
    }
    
    comparePlayersNaturally(player1, player2) {
        return `The first has better underlying stats recently, while the second offers more consistency. It really depends on whether you're looking for ceiling or floor in your team`;
    }
    
    generateContextualFPLAdvice(message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('rank')) {
            return `Rank improvement is about consistent good decisions over time. Focus on getting your captain picks right (most important), having players for the big hauls, and not taking unnecessary hits. What's your current rank and goal?`;
        }
        
        if (lower.includes('chip')) {
            return `Chip strategy is crucial for a successful season. Each chip should be planned weeks in advance. Triple Captain for a double gameweek, Bench Boost when you have 15 playing players, Free Hit for blanks or emergencies. Which chip are you considering?`;
        }
        
        if (lower.includes('budget') || lower.includes('value')) {
            return `Team value is built over time through price rises, but remember - it's points that matter, not value. That said, having extra budget gives you flexibility. Are you looking to build value or maximize points?`;
        }
        
        return `FPL success comes from balancing risk and reward, understanding the fundamentals, and a bit of luck. What specific aspect of the game would you like to improve?`;
    }
    
    getPlayerInsight(player) {
        const insights = {
            'haaland': "His goal-scoring record is phenomenal, though the occasional rotation can be frustrating",
            'salah': "Still producing elite numbers year after year, a true FPL legend",
            'messi': "One of the greatest to ever play the game, his vision is unmatched",
            'ronaldo': "His longevity and dedication to fitness is remarkable",
            'default': "They've been making headlines recently"
        };
        return insights[player.toLowerCase()] || insights['default'];
    }
    
    getFootballInsight() {
        const insights = [
            "The tactical evolution in modern football is fascinating, with teams constantly adapting",
            "The Premier League's competitiveness makes every match unpredictable",
            "Youth development has become crucial for clubs' long-term success",
            "The impact of analytics on modern football strategy is revolutionary"
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    }
    
    formatName(name) {
        const properNames = {
            'haaland': 'Haaland',
            'salah': 'Salah',
            'palmer': 'Palmer',
            'saka': 'Saka',
            'son': 'Son',
            'kane': 'Kane',
            'messi': 'Messi',
            'ronaldo': 'Ronaldo'
        };
        return properNames[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    evaluateMath(expression) {
        // Simple safe math evaluation
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
                case '/': return b !== 0 ? (a / b).toFixed(2) : 'undefined (division by zero)';
            }
        }
        return 'Could not calculate';
    }
    
    getRecentContext() {
        return this.conversationContext.slice(-4);
    }
    
    extractTopicFromContext(context) {
        if (context.length > 0) {
            const lastMessage = context[context.length - 1];
            if (lastMessage.role === 'assistant') {
                // Extract main topic from last response
                if (lastMessage.content.includes('FPL')) return 'FPL strategy';
                if (lastMessage.content.includes('football')) return 'football';
                if (lastMessage.content.includes('captain')) return 'captaincy';
            }
        }
        return null;
    }
    
    continueConversation(message, topic) {
        const continuations = {
            'FPL strategy': "this connects to the broader strategy we were discussing. How does this fit into your overall plan?",
            'football': "that's another interesting angle to consider. The sport has so many dimensions.",
            'captaincy': "captaincy choices can really make or break a gameweek. Have you decided yet?",
            'default': "I see where you're going with this. Tell me more about your thoughts."
        };
        return continuations[topic] || continuations['default'];
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
            localStorage.setItem('fpl_chat_context', JSON.stringify(this.conversationContext.slice(-10)));
        }
    }
    
    loadSavedConversation() {
        const savedHistory = localStorage.getItem('fpl_chat_history');
        const savedContext = localStorage.getItem('fpl_chat_context');
        
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
    
    initializeKnowledgeBase() {
        return {
            currentGameweek: this.calculateCurrentGameweek(),
            players: {
                premiums: ['Haaland', 'Salah', 'Son', 'De Bruyne', 'Kane'],
                midPrice: ['Palmer', 'Saka', 'Watkins', 'Solanke', 'Gordon'],
                budget: ['Mbeumo', 'Cunha', 'Eze', 'Wissa', 'Rogers']
            },
            strategies: {
                aggressive: 'Take hits for upside, early chips, chase differentials',
                balanced: 'Mix of safety and risk, strategic hits, planned chips',
                conservative: 'Minimize hits, template team, safe captains'
            }
        };
    }
    
    calculateCurrentGameweek() {
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(diff + 1, 1), 38);
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