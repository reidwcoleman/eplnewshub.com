// FPL AI Assistant - Fixed Hugging Face AI Integration
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        
        // Hugging Face configuration
        this.initializeAssistant();
        this.loadSavedConversation();
        this.testHuggingFace();
    }
    
    async testHuggingFace() {
        // Test the connection on load
        console.log('Testing Hugging Face connection...');
        try {
            const response = await this.callHuggingFaceDirectly('Hello, how are you?');
            console.log('Hugging Face test successful:', response);
        } catch (error) {
            console.log('Hugging Face test failed, but will retry on each message');
        }
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
                "👋 Welcome! I'm powered by Hugging Face AI models. Ask me anything about FPL - captain picks, transfers, wildcards, or any general questions. I generate unique responses using real AI!",
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
        
        // Clear input
        input.value = '';
        input.style.borderColor = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Get AI response - ALWAYS try Hugging Face first
        let response = '';
        let isAIGenerated = false;
        
        try {
            console.log('Calling Hugging Face for:', message);
            response = await this.callHuggingFaceDirectly(message);
            isAIGenerated = true;
            console.log('Hugging Face response received:', response);
        } catch (error) {
            console.error('Hugging Face error:', error);
            // Only use fallback if HF completely fails
            response = this.getMinimalFallback(message);
            isAIGenerated = false;
        }
        
        this.removeTypingIndicator();
        this.typeResponse(response, isAIGenerated);
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async callHuggingFaceDirectly(message) {
        // Try multiple Hugging Face models with proper API format
        const models = [
            {
                url: 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
                payload: {
                    inputs: this.buildConversationContext(message),
                    parameters: {
                        max_length: 200,
                        temperature: 0.8,
                        top_p: 0.9,
                        return_full_text: false
                    }
                }
            },
            {
                url: 'https://api-inference.huggingface.co/models/google/flan-t5-base',
                payload: {
                    inputs: `Answer this question: ${message}`,
                    parameters: {
                        max_length: 200,
                        temperature: 0.7
                    }
                }
            },
            {
                url: 'https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill',
                payload: {
                    inputs: message,
                    parameters: {
                        max_length: 200,
                        temperature: 0.8
                    }
                }
            }
        ];
        
        // Try each model until one works
        for (const model of models) {
            try {
                const response = await fetch(model.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // No auth needed for public models
                    },
                    body: JSON.stringify(model.payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('HF API Response:', data);
                    
                    // Extract the generated text
                    let generatedText = '';
                    
                    if (data.generated_text) {
                        generatedText = data.generated_text;
                    } else if (Array.isArray(data) && data[0]) {
                        generatedText = data[0].generated_text || data[0].translation_text || data[0].summary_text || '';
                    } else if (data.conversation) {
                        generatedText = data.conversation.generated_responses?.[0] || '';
                    }
                    
                    if (generatedText && generatedText.length > 10) {
                        // Add FPL context if it's an FPL question
                        if (this.isFPLQuestion(message)) {
                            generatedText = this.enhanceWithFPL(generatedText, message);
                        }
                        return generatedText;
                    }
                } else if (response.status === 503) {
                    // Model is loading, wait and retry
                    console.log('Model is loading, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    // Retry the same model
                    const retryResponse = await fetch(model.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(model.payload)
                    });
                    
                    if (retryResponse.ok) {
                        const data = await retryResponse.json();
                        let text = data.generated_text || data[0]?.generated_text || '';
                        if (text && text.length > 10) {
                            if (this.isFPLQuestion(message)) {
                                text = this.enhanceWithFPL(text, message);
                            }
                            return text;
                        }
                    }
                }
            } catch (error) {
                console.log(`Model ${model.url} failed:`, error.message);
                continue; // Try next model
            }
        }
        
        // If all models fail, throw error to trigger fallback
        throw new Error('All Hugging Face models failed');
    }
    
    buildConversationContext(message) {
        // Build proper context for conversational models
        let context = '';
        
        // Add recent conversation history
        const recentHistory = this.messageHistory.slice(-4);
        recentHistory.forEach(msg => {
            if (msg.type === 'user') {
                context += `User: ${msg.message}\n`;
            } else {
                context += `Bot: ${msg.message}\n`;
            }
        });
        
        // Add current message
        context += `User: ${message}\nBot:`;
        
        return context;
    }
    
    isFPLQuestion(message) {
        const lower = message.toLowerCase();
        const fplKeywords = [
            'captain', 'transfer', 'wildcard', 'fpl', 'fantasy',
            'gameweek', 'gw', 'chip', 'bench', 'triple', 'differential',
            'team', 'squad', 'player', 'points', 'rank', 'price'
        ];
        return fplKeywords.some(keyword => lower.includes(keyword));
    }
    
    enhanceWithFPL(aiResponse, originalMessage) {
        const lower = originalMessage.toLowerCase();
        let enhancement = '';
        
        // Add specific FPL context based on the question
        if (lower.includes('captain')) {
            enhancement = '\n\nFor captaincy: Consider Haaland (safe, 85% owned), Salah (reliable, 65% owned), or Palmer (differential, 45% owned).';
        } else if (lower.includes('transfer')) {
            enhancement = '\n\nTransfer targets: Gordon (£6.0m), Mbeumo (£7.3m), Watkins (£9.0m). Only take -4 for injured players or captains.';
        } else if (lower.includes('wildcard')) {
            enhancement = '\n\nWildcard if you have 4+ problems. Best structure: 3-5-2 with Haaland + Salah essential.';
        } else if (lower.includes('differential')) {
            enhancement = '\n\nDifferentials under 10%: Cunha (3.2%), Mbeumo (8%), Eze (5.1%). Balance with template players.';
        }
        
        return aiResponse + enhancement;
    }
    
    getMinimalFallback(message) {
        // Minimal fallback - only used if HF completely fails
        const lower = message.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi')) {
            return "Hello! I'm having trouble connecting to the AI service right now, but I can still help with FPL questions. What would you like to know?";
        }
        
        if (this.isFPLQuestion(message)) {
            return `I'm having connection issues with the AI service, but here's some quick FPL advice:\n\n` +
                   this.getQuickFPLAdvice(lower);
        }
        
        return "I'm having trouble connecting to the AI service at the moment. Please try again in a few seconds, or ask me about FPL strategy!";
    }
    
    getQuickFPLAdvice(query) {
        const gw = this.getCurrentGameweek();
        
        if (query.includes('captain')) {
            return `Captain picks for GW${gw}: Haaland (safe), Salah (reliable), Palmer (differential)`;
        }
        if (query.includes('transfer')) {
            return 'Hot transfers: Gordon, Mbeumo, Watkins. Fix injuries first!';
        }
        if (query.includes('wildcard')) {
            return 'Wildcard if 4+ changes needed. Structure: 3-5-2, Haaland + Salah essential';
        }
        return 'Focus on form over fixtures, plan 3 GWs ahead, avoid unnecessary hits.';
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
                <div class="ai-badge">Hugging Face AI</div>
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
    
    typeResponse(response, isAIGenerated = false) {
        const messagesDiv = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-message fade-in';
        
        const formattedResponse = this.formatResponse(response);
        const badge = isAIGenerated ? 'Hugging Face AI' : 'AI Assistant';
        const badgeColor = isAIGenerated ? 'linear-gradient(90deg, #FF6B6B, #FFD93D)' : 'linear-gradient(90deg, #667eea, #764ba2)';
        
        msgDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
                <span class="ai-status-dot" style="background: ${isAIGenerated ? '#4CAF50' : '#FFC107'}"></span>
            </div>
            <div class="message-content">
                <div class="message-text" id="typing-text"></div>
                <span class="message-time">${this.getCurrentTime()}</span>
                <div class="ai-badge" style="background: ${badgeColor}">${badge}</div>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        
        const textElement = msgDiv.querySelector('#typing-text');
        let index = 0;
        
        const typeInterval = setInterval(() => {
            if (index < formattedResponse.length) {
                textElement.innerHTML = formattedResponse.substring(0, Math.min(index + 5, formattedResponse.length));
                index += 5;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } else {
                clearInterval(typeInterval);
                this.messageHistory.push({ type: 'ai', message: response });
                this.saveConversation();
            }
        }, 15);
    }
    
    formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '•');
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
    }
    
    loadSavedConversation() {
        try {
            const history = localStorage.getItem('fpl_chat_history');
            if (history) this.messageHistory = JSON.parse(history);
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
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        margin-top: 4px;
        font-weight: 600;
    }
    
    .ai-status-dot {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: 2px solid white;
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