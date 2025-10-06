// Enhanced FPL AI Assistant with Real ChatGPT Integration
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationHistory = []; // For GPT context
        this.apiEndpoint = this.getApiEndpoint();
        this.initializeAssistant();
        this.loadSavedConversation();
        this.checkAPIHealth();
    }
    
    getApiEndpoint() {
        // Check if we're in development or production
        const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1';
        
        // You can configure these endpoints
        return isDevelopment 
            ? 'http://localhost:3001/api/chat'  // Local development
            : 'https://your-api-server.com/api/chat'; // Production server
    }
    
    async checkAPIHealth() {
        try {
            const healthEndpoint = this.apiEndpoint.replace('/chat', '/health');
            const response = await fetch(healthEndpoint);
            const data = await response.json();
            
            if (data.status === 'OK') {
                console.log('API Server connected successfully');
                if (!data.apiConfigured) {
                    console.warn('OpenAI API key not configured - running in fallback mode');
                }
            }
        } catch (error) {
            console.warn('API Server not available - running in standalone mode');
        }
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
            { text: "Who should I captain this week?", icon: "⚡" },
            { text: "Best transfers for GW20?", icon: "🔄" },
            { text: "Should I wildcard?", icon: "🎯" },
            { text: "Differential picks under 5%", icon: "💎" }
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
                "👋 Welcome! I'm powered by ChatGPT and specialized in Fantasy Premier League. I can help with captain picks, transfers, wildcard timing, differentials, and any other FPL or general questions. What would you like to know?",
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
        this.conversationHistory.push({ role: 'user', content: message });
        
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
            const fallbackResponse = this.generateFallbackResponse(message);
            this.typeResponse(fallbackResponse);
        }
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async getAIResponse(message) {
        try {
            // Try to use the API proxy server first
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.conversationHistory.slice(-10) // Last 10 messages for context
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            return data.response;
            
        } catch (error) {
            console.error('API Error:', error);
            // Fall back to client-side response generation
            return this.generateFallbackResponse(message);
        }
    }
    
    generateFallbackResponse(message) {
        const lower = message.toLowerCase();
        
        // Enhanced FPL responses when API is not available
        if (this.isFPLQuery(lower)) {
            return this.generateFPLResponse(message);
        }
        
        // General conversational responses
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            return "Hello! I'm your FPL assistant. While I'm currently running without full ChatGPT integration, I can still help with FPL strategy. What would you like to know about?";
        }
        
        if (lower.includes('how are you')) {
            return "I'm doing well, thank you! Ready to help with your FPL decisions. Are you looking for captain advice, transfer suggestions, or something else?";
        }
        
        if (lower.includes('thank')) {
            return "You're welcome! Feel free to ask anything else about FPL or general topics.";
        }
        
        // Math calculations
        if (/\d+[\+\-\*\/]\d+/.test(message)) {
            try {
                const result = this.evaluateSimpleMath(message);
                return `The answer is ${result}. Need help with anything else?`;
            } catch {
                return "I can help with calculations, but that expression seems complex. Could you clarify?";
            }
        }
        
        // Default response
        return `I understand you're asking about "${message}". While I'm optimized for FPL advice, I can discuss various topics. For the best experience with general questions, make sure the API server is running. What specific aspect would you like to explore?`;
    }
    
    isFPLQuery(text) {
        const fplKeywords = [
            'captain', 'transfer', 'wildcard', 'bench boost', 'triple captain',
            'free hit', 'chip', 'gameweek', 'gw', 'points', 'team', 'squad',
            'differential', 'template', 'rank', 'mini-league', 'fixture',
            'clean sheet', 'assist', 'goal', 'price', 'value', 'budget',
            'formation', 'defender', 'midfielder', 'forward', 'goalkeeper',
            'fpl', 'fantasy', 'premier league'
        ];
        
        return fplKeywords.some(keyword => text.includes(keyword));
    }
    
    generateFPLResponse(message) {
        const lower = message.toLowerCase();
        const currentGW = this.getCurrentGameweek();
        
        if (lower.includes('captain')) {
            const players = this.extractPlayers(message);
            if (players.length > 0) {
                return `Looking at ${players[0]} for captaincy? Let me analyze that choice:

Based on current form and fixtures, here's my assessment:
• Recent form: Check their last 5 gameweek returns
• Fixture difficulty: Home games generally offer 20% better returns
• Team news: Wait for press conferences before deadline
• Ownership: Consider if you need a differential

For GW${currentGW}, the safe picks are usually Haaland (home) or Salah (consistent). But if you're chasing rank, a differential captain could pay off.

What's your current rank and risk tolerance?`;
            }
            
            return `Captain selection for GW${currentGW}:

**Safe Picks:**
• Haaland - Most consistent, especially at home
• Salah - Liverpool's talisman, great record

**Differential Options:**
• Palmer - On all set pieces for Chelsea
• Saka - Arsenal's key player
• Gordon - Newcastle's form player

Consider: fixture difficulty, team form, and your rank situation. Are you protecting a lead or chasing?`;
        }
        
        if (lower.includes('transfer')) {
            return `Transfer strategy for GW${currentGW}:

**Priority Checklist:**
1. Remove injured/suspended players first
2. Target players with good fixture runs (next 4-6 GWs)
3. Consider form over fixtures for in-form players
4. Don't chase last week's points

**Current Hot Picks:**
• Budget: Mbeumo, Cunha, Rogers
• Mid-price: Gordon, Watkins, Solanke
• Premium: Salah, Haaland (essential)

Are you looking to fix a specific issue or planning ahead? What's your team value and FT situation?`;
        }
        
        if (lower.includes('wildcard')) {
            return `Wildcard Assessment for GW${currentGW}:

**Should you wildcard? Check if you have:**
✓ 3+ injuries or long-term absentees
✓ 5+ players with poor fixtures
✓ Team value dropping significantly
✓ Major template shifts you've missed

**Optimal Wildcard Structure:**
• GK: One premium (5.5m+), one 4.0m
• DEF: 2 premiums, 3 rotation options
• MID: 2-3 premiums, good enablers
• FWD: Haaland + 2 mid-price

**Best Wildcard Windows:**
• GW9-12: International break
• GW28-31: Fixture swings
• GW35-38: Final push with doubles

How many transfers would you need to make without wildcarding?`;
        }
        
        if (lower.includes('differential')) {
            return `Differential Picks for GW${currentGW} (Under 10% ownership):

**Hidden Gems:**
• Matheus Cunha (6.5m, 3.2%) - Wolves' talisman
• Bryan Mbeumo (7.3m, 6.8%) - Penalties + form
• Eberechi Eze (6.8m, 5.1%) - Palace's creator
• Morgan Gibbs-White (6.5m, 2.9%) - Forest's key player

**Why They Matter:**
• Can provide massive rank jumps
• Low ownership = unique advantage
• Essential for top 10k pushes

Risk Level: Medium-High
Recommended allocation: 2-3 differentials maximum

What's your current rank? This affects how aggressive you should be with differentials.`;
        }
        
        // Default FPL response
        return `I can help with all aspects of FPL strategy for GW${currentGW}:

• **Captaincy:** Safe vs differential picks
• **Transfers:** Buy/sell recommendations
• **Chips:** Optimal timing and strategy
• **Team structure:** Formation and balance
• **Mini-leagues:** Catching rivals
• **Price changes:** Tonight's predictions

What specific area would you like to focus on? Share your team or situation for personalized advice.`;
    }
    
    extractPlayers(message) {
        const players = [];
        const playerNames = [
            'haaland', 'salah', 'palmer', 'saka', 'son', 'gordon',
            'watkins', 'solanke', 'martinelli', 'odegaard', 'foden'
        ];
        
        const lower = message.toLowerCase();
        playerNames.forEach(player => {
            if (lower.includes(player)) {
                players.push(player.charAt(0).toUpperCase() + player.slice(1));
            }
        });
        
        return players;
    }
    
    evaluateSimpleMath(expression) {
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
                <div class="powered-by">Powered by ChatGPT</div>
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
        
        // Format response with Markdown support
        const formattedResponse = this.formatMarkdown(response);
        
        msgDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
                <span class="ai-status-dot"></span>
            </div>
            <div class="message-content">
                <div class="message-text" id="typing-text"></div>
                <span class="message-time">${this.getCurrentTime()}</span>
                <div class="powered-by">Powered by ChatGPT</div>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        
        // Type out the response
        const textElement = msgDiv.querySelector('#typing-text');
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < formattedResponse.length) {
                textElement.innerHTML = formattedResponse.substring(0, index + 1);
                index += 2; // Type faster
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } else {
                clearInterval(typeInterval);
                this.messageHistory.push({ type: 'ai', message: response });
                this.conversationHistory.push({ role: 'assistant', content: response });
                
                // Keep conversation history manageable
                if (this.conversationHistory.length > 20) {
                    this.conversationHistory = this.conversationHistory.slice(-20);
                }
                
                this.saveConversation();
            }
        }, 15);
    }
    
    formatMarkdown(text) {
        // Basic markdown formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^• /gm, '• ')
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
    
    getCurrentGameweek() {
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const diff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(diff + 1, 1), 38);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    saveConversation() {
        if (this.messageHistory.length > 0) {
            localStorage.setItem('fpl_chat_history', JSON.stringify(this.messageHistory.slice(-50)));
            localStorage.setItem('fpl_conversation_context', JSON.stringify(this.conversationHistory.slice(-20)));
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
                this.conversationHistory = JSON.parse(savedContext);
            } catch (e) {
                console.error('Could not load saved context');
            }
        }
    }
}

// Add styles for powered-by badge
const style = document.createElement('style');
style.textContent = `
    .powered-by {
        font-size: 10px;
        color: #888;
        margin-top: 4px;
        opacity: 0.7;
    }
    
    .ai-message:hover .powered-by {
        opacity: 1;
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