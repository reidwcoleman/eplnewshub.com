// FPL AI Assistant with Hugging Face AI Integration
class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        
        // Hugging Face configuration - using free inference API
        this.hfToken = null; // Optional - works without token but with rate limits
        this.modelEndpoint = 'https://api-inference.huggingface.co/models/';
        
        // Available free models on Hugging Face
        this.models = {
            conversational: 'microsoft/DialoGPT-large',
            qa: 'deepset/roberta-base-squad2',
            textGeneration: 'gpt2',
            flan: 'google/flan-t5-large'
        };
        
        this.currentModel = this.models.conversational;
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
                "👋 Welcome! I'm powered by Hugging Face AI. I can help with FPL strategy - captain picks, transfers, wildcards, and more. I also handle general questions. What would you like to know?",
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
        
        // Get AI response from Hugging Face
        try {
            const response = await this.getHuggingFaceResponse(message);
            this.removeTypingIndicator();
            this.typeResponse(response);
        } catch (error) {
            console.error('HF Error:', error);
            this.removeTypingIndicator();
            // Fallback to intelligent response
            const fallback = await this.generateIntelligentFallback(message);
            this.typeResponse(fallback);
        }
        
        // Scroll to bottom
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    async getHuggingFaceResponse(message) {
        // Build context-aware prompt
        const prompt = this.buildPrompt(message);
        
        // Try different Hugging Face models
        const models = [
            {
                name: 'microsoft/DialoGPT-large',
                type: 'conversational'
            },
            {
                name: 'google/flan-t5-large', 
                type: 'text2text'
            },
            {
                name: 'facebook/blenderbot-400M-distill',
                type: 'conversational'
            }
        ];
        
        for (const model of models) {
            try {
                const response = await this.callHuggingFaceAPI(model.name, prompt, model.type);
                if (response && response.length > 10) {
                    // Enhance with FPL context if needed
                    return this.enhanceWithFPLContext(response, message);
                }
            } catch (error) {
                console.log(`Model ${model.name} failed, trying next...`);
                continue;
            }
        }
        
        // If all models fail, use intelligent fallback
        throw new Error('All models failed');
    }
    
    async callHuggingFaceAPI(modelName, prompt, modelType) {
        const url = `${this.modelEndpoint}${modelName}`;
        
        // Prepare the request based on model type
        let requestBody;
        
        if (modelType === 'conversational') {
            // For conversational models
            requestBody = {
                inputs: {
                    past_user_inputs: this.conversationContext
                        .filter(m => m.role === 'user')
                        .slice(-3)
                        .map(m => m.content),
                    generated_responses: this.conversationContext
                        .filter(m => m.role === 'assistant')
                        .slice(-3)
                        .map(m => m.content),
                    text: prompt
                },
                parameters: {
                    max_length: 200,
                    temperature: 0.7,
                    top_p: 0.9,
                    repetition_penalty: 1.2
                }
            };
        } else if (modelType === 'text2text') {
            // For text-to-text models like Flan-T5
            requestBody = {
                inputs: prompt,
                parameters: {
                    max_length: 200,
                    temperature: 0.7,
                    top_k: 50,
                    do_sample: true
                }
            };
        } else {
            // Default text generation
            requestBody = {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 200,
                    temperature: 0.7,
                    return_full_text: false
                }
            };
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Optional: Add your HF token for higher rate limits
                // 'Authorization': 'Bearer YOUR_HF_TOKEN'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HF API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the generated text based on response format
        if (modelType === 'conversational' && data.generated_text) {
            return data.generated_text;
        } else if (Array.isArray(data) && data[0]) {
            return data[0].generated_text || data[0].translation_text || data[0].summary_text || JSON.stringify(data[0]);
        } else if (data.generated_text) {
            return data.generated_text;
        } else if (typeof data === 'string') {
            return data;
        }
        
        throw new Error('Unexpected response format');
    }
    
    buildPrompt(message) {
        const gw = this.getCurrentGameweek();
        const lower = message.toLowerCase();
        
        // Build context-aware prompt for better AI responses
        let context = `You are an expert Fantasy Premier League (FPL) assistant. Current gameweek: ${gw}.\n`;
        context += `Key players: Haaland (£14.1m, 85% owned), Salah (£13.0m, 65% owned), Palmer (£10.8m, 45% owned).\n`;
        context += `FPL rules: Captain gets double points, -4 points per extra transfer.\n\n`;
        
        // Add conversation history for context
        if (this.conversationContext.length > 0) {
            const recentHistory = this.conversationContext.slice(-2);
            recentHistory.forEach(msg => {
                context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
            });
        }
        
        // Add the current question
        context += `User: ${message}\nAssistant: `;
        
        // Add specific prompting based on query type
        if (lower.includes('captain')) {
            context += `Let me analyze the best captain options for GW${gw}. `;
        } else if (lower.includes('transfer')) {
            context += `Here's my transfer advice: `;
        } else if (lower.includes('wildcard')) {
            context += `Regarding wildcard strategy: `;
        }
        
        return context;
    }
    
    enhanceWithFPLContext(aiResponse, originalMessage) {
        const lower = originalMessage.toLowerCase();
        
        // If it's an FPL question but response lacks detail, add context
        if (this.isFPLQuery(lower)) {
            // Check if response already has good FPL content
            if (!this.hasFPLContent(aiResponse)) {
                // Add relevant FPL information
                const fplContext = this.getFPLContext(lower);
                return `${aiResponse}\n\n${fplContext}`;
            }
        }
        
        return aiResponse;
    }
    
    isFPLQuery(text) {
        const fplKeywords = [
            'captain', 'transfer', 'wildcard', 'chip', 'fpl', 'fantasy',
            'gameweek', 'gw', 'points', 'team', 'differential', 'bench',
            'triple', 'boost', 'hit', 'price', 'rise', 'fall', 'squad'
        ];
        return fplKeywords.some(keyword => text.includes(keyword));
    }
    
    hasFPLContent(text) {
        const lower = text.toLowerCase();
        return this.isFPLQuery(lower) || lower.includes('haaland') || lower.includes('salah');
    }
    
    getFPLContext(query) {
        const gw = this.getCurrentGameweek();
        
        if (query.includes('captain')) {
            return `For GW${gw}, top captain picks are:\n` +
                   `• Haaland - Safe choice with 85% ownership\n` +
                   `• Salah - Reliable differential at 65%\n` +
                   `• Palmer - High-risk differential at 45%`;
        }
        
        if (query.includes('transfer')) {
            return `Transfer priorities:\n` +
                   `• Fix injuries first\n` +
                   `• Target: Gordon (£6.0m), Mbeumo (£7.3m), Watkins (£9.0m)\n` +
                   `• Only take -4 for captains or injured players`;
        }
        
        if (query.includes('wildcard')) {
            return `Wildcard strategy:\n` +
                   `• Use if 4+ changes needed\n` +
                   `• Structure: 3-5-2 with Haaland + Salah\n` +
                   `• Best windows: GW28-31 or GW35-38`;
        }
        
        return `Key FPL tips: Focus on form over fixtures, plan 3 GWs ahead, avoid unnecessary hits.`;
    }
    
    async generateIntelligentFallback(message) {
        // Intelligent fallback when Hugging Face is unavailable
        const analysis = this.analyzeMessage(message);
        
        // Generate contextual response based on analysis
        let response = '';
        
        if (analysis.type === 'greeting') {
            response = "Hello! I'm your FPL AI assistant. How can I help you today?";
        } else if (analysis.type === 'captain') {
            response = this.generateCaptainAdvice(analysis);
        } else if (analysis.type === 'transfer') {
            response = this.generateTransferAdvice(analysis);
        } else if (analysis.type === 'wildcard') {
            response = this.generateWildcardAdvice();
        } else if (analysis.type === 'differential') {
            response = this.generateDifferentialAdvice();
        } else if (analysis.type === 'general') {
            response = this.generateGeneralResponse(message, analysis);
        } else {
            response = this.generateContextualResponse(message, analysis);
        }
        
        return response;
    }
    
    analyzeMessage(message) {
        const lower = message.toLowerCase();
        
        return {
            type: this.detectMessageType(lower),
            entities: this.extractEntities(message),
            sentiment: this.detectSentiment(lower),
            isQuestion: message.includes('?') || this.isQuestion(lower)
        };
    }
    
    detectMessageType(text) {
        if (/^(hi|hello|hey)/.test(text)) return 'greeting';
        if (text.includes('captain')) return 'captain';
        if (text.includes('transfer')) return 'transfer';
        if (text.includes('wildcard')) return 'wildcard';
        if (text.includes('differential')) return 'differential';
        if (text.includes('chip')) return 'chip';
        if (text.includes('team')) return 'team';
        if (text.includes('price')) return 'price';
        if (text.includes('fixture')) return 'fixture';
        return 'general';
    }
    
    extractEntities(message) {
        const lower = message.toLowerCase();
        const entities = { players: [] };
        
        const players = ['haaland', 'salah', 'palmer', 'saka', 'son', 'gordon'];
        players.forEach(player => {
            if (lower.includes(player)) entities.players.push(player);
        });
        
        return entities;
    }
    
    detectSentiment(text) {
        const positive = ['good', 'great', 'happy', 'best'];
        const negative = ['bad', 'terrible', 'worst', 'angry'];
        
        const hasPositive = positive.some(word => text.includes(word));
        const hasNegative = negative.some(word => text.includes(word));
        
        if (hasPositive && !hasNegative) return 'positive';
        if (hasNegative && !hasPositive) return 'negative';
        return 'neutral';
    }
    
    isQuestion(text) {
        const questions = ['what', 'who', 'when', 'where', 'why', 'how', 'should', 'could', 'would'];
        return questions.some(q => text.startsWith(q));
    }
    
    generateCaptainAdvice(analysis) {
        const gw = this.getCurrentGameweek();
        let response = `**Captain Analysis for GW${gw}:**\n\n`;
        
        if (analysis.entities.players.length > 0) {
            const player = analysis.entities.players[0];
            response += `${this.formatName(player)} is ${this.getPlayerAssessment(player)}.\n\n`;
        }
        
        response += `Top Options:\n`;
        response += `• Haaland - Safe choice (85% EO)\n`;
        response += `• Salah - Reliable (65% EO)\n`;
        response += `• Palmer - Differential (45% EO)\n\n`;
        response += `Consider your rank when choosing!`;
        
        return response;
    }
    
    getPlayerAssessment(player) {
        const assessments = {
            'haaland': 'the safest captain choice with incredible consistency',
            'salah': 'a reliable option who rarely blanks',
            'palmer': 'a great differential on all set pieces',
            'saka': 'solid when Arsenal are at home',
            'son': 'explosive but with rotation risk'
        };
        return assessments[player] || 'a decent option depending on fixtures';
    }
    
    generateTransferAdvice(analysis) {
        let response = `**Transfer Strategy:**\n\n`;
        
        response += `Hot Picks:\n`;
        response += `• Gordon (£6.0m) - Great fixtures\n`;
        response += `• Mbeumo (£7.3m) - Penalties\n`;
        response += `• Watkins (£9.0m) - Villa's main man\n\n`;
        response += `Only take -4 for injuries or captains!`;
        
        return response;
    }
    
    generateWildcardAdvice() {
        return `**Wildcard Strategy:**\n\n` +
               `Use if: 4+ problems in team\n` +
               `Structure: 3-5-2 optimal\n` +
               `Essentials: Haaland + Salah\n` +
               `Best windows: GW28-31 or GW35-38\n\n` +
               `How many issues does your team have?`;
    }
    
    generateDifferentialAdvice() {
        return `**Differential Picks (<10% owned):**\n\n` +
               `• Cunha (£6.5m, 3%) - Wolves key player\n` +
               `• Mbeumo (£7.3m, 8%) - Penalties + form\n` +
               `• Eze (£6.8m, 5%) - Palace creator\n\n` +
               `Balance with template players!`;
    }
    
    generateContextualResponse(message, analysis) {
        if (analysis.isQuestion) {
            return `That's a good question! Based on current FPL data and trends, ` +
                   `I'd recommend focusing on form over fixtures and planning 3 gameweeks ahead. ` +
                   `What specific aspect would you like me to elaborate on?`;
        }
        
        return `I understand. In FPL, consistency is key. ` +
               `Focus on getting your captain picks right and avoiding unnecessary hits. ` +
               `How can I help you improve your team?`;
    }
    
    generateGeneralResponse(message, analysis) {
        return `I can help with various aspects of FPL and general questions. ` +
               `Whether it's captain picks, transfers, wildcards, or anything else, just ask! ` +
               `What would you like to know?`;
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
                <div class="ai-badge">Hugging Face AI</div>
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
        background: linear-gradient(90deg, #FF6B6B, #FFD93D);
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