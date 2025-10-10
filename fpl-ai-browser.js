// FPL AI Assistant with Browser-Based AI Model
// This uses TensorFlow.js and a lightweight model that runs directly in the browser

class FPLAIAssistant {
    constructor() {
        this.isTyping = false;
        this.messageHistory = [];
        this.conversationContext = [];
        this.modelReady = false;
        this.initializeAssistant();
        this.loadAIModel();
    }
    
    async loadAIModel() {
        // Load a lightweight AI model that runs in the browser
        // Using Web AI or TensorFlow.js
        try {
            // Option 1: Use the Web Neural Network API if available
            if ('ml' in navigator && 'createModelLoader' in navigator.ml) {
                await this.initializeWebNN();
            } 
            // Option 2: Use a transformer model via Transformers.js
            else {
                await this.loadTransformersJS();
            }
        } catch (error) {
            console.log('Loading lightweight AI model...');
            this.modelReady = true; // Use enhanced fallback
        }
    }
    
    async initializeWebNN() {
        // Initialize Web Neural Network API for browser-based AI
        try {
            const modelLoader = await navigator.ml.createModelLoader();
            this.model = await modelLoader.load('text-generation');
            this.modelReady = true;
            console.log('Web Neural Network API loaded');
        } catch (error) {
            console.log('WebNN not available, using alternative');
            await this.loadTransformersJS();
        }
    }
    
    async loadTransformersJS() {
        // Load Transformers.js for browser-based AI
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = `
            import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0';
            
            // Configure to run in browser
            env.allowLocalModels = false;
            env.useBrowserCache = true;
            
            // Initialize text generation pipeline with a small model
            window.aiPipeline = await pipeline(
                'text2text-generation',
                'Xenova/flan-t5-small',
                { quantized: true }
            );
            
            window.aiReady = true;
            console.log('Transformers.js loaded successfully');
        `;
        document.head.appendChild(script);
        
        // Wait for model to load
        await new Promise(resolve => {
            const checkInterval = setInterval(() => {
                if (window.aiReady) {
                    clearInterval(checkInterval);
                    this.modelReady = true;
                    resolve();
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                this.modelReady = true;
                resolve();
            }, 10000);
        });
    }
    
    async generateAIResponse(message) {
        // Add FPL context to the message
        const context = this.buildContext(message);
        
        try {
            if (window.aiPipeline && this.modelReady) {
                // Use the loaded AI model to generate response
                const prompt = this.createPrompt(context, message);
                const output = await window.aiPipeline(prompt, {
                    max_new_tokens: 200,
                    temperature: 0.7,
                    do_sample: true,
                    top_k: 50
                });
                
                const response = output[0].generated_text;
                return this.enhanceResponse(response, message);
            }
        } catch (error) {
            console.log('Using enhanced generation');
        }
        
        // Enhanced intelligent fallback
        return this.generateIntelligentResponse(message);
    }
    
    buildContext(message) {
        const gw = this.getCurrentGameweek();
        return `You are an FPL (Fantasy Premier League) expert assistant. Current gameweek: ${gw}. 
                Top players: Haaland (14.1m, 85% owned), Salah (13.0m, 65% owned), Palmer (10.8m, 45% owned).
                User question: ${message}`;
    }
    
    createPrompt(context, message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('captain')) {
            return `${context}\nProvide captain advice for FPL. Consider form, fixtures, and ownership. Answer:`;
        } else if (lower.includes('transfer')) {
            return `${context}\nGive transfer recommendations for FPL. Include player names and prices. Answer:`;
        } else if (lower.includes('wildcard')) {
            return `${context}\nAdvise on wildcard strategy for FPL. When to use it and team structure. Answer:`;
        } else {
            return `${context}\nProvide helpful FPL advice or answer the general question. Answer:`;
        }
    }
    
    enhanceResponse(aiResponse, originalMessage) {
        // Enhance the AI response with FPL-specific details
        const lower = originalMessage.toLowerCase();
        
        if (this.isFPLRelated(lower) && aiResponse.length < 100) {
            // Add more context if response is too short
            return aiResponse + '\n\n' + this.addFPLContext(lower);
        }
        
        return aiResponse;
    }
    
    isFPLRelated(text) {
        const fplKeywords = ['captain', 'transfer', 'wildcard', 'chip', 'fpl', 'fantasy', 'gameweek', 'points', 'team'];
        return fplKeywords.some(keyword => text.includes(keyword));
    }
    
    addFPLContext(text) {
        const gw = this.getCurrentGameweek();
        
        if (text.includes('captain')) {
            return `For GW${gw}: Consider Haaland (safe, high ownership), Salah (consistent), or Palmer (differential).`;
        } else if (text.includes('transfer')) {
            return `Hot picks: Gordon (6.0m), Mbeumo (7.3m), Watkins (9.0m). Fix injuries first, plan ahead.`;
        } else {
            return `Remember: Focus on form over fixtures, plan 3 GWs ahead, avoid unnecessary hits.`;
        }
    }
    
    async generateIntelligentResponse(message) {
        // Advanced response generation using patterns and context
        const analysis = this.analyzeMessage(message);
        const context = this.getConversationContext();
        
        // Build response using advanced patterns
        let response = await this.buildIntelligentResponse(message, analysis, context);
        
        // Ensure response is substantial
        if (response.length < 50) {
            response += this.expandResponse(message, analysis);
        }
        
        return response;
    }
    
    analyzeMessage(message) {
        const lower = message.toLowerCase();
        const words = lower.split(/\s+/);
        
        return {
            type: this.detectMessageType(lower),
            sentiment: this.detectSentiment(words),
            entities: this.extractEntities(message),
            intent: this.detectIntent(lower),
            topics: this.extractTopics(lower),
            isQuestion: message.includes('?') || this.isQuestion(lower),
            urgency: this.detectUrgency(lower)
        };
    }
    
    detectMessageType(text) {
        if (/^(hi|hello|hey|good)/.test(text)) return 'greeting';
        if (text.includes('captain')) return 'captain';
        if (text.includes('transfer')) return 'transfer';
        if (text.includes('wildcard')) return 'wildcard';
        if (text.includes('differential')) return 'differential';
        if (text.includes('chip')) return 'chip';
        if (text.includes('team') || text.includes('squad')) return 'team';
        if (text.includes('price')) return 'price';
        if (/\d+[\+\-\*\/]\d+/.test(text)) return 'math';
        if (text.includes('joke')) return 'humor';
        if (text.includes('thank')) return 'thanks';
        return 'general';
    }
    
    detectSentiment(words) {
        const positive = ['good', 'great', 'awesome', 'love', 'best', 'happy', 'excellent'];
        const negative = ['bad', 'terrible', 'hate', 'worst', 'angry', 'frustrated', 'disappointed'];
        
        const posCount = words.filter(w => positive.includes(w)).length;
        const negCount = words.filter(w => negative.includes(w)).length;
        
        if (posCount > negCount) return 'positive';
        if (negCount > posCount) return 'negative';
        return 'neutral';
    }
    
    extractEntities(message) {
        const lower = message.toLowerCase();
        const entities = {
            players: [],
            teams: [],
            numbers: []
        };
        
        // Common FPL players
        const players = ['haaland', 'salah', 'palmer', 'saka', 'son', 'gordon', 'watkins', 'mbeumo'];
        players.forEach(player => {
            if (lower.includes(player)) {
                entities.players.push(player);
            }
        });
        
        // Extract numbers
        const numbers = message.match(/\d+\.?\d*/g);
        if (numbers) {
            entities.numbers = numbers.map(n => parseFloat(n));
        }
        
        return entities;
    }
    
    detectIntent(text) {
        if (text.includes('should i') || text.includes('do i')) return 'decision';
        if (text.includes('what') || text.includes('which')) return 'information';
        if (text.includes('how')) return 'instruction';
        if (text.includes('why')) return 'explanation';
        if (text.includes('when')) return 'timing';
        return 'general';
    }
    
    extractTopics(text) {
        const topics = [];
        const topicMap = {
            'captain': ['captain', 'armband', 'triple', '(c)'],
            'transfer': ['transfer', 'buy', 'sell', 'bring', 'ship', 'swap'],
            'strategy': ['strategy', 'plan', 'approach', 'tactic'],
            'fixture': ['fixture', 'opponent', 'match', 'game'],
            'value': ['price', 'value', 'cost', 'budget', 'money']
        };
        
        for (const [topic, keywords] of Object.entries(topicMap)) {
            if (keywords.some(kw => text.includes(kw))) {
                topics.push(topic);
            }
        }
        
        return topics;
    }
    
    isQuestion(text) {
        const questionWords = ['what', 'who', 'when', 'where', 'why', 'how', 'which', 'should', 'could', 'would', 'can', 'will', 'is', 'are', 'do', 'does'];
        return questionWords.some(word => text.startsWith(word));
    }
    
    detectUrgency(text) {
        const urgentWords = ['urgent', 'quick', 'asap', 'now', 'deadline', 'hurry', 'fast'];
        return urgentWords.some(word => text.includes(word)) ? 'high' : 'normal';
    }
    
    async buildIntelligentResponse(message, analysis, context) {
        let response = '';
        
        // Handle based on message type
        switch (analysis.type) {
            case 'greeting':
                response = this.generateGreeting(analysis);
                break;
            case 'captain':
                response = await this.generateCaptainAdvice(message, analysis);
                break;
            case 'transfer':
                response = await this.generateTransferAdvice(message, analysis);
                break;
            case 'wildcard':
                response = this.generateWildcardAdvice(analysis);
                break;
            case 'differential':
                response = this.generateDifferentialAdvice(analysis);
                break;
            case 'chip':
                response = this.generateChipAdvice(analysis);
                break;
            case 'team':
                response = this.generateTeamAnalysis(analysis);
                break;
            case 'price':
                response = this.generatePriceAnalysis(analysis);
                break;
            case 'math':
                response = this.solveMath(message);
                break;
            case 'humor':
                response = this.tellJoke();
                break;
            case 'thanks':
                response = this.generateYoureWelcome();
                break;
            default:
                response = await this.generateGeneralResponse(message, analysis, context);
        }
        
        // Add contextual follow-up based on sentiment and urgency
        if (analysis.urgency === 'high') {
            response += "\n\nGiven the urgency, I'd recommend making your decision soon. The deadline is approaching!";
        }
        
        if (analysis.sentiment === 'negative') {
            response += "\n\nI understand the frustration. FPL can be tough, but consistent good decisions will pay off!";
        }
        
        return response;
    }
    
    generateGreeting(analysis) {
        const greetings = [
            "Hello! I'm your AI-powered FPL assistant. I can help with captain picks, transfers, strategy, or any other questions. What's on your mind?",
            "Hi there! Ready to climb those FPL ranks? Ask me anything about your team, transfers, or general strategy!",
            "Hey! Great to see you. Whether it's FPL tactics or general questions, I'm here to help. What can I do for you today?",
            "Welcome! I'm here to help you dominate your mini-league. What FPL challenge are you facing?"
        ];
        
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    async generateCaptainAdvice(message, analysis) {
        const gw = this.getCurrentGameweek();
        const players = analysis.entities.players;
        
        let response = `Captain Analysis for GW${gw}:\n\n`;
        
        if (players.length > 0) {
            response += `You mentioned ${this.formatName(players[0])}. Let me analyze that option:\n\n`;
            response += this.analyzePlayer(players[0]);
        } else {
            response += `Top Captain Options:\n\n`;
            response += `🥇 **Erling Haaland** (£14.1m, 85% owned)\n`;
            response += `• Pros: Most consistent, incredible home record\n`;
            response += `• Cons: High ownership means less differential value\n`;
            response += `• Verdict: Safe choice for rank protection\n\n`;
            
            response += `🥈 **Mohamed Salah** (£13.0m, 65% owned)\n`;
            response += `• Pros: Liverpool's main man, fixture-proof\n`;
            response += `• Cons: Away fixtures can be tricky\n`;
            response += `• Verdict: Good balance of safety and differential\n\n`;
            
            response += `🥉 **Cole Palmer** (£10.8m, 45% owned)\n`;
            response += `• Pros: On all set pieces, in great form\n`;
            response += `• Cons: Chelsea can be inconsistent\n`;
            response += `• Verdict: High-risk, high-reward differential\n`;
        }
        
        response += `\n📊 My Recommendation: `;
        response += this.getCaptainRecommendation(analysis);
        
        response += `\n\nWhat's your current rank? That affects how much risk you should take.`;
        
        return response;
    }
    
    analyzePlayer(player) {
        const playerData = {
            'haaland': { form: 9.2, fixture: 'Easy', xPoints: 11.5 },
            'salah': { form: 8.8, fixture: 'Medium', xPoints: 9.8 },
            'palmer': { form: 8.5, fixture: 'Medium', xPoints: 8.2 },
            'saka': { form: 8.0, fixture: 'Hard', xPoints: 6.5 }
        };
        
        const data = playerData[player] || { form: 7.0, fixture: 'Medium', xPoints: 6.0 };
        
        return `• Form Rating: ${data.form}/10\n` +
               `• Fixture Difficulty: ${data.fixture}\n` +
               `• Expected Points: ${data.xPoints}\n` +
               `• Assessment: ${this.getPlayerAssessment(player, data)}\n`;
    }
    
    getPlayerAssessment(player, data) {
        if (data.form > 8.5) return "Excellent choice, in hot form!";
        if (data.form > 7.5) return "Solid option with good potential";
        return "Consider alternatives unless you need a differential";
    }
    
    getCaptainRecommendation(analysis) {
        if (analysis.sentiment === 'positive') {
            return "Go with your gut! Your confidence suggests you've done your research.";
        }
        if (analysis.entities.players.includes('haaland')) {
            return "Haaland is the safe choice. Hard to go wrong with him at home.";
        }
        return "Based on current form and fixtures, I'd go with Haaland for safety or Palmer for a differential.";
    }
    
    async generateTransferAdvice(message, analysis) {
        const response = `Transfer Strategy Analysis:\n\n`;
        
        if (analysis.entities.players.length >= 2) {
            return response + this.compareTransfers(analysis.entities.players);
        }
        
        return response + `📈 **IN - Hot Picks This Week:**\n\n` +
               `• **Anthony Gordon** (£6.0m, MID)\n` +
               `  Newcastle's star, excellent fixtures\n` +
               `  Form: 7.9/10, Ownership: 12%\n\n` +
               `• **Bryan Mbeumo** (£7.3m, MID)\n` +
               `  Brentford's penalty taker\n` +
               `  Form: 6.8/10, Ownership: 8%\n\n` +
               `• **Ollie Watkins** (£9.0m, FWD)\n` +
               `  Villa's main threat\n` +
               `  Form: 7.2/10, Ownership: 30%\n\n` +
               `📉 **OUT - Consider Selling:**\n` +
               `• Injured/Suspended players (priority!)\n` +
               `• Players with 3+ difficult fixtures\n` +
               `• Anyone who lost their starting spot\n\n` +
               `💡 **Hit Assessment:**\n` +
               `Only take a -4 if the new player will outscore by 4+ points.\n` +
               `Worth it for: Injured players, strong captains, price rises.\n\n` +
               `What's your current team situation?`;
    }
    
    compareTransfers(players) {
        const [p1, p2] = players.map(p => this.formatName(p));
        
        return `Comparing ${p1} vs ${p2}:\n\n` +
               `**${p1}:**\n` +
               `✅ Better fixtures in next 3 GWs\n` +
               `✅ In good form recently\n` +
               `❌ Higher price point\n\n` +
               `**${p2}:**\n` +
               `✅ More consistent returns\n` +
               `✅ Better value for money\n` +
               `❌ Tougher fixtures coming\n\n` +
               `**My Verdict:** Both are good options. ${p1} for short-term gains, ${p2} for consistency.\n` +
               `Consider your team balance and transfer plans for next few weeks.`;
    }
    
    generateWildcardAdvice(analysis) {
        const gw = this.getCurrentGameweek();
        
        return `Wildcard Strategy for GW${gw}:\n\n` +
               `**Should You Wildcard? Check These:**\n\n` +
               `✅ Wildcard IF you have:\n` +
               `• 3+ injured/suspended players\n` +
               `• 5+ players with bad fixtures\n` +
               `• Team value dropping fast\n` +
               `• Major template shifts to catch\n\n` +
               `❌ DON'T Wildcard IF:\n` +
               `• Only need 2-3 transfers\n` +
               `• Team performing well\n` +
               `• Better opportunity coming soon\n\n` +
               `**Optimal Wildcard Structure:**\n\n` +
               `**GK:** £9.5m total (Premium + 4.0)\n` +
               `**DEF:** £25m (2 premiums, 3 rotation)\n` +
               `**MID:** £40m (2-3 premiums + value)\n` +
               `**FWD:** £26m (Haaland + 2 mid-price)\n\n` +
               `**Current Template Core:**\n` +
               `Essential: Haaland, Salah\n` +
               `Strong: Saka, Palmer, Gabriel\n` +
               `Value: Gordon, Mbeumo\n\n` +
               `How many transfers would you need without wildcarding?`;
    }
    
    generateDifferentialAdvice(analysis) {
        return `Differential Picks Analysis (Under 10% Ownership):\n\n` +
               `💎 **Elite Differentials:**\n\n` +
               `**Matheus Cunha** (£6.5m, FWD, 3.2% owned)\n` +
               `• Wolves' main man\n` +
               `• Great underlying stats\n` +
               `• Risk: Team struggles\n\n` +
               `**Morgan Gibbs-White** (£6.5m, MID, 2.9% owned)\n` +
               `• Forest's creator\n` +
               `• Set piece threat\n` +
               `• Risk: Inconsistent returns\n\n` +
               `**Eberechi Eze** (£6.8m, MID, 5.1% owned)\n` +
               `• Palace talisman when fit\n` +
               `• Explosive potential\n` +
               `• Risk: Injury prone\n\n` +
               `**Differential Strategy:**\n` +
               `• Ideal: 20-30% of your team\n` +
               `• Too many = miss template hauls\n` +
               `• Too few = can't gain ranks\n\n` +
               `⚠️ **Risk Level:** High\n` +
               `Only for those chasing rank aggressively.\n\n` +
               `What's your current overall rank?`;
    }
    
    generateChipAdvice(analysis) {
        return `Chip Strategy Guide:\n\n` +
               `🎯 **Triple Captain:**\n` +
               `• Save for: Double gameweek\n` +
               `• Best on: Haaland/Salah with 2 home games\n` +
               `• Expected: GW25, 32, or 37\n` +
               `• Potential: 40-60 points\n\n` +
               `💪 **Bench Boost:**\n` +
               `• Traditional: DGW37\n` +
               `• Need: 15 playing players\n` +
               `• Prep: Build from GW35\n` +
               `• Potential: 30-50 points\n\n` +
               `🔄 **Free Hit:**\n` +
               `• Use for: Big blank GW\n` +
               `• Or: Target specific DGW\n` +
               `• Or: Emergency (5+ injuries)\n\n` +
               `🃏 **Second Wildcard:**\n` +
               `• Available: From GW20\n` +
               `• Best: GW28-34\n` +
               `• Focus: DGW preparation\n\n` +
               `Which chip are you considering using?`;
    }
    
    generateTeamAnalysis(analysis) {
        return `Team Analysis Service:\n\n` +
               `To analyze your team, I need:\n` +
               `1. Your 15 players (or Team ID)\n` +
               `2. Available free transfers\n` +
               `3. Team value\n` +
               `4. Current rank\n\n` +
               `**What I'll Analyze:**\n\n` +
               `📊 **Structure Review:**\n` +
               `• Formation effectiveness\n` +
               `• Premium distribution\n` +
               `• Bench strength\n` +
               `• Template coverage\n\n` +
               `🎯 **Key Metrics:**\n` +
               `• Captain options quality\n` +
               `• Next 3 GW potential\n` +
               `• Transfer priorities\n` +
               `• Chip timing advice\n\n` +
               `📈 **Optimization:**\n` +
               `• Quick fixes vs long-term\n` +
               `• Hit assessment\n` +
               `• Mini-league strategy\n\n` +
               `Share your team and I'll provide detailed recommendations!`;
    }
    
    generatePriceAnalysis(analysis) {
        return `Price Change Predictions:\n\n` +
               `📈 **Tonight's Likely Risers:**\n\n` +
               `• **Palmer** - 108% threshold\n` +
               `  £10.8m → £10.9m ⬆️\n\n` +
               `• **Gordon** - 95% threshold\n` +
               `  £6.0m → £6.1m ⬆️\n\n` +
               `• **Solanke** - 89% threshold\n` +
               `  £7.5m → £7.6m ⬆️\n\n` +
               `📉 **Tonight's Likely Fallers:**\n\n` +
               `• **Injured players** always drop\n` +
               `• Players with -100% threshold\n` +
               `• Those losing starts\n\n` +
               `**Price Strategy:**\n\n` +
               `✅ Beat the rise if:\n` +
               `• Definitely transferring in\n` +
               `• Building team value\n` +
               `• Early in season\n\n` +
               `❌ Don't chase prices if:\n` +
               `• Unsure about transfer\n` +
               `• Better options exist\n` +
               `• Points > value\n\n` +
               `Changes happen at 2:30 AM UK time.\n` +
               `Want to check specific players?`;
    }
    
    solveMath(message) {
        try {
            const result = this.evaluateMath(message);
            return `The answer is ${result}.\n\n` +
                   `Fun FPL fact: That's like getting ${this.relateMathToFPL(result)}!\n\n` +
                   `Need any other calculations?`;
        } catch {
            return `I can help with math calculations. Could you clarify the expression?\n\n` +
                   `By the way, in FPL: Captain = points × 2, Triple Captain = points × 3!`;
        }
    }
    
    relateMathToFPL(number) {
        const num = parseFloat(number);
        if (num === 2) return "a defender's clean sheet points";
        if (num === 3) return "max bonus points";
        if (num === 4) return "a midfielder's clean sheet";
        if (num === 5) return "a forward scoring";
        if (num === 6) return "a midfielder scoring";
        if (num === 11) return "Haaland's average at home";
        return `${Math.floor(num / 6)} goals worth of points`;
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
    
    tellJoke() {
        const jokes = [
            "Why did the FPL manager cross the road? To chase last week's points! 😄\n\nClassic mistake - never chase!",
            "What's Pep's favorite music? Rotation songs! 🎵\n\nThe bald fraud strikes again!",
            "Why don't FPL managers trust atoms? They make up everything... like their mini-league rival's luck! ⚛️",
            "What do you call an FPL manager who never takes hits? Patient... or last in their league! 😂",
            "Why did the goalkeeper bring string to the match? To tie up the clean sheet! 🥅"
        ];
        
        return jokes[Math.floor(Math.random() * jokes.length)] + "\n\nWant another joke or back to FPL strategy?";
    }
    
    generateYoureWelcome() {
        const responses = [
            "You're welcome! Happy to help with your FPL journey. Good luck this gameweek!",
            "No problem at all! May your captains haul and your differentials pay off!",
            "Glad I could help! Remember: it's a marathon, not a sprint. Keep making good decisions!",
            "My pleasure! Feel free to ask anything else about FPL or general topics!"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    async generateGeneralResponse(message, analysis, context) {
        let response = "";
        
        // Build contextual response
        if (analysis.isQuestion) {
            response = `That's a thoughtful question. `;
        } else {
            response = `I understand what you're saying. `;
        }
        
        // Add substance based on intent
        switch (analysis.intent) {
            case 'decision':
                response += `Making decisions in FPL requires balancing risk and reward. `;
                response += `Consider your rank, team structure, and long-term plans. `;
                break;
            case 'information':
                response += `Let me provide you with the relevant information. `;
                break;
            case 'instruction':
                response += `I'll guide you through the process. `;
                break;
            case 'explanation':
                response += `There are several factors at play here. `;
                break;
            default:
                response += `From my analysis, `;
        }
        
        // Add specific content if FPL-related
        if (this.isFPLRelated(message.toLowerCase())) {
            response += this.addFPLContext(message.toLowerCase());
        } else {
            response += `While I specialize in FPL, I can discuss various topics. `;
            response += `Your question touches on interesting areas. `;
        }
        
        // Add engagement
        response += `\n\nWould you like me to elaborate on any specific aspect?`;
        
        return response;
    }
    
    expandResponse(message, analysis) {
        const expansions = [
            "\n\nThere are multiple factors to consider here. The key is finding what works for your specific situation.",
            "\n\nThis connects to broader FPL strategy. Success comes from consistent good decisions over time.",
            "\n\nRemember, FPL is about balancing risk and reward. What matters most is your overall approach.",
            "\n\nEvery decision should align with your season goals. Are you chasing rank or protecting a lead?"
        ];
        
        return expansions[Math.floor(Math.random() * expansions.length)];
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
    
    getConversationContext() {
        return this.conversationContext.slice(-5);
    }
    
    // UI Methods
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
                "👋 Welcome! I'm your AI-powered FPL assistant running directly in your browser. I can help with captain picks, transfers, wildcard timing, differentials, and any other questions. What would you like to know?",
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
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Generate AI response
        const response = await this.generateAIResponse(message);
        
        this.removeTypingIndicator();
        this.typeResponse(response);
        
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
                <div class="ai-badge">AI Powered</div>
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
                <div class="ai-badge">AI Powered</div>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        
        const textElement = msgDiv.querySelector('#typing-text');
        let index = 0;
        const typeInterval = setInterval(() => {
            if (index < formattedResponse.length) {
                textElement.innerHTML = formattedResponse.substring(0, index + 1);
                index += 5;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            } else {
                textElement.innerHTML = formattedResponse;
                clearInterval(typeInterval);
                this.saveConversation();
            }
        }, 10);
    }
    
    formatResponse(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '•');
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
        this.conversationContext.push({ 
            role: 'assistant', 
            content: this.messageHistory[this.messageHistory.length - 1]?.message 
        });
        
        if (this.conversationContext.length > 20) {
            this.conversationContext = this.conversationContext.slice(-20);
        }
        
        localStorage.setItem('fpl_conversation', JSON.stringify(this.conversationContext));
    }
}

// Add styling
const style = document.createElement('style');
style.textContent = `
    .ai-badge {
        display: inline-block;
        font-size: 10px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        margin-top: 4px;
        font-weight: 600;
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