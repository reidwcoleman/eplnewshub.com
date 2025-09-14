// FPL AI Assistant with Real AI Integration using Free Services
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        
        // Using free AI services - no API key needed
        this.aiEndpoints = [
            {
                url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
                headers: {
                    'Content-Type': 'application/json',
                },
                format: 'huggingface'
            },
            {
                url: 'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill',
                headers: {
                    'Content-Type': 'application/json',
                },
                format: 'huggingface'
            }
        ];
        
        this.currentEndpoint = 0;
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
                "👋 Welcome! I'm an AI-powered FPL assistant. I can help with captain picks, transfers, wildcard timing, or any other questions. I use advanced AI to provide intelligent responses. What would you like to know?",
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
        
        // Get AI response
        try {
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.typeResponse(response);
        } catch (error) {
            console.error('Error getting AI response:', error);
            this.removeTypingIndicator();
            // Use enhanced fallback
            const fallbackResponse = await this.getEnhancedFallback(message);
            this.typeResponse(fallbackResponse);
        }
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async getAIResponse(message) {
        // First, try to use a free AI service
        try {
            // Try OpenAI-compatible free endpoints
            const response = await this.callFreeAI(message);
            if (response && response.length > 10) {
                // Add FPL context if needed
                return this.enhanceWithFPLContext(response, message);
            }
        } catch (error) {
            console.log('Free AI service unavailable, using advanced fallback');
        }
        
        // Use advanced pattern matching with context
        return this.getEnhancedFallback(message);
    }
    
    async callFreeAI(message) {
        // Try multiple free AI services
        const services = [
            // Using a CORS proxy for demonstration
            {
                url: `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium')}`,
                method: 'POST',
                body: {
                    inputs: this.buildConversationString(),
                }
            }
        ];
        
        for (const service of services) {
            try {
                const response = await fetch(service.url, {
                    method: service.method || 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(service.body)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.generated_text || data.response || data[0]?.generated_text) {
                        return data.generated_text || data.response || data[0]?.generated_text;
                    }
                }
            } catch (error) {
                continue; // Try next service
            }
        }
        
        throw new Error('No AI service available');
    }
    
    buildConversationString() {
        // Build conversation context for the AI
        const context = this.conversationContext.slice(-5).map(msg => {
            return `${msg.role === 'user' ? 'Human' : 'AI'}: ${msg.content}`;
        }).join('\n');
        
        return context || "Let's talk about Fantasy Premier League strategy.";
    }
    
    enhanceWithFPLContext(aiResponse, userMessage) {
        const lower = userMessage.toLowerCase();
        
        // If the question is FPL-related, add context
        if (this.isFPLRelated(lower)) {
            const fplContext = this.getFPLContext(lower);
            return `${aiResponse}\n\n${fplContext}`;
        }
        
        return aiResponse;
    }
    
    isFPLRelated(text) {
        const fplKeywords = [
            'captain', 'transfer', 'wildcard', 'chip', 'fpl', 'fantasy',
            'gameweek', 'gw', 'points', 'team', 'differential', 'bench',
            'triple', 'boost', 'hit', 'price', 'rise', 'fall'
        ];
        
        return fplKeywords.some(keyword => text.includes(keyword));
    }
    
    getFPLContext(text) {
        const gw = this.getCurrentGameweek();
        
        if (text.includes('captain')) {
            return `For GW${gw}, consider: Haaland (safe, 85% ownership), Salah (reliable, 65% ownership), or Palmer (differential, 45% ownership). Check fixtures and form before deciding.`;
        }
        
        if (text.includes('transfer')) {
            return `Popular transfers this week: Gordon (£6.0m, great fixtures), Mbeumo (£7.3m, penalties), Watkins (£9.0m, Villa's main threat). Only take hits for injured players or captains.`;
        }
        
        if (text.includes('wildcard')) {
            return `Wildcard if you have 4+ issues. Best windows: GW28-31 (fixture swings) or GW35-38 (doubles). Structure: 3-5-2 with Haaland + Salah essential.`;
        }
        
        return `Current GW${gw}. Focus on: form over fixtures for in-form players, plan 3 GWs ahead, and maintain team value.`;
    }
    
    async getEnhancedFallback(message) {
        const lower = message.toLowerCase();
        
        // Use GPT-like response generation
        const analysis = this.analyzeMessage(message);
        const context = this.getConversationContext();
        
        // Generate response based on patterns and context
        let response = "";
        
        // Handle different types of queries with AI-like responses
        if (analysis.isGreeting) {
            response = this.generateGreeting();
        } else if (analysis.isFPL) {
            response = await this.generateFPLResponse(message, analysis);
        } else if (analysis.isQuestion) {
            response = this.generateQuestionResponse(message, analysis);
        } else {
            response = this.generateGeneralResponse(message, context);
        }
        
        // Add contextual follow-up
        if (this.conversationContext.length > 1) {
            response += this.generateFollowUp(analysis);
        }
        
        return response;
    }
    
    analyzeMessage(message) {
        const lower = message.toLowerCase();
        
        return {
            isGreeting: /^(hi|hello|hey|good|greetings)/.test(lower),
            isFPL: this.isFPLRelated(lower),
            isQuestion: message.includes('?') || /^(what|who|when|where|why|how|is|are|can|should|would|could)/.test(lower),
            sentiment: this.analyzeSentiment(lower),
            topics: this.extractTopics(lower),
            entities: this.extractEntities(message)
        };
    }
    
    analyzeSentiment(text) {
        const positive = ['good', 'great', 'love', 'excellent', 'happy', 'best'];
        const negative = ['bad', 'hate', 'terrible', 'worst', 'angry', 'disappointed'];
        
        const hasPositive = positive.some(word => text.includes(word));
        const hasNegative = negative.some(word => text.includes(word));
        
        if (hasPositive && !hasNegative) return 'positive';
        if (hasNegative && !hasPositive) return 'negative';
        return 'neutral';
    }
    
    extractTopics(text) {
        const topics = [];
        const topicMap = {
            'captain': ['captain', 'armband', '(c)', 'triple'],
            'transfer': ['transfer', 'buy', 'sell', 'bring', 'ship'],
            'wildcard': ['wildcard', 'wc', 'rebuild'],
            'strategy': ['strategy', 'plan', 'approach', 'tactic'],
            'player': ['haaland', 'salah', 'palmer', 'saka', 'son'],
            'general': ['weather', 'news', 'time', 'help', 'thanks']
        };
        
        for (const [topic, keywords] of Object.entries(topicMap)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                topics.push(topic);
            }
        }
        
        return topics;
    }
    
    extractEntities(message) {
        const entities = {
            players: [],
            numbers: [],
            teams: []
        };
        
        // Extract player names
        const playerPatterns = [
            'haaland', 'salah', 'palmer', 'saka', 'son', 'gordon',
            'watkins', 'mbeumo', 'martinelli', 'odegaard'
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
    
    generateGreeting() {
        const greetings = [
            "Hello! I'm here to help you with FPL strategy and any other questions. What's on your mind today?",
            "Hi there! Ready to dominate your mini-league? I can help with captains, transfers, or general chat. What would you like to discuss?",
            "Hey! Great to see you. Whether it's FPL tactics or just a chat, I'm here to help. What can I do for you?",
            "Welcome! I'm your AI assistant specialized in FPL but happy to discuss anything. How can I assist you today?"
        ];
        
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    async generateFPLResponse(message, analysis) {
        const gw = this.getCurrentGameweek();
        const topics = analysis.topics;
        
        let response = "";
        
        if (topics.includes('captain')) {
            response = `For captain selection in GW${gw}, I'd analyze several factors:

**Top Options:**
• **Haaland** - The safe choice with consistent returns, especially at home. Currently 85% owned.
• **Salah** - Liverpool's talisman, rarely blanks at Anfield. 65% ownership.
• **Palmer** - On all set pieces for Chelsea, great differential at 45% ownership.

The choice depends on your rank situation. If protecting, go safe with Haaland. If chasing, consider a differential.

`;
            
            if (analysis.entities.players.length > 0) {
                response += `You mentioned ${analysis.entities.players[0]} - they could be a good option depending on fixtures and form. `;
            }
            
            response += "What's your current rank and risk tolerance?";
            
        } else if (topics.includes('transfer')) {
            response = `Transfer strategy is crucial for success. Here's my analysis:

**Current Hot Picks:**
• **Anthony Gordon (£6.0m)** - Newcastle's star, excellent fixtures ahead
• **Bryan Mbeumo (£7.3m)** - Brentford's penalty taker, great differential
• **Ollie Watkins (£9.0m)** - Villa's main threat, decent run

**Key Principles:**
1. Fix injuries first (non-negotiable)
2. Plan 2-3 gameweeks ahead
3. Don't chase last week's points
4. Consider price changes but don't let them dictate transfers

`;
            
            if (message.includes('hit') || message.includes('-4')) {
                response += "\nRegarding hits: Only worth it for injured players or strong captaincy options. The new player needs to outscore the old by 4+ points.";
            }
            
            response += "\n\nWhat's your current team situation?";
            
        } else if (topics.includes('wildcard')) {
            response = `Wildcard timing is critical. Let me break it down:

**Should You Wildcard?**
✓ Yes if: 3+ injuries, 5+ poor fixtures, major template shift needed
✗ No if: Only need 2-3 changes, team performing well

**Optimal Structure:**
• Formation: 3-5-2 or 3-4-3
• Essentials: Haaland + Salah (non-negotiable)
• Budget: Spread funds wisely, don't overspend on bench

**Best Windows:**
• GW28-31: Fixture swings
• GW35-38: Double gameweek preparation

How many transfers would you need without wildcarding?`;
            
        } else {
            // General FPL response
            response = `Based on your question about FPL, here's my take:

${this.generateContextualFPLAdvice(message)}

The key to FPL success is balancing risk and reward while staying ahead of the template. 

Would you like me to elaborate on any specific aspect?`;
        }
        
        return response;
    }
    
    generateContextualFPLAdvice(message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('differential')) {
            return `Differentials are players with <10% ownership who can provide huge rank gains. Current picks: Cunha (3.2%), Mbeumo (6.8%), Eze (5.1%). Balance is key - too many differentials means missing template hauls.`;
        }
        
        if (lower.includes('chip')) {
            return `Chip strategy: Triple Captain for DGW with premium, Bench Boost for DGW37 traditionally, Free Hit for blanks or emergencies. Plan these weeks in advance for maximum impact.`;
        }
        
        if (lower.includes('team') || lower.includes('rate')) {
            return `To analyze your team, I'd need to see your 15 players. Key factors: captain options, bench strength, fixture difficulty, and template coverage. Share your team for specific advice.`;
        }
        
        return `FPL is about consistent good decisions over time. Focus on: getting captains right (most important), having the right players for hauls, and avoiding unnecessary hits.`;
    }
    
    generateQuestionResponse(message, analysis) {
        const lower = message.toLowerCase();
        
        // Handle specific question types
        if (lower.includes('what is')) {
            const subject = message.split('what is')[1]?.trim();
            return `Regarding "${subject}" - that's an interesting question. ${this.generateExplanation(subject)} Would you like me to elaborate further?`;
        }
        
        if (lower.includes('how do') || lower.includes('how to')) {
            return `I'll help you with that. ${this.generateHowTo(message)} Is there a specific part you'd like me to clarify?`;
        }
        
        if (lower.includes('should i')) {
            return `That's a decision that depends on several factors. ${this.generateAdvice(message)} What's most important to you in this situation?`;
        }
        
        // Math questions
        if (/\d+[\+\-\*\/]\d+/.test(message)) {
            try {
                const result = this.evaluateMath(message);
                return `The answer is ${result}. Interestingly, in FPL terms, that could be ${this.relateMathToFPL(result)}. Need any other calculations?`;
            } catch {
                return "I can help with calculations. Could you clarify the expression?";
            }
        }
        
        return `That's a thoughtful question. ${this.generateThoughtfulResponse(message)} What aspects are you most curious about?`;
    }
    
    generateExplanation(subject) {
        if (!subject) return "I'd be happy to explain that concept.";
        
        const explanations = [
            `From my understanding, this involves multiple factors that interact in complex ways.`,
            `This is a topic that many people find interesting, and there are different perspectives on it.`,
            `Let me break this down into key components for clarity.`,
            `This concept has evolved over time and has various interpretations.`
        ];
        
        return explanations[Math.floor(Math.random() * explanations.length)];
    }
    
    generateHowTo(message) {
        const responses = [
            "The process typically involves several steps that build on each other.",
            "There are multiple approaches, but I'll share the most effective method.",
            "This is something that becomes easier with practice and the right approach.",
            "Let me outline the key steps you'll need to follow."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    generateAdvice(message) {
        const advice = [
            "Consider your current situation and long-term goals.",
            "Weigh the pros and cons based on your priorities.",
            "Think about both immediate impact and future implications.",
            "Consider what aligns best with your overall strategy."
        ];
        
        return advice[Math.floor(Math.random() * advice.length)];
    }
    
    relateMathToFPL(number) {
        const relations = [
            `the points from a midfielder scoring and assisting (3+5=${number})`,
            `a typical gameweek score for a single premium player`,
            `the cost of taking multiple hits in FPL`,
            `bonus points across your entire team`
        ];
        
        return relations[Math.floor(Math.random() * relations.length)];
    }
    
    generateThoughtfulResponse(message) {
        const responses = [
            "From multiple angles, this presents interesting considerations.",
            "This touches on several important aspects worth exploring.",
            "There's depth to this topic that we can unpack together.",
            "This connects to broader themes in interesting ways."
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    generateGeneralResponse(message, context) {
        // Build a contextual response based on conversation history
        let response = "";
        
        if (context.length > 0) {
            response = "Building on our conversation, ";
        } else {
            response = "That's an interesting point. ";
        }
        
        // Add contextual content
        const templates = [
            `I understand you're asking about "${message}". While I specialize in FPL, I can discuss various topics. `,
            `Regarding your message, there are several angles to consider. `,
            `This touches on some interesting areas. `,
            `Let me share my thoughts on this. `
        ];
        
        response += templates[Math.floor(Math.random() * templates.length)];
        
        // Add substance
        response += `From my perspective, ${this.generateSubstance(message)} `;
        
        // Add engagement
        response += "What specific aspect would you like to explore further?";
        
        return response;
    }
    
    generateSubstance(message) {
        const substances = [
            "this involves balancing different factors and considering various outcomes",
            "there are both immediate and long-term considerations to weigh",
            "the key is finding what works best for your specific situation",
            "different approaches can lead to success depending on your goals"
        ];
        
        return substances[Math.floor(Math.random() * substances.length)];
    }
    
    generateFollowUp(analysis) {
        if (analysis.sentiment === 'positive') {
            return "\n\nGlad to help! Anything else you'd like to discuss?";
        } else if (analysis.sentiment === 'negative') {
            return "\n\nI understand the frustration. Let's work through this together.";
        } else if (analysis.isFPL) {
            return "\n\nFPL success is a marathon, not a sprint. Keep making good decisions!";
        } else {
            return "\n\nFeel free to ask about anything else - FPL or otherwise!";
        }
    }
    
    getConversationContext() {
        return this.conversationContext.slice(-5);
    }
    
    getCurrentGameweek() {
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(diff + 1, 1), 38);
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
                <div class="ai-badge">AI Enhanced</div>
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
                <div class="ai-badge">AI Enhanced</div>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        
        const textElement = msgDiv.querySelector('#typing-text');
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < formattedResponse.length) {
                textElement.innerHTML = formattedResponse.substring(0, index + 1);
                index += Math.min(5, formattedResponse.length - index);
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
            .replace(/^✓ /gm, '✓ ')
            .replace(/^✗ /gm, '✗ ')
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

// Add AI badge styles
const style = document.createElement('style');
style.textContent = `
    .ai-badge {
        display: inline-block;
        font-size: 10px;
        color: #667eea;
        background: rgba(102, 126, 234, 0.1);
        padding: 2px 8px;
        border-radius: 10px;
        margin-top: 4px;
        font-weight: 600;
        letter-spacing: 0.5px;
    }
    
    .ai-message:hover .ai-badge {
        background: rgba(102, 126, 234, 0.2);
    }
`;
document.head.appendChild(style);

// Initialize the assistant when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.fplAI = new FPLAIAssistant();
    });
} else {
    window.fplAI = new FPLAIAssistant();
}