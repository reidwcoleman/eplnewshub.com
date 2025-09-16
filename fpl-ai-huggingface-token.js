// FPL AI Assistant - Hugging Face AI with Token Support
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        
        // IMPORTANT: Replace 'YOUR_HF_TOKEN_HERE' with your actual Hugging Face token
        // Get your token from: https://huggingface.co/settings/tokens
        this.hfToken = 'YOUR_HF_TOKEN_HERE'; // <-- ADD YOUR TOKEN HERE
        
        // With a token, you can use better models
        this.models = {
            // Premium models (require token)
            gpt2Large: 'gpt2-large',
            dialogptLarge: 'microsoft/DialoGPT-large',
            flanT5XL: 'google/flan-t5-xl',
            blenderbot: 'facebook/blenderbot-1B-distill',
            
            // Open models (work without token but better with)
            gpt2: 'gpt2',
            dialogptMedium: 'microsoft/DialoGPT-medium',
            flanT5Base: 'google/flan-t5-base'
        };
        
        this.initializeAssistant();
        this.loadSavedConversation();
        this.testHuggingFace();
    }
    
    async testHuggingFace() {
        console.log('Testing Hugging Face connection with token...');
        if (this.hfToken === 'YOUR_HF_TOKEN_HERE') {
            console.warn('⚠️ No Hugging Face token configured! Add your token to get better AI responses.');
            console.warn('Get your free token at: https://huggingface.co/settings/tokens');
        } else {
            console.log('✅ Hugging Face token configured!');
            try {
                const response = await this.callHuggingFaceWithToken('Hello, test message');
                console.log('✅ Hugging Face API working with token!');
            } catch (error) {
                console.error('❌ Token test failed:', error);
            }
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
            const tokenStatus = this.hfToken !== 'YOUR_HF_TOKEN_HERE' 
                ? '✅ Using Hugging Face API with token for premium AI responses!' 
                : '⚠️ Add your HF token for better responses (see console for instructions)';
                
            const welcomeMsg = this.createAIMessage(
                `👋 Welcome! I'm powered by Hugging Face AI models. ${tokenStatus}\n\nAsk me anything about FPL - captain picks, transfers, wildcards, or any general questions!`,
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
        let response = '';
        let isAIGenerated = false;
        
        try {
            console.log('Calling Hugging Face API...');
            response = await this.callHuggingFaceWithToken(message);
            isAIGenerated = true;
            console.log('✅ AI Response received:', response.substring(0, 100) + '...');
        } catch (error) {
            console.error('❌ Hugging Face error:', error);
            response = this.getMinimalFallback(message);
            isAIGenerated = false;
        }
        
        this.removeTypingIndicator();
        this.typeResponse(response, isAIGenerated);
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async callHuggingFaceWithToken(message) {
        const hasToken = this.hfToken && this.hfToken !== 'YOUR_HF_TOKEN_HERE';
        
        // Select models based on token availability
        const models = hasToken ? [
            // Better models with token
            {
                name: this.models.flanT5XL,
                type: 'text2text',
                prompt: this.buildT5Prompt(message)
            },
            {
                name: this.models.dialogptLarge,
                type: 'conversational',
                prompt: this.buildConversationContext(message)
            },
            {
                name: this.models.blenderbot,
                type: 'conversational',
                prompt: message
            }
        ] : [
            // Free models without token
            {
                name: this.models.flanT5Base,
                type: 'text2text',
                prompt: this.buildT5Prompt(message)
            },
            {
                name: this.models.dialogptMedium,
                type: 'conversational',
                prompt: this.buildConversationContext(message)
            }
        ];
        
        // Try each model
        for (const model of models) {
            try {
                const url = `https://api-inference.huggingface.co/models/${model.name}`;
                
                // Build headers with or without token
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (hasToken) {
                    headers['Authorization'] = `Bearer ${this.hfToken}`;
                }
                
                // Build request body based on model type
                let body;
                if (model.type === 'text2text') {
                    body = {
                        inputs: model.prompt,
                        parameters: {
                            max_length: 250,
                            temperature: 0.8,
                            top_p: 0.95,
                            do_sample: true
                        }
                    };
                } else {
                    body = {
                        inputs: model.prompt,
                        parameters: {
                            max_new_tokens: 200,
                            temperature: 0.8,
                            top_p: 0.9,
                            return_full_text: false,
                            repetition_penalty: 1.2
                        }
                    };
                }
                
                console.log(`Trying model: ${model.name}`);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('API Response:', data);
                    
                    // Extract generated text
                    let generatedText = '';
                    if (data.generated_text) {
                        generatedText = data.generated_text;
                    } else if (Array.isArray(data) && data[0]) {
                        generatedText = data[0].generated_text || data[0].translation_text || '';
                    }
                    
                    if (generatedText && generatedText.length > 10) {
                        // Clean up the response
                        generatedText = this.cleanResponse(generatedText, message);
                        
                        // Add FPL context if needed
                        if (this.isFPLQuestion(message)) {
                            generatedText = this.enhanceWithFPL(generatedText, message);
                        }
                        
                        return generatedText;
                    }
                } else if (response.status === 503) {
                    // Model is loading
                    console.log('Model loading, waiting 5 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Retry once
                    const retryResponse = await fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(body)
                    });
                    
                    if (retryResponse.ok) {
                        const data = await retryResponse.json();
                        let text = data.generated_text || data[0]?.generated_text || '';
                        if (text && text.length > 10) {
                            text = this.cleanResponse(text, message);
                            if (this.isFPLQuestion(message)) {
                                text = this.enhanceWithFPL(text, message);
                            }
                            return text;
                        }
                    }
                } else if (response.status === 401) {
                    console.error('Invalid token! Please check your Hugging Face token.');
                    throw new Error('Invalid token');
                }
            } catch (error) {
                console.log(`Model ${model.name} failed:`, error.message);
                continue;
            }
        }
        
        throw new Error('All models failed');
    }
    
    buildT5Prompt(message) {
        // T5 models work better with specific prompts
        const lower = message.toLowerCase();
        
        if (this.isFPLQuestion(message)) {
            return `Answer this Fantasy Premier League question: ${message}`;
        } else if (lower.includes('?')) {
            return `Question: ${message} Answer:`;
        } else {
            return `Respond to: ${message}`;
        }
    }
    
    buildConversationContext(message) {
        // Build context for conversational models
        let context = '';
        
        // Add FPL context
        const gw = this.getCurrentGameweek();
        context += `System: You are a helpful Fantasy Premier League assistant. Current gameweek is ${gw}.\n`;
        
        // Add recent conversation
        const recent = this.messageHistory.slice(-4);
        recent.forEach(msg => {
            if (msg.type === 'user') {
                context += `User: ${msg.message}\n`;
            } else {
                context += `Assistant: ${msg.message}\n`;
            }
        });
        
        // Add current message
        context += `User: ${message}\nAssistant:`;
        
        return context;
    }
    
    cleanResponse(text, originalMessage) {
        // Remove any repeated context or prompt from the response
        text = text.replace(originalMessage, '').trim();
        text = text.replace(/^(Assistant:|Bot:|A:)/i, '').trim();
        text = text.replace(/^(User:|Human:|Q:).*/i, '').trim();
        
        // Ensure response isn't empty
        if (!text || text.length < 5) {
            return "I understand your question. Let me help you with that.";
        }
        
        return text;
    }
    
    isFPLQuestion(message) {
        const lower = message.toLowerCase();
        const fplKeywords = [
            'captain', 'transfer', 'wildcard', 'fpl', 'fantasy',
            'gameweek', 'gw', 'chip', 'bench', 'triple', 'differential',
            'team', 'squad', 'player', 'points', 'rank', 'price',
            'haaland', 'salah', 'palmer'
        ];
        return fplKeywords.some(keyword => lower.includes(keyword));
    }
    
    enhanceWithFPL(aiResponse, originalMessage) {
        const lower = originalMessage.toLowerCase();
        let enhancement = '';
        
        // Add specific FPL data based on question type
        if (lower.includes('captain')) {
            enhancement = '\n\n📊 Current top captain picks: Haaland (85% EO), Salah (65% EO), Palmer (45% EO)';
        } else if (lower.includes('transfer')) {
            enhancement = '\n\n💡 Hot transfers: Gordon (£6.0m), Mbeumo (£7.3m), Watkins (£9.0m)';
        } else if (lower.includes('wildcard')) {
            enhancement = '\n\n🎯 Wildcard tip: 3-5-2 formation with Haaland + Salah essential';
        }
        
        return aiResponse + enhancement;
    }
    
    getMinimalFallback(message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('hello') || lower.includes('hi')) {
            return "Hello! The AI service is having issues. I can still help with FPL basics. What do you need?";
        }
        
        if (this.isFPLQuestion(message)) {
            return this.getBasicFPLAdvice(lower);
        }
        
        return "I'm having trouble connecting to the AI service. Please try again or ask about FPL strategy.";
    }
    
    getBasicFPLAdvice(query) {
        const gw = this.getCurrentGameweek();
        
        if (query.includes('captain')) {
            return `Captain picks for GW${gw}:\n• Haaland - Safe choice (85% owned)\n• Salah - Reliable (65% owned)\n• Palmer - Differential (45% owned)`;
        }
        if (query.includes('transfer')) {
            return 'Transfer targets:\n• Gordon (£6.0m) - Great fixtures\n• Mbeumo (£7.3m) - Penalties\n• Watkins (£9.0m) - Villa main threat';
        }
        if (query.includes('wildcard')) {
            return 'Wildcard strategy:\n• Use if 4+ changes needed\n• Structure: 3-5-2\n• Essentials: Haaland + Salah';
        }
        return 'FPL tip: Focus on form over fixtures, plan 3 GWs ahead.';
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
        const hasToken = this.hfToken && this.hfToken !== 'YOUR_HF_TOKEN_HERE';
        const badge = isAIGenerated 
            ? (hasToken ? 'HF Premium AI' : 'HF Free AI')
            : 'Fallback Mode';
        const badgeColor = isAIGenerated 
            ? (hasToken ? '#4CAF50' : '#2196F3')
            : '#FFC107';
        
        msgDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
                <span class="ai-status-dot" style="background: ${badgeColor}"></span>
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
            .replace(/•/g, '•')
            .replace(/📊/g, '📊')
            .replace(/💡/g, '💡')
            .replace(/🎯/g, '🎯');
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
        localStorage.setItem('fpl_conversation_context', JSON.stringify(this.conversationContext.slice(-20)));
    }
    
    loadSavedConversation() {
        try {
            const history = localStorage.getItem('fpl_chat_history');
            const context = localStorage.getItem('fpl_conversation_context');
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