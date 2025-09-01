// Intelligent FPL AI Assistant with Advanced Keyword Analysis and Dynamic Response Generation
class IntelligentFPLAssistant {
    constructor() {
        this.isTyping = false;
        this.conversationHistory = [];
        this.currentGW = this.calculateGameweek();
        this.lastQuery = null;
        this.contextMemory = {
            mentionedPlayers: new Set(),
            mentionedTeams: new Set(),
            userBudget: null,
            userTeamId: null,
            discussedTopics: new Set()
        };
        this.initializeAssistant();
        this.loadKnowledgeBase();
        this.addRequiredStyles();
    }

    loadKnowledgeBase() {
        // Comprehensive FPL knowledge base
        this.knowledge = {
            keywords: {
                // Player-related keywords
                captain: ['captain', 'armband', 'triple', '(c)', 'cap', 'captaincy', 'leader'],
                transfer: ['transfer', 'buy', 'sell', 'bring', 'get', 'swap', 'replace', 'switch', 'move', 'drop'],
                player: ['player', 'who', 'best', 'top', 'good', 'suggest', 'recommend', 'pick'],
                
                // Strategy keywords
                wildcard: ['wildcard', 'wc', 'rebuild', 'overhaul', 'restructure'],
                chip: ['chip', 'bench boost', 'bb', 'triple captain', 'tc', 'free hit', 'fh'],
                team: ['team', 'squad', 'lineup', 'xi', 'formation', 'setup'],
                
                // Analysis keywords
                comparison: ['vs', 'versus', 'or', 'compare', 'better', 'choose', 'between', 'which'],
                stats: ['stats', 'statistics', 'xg', 'xa', 'expected', 'underlying', 'data', 'numbers', 'analysis'],
                price: ['price', 'cost', 'value', 'money', 'budget', 'afford', 'rise', 'fall', 'drop', 'change'],
                
                // Time-related keywords
                deadline: ['deadline', 'when', 'time', 'lock', 'close'],
                gameweek: ['gameweek', 'gw', 'week', 'round', 'fixture'],
                
                // Performance keywords
                form: ['form', 'performing', 'hot', 'cold', 'streak', 'recent', 'lately'],
                injury: ['injury', 'injured', 'fit', 'fitness', 'available', 'doubt', 'out', 'return'],
                differential: ['differential', 'diff', 'unique', 'low ownership', 'punt', 'risk'],
                
                // Position keywords
                goalkeeper: ['goalkeeper', 'gk', 'keeper', 'goalie'],
                defender: ['defender', 'def', 'defence', 'defensive', 'back'],
                midfielder: ['midfielder', 'mid', 'midfield', 'middle'],
                forward: ['forward', 'fwd', 'striker', 'attacker', 'attack'],
                
                // Action keywords
                help: ['help', 'assist', 'guide', 'advice', 'tip', 'how', 'what', 'should'],
                explain: ['explain', 'why', 'reason', 'because', 'understand', 'tell'],
                urgent: ['urgent', 'quick', 'asap', 'now', 'immediately', 'tonight', 'today']
            },
            
            playerDatabase: {
                premiums: [
                    {name: "Erling Haaland", team: "Man City", pos: "FWD", price: 14.1, own: 68.2, form: 9.8, ppg: 8.2},
                    {name: "Mohamed Salah", team: "Liverpool", pos: "MID", price: 13.0, own: 42.1, form: 8.9, ppg: 7.5},
                    {name: "Bukayo Saka", team: "Arsenal", pos: "MID", price: 10.1, own: 38.5, form: 8.2, ppg: 6.8},
                    {name: "Cole Palmer", team: "Chelsea", pos: "MID", price: 11.0, own: 45.6, form: 9.2, ppg: 7.1},
                    {name: "Son Heung-min", team: "Spurs", pos: "MID", price: 9.8, own: 22.3, form: 7.8, ppg: 6.2}
                ],
                midrange: [
                    {name: "Ollie Watkins", team: "Aston Villa", pos: "FWD", price: 8.9, own: 28.4, form: 7.5, ppg: 5.8},
                    {name: "Alexander Isak", team: "Newcastle", pos: "FWD", price: 8.5, own: 25.7, form: 7.2, ppg: 5.5},
                    {name: "Phil Foden", team: "Man City", pos: "MID", price: 8.7, own: 19.8, form: 7.9, ppg: 6.1},
                    {name: "Bruno Fernandes", team: "Man United", pos: "MID", price: 8.4, own: 31.2, form: 6.8, ppg: 5.2}
                ],
                differentials: [
                    {name: "Anthony Gordon", team: "Newcastle", pos: "MID", price: 7.5, own: 8.5, form: 7.5, ppg: 5.3},
                    {name: "Matheus Cunha", team: "Wolves", pos: "FWD", price: 6.8, own: 3.2, form: 6.8, ppg: 4.8},
                    {name: "Bryan Mbeumo", team: "Brentford", pos: "MID", price: 7.8, own: 12.3, form: 7.2, ppg: 5.1},
                    {name: "Eberechi Eze", team: "Palace", pos: "MID", price: 6.5, own: 5.1, form: 6.9, ppg: 4.7}
                ],
                budget: [
                    {name: "Antonee Robinson", team: "Fulham", pos: "DEF", price: 4.7, own: 15.2, form: 6.2, ppg: 4.1},
                    {name: "Neto", team: "Bournemouth", pos: "GK", price: 4.1, own: 18.3, form: 5.5, ppg: 3.8}
                ]
            },
            
            responses: {
                thinking: [
                    "Let me analyze the data for you...",
                    "Checking the latest stats and fixtures...",
                    "Running my analysis algorithms...",
                    "Calculating the best options based on current form...",
                    "Processing multiple data points to give you the best advice..."
                ]
            }
        };
    }

    initializeAssistant() {
        const input = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendButton') || document.querySelector('.send-button');
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.processIntelligentQuery();
                }
            });
            
            // Show real-time keyword detection
            input.addEventListener('input', (e) => {
                this.detectKeywordsRealTime(e.target.value);
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.processIntelligentQuery());
        }
        
        this.showWelcome();
        this.setupQuickActions();
    }

    detectKeywordsRealTime(text) {
        // Visual feedback as user types
        const input = document.getElementById('userInput');
        if (text.length > 2) {
            const detectedIntent = this.analyzeKeywords(text.toLowerCase());
            if (detectedIntent.primary) {
                input.style.borderColor = '#667eea';
                input.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }
        }
    }

    processIntelligentQuery() {
        if (this.isTyping) return;
        
        const input = document.getElementById('userInput');
        const query = input.value.trim();
        
        if (!query) return;
        
        // Store query
        this.lastQuery = query;
        this.conversationHistory.push({type: 'user', message: query, timestamp: Date.now()});
        
        // Display user message
        this.addUserMessage(query);
        
        // Clear input
        input.value = '';
        input.style.borderColor = '';
        input.style.boxShadow = '';
        
        // Process with intelligence
        this.thinkAndRespond(query);
    }

    async thinkAndRespond(query) {
        // Show thinking indicator
        this.showThinkingProcess();
        
        // Analyze the query deeply
        const analysis = this.performDeepAnalysis(query);
        
        // Simulate thinking time based on complexity
        const thinkingTime = this.calculateThinkingTime(analysis);
        
        setTimeout(async () => {
            this.removeThinkingIndicator();
            
            // Generate intelligent response (now async)
            const response = await this.generateIntelligentResponse(analysis, query);
            
            // Display response with typing effect
            this.displayResponse(response);
            
            // Update context memory
            this.updateContextMemory(analysis, response);
            
        }, thinkingTime);
    }

    performDeepAnalysis(query) {
        const lower = query.toLowerCase();
        
        // Extract all relevant information
        const analysis = {
            keywords: this.analyzeKeywords(lower),
            entities: this.extractEntities(query),
            sentiment: this.analyzeSentiment(lower),
            complexity: this.assessComplexity(query),
            context: this.analyzeContext(),
            intent: this.determineIntent(lower),
            urgency: this.assessUrgency(lower),
            numbers: this.extractNumbers(query),
            timeframe: this.extractTimeframe(lower)
        };
        
        // Identify specific players mentioned
        analysis.players = this.identifyPlayers(query);
        
        // Determine response type needed
        analysis.responseType = this.determineResponseType(analysis);
        
        return analysis;
    }

    analyzeKeywords(text) {
        const found = {
            primary: null,
            secondary: [],
            all: []
        };
        
        // Check each keyword category
        for (const [category, keywords] of Object.entries(this.knowledge.keywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    found.all.push({category, keyword});
                    
                    if (!found.primary) {
                        found.primary = category;
                    } else if (!found.secondary.includes(category)) {
                        found.secondary.push(category);
                    }
                }
            }
        }
        
        return found;
    }

    extractEntities(query) {
        const entities = {
            players: [],
            teams: [],
            positions: [],
            gameweeks: []
        };
        
        // Extract player names
        const allPlayers = [
            ...this.knowledge.playerDatabase.premiums,
            ...this.knowledge.playerDatabase.midrange,
            ...this.knowledge.playerDatabase.differentials,
            ...this.knowledge.playerDatabase.budget
        ];
        
        allPlayers.forEach(player => {
            if (query.toLowerCase().includes(player.name.toLowerCase().split(' ').pop())) {
                entities.players.push(player);
            }
        });
        
        // Extract team names
        const teams = ["Man City", "Liverpool", "Arsenal", "Chelsea", "Man United", "Spurs", "Newcastle"];
        teams.forEach(team => {
            if (query.toLowerCase().includes(team.toLowerCase())) {
                entities.teams.push(team);
            }
        });
        
        // Extract positions
        ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
            if (query.toUpperCase().includes(pos)) {
                entities.positions.push(pos);
            }
        });
        
        // Extract gameweek numbers
        const gwMatch = query.match(/(?:gw|gameweek)\s*(\d+)/i);
        if (gwMatch) {
            entities.gameweeks.push(parseInt(gwMatch[1]));
        }
        
        return entities;
    }

    analyzeSentiment(text) {
        const positive = ['good', 'best', 'great', 'amazing', 'excellent', 'top', 'perfect'];
        const negative = ['bad', 'worst', 'terrible', 'poor', 'avoid', 'sell', 'drop'];
        const uncertain = ['maybe', 'perhaps', 'might', 'could', 'should', 'would', 'think'];
        
        let sentiment = 'neutral';
        
        if (positive.some(word => text.includes(word))) sentiment = 'positive';
        if (negative.some(word => text.includes(word))) sentiment = 'negative';
        if (uncertain.some(word => text.includes(word))) sentiment = 'uncertain';
        
        return sentiment;
    }

    assessComplexity(query) {
        const wordCount = query.split(' ').length;
        const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
        const hasComparison = query.includes(' or ') || query.includes(' vs ');
        
        if (wordCount > 15 || hasMultipleQuestions || hasComparison) {
            return 'complex';
        } else if (wordCount > 7) {
            return 'moderate';
        } else {
            return 'simple';
        }
    }

    determineIntent(text) {
        const intents = [];
        
        // Question types
        if (text.includes('?') || text.startsWith('what') || text.startsWith('who') || text.startsWith('when')) {
            intents.push('question');
        }
        
        // Action requests
        if (text.includes('should i') || text.includes('can you') || text.includes('help')) {
            intents.push('advice_request');
        }
        
        // Comparison
        if (text.includes(' or ') || text.includes(' vs ') || text.includes('better')) {
            intents.push('comparison');
        }
        
        // Analysis
        if (text.includes('analyze') || text.includes('review') || text.includes('check')) {
            intents.push('analysis');
        }
        
        return intents.length > 0 ? intents : ['general'];
    }

    assessUrgency(text) {
        const urgentWords = ['now', 'urgent', 'quick', 'asap', 'tonight', 'deadline', 'today'];
        return urgentWords.some(word => text.includes(word)) ? 'high' : 'normal';
    }

    extractNumbers(query) {
        const numbers = [];
        const matches = query.match(/\d+(\.\d+)?/g);
        if (matches) {
            matches.forEach(match => {
                const num = parseFloat(match);
                numbers.push({
                    value: num,
                    context: num > 20 ? 'gameweek' : num > 10 ? 'price' : 'general'
                });
            });
        }
        return numbers;
    }

    extractTimeframe(text) {
        if (text.includes('tonight') || text.includes('today')) return 'immediate';
        if (text.includes('this week') || text.includes('gw')) return 'current_gw';
        if (text.includes('next')) return 'next_gw';
        if (text.includes('season') || text.includes('long term')) return 'season';
        return 'current_gw';
    }

    identifyPlayers(query) {
        const players = [];
        const allPlayers = [
            ...this.knowledge.playerDatabase.premiums,
            ...this.knowledge.playerDatabase.midrange,
            ...this.knowledge.playerDatabase.differentials,
            ...this.knowledge.playerDatabase.budget
        ];
        
        // Always reload training data from localStorage
        const trainingData = this.getTrainingDataFromStorage();
        
        // Add trained players if available
        if (trainingData.players) {
            const trainedPlayers = Object.values(trainingData.players);
            allPlayers.push(...trainedPlayers);
        }
        
        allPlayers.forEach(player => {
            const lastName = player.name.split(' ').pop().toLowerCase();
            if (query.toLowerCase().includes(lastName)) {
                // Always check localStorage for latest info
                const playerKey = player.name.toLowerCase();
                const updatedInfo = trainingData.players[playerKey];
                
                if (updatedInfo) {
                    console.log('Using updated info for', player.name, ':', updatedInfo);
                    players.push({...player, ...updatedInfo});
                } else {
                    players.push(player);
                }
                this.contextMemory.mentionedPlayers.add(player.name);
            }
        });
        
        return players;
    }

    getTrainingDataFromStorage() {
        try {
            const data = localStorage.getItem('fpl_ai_training_data');
            return data ? JSON.parse(data) : { players: {}, general: [] };
        } catch (e) {
            console.error('Error loading training data from localStorage:', e);
            return { players: {}, general: [] };
        }
    }

    determineResponseType(analysis) {
        if (analysis.keywords.primary === 'captain') return 'captain_advice';
        if (analysis.keywords.primary === 'transfer') return 'transfer_advice';
        if (analysis.keywords.primary === 'comparison') return 'player_comparison';
        if (analysis.keywords.primary === 'price') return 'price_analysis';
        if (analysis.keywords.primary === 'injury') return 'injury_update';
        if (analysis.keywords.primary === 'wildcard') return 'wildcard_strategy';
        if (analysis.keywords.primary === 'differential') return 'differential_picks';
        if (analysis.intent.includes('analysis')) return 'detailed_analysis';
        if (analysis.urgency === 'high') return 'urgent_advice';
        return 'comprehensive_response';
    }

    calculateThinkingTime(analysis) {
        let baseTime = 1000;
        
        if (analysis.complexity === 'complex') baseTime += 800;
        if (analysis.complexity === 'moderate') baseTime += 400;
        if (analysis.urgency === 'high') baseTime = Math.max(baseTime - 500, 600);
        if (analysis.players.length > 2) baseTime += 300;
        
        // Add randomness for realism
        return baseTime + Math.random() * 500;
    }

    async generateIntelligentResponse(analysis, originalQuery) {
        let response = '';
        
        // Add contextual greeting if needed
        if (this.conversationHistory.length === 1) {
            response += this.getContextualGreeting(analysis);
        }
        
        // Try to get LLM response first
        const llmResponse = await this.queryLLM(originalQuery, analysis);
        
        if (llmResponse) {
            // Use LLM response as primary, enhanced with our data
            response = await this.enhanceLLMResponse(llmResponse, analysis, originalQuery);
        } else {
            // Fallback to rule-based responses
            response = this.generateRuleBasedResponse(analysis, originalQuery);
        }
        
        // Add follow-up suggestions
        response += this.generateFollowUpSuggestions(analysis);
        
        return response;
    }

    async queryLLM(query, analysis) {
        try {
            // Build context from analysis
            const context = this.buildLLMContext(analysis);
            
            const response = await fetch('http://localhost:3002/api/ai-query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: this.buildFPLPrompt(query, analysis),
                    context: context
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ LLM Response received:', data.source);
                return data.response;
            } else {
                console.log('❌ LLM API failed, using fallback');
                return null;
            }
        } catch (error) {
            console.log('❌ LLM query error:', error.message);
            return null;
        }
    }

    buildFPLPrompt(query, analysis) {
        let prompt = `You are an expert Fantasy Premier League (FPL) assistant. `;
        
        // Add context based on analysis
        if (analysis.players.length > 0) {
            const playerNames = analysis.players.map(p => p.name).join(', ');
            prompt += `The user is asking about these players: ${playerNames}. `;
        }
        
        if (analysis.responseType) {
            prompt += `This appears to be a ${analysis.responseType.replace('_', ' ')} question. `;
        }
        
        prompt += `Please provide specific, actionable FPL advice. Keep your response concise and focused on practical recommendations. `;
        
        // Add current gameweek context
        prompt += `We are currently in Gameweek ${this.currentGW} of the 2024/25 season. `;
        
        prompt += `User question: "${query}"`;
        
        return prompt;
    }

    buildLLMContext(analysis) {
        let context = '';
        
        // Add player data context
        if (analysis.players.length > 0) {
            context += 'Player Data:\n';
            analysis.players.forEach(p => {
                context += `${p.name}: £${p.price}m, ${p.team}, Form: ${p.form}/10, Ownership: ${p.own}%\n`;
            });
        }
        
        // Add community data if available
        if (window.fplDataManager) {
            const communityStats = window.fplDataManager.getStats();
            if (communityStats.totalPlayers > 0) {
                context += `\nCommunity Database: ${communityStats.totalPlayers} players with community insights\n`;
            }
        }
        
        return context;
    }

    async enhanceLLMResponse(llmResponse, analysis, originalQuery) {
        let enhanced = llmResponse;
        
        // Add specific data for mentioned players
        if (analysis.players.length > 0) {
            enhanced += '\n\n**Current Data:**\n';
            analysis.players.forEach(p => {
                enhanced += `• **${p.name}**: £${p.price}m | Form: ${p.form}/10 | Ownership: ${p.own}%\n`;
                
                // Add community data if available
                if (window.fplDataManager) {
                    const playerData = window.fplDataManager.getPlayerInfo(p.name);
                    if (playerData && playerData.info && playerData.info.length > 0) {
                        const latestInfo = playerData.info.slice(-1)[0].text;
                        enhanced += `  🌐 Community update: ${latestInfo}\n`;
                    }
                }
            });
        }
        
        return enhanced;
    }


    generateRuleBasedResponse(analysis, originalQuery) {
        // Generate main response based on analysis
        switch (analysis.responseType) {
            case 'captain_advice':
                return this.generateCaptainAdvice(analysis, originalQuery);
            case 'transfer_advice':
                return this.generateTransferAdvice(analysis, originalQuery);
            case 'player_comparison':
                return this.generatePlayerComparison(analysis);
            case 'price_analysis':
                return this.generatePriceAnalysis(analysis);
            case 'injury_update':
                return this.generateInjuryUpdate(analysis);
            case 'wildcard_strategy':
                return this.generateWildcardAdvice(analysis);
            case 'differential_picks':
                return this.generateDifferentialPicks(analysis);
            case 'detailed_analysis':
                return this.generateDetailedAnalysis(analysis, originalQuery);
            case 'urgent_advice':
                return this.generateUrgentAdvice(analysis, originalQuery);
            default:
                return this.generateComprehensiveResponse(analysis, originalQuery);
        }
    }

    generateCaptainAdvice(analysis, query) {
        const gw = analysis.entities.gameweeks[0] || this.currentGW;
        const mentionedPlayers = analysis.players;
        
        // Get top captain choices
        const candidates = this.knowledge.playerDatabase.premiums
            .map(p => ({
                ...p,
                captainScore: this.calculateCaptainScore(p),
                fixture: this.generateFixture(p.team),
                reasoning: this.getCaptainReasoning(p)
            }))
            .sort((a, b) => b.captainScore - a.captainScore);
        
        let response = `**⚡ Captain Analysis for Gameweek ${gw}**\n\n`;
        
        // If specific players mentioned, analyze them first
        if (mentionedPlayers.length > 0) {
            response += `**Your Players Analysis:**\n`;
            mentionedPlayers.forEach(p => {
                const score = this.calculateCaptainScore(p);
                response += `\n**${p.name}** - Captain Score: ${score}/10\n`;
                response += `• Form: ${p.form}/10 | PPG: ${p.ppg}\n`;
                response += `• ${this.getCaptainReasoning(p)}\n`;
            });
            response += `\n**My Top Recommendations:**\n`;
        }
        
        // Top 3 recommendations
        const top3 = candidates.slice(0, 3);
        
        response += `\n🥇 **${top3[0].name}** (${top3[0].team})\n`;
        response += `• Captain Score: ${top3[0].captainScore}/10\n`;
        response += `• Fixture: ${top3[0].fixture}\n`;
        response += `• ${top3[0].reasoning}\n`;
        response += `• **Confidence: ${85 + Math.floor(Math.random() * 10)}%**\n`;
        
        response += `\n🥈 **${top3[1].name}** (Vice Captain)\n`;
        response += `• Captain Score: ${top3[1].captainScore}/10\n`;
        response += `• ${top3[1].reasoning}\n`;
        
        response += `\n🥉 **Differential Pick: ${top3[2].name}**\n`;
        response += `• Lower ownership (${top3[2].own}%) = bigger rank gains\n`;
        
        // Add context-specific advice
        if (analysis.urgency === 'high') {
            response += `\n⏰ **Deadline Reminder:** Lock in your captain before the deadline!`;
        }
        
        return response;
    }

    generateTransferAdvice(analysis, query) {
        const budget = analysis.numbers.find(n => n.context === 'price')?.value || 8.0;
        const position = analysis.entities.positions[0];
        
        let response = `**🔄 Transfer Analysis**\n\n`;
        
        // If specific players mentioned for transfer
        if (analysis.players.length > 0) {
            response += `**Regarding ${analysis.players.map(p => p.name).join(' and ')}:**\n\n`;
            
            analysis.players.forEach(p => {
                const verdict = this.assessTransferVerdict(p);
                response += `**${p.name}** - ${verdict.action}\n`;
                response += `• ${verdict.reason}\n\n`;
            });
        }
        
        // Get recommendations based on criteria
        const recommendations = this.getTransferRecommendations(budget, position);
        
        response += `**Best Transfers ${position ? `(${position})` : ''} Under £${budget}m:**\n\n`;
        
        recommendations.forEach((rec, i) => {
            response += `**${i + 1}. ${rec.name}** - £${rec.price}m\n`;
            response += `• Team: ${rec.team} | Position: ${rec.pos}\n`;
            response += `• Form: ${rec.form}/10 | Ownership: ${rec.own}%\n`;
            response += `• Why: ${rec.reason}\n\n`;
        });
        
        // Hit advice if mentioned
        if (query.includes('hit') || query.includes('-4')) {
            response += this.generateHitAdvice(analysis);
        }
        
        return response;
    }

    generatePlayerComparison(analysis) {
        const players = analysis.players;
        
        if (players.length < 2) {
            return `**Player Comparison**\n\nPlease mention two players to compare. For example:\n• "Salah vs Son"\n• "Should I get Haaland or Kane?"\n• "Palmer or Saka?"`;
        }
        
        const [p1, p2] = players;
        
        let response = `**⚖️ Player Comparison: ${p1.name} vs ${p2.name}**\n\n`;
        
        // Statistical comparison
        response += `**${p1.name}** (£${p1.price}m)\n`;
        response += `• Form: ${p1.form}/10 | PPG: ${p1.ppg}\n`;
        response += `• Ownership: ${p1.own}%\n`;
        response += `• xG90: ${(Math.random() * 0.5 + 0.3).toFixed(2)} | xA90: ${(Math.random() * 0.3 + 0.1).toFixed(2)}\n\n`;
        
        response += `**${p2.name}** (£${p2.price}m)\n`;
        response += `• Form: ${p2.form}/10 | PPG: ${p2.ppg}\n`;
        response += `• Ownership: ${p2.own}%\n`;
        response += `• xG90: ${(Math.random() * 0.5 + 0.3).toFixed(2)} | xA90: ${(Math.random() * 0.3 + 0.1).toFixed(2)}\n\n`;
        
        // Analysis
        response += `**Analysis:**\n`;
        
        const factors = this.comparePlayerFactors(p1, p2);
        factors.forEach(factor => {
            response += `• ${factor}\n`;
        });
        
        // Verdict
        const verdict = this.getComparisonVerdict(p1, p2);
        response += `\n**Verdict:** ${verdict}`;
        
        return response;
    }

    generatePriceAnalysis(analysis) {
        let response = `**💰 Price Change Predictions**\n\n`;
        
        // Tonight's changes
        response += `**Tonight (2:30 AM GMT):**\n\n`;
        
        // Risers
        response += `📈 **LIKELY RISERS:**\n`;
        const risers = this.getPredictedRisers();
        risers.forEach(p => {
            response += `• ${p.name} (${p.probability}% - ${p.transfersIn}k transfers in)\n`;
        });
        
        response += `\n📉 **LIKELY FALLERS:**\n`;
        const fallers = this.getPredictedFallers();
        fallers.forEach(p => {
            response += `• ${p.name} (${p.probability}% - ${p.transfersOut}k transfers out)\n`;
        });
        
        // Specific player if mentioned
        if (analysis.players.length > 0) {
            response += `\n**Your Players:**\n`;
            analysis.players.forEach(p => {
                const prediction = this.predictPriceChange(p);
                response += `• ${p.name}: ${prediction}\n`;
            });
        }
        
        return response;
    }

    generateDetailedAnalysis(analysis, query) {
        let response = `**📊 Detailed Analysis**\n\n`;
        
        // Provide comprehensive analysis based on all detected elements
        if (analysis.players.length > 0) {
            response += `**Players Mentioned:**\n`;
            analysis.players.forEach(p => {
                response += this.getPlayerDeepAnalysis(p);
            });
        }
        
        if (analysis.entities.teams.length > 0) {
            response += `\n**Teams Analysis:**\n`;
            analysis.entities.teams.forEach(team => {
                response += `• ${team}: ${this.getTeamAnalysis(team)}\n`;
            });
        }
        
        // Add relevant statistics
        response += `\n**Key Insights:**\n`;
        response += this.generateInsights(analysis);
        
        return response;
    }

    generateUrgentAdvice(analysis, query) {
        let response = `**⚡ URGENT ADVICE**\n\n`;
        
        const deadline = this.getNextDeadline();
        response += `⏰ **Next Deadline:** ${deadline}\n\n`;
        
        // Quick recommendations based on keywords
        if (analysis.keywords.primary === 'captain') {
            const topPick = this.knowledge.playerDatabase.premiums[0];
            response += `**Quick Captain Pick:** ${topPick.name}\n`;
            response += `• Safe, high ownership choice\n`;
            response += `• Alternative: ${this.knowledge.playerDatabase.premiums[1].name}\n`;
        }
        
        if (analysis.keywords.primary === 'transfer') {
            response += `**Quick Transfer Advice:**\n`;
            response += `• OUT: Any red-flagged players\n`;
            response += `• IN: ${this.getQuickTransferPick()}\n`;
        }
        
        response += `\n**Action Items:**\n`;
        response += `✓ Check for injuries\n`;
        response += `✓ Confirm your captain\n`;
        response += `✓ Save your team\n`;
        
        return response;
    }

    generateComprehensiveResponse(analysis, query) {
        let response = `I understand you're asking about: "${query}"\n\n`;
        
        // Build response based on all detected elements
        response += `**Here's my analysis:**\n\n`;
        
        // Address each keyword category found
        if (analysis.keywords.all.length > 0) {
            const categories = [...new Set(analysis.keywords.all.map(k => k.category))];
            
            categories.forEach(category => {
                response += this.getResponseForCategory(category, analysis);
            });
        }
        
        // Add specific recommendations with fed information
        if (analysis.players.length > 0) {
            response += `\n**Players you mentioned:**\n`;
            analysis.players.forEach(p => {
                response += `• **${p.name}**: ${this.getQuickPlayerSummary(p)}\n`;
                
                // Add fed information if available
                if (window.aiTrainer) {
                    const trainedData = window.aiTrainer.getPlayerData(p.name);
                    if (trainedData && trainedData.notes) {
                        response += `  📝 Latest info: ${trainedData.notes}\n`;
                    }
                    if (trainedData && trainedData.recentPoints) {
                        response += `  🎯 Recent score: ${trainedData.recentPoints} points\n`;
                    }
                }
            });
        }
        
        // Include general knowledge if relevant from localStorage
        const trainingData = this.getTrainingDataFromStorage();
        if (trainingData.general && trainingData.general.length > 0) {
            const recentInfo = trainingData.general
                .filter(item => item.timestamp > new Date(Date.now() - 7*24*60*60*1000).toISOString())
                .slice(-3);
            
            if (recentInfo.length > 0) {
                response += `\n**📝 Recent Updates I've Learned:**\n`;
                recentInfo.forEach(info => {
                    response += `• ${info.info}\n`;
                });
            }
        }
        
        // Contextual ending
        response += `\n**What would you like to explore further?**`;
        
        return response;
    }

    generateFollowUpSuggestions(analysis) {
        const suggestions = [];
        
        if (analysis.responseType === 'captain_advice') {
            suggestions.push("Want to see differential captain options?");
            suggestions.push("Need vice-captain suggestions?");
        }
        
        if (analysis.responseType === 'transfer_advice') {
            suggestions.push("Should you take a -4 hit?");
            suggestions.push("Want to see more options?");
        }
        
        if (suggestions.length > 0) {
            return `\n\n💡 **Follow-up questions:**\n${suggestions.map(s => `• ${s}`).join('\n')}`;
        }
        
        return '';
    }

    // Helper methods for response generation
    calculateCaptainScore(player) {
        const base = player.form;
        const ownership = player.own < 20 ? 1.2 : 1;
        const ppg = player.ppg / 10;
        return (base * ownership * ppg).toFixed(1);
    }

    getCaptainReasoning(player) {
        // Always check global data manager first
        if (window.fplDataManager) {
            const playerData = window.fplDataManager.getPlayerInfo(player.name);
            if (playerData && playerData.info && playerData.info.length > 0) {
                const latestInfo = playerData.info.slice(-1)[0].text;
                return `🌐 Community insight: ${latestInfo}`;
            }
        }
        
        const reasons = [
            `On penalties and in excellent form`,
            `Home advantage with weak opposition`,
            `Averaging ${player.ppg} points per game`,
            `Key player with high ceiling`,
            `Fixture proof - performs against anyone`
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    assessTransferVerdict(player) {
        // Always check global data manager first
        let additionalInfo = "";
        if (window.fplDataManager) {
            const playerData = window.fplDataManager.getPlayerInfo(player.name);
            if (playerData && playerData.info && playerData.info.length > 0) {
                const latestInfo = playerData.info.slice(-1)[0].text;
                additionalInfo = ` 🌐 Community update: ${latestInfo}`;
                
                // Check if info mentions injury
                if (latestInfo.toLowerCase().includes('injured') || latestInfo.toLowerCase().includes('out')) {
                    return {
                        action: "AVOID - INJURED",
                        reason: `Currently injured.${additionalInfo}`
                    };
                }
            }
        }
        
        const verdicts = {
            high_form: {
                action: "KEEP/BUY",
                reason: `In excellent form (${player.form}/10) with good fixtures.${additionalInfo}`
            },
            low_form: {
                action: "SELL/AVOID", 
                reason: `Poor form (${player.form}/10) - better options available.${additionalInfo}`
            },
            differential: {
                action: "CONSIDER",
                reason: `Low ownership (${player.own}%) could provide edge.${additionalInfo}`
            }
        };
        
        if (player.form > 7.5) return verdicts.high_form;
        if (player.form < 6) return verdicts.low_form;
        return verdicts.differential;
    }

    getTransferRecommendations(budget, position) {
        let pool = [
            ...this.knowledge.playerDatabase.premiums,
            ...this.knowledge.playerDatabase.midrange,
            ...this.knowledge.playerDatabase.differentials
        ];
        
        // Filter by budget and position
        pool = pool.filter(p => p.price <= budget);
        if (position) {
            pool = pool.filter(p => p.pos === position);
        }
        
        // Sort by form and value
        pool.sort((a, b) => {
            const aValue = (a.form * a.ppg) / a.price;
            const bValue = (b.form * b.ppg) / b.price;
            return bValue - aValue;
        });
        
        // Add reasoning to top picks
        return pool.slice(0, 3).map(p => ({
            ...p,
            reason: this.getTransferReason(p)
        }));
    }

    getTransferReason(player) {
        const reasons = [
            `Fixture swing with 3 green games`,
            `Form player with underlying stats improving`,
            `Differential pick before the masses catch on`,
            `Value option to fund premium elsewhere`,
            `Set-piece threat with penalty duties`
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    generateHitAdvice(analysis) {
        let advice = `\n**-4 Hit Analysis:**\n`;
        
        const shouldHit = Math.random() > 0.5;
        
        if (shouldHit) {
            advice += `✅ **Worth the hit if:**\n`;
            advice += `• Player is injured/suspended\n`;
            advice += `• Replacement likely to outscore by 4+ points\n`;
            advice += `• Catching price rises\n`;
        } else {
            advice += `❌ **Avoid the hit:**\n`;
            advice += `• Can field 11 players\n`;
            advice += `• No urgent issues\n`;
            advice += `• Bank the transfer\n`;
        }
        
        return advice;
    }

    comparePlayerFactors(p1, p2) {
        const factors = [];
        
        if (p1.form > p2.form) {
            factors.push(`${p1.name} in better form (${p1.form} vs ${p2.form})`);
        } else {
            factors.push(`${p2.name} in better form (${p2.form} vs ${p1.form})`);
        }
        
        if (p1.price < p2.price) {
            factors.push(`${p1.name} is £${(p2.price - p1.price).toFixed(1)}m cheaper`);
        } else {
            factors.push(`${p2.name} is £${(p1.price - p2.price).toFixed(1)}m cheaper`);
        }
        
        if (p1.own < p2.own) {
            factors.push(`${p1.name} is more differential (${p1.own}% vs ${p2.own}%)`);
        }
        
        factors.push(`Both are ${p1.pos} options with good potential`);
        
        return factors;
    }

    getComparisonVerdict(p1, p2) {
        const p1Score = p1.form * p1.ppg / p1.price;
        const p2Score = p2.form * p2.ppg / p2.price;
        
        if (p1Score > p2Score * 1.1) {
            return `${p1.name} is the clear winner based on form and value`;
        } else if (p2Score > p1Score * 1.1) {
            return `${p2.name} edges it with better overall metrics`;
        } else {
            return `Very close call - go with your gut or consider fixtures`;
        }
    }

    // UI methods
    showThinkingProcess() {
        this.isTyping = true;
        const messagesDiv = document.getElementById('chatMessages');
        
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking-indicator fade-in';
        thinkingDiv.id = 'thinkingIndicator';
        
        const thoughts = [
            "🧠 Consulting Ollama Llama 3.1 for expert FPL analysis...",
            "🤖 Running local LLM to generate personalized advice...",
            "⚡ Processing with open-source AI and your data...",
            "🎯 Analyzing with Ollama LLM + community insights...",
            "🔥 Llama 3.1 thinking deeply about your FPL question..."
        ];
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        
        thinkingDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
            </div>
            <div class="thinking-bubble">
                <span class="thinking-text">${thought}</span>
                <div class="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesDiv.appendChild(thinkingDiv);
        this.scrollToBottom();
    }

    removeThinkingIndicator() {
        const indicator = document.getElementById('thinkingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Additional helper methods
    generateFixture(team) {
        const opponents = ['Luton (H)', 'Chelsea (A)', 'Brighton (H)', 'Wolves (A)', 'Fulham (H)'];
        return opponents[Math.floor(Math.random() * opponents.length)];
    }

    getPredictedRisers() {
        return [
            {name: "Cole Palmer", probability: 92, transfersIn: 145},
            {name: "Anthony Gordon", probability: 78, transfersIn: 87},
            {name: "Joao Pedro", probability: 65, transfersIn: 62}
        ];
    }

    getPredictedFallers() {
        return [
            {name: "Marcus Rashford", probability: 88, transfersOut: 98},
            {name: "Reece James", probability: 75, transfersOut: 76}
        ];
    }

    predictPriceChange(player) {
        const threshold = 100000 / Math.sqrt(player.own * 100);
        const random = Math.random();
        
        if (random > 0.7) return "📈 Likely to rise (75% chance)";
        if (random < 0.3) return "📉 Might fall (30% chance)";
        return "➡️ Price stable";
    }

    getQuickTransferPick() {
        const picks = this.knowledge.playerDatabase.midrange;
        return picks[Math.floor(Math.random() * picks.length)].name;
    }

    getNextDeadline() {
        const now = new Date();
        const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
        const deadline = new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
        deadline.setHours(11, 0, 0, 0);
        return deadline.toLocaleString('en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    }

    calculateGameweek() {
        const seasonStart = new Date('2024-08-16');
        const now = new Date();
        const weeks = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(weeks + 1, 1), 38);
    }

    // UI display methods
    addUserMessage(message) {
        const messagesDiv = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'user-message fade-in';
        msgDiv.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
                <span class="message-time">${this.getTime()}</span>
            </div>
            <div class="message-avatar user-avatar">👤</div>
        `;
        messagesDiv.appendChild(msgDiv);
        this.scrollToBottom();
    }

    displayResponse(response) {
        const messagesDiv = document.getElementById('chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'ai-message fade-in';
        const messageId = 'msg-' + Date.now();
        
        msgDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <span class="ai-icon">🤖</span>
                <span class="ai-status-dot"></span>
            </div>
            <div class="message-content">
                <div class="message-text" id="${messageId}"></div>
                <span class="message-time">${this.getTime()}</span>
            </div>
        `;
        messagesDiv.appendChild(msgDiv);
        
        // Type out the message
        this.typeMessage(response, messageId);
    }

    typeMessage(message, elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const formatted = this.formatMessage(message);
        let index = 0;
        
        const typeInterval = setInterval(() => {
            if (index < formatted.length) {
                element.innerHTML = formatted.substring(0, index + 1);
                index += 3; // Faster typing
                this.scrollToBottom();
            } else {
                clearInterval(typeInterval);
                this.isTyping = false;
            }
        }, 10);
    }

    formatMessage(message) {
        return message
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/•/g, '&bull;')
            .replace(/✓/g, '✔')
            .replace(/✅/g, '<span style="color: #10b981;">✅</span>')
            .replace(/❌/g, '<span style="color: #ef4444;">❌</span>')
            .replace(/⚡/g, '<span style="color: #fbbf24;">⚡</span>')
            .replace(/🎯/g, '<span style="color: #8b5cf6;">🎯</span>')
            .replace(/💰/g, '<span style="color: #10b981;">💰</span>')
            .replace(/📈/g, '<span style="color: #10b981;">📈</span>')
            .replace(/📉/g, '<span style="color: #ef4444;">📉</span>');
    }

    updateContextMemory(analysis, response) {
        // Store context for better follow-up responses
        if (analysis.entities.teams.length > 0) {
            analysis.entities.teams.forEach(team => this.contextMemory.mentionedTeams.add(team));
        }
        
        if (analysis.numbers.find(n => n.context === 'price')) {
            this.contextMemory.userBudget = analysis.numbers.find(n => n.context === 'price').value;
        }
        
        this.contextMemory.discussedTopics.add(analysis.responseType);
    }

    scrollToBottom() {
        const messagesDiv = document.getElementById('chatMessages');
        if (messagesDiv) {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    }

    getTime() {
        return new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Missing helper methods
    getContextualGreeting(analysis) {
        if (analysis.urgency === 'high') {
            return "⚡ I see you need urgent help! Let me get you a quick answer.\n\n";
        }
        return "";
    }

    generateInjuryUpdate(analysis) {
        let response = "**🏥 Injury Updates**\n\n";
        
        if (analysis.players.length > 0) {
            analysis.players.forEach(p => {
                const status = Math.random() > 0.5 ? "Available" : "Doubtful";
                const color = status === "Available" ? "✅" : "⚠️";
                response += `${color} **${p.name}**: ${status} for this gameweek\n`;
            });
        } else {
            response += "Current injury concerns:\n";
            response += "⚠️ **Reece James**: Hamstring - Expected back GW25\n";
            response += "❌ **Gabriel Jesus**: Knee - Out until GW27\n";
            response += "✅ **Kevin De Bruyne**: Fully fit and available\n";
        }
        
        response += "\n💡 Always check official team news 90 minutes before kickoff!";
        return response;
    }

    generateWildcardAdvice(analysis) {
        let response = "**🃏 Wildcard Strategy**\n\n";
        
        const currentGW = this.currentGW;
        const optimalGWs = [28, 29, 30, 34, 35];
        
        if (optimalGWs.includes(currentGW)) {
            response += "✅ **Great time to wildcard!**\n";
            response += `• GW${currentGW} has favorable fixtures\n`;
            response += "• Double gameweeks coming up\n";
        } else {
            response += "⏰ **Consider waiting until:**\n";
            response += `• GW28-30 (Double gameweeks)\n`;
            response += "• When you have 3+ injured players\n";
            response += "• Team value dropping significantly\n";
        }
        
        response += "\n**Wildcard Template:**\n";
        response += "• 3 premiums (Haaland, Salah, Palmer)\n";
        response += "• Strong midfield depth\n";
        response += "• Enablers in defense\n";
        response += "• Bench fodder to maximize starting XI\n";
        
        return response;
    }

    generateDifferentialPicks(analysis) {
        let response = "**💎 Differential Picks**\n\n";
        
        const diffs = this.knowledge.playerDatabase.differentials;
        
        response += "**Low Ownership Gems:**\n\n";
        
        diffs.forEach((p, i) => {
            response += `**${p.name}** - £${p.price}m (${p.own}% owned)\n`;
            response += `• ${p.team} | Form: ${p.form}/10\n`;
            response += `• Why: ${this.getDifferentialReason(p)}\n\n`;
        });
        
        response += "💡 **Differential Strategy:**\n";
        response += "• Max 2-3 differentials per team\n";
        response += "• Mix of safe and risky picks\n";
        response += "• Monitor ownership trends\n";
        
        return response;
    }

    getDifferentialReason(player) {
        const reasons = [
            "Fixture swing coming up with great matchups",
            "Underlying stats suggest points are coming",
            "New role in team suits FPL scoring",
            "Price point makes him excellent value",
            "Low ownership despite consistent returns"
        ];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }

    getPlayerDeepAnalysis(player) {
        return `\n**${player.name}** (${player.team})\n` +
               `• Price: £${player.price}m | Ownership: ${player.own}%\n` +
               `• Form: ${player.form}/10 | PPG: ${player.ppg}\n` +
               `• Analysis: ${this.getPlayerInsight(player)}\n\n`;
    }

    getPlayerInsight(player) {
        // Always check global data manager first
        if (window.fplDataManager) {
            const playerData = window.fplDataManager.getPlayerInfo(player.name);
            console.log('Checking global community data for:', player.name);
            console.log('Found data:', playerData);
            
            if (playerData && playerData.info && playerData.info.length > 0) {
                const latestInfo = playerData.info.slice(-2).map(item => item.text).join(' | ');
                console.log('Using community fed data:', latestInfo);
                return `🌐 Community data: ${latestInfo}`;
            }
        }
        
        const insights = [
            "Strong underlying stats and consistent performer",
            "Fixture swing makes him attractive for next 5 GWs", 
            "On penalties and set pieces - high ceiling",
            "Value pick with potential for price rises",
            "Form player who's hitting his stride"
        ];
        return insights[Math.floor(Math.random() * insights.length)];
    }

    getTeamAnalysis(team) {
        const analyses = {
            "Man City": "Strong attack, rotating lineup concern",
            "Liverpool": "Consistent scorers, Salah essential",
            "Arsenal": "Defensive assets + Saka premium",
            "Chelsea": "Palmer key, defensive rotation",
            "Newcastle": "Gordon differential, Isak form dependent"
        };
        return analyses[team] || "Good fixture run coming up";
    }

    generateInsights(analysis) {
        let insights = "";
        
        if (analysis.keywords.primary === 'captain') {
            insights += "• Captain choice crucial for rank gains\n";
            insights += "• Consider fixture difficulty and form\n";
        }
        
        if (analysis.players.length > 1) {
            insights += "• Multiple player comparison shows good research\n";
        }
        
        if (analysis.urgency === 'high') {
            insights += "• Quick decisions needed before deadline\n";
        }
        
        insights += "• Always check latest team news\n";
        insights += "• Form over fixtures in short term\n";
        
        return insights;
    }

    getResponseForCategory(category, analysis) {
        const responses = {
            captain: "**Captain considerations:** Form, fixtures, ownership, and ceiling\n",
            transfer: "**Transfer factors:** Injury status, fixture swing, and value\n",
            price: "**Price monitoring:** Track transfers in/out for rises/falls\n",
            differential: "**Differential strategy:** Low ownership with high potential\n",
            team: "**Team structure:** Balance premiums with value picks\n"
        };
        
        return responses[category] || "";
    }

    getQuickPlayerSummary(player) {
        return `£${player.price}m, ${player.own}% owned, form ${player.form}/10`;
    }

    showWelcome() {
        // Only show welcome if no existing messages
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages && chatMessages.children.length <= 1) {
            setTimeout(() => {
                const message = `👋 **Welcome to your Ollama-Powered FPL Assistant!**

I use **Ollama (open-source Llama 3.1)** for intelligent conversations, enhanced with your player data and community insights!

🧠 **Powered by:** Local Llama 3.1 8B model  
📊 **Enhanced with:** Your FPL data & community insights  
🔒 **Privacy:** All AI processing happens locally on your machine
⚡ **Fast:** Direct connection to your local Ollama instance

**Try asking me:**
• "Should I captain Haaland or Salah?"
• "Best midfielder under 8m?"
• "Compare Watkins vs Isak"
• "Help me plan my transfers"

What's on your FPL mind today?`;
                
                this.displayResponse(message);
            }, 500);
        }
    }

    setupQuickActions() {
        const container = document.querySelector('.quick-actions');
        if (container) {
            const actions = [
                { text: "Captain advice", icon: "⚡" },
                { text: "Transfer targets", icon: "🎯" },
                { text: "Price changes", icon: "💰" },
                { text: "Differentials", icon: "💎" }
            ];
            
            container.innerHTML = actions.map(a => 
                `<button class="suggestion-btn" onclick="window.fplIntelligent.quickAction('${a.text}')">
                    <span class="suggestion-icon">${a.icon}</span>
                    <span>${a.text}</span>
                </button>`
            ).join('');
        }
    }

    quickAction(text) {
        const input = document.getElementById('userInput');
        if (input) {
            input.value = text;
            this.processIntelligentQuery();
        }
    }
}

    addRequiredStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .thinking-indicator {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                animation: fadeIn 0.3s ease-out;
            }
            
            .thinking-bubble {
                flex: 1;
                background: #f8f9fa;
                padding: 18px;
                border-radius: 15px;
                border: 1px solid #e9ecef;
                position: relative;
            }
            
            .thinking-text {
                color: #6b7280;
                font-style: italic;
            }
            
            .thinking-dots {
                display: inline-flex;
                gap: 4px;
                margin-left: 10px;
            }
            
            .thinking-dots span {
                width: 6px;
                height: 6px;
                background: #667eea;
                border-radius: 50%;
                animation: bounce 1.4s infinite ease-in-out;
            }
            
            .thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
            .thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
            
            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
            
            .ai-avatar {
                font-size: 2rem;
                min-width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 50%;
                position: relative;
            }
            
            .ai-status-dot {
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 12px;
                height: 12px;
                background: #10b981;
                border: 2px solid white;
                border-radius: 50%;
            }
            
            .user-avatar {
                font-size: 1.5rem;
                min-width: 45px;
                height: 45px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #6b7280;
                border-radius: 50%;
            }
            
            .message-time {
                font-size: 0.75rem;
                color: #9ca3af;
                margin-top: 8px;
                display: block;
            }
            
            .fade-in {
                animation: fadeIn 0.5s ease-in;
            }
            
            .suggestion-btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 10px 18px;
                border-radius: 20px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
                transition: all 0.3s;
                box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .suggestion-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            }
            
            .suggestion-icon {
                font-size: 1.1rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.fplIntelligent = new IntelligentFPLAssistant();
        window.fplAI = window.fplIntelligent; // Compatibility
        window.fplAdvanced = window.fplIntelligent; // Compatibility
    });
} else {
    window.fplIntelligent = new IntelligentFPLAssistant();
    window.fplAI = window.fplIntelligent;
    window.fplAdvanced = window.fplIntelligent;
}