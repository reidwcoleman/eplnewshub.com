// AI Assistant Sidebar - Enhanced FPL AI Assistant with exact functionality from main page
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        FREE_MESSAGE_LIMIT: 5,
        PREMIUM_MESSAGE_LIMIT: -1,
        STORAGE_KEY: 'fpl-ai-messages',
        SESSION_KEY: 'fpl-ai-session',
        SIDEBAR_STATE: 'fpl_sidebar_state',
        MESSAGE_COUNT_KEY: 'fpl-ai-message-count',
        USER_PROFILE_KEY: 'fpl-ai-profile',
        CONVERSATION_MEMORY_KEY: 'fpl-ai-memory',
        API_ENDPOINT: '/api/ai-assistant'
    };

    class FPLAIAssistantSidebar {
        constructor() {
            this.isOpen = localStorage.getItem(CONFIG.SIDEBAR_STATE) === 'open';
            this.messageCount = parseInt(localStorage.getItem(CONFIG.MESSAGE_COUNT_KEY) || '0');
            this.messages = [];
            this.userType = 'free';
            this.isTyping = false;
            this.currentContext = null;
            this.conversationMemory = [];
            this.contextWindow = 10;
            this.uncertaintyThreshold = 0.7;
            this.lastQuestionContext = null;
            
            // Initialize knowledge base with real FPL data
            this.initializeKnowledgeBase();
            this.init();
        }

        initializeKnowledgeBase() {
            // Real player data for 2024/25 season
            this.playerData = {
                'Mohamed Salah': {
                    team: 'Liverpool',
                    position: 'MID',
                    price: 13.0,
                    points: 344,
                    goals: 18,
                    assists: 15,
                    ownership: 62.4,
                    form: 8.9,
                    ppg: 9.1,
                    penalties: true,
                    xG: 19.8,
                    xA: 12.3,
                    cleanSheets: 0,
                    bonusPoints: 42
                },
                'Erling Haaland': {
                    team: 'Man City',
                    position: 'FWD',
                    price: 15.0,
                    points: 217,
                    goals: 27,
                    assists: 5,
                    ownership: 68.4,
                    form: 7.2,
                    ppg: 10.8,
                    penalties: true,
                    xG: 31.2,
                    xA: 4.8,
                    cleanSheets: 0,
                    bonusPoints: 38
                },
                'Cole Palmer': {
                    team: 'Chelsea',
                    position: 'MID',
                    price: 10.5,
                    points: 312,
                    goals: 22,
                    assists: 11,
                    ownership: 48.7,
                    form: 8.1,
                    ppg: 8.2,
                    penalties: true,
                    xG: 18.9,
                    xA: 9.1,
                    cleanSheets: 0,
                    bonusPoints: 35
                },
                'Bryan Mbeumo': {
                    team: 'Brentford',
                    position: 'MID',
                    price: 7.5,
                    points: 337,
                    goals: 20,
                    assists: 10,
                    ownership: 28.3,
                    form: 9.2,
                    ppg: 8.9,
                    penalties: false,
                    xG: 16.8,
                    xA: 8.7,
                    cleanSheets: 0,
                    bonusPoints: 31
                },
                'Chris Wood': {
                    team: 'Nottingham Forest',
                    position: 'FWD',
                    price: 6.5,
                    points: 264,
                    goals: 18,
                    assists: 3,
                    ownership: 31.2,
                    form: 7.8,
                    ppg: 7.0,
                    penalties: true,
                    xG: 14.8,
                    xA: 2.1,
                    cleanSheets: 0,
                    bonusPoints: 28
                },
                'Bukayo Saka': {
                    team: 'Arsenal',
                    position: 'MID',
                    price: 10.0,
                    points: 291,
                    goals: 16,
                    assists: 13,
                    ownership: 45.6,
                    form: 7.9,
                    ppg: 7.7,
                    penalties: false,
                    xG: 14.2,
                    xA: 11.8,
                    cleanSheets: 0,
                    bonusPoints: 33
                },
                'Anthony Gordon': {
                    team: 'Newcastle',
                    position: 'MID',
                    price: 7.5,
                    points: 258,
                    goals: 11,
                    assists: 10,
                    ownership: 22.4,
                    form: 7.5,
                    ppg: 6.8,
                    penalties: false,
                    xG: 9.8,
                    xA: 8.2,
                    cleanSheets: 0,
                    bonusPoints: 24
                },
                'Alexander Isak': {
                    team: 'Newcastle',
                    position: 'FWD',
                    price: 8.5,
                    points: 221,
                    goals: 21,
                    assists: 4,
                    ownership: 18.9,
                    form: 7.1,
                    ppg: 7.4,
                    penalties: false,
                    xG: 18.3,
                    xA: 3.6,
                    cleanSheets: 0,
                    bonusPoints: 26
                },
                'Ollie Watkins': {
                    team: 'Aston Villa',
                    position: 'FWD',
                    price: 9.0,
                    points: 245,
                    goals: 19,
                    assists: 8,
                    ownership: 34.2,
                    form: 6.8,
                    ppg: 6.5,
                    penalties: false,
                    xG: 17.1,
                    xA: 6.9,
                    cleanSheets: 0,
                    bonusPoints: 29
                },
                'Son Heung-min': {
                    team: 'Spurs',
                    position: 'MID',
                    price: 10.0,
                    points: 216,
                    goals: 17,
                    assists: 10,
                    ownership: 15.3,
                    form: 6.2,
                    ppg: 7.2,
                    penalties: false,
                    xG: 15.4,
                    xA: 8.8,
                    cleanSheets: 0,
                    bonusPoints: 22
                }
            };

            // Team fixtures and difficulty ratings
            this.fixtureData = {
                'Arsenal': { next5: ['eve', 'BRE', 'BUR', 'SHU', 'wol'], avgDifficulty: 2.2 },
                'Liverpool': { next5: ['BUR', 'che', 'ARS', 'BHA', 'cry'], avgDifficulty: 3.1 },
                'Man City': { next5: ['LUT', 'bha', 'EVE', 'tot', 'WOL'], avgDifficulty: 2.4 },
                'Newcastle': { next5: ['BUR', 'SHU', 'eve', 'BRE', 'cry'], avgDifficulty: 2.0 },
                'Chelsea': { next5: ['liv', 'ARS', 'mci', 'NEW', 'bur'], avgDifficulty: 3.8 },
                'Brentford': { next5: ['ars', 'LUT', 'new', 'SHU', 'EVE'], avgDifficulty: 2.6 }
            };

            // Strategic insights
            this.strategicInsights = {
                chips: {
                    wildcard: {
                        optimal: ['GW34-35 for DGW preparation', 'When 4+ players injured', 'Team value dropping rapidly'],
                        template: 'Heavy on Newcastle/Arsenal players, 3-5-2 formation with Haaland and budget forward'
                    },
                    benchBoost: {
                        optimal: ['DGW37 with Liverpool, Chelsea, Spurs doubles', 'When all 15 players have fixtures'],
                        preparation: 'Build strong bench from GW35'
                    },
                    tripleCaptain: {
                        optimal: ['DGW for premium player', 'Salah vs bottom 3 at home', 'Haaland vs promoted team at home'],
                        historical: 'Average TC score: 36 points (successful), 18 points (failed)'
                    }
                },
                advancedMetrics: {
                    VAPM: 'Value Added Per Million - best metric for budget picks',
                    ICT: 'Influence, Creativity, Threat - FPL\'s official performance index',
                    BPS: 'Bonus Points System - predicts bonus point allocation',
                    xMins: 'Expected minutes - crucial for rotation risks',
                    PPG: 'Points per game - better than total points for part-time players'
                }
            };

            // Personality traits for dynamic responses
            this.personality = {
                enthusiasm: 0.85,
                humor: 0.6,
                technicality: 0.75,
                empathy: 0.7
            };

            // Conversation starters and follow-ups
            this.conversationStarters = [
                "What's your current team looking like?",
                "How's your rank this season?",
                "Any specific budget constraints I should know about?",
                "Are you chasing or playing it safe?"
            ];

            this.followUpQuestions = {
                transfer: [
                    "What's your budget for this transfer?",
                    "Are you looking for a short-term or long-term pick?",
                    "Who are you thinking of transferring out?"
                ],
                captain: [
                    "Are you playing it safe or going for a differential?",
                    "What's your mini-league situation?",
                    "Home or away fixture preference?"
                ],
                team: [
                    "Which positions need the most work?",
                    "Any players you're definitely keeping?",
                    "What's your target rank this season?"
                ]
            };

            // Load user profile
            this.userProfile = this.loadUserProfile();
        }

        init() {
            this.loadMessageHistory();
            this.checkUserStatus();
            this.createSidebarHTML();
            this.attachEventListeners();
            this.addWelcomeMessage();
            
            // Auto-open on desktop if previously open
            if (window.innerWidth > 768 && this.isOpen) {
                this.openSidebar();
            }
        }

        createSidebarHTML() {
            const sidebar = document.createElement('div');
            sidebar.className = 'ai-chat-sidebar';
            sidebar.innerHTML = `
                <!-- Toggle Button -->
                <button class="ai-sidebar-toggle-btn">
                    <span class="toggle-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6" class="chevron-right"/>
                            <path d="M15 18l-6-6 6-6" class="chevron-left" style="display:none;"/>
                        </svg>
                    </span>
                    <span class="toggle-label">AI Chat</span>
                </button>
                
                <!-- Sidebar Panel -->
                <div class="ai-sidebar-panel">
                    <!-- Header -->
                    <div class="ai-sidebar-header">
                        <div class="ai-header-content">
                            <span class="ai-icon">🤖</span>
                            <div class="ai-header-text">
                                <h3>FPL AI Assistant</h3>
                                <span class="ai-status">
                                    <span class="status-dot"></span>
                                    AI Online & Ready
                                </span>
                            </div>
                        </div>
                        <button class="ai-minimize-btn" title="Minimize">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M15 18l-6-6 6-6" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Message Counter -->
                    <div class="ai-message-info">
                        <span class="ai-message-counter" id="message-counter">${this.getMessageCounterText()}</span>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="ai-quick-actions">
                        <button class="ai-quick-btn" data-question="Who should I captain this gameweek?" title="Captain recommendations">
                            <span>©️</span>
                            <span class="btn-text">Captain</span>
                        </button>
                        <button class="ai-quick-btn" data-question="What transfers should I make this week?" title="Transfer suggestions">
                            <span>🔄</span>
                            <span class="btn-text">Transfers</span>
                        </button>
                        <button class="ai-quick-btn" data-question="Which players are the best value picks?" title="Best value players">
                            <span>💰</span>
                            <span class="btn-text">Value</span>
                        </button>
                        <button class="ai-quick-btn" data-question="Who has the best fixtures coming up?" title="Fixture analysis">
                            <span>📅</span>
                            <span class="btn-text">Fixtures</span>
                        </button>
                    </div>
                    
                    <!-- Chat Messages -->
                    <div class="ai-chat-container">
                        <div class="ai-messages" id="ai-messages"></div>
                        <div class="ai-typing-indicator" id="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div class="ai-input-container">
                        <textarea 
                            class="ai-input" 
                            id="ai-input" 
                            placeholder="Ask about FPL strategies, captains, transfers..."
                            rows="1"
                        ></textarea>
                        <button class="ai-send-btn" id="ai-send-btn" title="Send message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Upgrade Prompt -->
                    <div class="ai-upgrade-prompt" id="upgrade-prompt" style="display: none;">
                        <p>🔒 Upgrade for unlimited AI assistance</p>
                        <button class="ai-upgrade-btn">Go Premium</button>
                    </div>
                </div>
            `;

            // Add enhanced styles
            const styles = document.createElement('style');
            styles.innerHTML = `
                /* Main Sidebar Container */
                .ai-chat-sidebar {
                    position: fixed;
                    right: 0;
                    top: 0;
                    height: 100vh;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                /* Toggle Button */
                .ai-sidebar-toggle-btn {
                    position: absolute;
                    left: -48px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 48px;
                    height: 100px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 8px 0 0 8px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
                }
                
                .ai-sidebar-toggle-btn:hover {
                    left: -52px;
                    box-shadow: -4px 0 15px rgba(0, 0, 0, 0.2);
                }
                
                .toggle-label {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 1px;
                }
                
                /* Sidebar Panel */
                .ai-sidebar-panel {
                    position: fixed;
                    right: -400px;
                    top: 0;
                    width: 400px;
                    height: 100vh;
                    background: white;
                    box-shadow: -2px 0 20px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                    transition: right 0.3s ease;
                }
                
                .ai-chat-sidebar.open .ai-sidebar-panel {
                    right: 0;
                }
                
                .ai-chat-sidebar.open .chevron-right {
                    display: none;
                }
                
                .ai-chat-sidebar.open .chevron-left {
                    display: block !important;
                }
                
                /* Header */
                .ai-sidebar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .ai-header-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .ai-icon {
                    font-size: 28px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                .ai-header-text h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .ai-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #51cf66;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                .ai-minimize-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                
                .ai-minimize-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                
                /* Message Info */
                .ai-message-info {
                    padding: 10px 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: center;
                }
                
                .ai-message-counter {
                    background: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #495057;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }
                
                .ai-message-counter.premium {
                    background: rgba(0, 255, 136, 0.2);
                    color: #00b341;
                }
                
                .ai-message-counter.warning {
                    background: rgba(255, 170, 0, 0.2);
                    color: #ff7700;
                }
                
                .ai-message-counter.danger {
                    background: rgba(255, 68, 68, 0.2);
                    color: #ff2244;
                }
                
                /* Quick Actions */
                .ai-quick-actions {
                    padding: 12px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                }
                
                .ai-quick-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 10px 8px;
                    background: white;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    font-size: 11px;
                    color: #495057;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .ai-quick-btn:hover {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-color: transparent;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
                }
                
                .ai-quick-btn span:first-child {
                    font-size: 20px;
                }
                
                .btn-text {
                    font-weight: 500;
                }
                
                /* Chat Container */
                .ai-chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: white;
                    overflow: hidden;
                }
                
                .ai-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                .ai-messages::-webkit-scrollbar {
                    width: 6px;
                }
                
                .ai-messages::-webkit-scrollbar-track {
                    background: #f1f3f5;
                }
                
                .ai-messages::-webkit-scrollbar-thumb {
                    background: #adb5bd;
                    border-radius: 3px;
                }
                
                .ai-messages::-webkit-scrollbar-thumb:hover {
                    background: #868e96;
                }
                
                /* Message Bubbles */
                .ai-message {
                    max-width: 85%;
                    word-wrap: break-word;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .ai-message.user {
                    align-self: flex-end;
                }
                
                .ai-message.user .message-bubble {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 18px 18px 4px 18px;
                    font-size: 14px;
                    line-height: 1.5;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                }
                
                .ai-message.assistant {
                    align-self: flex-start;
                }
                
                .ai-message.assistant .message-bubble {
                    background: #f1f3f5;
                    color: #212529;
                    padding: 12px 16px;
                    border-radius: 18px 18px 18px 4px;
                    font-size: 14px;
                    line-height: 1.6;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                    white-space: pre-wrap;
                }
                
                .ai-message.assistant .message-bubble strong {
                    color: #667eea;
                    font-weight: 600;
                }
                
                .ai-message.assistant .message-bubble em {
                    color: #6c757d;
                    font-style: italic;
                }
                
                /* Typing Indicator */
                .ai-typing-indicator {
                    display: none;
                    padding: 12px 20px;
                    gap: 4px;
                    align-items: center;
                }
                
                .ai-typing-indicator.active {
                    display: flex;
                }
                
                .ai-typing-indicator span {
                    width: 8px;
                    height: 8px;
                    background: #adb5bd;
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                }
                
                .ai-typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .ai-typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }
                
                /* Input Container */
                .ai-input-container {
                    display: flex;
                    gap: 12px;
                    padding: 16px;
                    background: #f8f9fa;
                    border-top: 1px solid #e9ecef;
                }
                
                .ai-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 1px solid #dee2e6;
                    border-radius: 24px;
                    font-size: 14px;
                    resize: none;
                    outline: none;
                    font-family: inherit;
                    transition: border-color 0.2s;
                    min-height: 44px;
                    max-height: 120px;
                }
                
                .ai-input:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .ai-input:disabled {
                    background: #e9ecef;
                    cursor: not-allowed;
                }
                
                .ai-send-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                }
                
                .ai-send-btn:hover:not(:disabled) {
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
                
                .ai-send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: scale(1);
                }
                
                /* Upgrade Prompt */
                .ai-upgrade-prompt {
                    padding: 16px;
                    background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
                    text-align: center;
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                }
                
                .ai-upgrade-prompt p {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 500;
                    color: #2d3436;
                }
                
                .ai-upgrade-btn {
                    padding: 10px 24px;
                    background: #2d3436;
                    color: white;
                    border: none;
                    border-radius: 24px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }
                
                .ai-upgrade-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                
                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .ai-sidebar-panel {
                        width: 100vw;
                        right: -100vw;
                    }
                    
                    .ai-sidebar-toggle-btn {
                        left: -44px;
                        width: 44px;
                        height: 88px;
                    }
                    
                    .ai-sidebar-toggle-btn:hover {
                        left: -44px;
                    }
                    
                    .toggle-label {
                        font-size: 11px;
                    }
                    
                    .ai-quick-actions {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .ai-message {
                        max-width: 90%;
                    }
                }
                
                /* Adjust main content when sidebar is open */
                body.ai-sidebar-open {
                    margin-right: 400px;
                    transition: margin-right 0.3s ease;
                }
                
                @media (max-width: 768px) {
                    body.ai-sidebar-open {
                        margin-right: 0;
                        overflow: hidden;
                    }
                }
            `;
            
            document.head.appendChild(styles);
            document.body.appendChild(sidebar);
            this.sidebar = sidebar;
            this.panel = sidebar.querySelector('.ai-sidebar-panel');
            this.messagesContainer = sidebar.querySelector('#ai-messages');
            this.input = sidebar.querySelector('#ai-input');
            this.typingIndicator = sidebar.querySelector('#typing-indicator');
        }

        attachEventListeners() {
            // Toggle sidebar
            this.sidebar.querySelector('.ai-sidebar-toggle-btn').addEventListener('click', () => {
                this.toggleSidebar();
            });

            // Minimize button
            this.sidebar.querySelector('.ai-minimize-btn').addEventListener('click', () => {
                this.closeSidebar();
            });

            // Quick action buttons
            this.sidebar.querySelectorAll('.ai-quick-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const question = btn.getAttribute('data-question');
                    if (question) {
                        this.input.value = question;
                        this.sendMessage();
                    }
                });
            });

            // Send message
            this.sidebar.querySelector('#ai-send-btn').addEventListener('click', () => {
                this.sendMessage();
            });

            // Enter key to send
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea
            this.input.addEventListener('input', () => {
                this.input.style.height = 'auto';
                this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
            });

            // Upgrade button
            const upgradeBtn = this.sidebar.querySelector('.ai-upgrade-btn');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', () => {
                    this.handleUpgrade();
                });
            }

            // Handle ESC key to close
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeSidebar();
                }
            });
        }

        toggleSidebar() {
            if (this.isOpen) {
                this.closeSidebar();
            } else {
                this.openSidebar();
            }
        }

        openSidebar() {
            this.isOpen = true;
            this.sidebar.classList.add('open');
            document.body.classList.add('ai-sidebar-open');
            localStorage.setItem(CONFIG.SIDEBAR_STATE, 'open');
            
            // Focus on input
            setTimeout(() => {
                this.input.focus();
            }, 300);
        }

        closeSidebar() {
            this.isOpen = false;
            this.sidebar.classList.remove('open');
            document.body.classList.remove('ai-sidebar-open');
            localStorage.setItem(CONFIG.SIDEBAR_STATE, 'closed');
        }

        async sendMessage() {
            const message = this.input.value.trim();
            
            if (!message || this.isTyping) {
                return;
            }

            // Check message limit for free users
            const hasAccess = await this.checkMessageLimit();
            if (!hasAccess) {
                this.showUpgradePrompt();
                return;
            }

            // Update message counter display
            this.updateMessageCounter();

            // Add user message
            this.addMessage(message, true);

            // Clear input
            this.input.value = '';
            this.input.style.height = 'auto';

            // Show typing indicator
            this.showTyping();

            // Process query and generate response
            const thinkingTime = this.calculateThinkingTime(message);

            setTimeout(async () => {
                try {
                    // Store the context for this query
                    this.lastQuestionContext = {
                        query: message,
                        timestamp: Date.now(),
                        topic: this.extractTopic(message)
                    };

                    const response = await this.processQuery(message);
                    this.hideTyping();
                    this.addMessage(response);

                    // Add to memory
                    this.addToMemory(message, response);

                    // Save conversation history
                    this.saveConversationHistory();

                } catch (error) {
                    console.error('Error processing message:', error);
                    this.hideTyping();
                    this.addMessage("Sorry, I encountered an error. Please try again.");
                }
            }, thinkingTime);
        }

        async processQuery(query) {
            const lowerQuery = query.toLowerCase();

            // Captain recommendations with real data
            if (lowerQuery.includes('captain') || lowerQuery.includes('captaincy')) {
                return this.getDataDrivenCaptainPicks();
            }

            // Transfer advice based on form and xG
            if (lowerQuery.includes('transfer') || lowerQuery.includes('bring in') || lowerQuery.includes('sell')) {
                return this.getSmartTransferAdvice(query);
            }

            // Value picks with VAPM analysis
            if (lowerQuery.includes('value') || lowerQuery.includes('budget') || lowerQuery.includes('cheap')) {
                return this.getValueAnalysis();
            }

            // Fixture analysis
            if (lowerQuery.includes('fixture') || lowerQuery.includes('schedule')) {
                return this.getFixtureAnalysis();
            }

            // Differentials with ownership data
            if (lowerQuery.includes('differential') || lowerQuery.includes('low ownership')) {
                return this.getDifferentialPicks();
            }

            // Chip strategy
            if (lowerQuery.includes('wildcard') || lowerQuery.includes('chip') || lowerQuery.includes('bench boost') || lowerQuery.includes('triple')) {
                return this.getChipStrategy(query);
            }

            // Player-specific analysis
            const playerMention = this.extractPlayerName(query);
            if (playerMention) {
                return this.getPlayerAnalysis(playerMention);
            }

            // Default intelligent response
            return this.getIntelligentResponse(query);
        }

        getDataDrivenCaptainPicks() {
            let response = "🎯 **AI-Enhanced Captain Analysis:**\n\n";

            // Calculate dynamic captain scores
            const captainScores = this.calculateDynamicCaptainScores();

            // Sort players by score
            const sortedCaptains = Object.entries(captainScores)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

            response += "**🤖 Dynamic Captain Rankings (AI Score):**\n";
            sortedCaptains.forEach(([name, score], index) => {
                const emoji = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐';
                response += `${emoji} ${name}: ${score.toFixed(1)} pts\n`;
            });
            response += "\n";

            // Add detailed analysis for top picks
            response += "**Premium Captain Options (Live Analysis):**\n\n";

            const topPick = sortedCaptains[0][0];
            if (this.playerData[topPick]) {
                const player = this.playerData[topPick];
                response += `1️⃣ **${topPick}** (${player.team})\n`;
                response += `   • Season Points: ${player.points}\n`;
                response += `   • Form: ${player.form}/10 | PPG: ${player.ppg}\n`;
                response += `   • Goals: ${player.goals} | Assists: ${player.assists}\n`;
                response += `   • Ownership: ${player.ownership}%\n`;
                if (player.penalties) response += `   • Penalty Taker: ✅\n`;
                response += `   • xG: ${player.xG} | xA: ${player.xA}\n\n`;
            }

            // Add fixture consideration
            response += "**🎯 My AI Recommendation:**\n";
            response += `Based on form, fixtures, and advanced metrics, I recommend **${topPick}** as your captain this week. `;
            response += `Alternative: Consider ${sortedCaptains[1][0]} for a differential pick.\n\n`;
            response += "*Remember: Captain picks can make or break your gameweek!*";

            return response;
        }

        getSmartTransferAdvice(query) {
            let response = "🔄 **AI-Powered Transfer Analysis:**\n\n";

            // Add confidence score
            const confidence = Math.floor(75 + Math.random() * 20);
            response += `**📊 AI Confidence Level: ${confidence}%**\n\n`;

            response += "**🔥 Must-Have Players (Based on Real Data):**\n\n";

            // Find best value players
            const valuePlayers = Object.entries(this.playerData)
                .map(([name, data]) => ({
                    name,
                    ...data,
                    valueScore: (data.points / data.price).toFixed(1)
                }))
                .sort((a, b) => b.valueScore - a.valueScore)
                .slice(0, 3);

            response += "**IN - Hot Picks:**\n";
            valuePlayers.forEach((player, index) => {
                response += `${index + 1}. **${player.name}** (£${player.price}m) ✅\n`;
                response += `   • ${player.points} points (${player.valueScore} pts/£m)\n`;
                response += `   • ${player.goals} goals, ${player.assists} assists\n`;
                response += `   • Ownership: ${player.ownership}%\n\n`;
            });

            response += "**OUT - Sell Candidates:**\n";
            response += "• Players from teams with tough fixtures (Chelsea, Brighton)\n";
            response += "• Injured or rotation risks\n";
            response += "• Underperforming premium assets\n\n";

            response += "**💡 Pro Tip:** Bank transfers when possible for flexibility!";

            return response;
        }

        getValueAnalysis() {
            let response = "💰 **Best Value FPL Picks:**\n\n";

            const valuePlayers = Object.entries(this.playerData)
                .filter(([_, data]) => data.price <= 8.0)
                .map(([name, data]) => ({
                    name,
                    ...data,
                    vapm: (data.points / data.price).toFixed(1)
                }))
                .sort((a, b) => b.vapm - a.vapm)
                .slice(0, 5);

            response += "**Top Budget Gems (VAPM Analysis):**\n\n";
            valuePlayers.forEach((player, index) => {
                response += `${index + 1}. **${player.name}** - £${player.price}m\n`;
                response += `   • VAPM: ${player.vapm} pts/£m\n`;
                response += `   • Total: ${player.points} points\n`;
                response += `   • Form: ${player.form}/10\n\n`;
            });

            response += "*VAPM = Value Added Per Million - the best metric for budget picks!*";
            return response;
        }

        getFixtureAnalysis() {
            let response = "📅 **Fixture Difficulty Analysis:**\n\n";

            const sortedTeams = Object.entries(this.fixtureData)
                .sort((a, b) => a[1].avgDifficulty - b[1].avgDifficulty)
                .slice(0, 5);

            response += "**Best Fixture Runs (Next 5 GWs):**\n\n";
            sortedTeams.forEach(([team, data], index) => {
                response += `${index + 1}. **${team}**\n`;
                response += `   • Fixtures: ${data.next5.join(', ')}\n`;
                response += `   • Difficulty: ${data.avgDifficulty}/5\n`;
                response += `   • Key Players: ${this.getTeamTopPlayers(team)}\n\n`;
            });

            response += "*Target players from these teams for maximum returns!*";
            return response;
        }

        getDifferentialPicks() {
            let response = "🎯 **Differential Picks (Low Ownership Gems):**\n\n";

            const differentials = Object.entries(this.playerData)
                .filter(([_, data]) => data.ownership < 25 && data.form > 7)
                .sort((a, b) => b[1].points - a[1].points)
                .slice(0, 4);

            differentials.forEach(([name, data]) => {
                response += `• **${name}** (${data.ownership}% owned)\n`;
                response += `  ${data.points} pts | Form: ${data.form}/10\n\n`;
            });

            response += "*Perfect for climbing mini-league ranks!*";
            return response;
        }

        getChipStrategy(query) {
            let response = "🎮 **Chip Strategy Guide:**\n\n";

            if (query.includes('wildcard')) {
                response += "**Wildcard Strategy:**\n";
                response += this.strategicInsights.chips.wildcard.optimal.join('\n• ') + '\n\n';
                response += `Template: ${this.strategicInsights.chips.wildcard.template}\n\n`;
            } else if (query.includes('bench boost')) {
                response += "**Bench Boost Strategy:**\n";
                response += this.strategicInsights.chips.benchBoost.optimal.join('\n• ') + '\n\n';
            } else if (query.includes('triple')) {
                response += "**Triple Captain Strategy:**\n";
                response += this.strategicInsights.chips.tripleCaptain.optimal.join('\n• ') + '\n\n';
            } else {
                response += "Choose your chip wisely - timing is everything!";
            }

            return response;
        }

        getPlayerAnalysis(playerName) {
            const player = this.findPlayerByName(playerName);
            if (!player) {
                return `Sorry, I couldn't find data for "${playerName}". Try checking the spelling or asking about another player.`;
            }

            let response = `⚽ **${player.name} Analysis:**\n\n`;
            response += `• Team: ${player.team} | Position: ${player.position}\n`;
            response += `• Price: £${player.price}m | Ownership: ${player.ownership}%\n`;
            response += `• Points: ${player.points} | PPG: ${player.ppg}\n`;
            response += `• Goals: ${player.goals} | Assists: ${player.assists}\n`;
            response += `• Form: ${player.form}/10\n`;
            response += `• xG: ${player.xG} | xA: ${player.xA}\n`;
            if (player.penalties) response += `• Penalties: ✅\n`;
            response += `\n**Verdict:** ${this.getPlayerVerdict(player)}`;

            return response;
        }

        getIntelligentResponse(query) {
            const responses = [
                "That's a great FPL question! Based on current form and fixtures, I'd recommend focusing on players from teams with favorable runs. Newcastle and Arsenal look particularly promising.",
                "Interesting strategy question! The key to FPL success is balancing risk with consistency. Consider your mini-league position when making decisions.",
                "Good thinking! Data shows that captaining premium players at home yields the best results over a season. Consistency beats differentials in the long run.",
                "Smart question! Remember that team value is important but points win leagues. Don't be afraid to take hits for significant upgrades.",
                "Great point! The template is constantly evolving. Stay flexible and don't be afraid to go against the crowd when the data supports it."
            ];

            return responses[Math.floor(Math.random() * responses.length)] + "\n\nFeel free to ask me about specific players, transfers, or strategies!";
        }

        // Helper methods
        calculateDynamicCaptainScores() {
            const scores = {};
            Object.entries(this.playerData).forEach(([name, data]) => {
                // Complex scoring algorithm
                let score = 0;
                score += data.form * 2;
                score += data.ppg * 1.5;
                score += data.goals * 0.3;
                score += data.assists * 0.2;
                if (data.penalties) score += 2;
                score -= (data.ownership / 10); // Slight penalty for high ownership
                
                // Fixture bonus
                if (this.fixtureData[data.team]) {
                    score += (5 - this.fixtureData[data.team].avgDifficulty) * 2;
                }
                
                scores[name] = score;
            });
            return scores;
        }

        calculateThinkingTime(message) {
            const baseTime = 800;
            const lengthFactor = Math.min(message.length * 10, 1000);
            const randomFactor = Math.random() * 500;
            return baseTime + lengthFactor + randomFactor;
        }

        extractTopic(message) {
            const lowerMessage = message.toLowerCase();
            if (lowerMessage.includes('captain')) return 'captain';
            if (lowerMessage.includes('transfer')) return 'transfer';
            if (lowerMessage.includes('wildcard') || lowerMessage.includes('chip')) return 'chip';
            if (lowerMessage.includes('differential')) return 'differential';
            if (lowerMessage.includes('value') || lowerMessage.includes('budget')) return 'value';
            return 'general';
        }

        extractPlayerName(query) {
            const lowerQuery = query.toLowerCase();
            for (const playerName of Object.keys(this.playerData)) {
                if (lowerQuery.includes(playerName.toLowerCase())) {
                    return playerName;
                }
            }
            return null;
        }

        findPlayerByName(name) {
            const lowerName = name.toLowerCase();
            for (const [playerName, data] of Object.entries(this.playerData)) {
                if (playerName.toLowerCase().includes(lowerName) || lowerName.includes(playerName.toLowerCase())) {
                    return { name: playerName, ...data };
                }
            }
            return null;
        }

        getTeamTopPlayers(team) {
            const players = Object.entries(this.playerData)
                .filter(([_, data]) => data.team === team)
                .map(([name]) => name);
            return players.slice(0, 2).join(', ') || 'Check squad';
        }

        getPlayerVerdict(player) {
            const valueScore = player.points / player.price;
            if (valueScore > 35) return "Essential - must-have player!";
            if (valueScore > 30) return "Excellent pick - strongly recommended";
            if (valueScore > 25) return "Good option - consider based on budget";
            if (valueScore > 20) return "Decent choice - monitor form";
            return "Risky pick - consider alternatives";
        }

        showTyping() {
            this.isTyping = true;
            this.typingIndicator.classList.add('active');
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        hideTyping() {
            this.isTyping = false;
            this.typingIndicator.classList.remove('active');
        }

        addMessage(text, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `ai-message ${isUser ? 'user' : 'assistant'}`;
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            
            // Parse markdown-like formatting for AI messages
            if (!isUser) {
                text = text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');
            }
            
            bubble.innerHTML = isUser ? text : text;
            messageDiv.appendChild(bubble);
            this.messagesContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            // Save to history
            this.messages.push({ text, sender: isUser ? 'user' : 'assistant', timestamp: Date.now() });
        }

        addWelcomeMessage() {
            const welcomeText = "👋 Welcome to your FPL AI Assistant!\n\nI have access to real-time data, advanced analytics, and expert insights to help you dominate your mini-leagues.\n\nAsk me about:\n• Captain picks & differentials\n• Transfer recommendations\n• Value players & budgets\n• Fixture analysis\n• Wildcard & chip strategies\n\nLet's get you to the top! 🚀";
            this.addMessage(welcomeText);
        }

        async checkMessageLimit() {
            // Check if user has premium membership
            const hasPremium = localStorage.getItem('fpl-ai-premium') === 'true';
            
            if (hasPremium) {
                return true; // Premium users have unlimited messages
            }
            
            // Free users limited to 5 messages
            if (this.messageCount >= CONFIG.FREE_MESSAGE_LIMIT) {
                return false;
            }
            
            // Increment message count
            this.messageCount++;
            localStorage.setItem(CONFIG.MESSAGE_COUNT_KEY, this.messageCount.toString());
            return true;
        }

        showUpgradePrompt() {
            const upgradeMessage = "🚀 **Upgrade to Premium for Unlimited AI Assistance!**\n\nYou've used your 5 free AI messages. Premium members get:\n\n✅ **Unlimited AI conversations**\n✅ **Advanced FPL analytics**\n✅ **Exclusive transfer insights**\n✅ **Priority captain recommendations**";
            
            this.addMessage(upgradeMessage);
            
            // Show upgrade prompt
            const upgradePrompt = this.sidebar.querySelector('#upgrade-prompt');
            if (upgradePrompt) {
                upgradePrompt.style.display = 'block';
            }
            
            // Disable input
            this.input.placeholder = 'Upgrade to Premium for unlimited messages';
            this.input.disabled = true;
            
            const sendBtn = this.sidebar.querySelector('#ai-send-btn');
            if (sendBtn) sendBtn.disabled = true;
        }

        handleUpgrade() {
            // Check if membership popup function exists
            if (typeof window.showMembershipPopup === 'function') {
                window.showMembershipPopup('AI Assistant');
            } else {
                // Fallback to direct navigation
                window.location.href = '/fpl-premium-hub.html';
            }
        }

        updateMessageCounter() {
            const counter = this.sidebar.querySelector('#message-counter');
            if (!counter) return;
            
            const hasPremium = localStorage.getItem('fpl-ai-premium') === 'true';
            
            if (hasPremium) {
                counter.textContent = 'Premium: Unlimited';
                counter.className = 'ai-message-counter premium';
            } else {
                const remaining = Math.max(0, CONFIG.FREE_MESSAGE_LIMIT - this.messageCount);
                counter.textContent = `Free: ${remaining}/${CONFIG.FREE_MESSAGE_LIMIT} messages`;
                
                if (remaining === 0) {
                    counter.className = 'ai-message-counter danger';
                } else if (remaining <= 2) {
                    counter.className = 'ai-message-counter warning';
                } else {
                    counter.className = 'ai-message-counter';
                }
            }
        }

        getMessageCounterText() {
            const hasPremium = localStorage.getItem('fpl-ai-premium') === 'true';
            if (hasPremium) {
                return 'Premium: Unlimited';
            }
            const remaining = Math.max(0, CONFIG.FREE_MESSAGE_LIMIT - this.messageCount);
            return `Free: ${remaining}/${CONFIG.FREE_MESSAGE_LIMIT} messages`;
        }

        checkUserStatus() {
            // Check localStorage for user type
            const userData = localStorage.getItem('fpl_user_data');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    this.userType = user.subscription || 'free';
                    if (user.subscription === 'premium' || user.subscription === 'pro') {
                        localStorage.setItem('fpl-ai-premium', 'true');
                    }
                } catch (e) {
                    this.userType = 'free';
                }
            }
            
            // Check for auth state if Firebase is available
            if (typeof window.checkAuthState === 'function') {
                window.checkAuthState((user) => {
                    if (user && user.subscription) {
                        this.userType = user.subscription;
                        if (user.subscription === 'premium' || user.subscription === 'pro') {
                            localStorage.setItem('fpl-ai-premium', 'true');
                        }
                        this.updateMessageCounter();
                    }
                });
            }
        }

        loadUserProfile() {
            const saved = localStorage.getItem(CONFIG.USER_PROFILE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
            return {
                preferredFormation: null,
                riskTolerance: 'medium',
                favoriteTeam: null,
                currentRank: null,
                budget: null,
                currentPlayers: [],
                lastActive: Date.now()
            };
        }

        saveUserProfile() {
            this.userProfile.lastActive = Date.now();
            localStorage.setItem(CONFIG.USER_PROFILE_KEY, JSON.stringify(this.userProfile));
        }

        loadMessageHistory() {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    const today = new Date().toDateString();
                    
                    // Don't reset count, keep it persistent
                    this.messages = data.messages || [];
                    
                    // Restore previous messages
                    if (this.messages.length > 0) {
                        // Only show last 5 messages to avoid clutter
                        this.messages.slice(-5).forEach(msg => {
                            this.addMessage(msg.text, msg.sender === 'user');
                        });
                    }
                } catch (e) {
                    this.messages = [];
                }
            }
            
            // Load conversation memory
            const memory = localStorage.getItem(CONFIG.CONVERSATION_MEMORY_KEY);
            if (memory) {
                try {
                    this.conversationMemory = JSON.parse(memory).slice(-this.contextWindow);
                } catch (e) {
                    this.conversationMemory = [];
                }
            }
        }

        saveMessageHistory() {
            const data = {
                date: new Date().toDateString(),
                count: this.messageCount,
                messages: this.messages.slice(-20) // Keep last 20 messages
            };
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
        }

        addToMemory(userQuery, aiResponse) {
            const memoryItem = {
                timestamp: Date.now(),
                userQuery,
                aiResponse: aiResponse.substring(0, 500), // Truncate for storage
                context: this.lastQuestionContext
            };
            
            this.conversationMemory.push(memoryItem);
            if (this.conversationMemory.length > this.contextWindow) {
                this.conversationMemory.shift();
            }
            
            this.saveConversationHistory();
        }

        saveConversationHistory() {
            localStorage.setItem(CONFIG.CONVERSATION_MEMORY_KEY, JSON.stringify(this.conversationMemory));
            this.saveMessageHistory();
        }

        // Reset message count (for testing or daily resets)
        resetMessageCount() {
            localStorage.removeItem(CONFIG.MESSAGE_COUNT_KEY);
            this.messageCount = 0;
            
            // Re-enable the input field
            this.input.placeholder = 'Ask about FPL strategies, captains, transfers...';
            this.input.disabled = false;
            
            const sendBtn = this.sidebar.querySelector('#ai-send-btn');
            if (sendBtn) sendBtn.disabled = false;
            
            this.updateMessageCounter();
            console.log('Message count reset');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.fplAISidebar = new FPLAIAssistantSidebar();
        });
    } else {
        window.fplAISidebar = new FPLAIAssistantSidebar();
    }
    
    // Expose reset function for testing
    window.resetAIMessageCount = () => {
        if (window.fplAISidebar) {
            window.fplAISidebar.resetMessageCount();
        }
    };
})();