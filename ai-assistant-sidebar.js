// AI Assistant Sidebar - Persistent chat sidebar for all pages
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        FREE_MESSAGE_LIMIT: 5,
        PREMIUM_MESSAGE_LIMIT: -1, // Unlimited
        STORAGE_KEY: 'fpl_ai_messages',
        SESSION_KEY: 'fpl_ai_session',
        SIDEBAR_STATE: 'fpl_sidebar_state',
        API_ENDPOINT: '/api/ai-assistant'
    };

    // AI responses database
    const AI_RESPONSES = {
        captain: [
            "Based on current form and fixtures, I'd recommend Haaland (C) against Luton. His xG is through the roof at 8.2 over the last 4 games, and Luton have conceded the most big chances in the league.",
            "Salah looks like the standout choice this week. Liverpool face Burnley at home, and he's averaging 9.5 points per home game this season. Consider Haaland as VC.",
            "Bruno Fernandes could be a great differential captain pick. United have a double gameweek and he's on penalties. Only 8% captaincy in top 10k.",
            "Palmer has been on fire lately! 5 goals in 3 games and faces Sheffield United who've conceded 62 goals this season. High risk, high reward option.",
            "I'm analyzing fixture difficulty and recent performance... Saka against Everton looks promising. Arsenal have scored 3+ goals in their last 5 home games."
        ],
        transfers: [
            "With your budget, I'd suggest Son → Palmer and upgrading your 4.5m defender to Trippier. Newcastle have excellent fixtures and Palmer's underlying stats are elite.",
            "Gordon at 6.5m is incredible value. Newcastle's fixtures turn and he's averaging 0.8 xG+xA per 90. Consider downgrading a premium midfielder for him.",
            "Injuries are hitting hard this week. If you have Martinelli, pivot to Bowen who has a great run of fixtures and is in red-hot form.",
            "The template is shifting. Consider moving from double Liverpool defense to include an Arsenal defender. Gabriel is a threat from set pieces.",
            "With DGW35 approaching, start planning now. Brighton and Newcastle players could be essential. Consider banking a transfer this week."
        ],
        value: [
            "Best value picks under 6m: Mateta (5.4m) with 7 goals in 8 games, Morris (4.5m) starting for Luton, and Muniz (5.2m) who's nailed for Fulham.",
            "In defense, look at Branthwaite (4.5m). Everton have improved defensively and he's a bonus point magnet. Also consider Dunk at 4.7m.",
            "Midfield bargains: Bailey (5.1m) when fit is explosive, Gordon (6.5m) is still underpriced, and Onana (5.5m) offers great all-round potential.",
            "For budget forwards, Muniz at 5.2m is the standout. Regular starter and Fulham create chances. Also monitor Osula if he gets more minutes.",
            "Premium value: Watkins at 9.0m offers similar output to 11m+ forwards. In midfield, Foden at 8.5m is still underowned despite elite numbers."
        ],
        fixtures: [
            "Best fixture runs next 6 GWs: 1) Newcastle (BUR, SHU, eve, BRE, cry), 2) Arsenal (eve, BRE, BUR, SHU, wol), 3) Man City (consistent home games).",
            "Avoid these teams short-term: Chelsea face Liverpool, Arsenal, and City in next 4. Brighton have tough away fixtures coming up.",
            "Double gameweek alert! GW35: Brighton, Newcastle likely. GW37: Chelsea, Spurs, Liverpool potential. Start planning your chip strategy now.",
            "Fixture swing incoming: Everton's run improves dramatically from GW33. Consider Pickford or DCL as differentials before the masses catch on.",
            "Target these defenses: Sheffield United and Burnley remain the teams to target with your attackers. Luton have tightened up recently."
        ],
        premium: [
            "Haaland vs Salah is the big debate. Haaland for captaincy security, Salah for differential potential. Why not both if you wildcard?",
            "Premium midfielder rotation: Foden and Palmer offer the best value. Saka most nailed. Bruno has penalties. Choose based on your risk appetite.",
            "Kane at 12.5m is being overlooked. Bayern fixtures are excellent and he's guaranteed 90 minutes. Could be a great differential.",
            "Consider going without Haaland. It frees up funds for a balanced squad and City have some rotation risk with CL fixtures.",
            "Triple premium strategy can work: Haaland, Salah, Son leaves enough for a solid supporting cast if you nail the budget picks."
        ],
        differential: [
            "Isak ownership under 10% but Newcastle fixtures are incredible. He's my top differential pick for the next 6 gameweeks.",
            "Eze at 12% ownership could explode. Palace fixtures improve and he's on penalties. Great enabler at 6.8m.",
            "In defense, Estupinan (4.8m, 3% owned) offers attacking potential when fit. Monitor Brighton's injury news closely.",
            "Morgan Rogers (5.2m, 2% owned) is playing OOP as a striker for Villa. Could be this season's Martinelli if he keeps starting.",
            "For a premium differential, Son at 15% ownership has a double gameweek coming and loves playing against weaker teams."
        ],
        wildcard: [
            "Wildcard team structure: Go heavy on Newcastle and Arsenal players. 3-5-2 with Haaland and a budget forward allows premium mids.",
            "Template wildcard: Pickford, TAA-Gabriel-Trippier, Salah-Foden-Palmer-Gordon, Haaland-Watkins-Muniz. Leaves 1.5m ITB for flexibility.",
            "Consider the anti-template: No Haaland allows Salah, Son, Saka, Palmer midfield with Kane up top. High risk but huge differential.",
            "Post-wildcard strategy: Plan your next 4-6 transfers now. Having a clear path helps you avoid hits and maximize team value.",
            "Wildcard timing: If you still have it, GW34-35 could be optimal to navigate doubles and set up for the final push."
        ],
        chips: [
            "Bench Boost GW37 looks optimal with likely doubles for Liverpool, Chelsea, and Spurs. Start building your bench from GW35.",
            "Triple Captain on Haaland DGW or save for a Salah haul? Statistics favor the double gameweek but follow your gut.",
            "Free Hit strategy: Use it to navigate blank gameweek 33 or save for massive upside in DGW37. Depends on your current squad.",
            "If you've used all chips, focus on team balance. Having 15 playing players is crucial for the congested end-of-season schedule.",
            "Chip combination: Wildcard GW34 → Bench Boost GW37 is the template strategy. But don't be afraid to go differential if your rank needs it."
        ],
        general: [
            "Focus on process over results. Good decisions don't always yield immediate points, but they pay off long-term.",
            "Mini-league strategy differs from overall rank. If you're chasing, take calculated risks. If leading, play it safer.",
            "Don't chase last week's points. Look forward to fixtures and form. The best FPL managers are always planning 3-4 weeks ahead.",
            "Set piece takers are gold. They offer penalty potential and assist threat. Always check who's on penalties when selecting players.",
            "Remember: FPL is a marathon, not a sprint. One bad gameweek doesn't define your season. Stay calm and trust your strategy."
        ]
    };

    class AIAssistantSidebar {
        constructor() {
            this.isOpen = localStorage.getItem(CONFIG.SIDEBAR_STATE) === 'open';
            this.messageCount = 0;
            this.messages = [];
            this.userType = 'free';
            this.currentContext = null;
            this.init();
        }

        init() {
            this.loadMessageHistory();
            this.checkUserStatus();
            this.createSidebarHTML();
            this.attachEventListeners();
            this.addWelcomeMessage();
            
            // Auto-open on desktop, closed on mobile by default
            if (window.innerWidth > 768 && this.isOpen) {
                this.openSidebar();
            }
        }

        createSidebarHTML() {
            // Create sidebar container
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
                                    Online
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
                        <span class="ai-message-counter">${this.getMessageCounterText()}</span>
                    </div>
                    
                    <!-- Quick Actions -->
                    <div class="ai-quick-actions">
                        <button class="ai-quick-btn" data-action="captain" title="Captain recommendations">
                            <span>©️</span>
                            <span class="btn-text">Captain</span>
                        </button>
                        <button class="ai-quick-btn" data-action="transfers" title="Transfer suggestions">
                            <span>🔄</span>
                            <span class="btn-text">Transfers</span>
                        </button>
                        <button class="ai-quick-btn" data-action="value" title="Best value players">
                            <span>💰</span>
                            <span class="btn-text">Value</span>
                        </button>
                        <button class="ai-quick-btn" data-action="fixtures" title="Fixture analysis">
                            <span>📅</span>
                            <span class="btn-text">Fixtures</span>
                        </button>
                    </div>
                    
                    <!-- Chat Messages -->
                    <div class="ai-chat-container">
                        <div class="ai-messages" id="ai-messages"></div>
                        <div class="ai-typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                    
                    <!-- Input Area -->
                    <div class="ai-input-container">
                        <textarea 
                            class="ai-input" 
                            id="ai-input" 
                            placeholder="Ask about FPL strategies, transfers, captains..."
                            rows="1"
                        ></textarea>
                        <button class="ai-send-btn" id="ai-send-btn" title="Send message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke-width="2"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Upgrade Prompt -->
                    <div class="ai-upgrade-prompt" style="display: none;">
                        <p>🔒 Upgrade for unlimited AI assistance</p>
                        <button class="ai-upgrade-btn">Go Premium</button>
                    </div>
                </div>
            `;

            // Add styles
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
                    max-width: 80%;
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
                
                .ai-send-btn:hover {
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
            this.typingIndicator = sidebar.querySelector('.ai-typing-indicator');
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
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    this.handleQuickAction(action);
                });
            });

            // Send message
            this.sidebar.querySelector('#ai-send-btn').addEventListener('click', () => {
                this.sendMessage();
            });

            // Enter key to send
            this.input.addEventListener('keydown', (e) => {
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

        handleQuickAction(action) {
            const questions = {
                captain: "Who should I captain this gameweek?",
                transfers: "What transfers should I make this week?",
                value: "Which players are the best value picks?",
                fixtures: "Who has the best fixtures coming up?"
            };

            const question = questions[action];
            if (question) {
                this.input.value = question;
                this.sendMessage();
            }
        }

        sendMessage() {
            const message = this.input.value.trim();
            if (!message) return;

            // Check message limit for free users
            if (this.userType === 'free' && this.messageCount >= CONFIG.FREE_MESSAGE_LIMIT) {
                this.showUpgradePrompt();
                return;
            }

            // Add user message
            this.addMessage(message, 'user');
            this.input.value = '';
            this.input.style.height = 'auto';

            // Show typing indicator
            this.showTypingIndicator();

            // Simulate AI response
            setTimeout(() => {
                const response = this.generateResponse(message);
                this.hideTypingIndicator();
                this.addMessage(response, 'assistant');
                
                // Increment message count
                this.messageCount++;
                this.updateMessageCounter();
                this.saveMessageHistory();
            }, 1000 + Math.random() * 1500);
        }

        generateResponse(message) {
            const lowerMessage = message.toLowerCase();
            
            // Determine response category
            if (lowerMessage.includes('captain') || lowerMessage.includes('captaincy')) {
                return this.getRandomResponse('captain');
            } else if (lowerMessage.includes('transfer') || lowerMessage.includes('sell') || lowerMessage.includes('buy')) {
                return this.getRandomResponse('transfers');
            } else if (lowerMessage.includes('value') || lowerMessage.includes('budget') || lowerMessage.includes('cheap')) {
                return this.getRandomResponse('value');
            } else if (lowerMessage.includes('fixture') || lowerMessage.includes('schedule')) {
                return this.getRandomResponse('fixtures');
            } else if (lowerMessage.includes('premium') || lowerMessage.includes('expensive')) {
                return this.getRandomResponse('premium');
            } else if (lowerMessage.includes('differential') || lowerMessage.includes('unique')) {
                return this.getRandomResponse('differential');
            } else if (lowerMessage.includes('wildcard')) {
                return this.getRandomResponse('wildcard');
            } else if (lowerMessage.includes('chip') || lowerMessage.includes('bench boost') || lowerMessage.includes('triple captain')) {
                return this.getRandomResponse('chips');
            } else {
                return this.getRandomResponse('general');
            }
        }

        getRandomResponse(category) {
            const responses = AI_RESPONSES[category] || AI_RESPONSES.general;
            return responses[Math.floor(Math.random() * responses.length)];
        }

        addMessage(text, sender) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `ai-message ${sender}`;
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = text;
            
            messageDiv.appendChild(bubble);
            this.messagesContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            
            // Save to history
            this.messages.push({ text, sender, timestamp: Date.now() });
        }

        addWelcomeMessage() {
            const welcomeText = "👋 Welcome! I'm your FPL AI Assistant. Ask me anything about Fantasy Premier League - transfers, captains, differentials, or strategy. Use the quick action buttons above for common questions!";
            this.addMessage(welcomeText, 'assistant');
        }

        showTypingIndicator() {
            this.typingIndicator.classList.add('active');
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }

        hideTypingIndicator() {
            this.typingIndicator.classList.remove('active');
        }

        showUpgradePrompt() {
            const upgradePrompt = this.sidebar.querySelector('.ai-upgrade-prompt');
            if (upgradePrompt) {
                upgradePrompt.style.display = 'block';
            }
            
            this.input.disabled = true;
            this.input.placeholder = 'Upgrade to Premium for unlimited messages';
            
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
            const counter = this.sidebar.querySelector('.ai-message-counter');
            if (counter) {
                counter.textContent = this.getMessageCounterText();
            }
        }

        getMessageCounterText() {
            if (this.userType === 'premium') {
                return '✨ Premium Member';
            }
            const remaining = CONFIG.FREE_MESSAGE_LIMIT - this.messageCount;
            return `Free: ${remaining}/${CONFIG.FREE_MESSAGE_LIMIT} messages`;
        }

        checkUserStatus() {
            // Check localStorage for user type
            const userData = localStorage.getItem('fpl_user_data');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    this.userType = user.subscription || 'free';
                } catch (e) {
                    this.userType = 'free';
                }
            }
            
            // Check for auth state if Firebase is available
            if (typeof window.checkAuthState === 'function') {
                window.checkAuthState((user) => {
                    if (user && user.subscription) {
                        this.userType = user.subscription;
                        this.updateMessageCounter();
                    }
                });
            }
        }

        loadMessageHistory() {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    const today = new Date().toDateString();
                    
                    // Reset count if it's a new day
                    if (data.date !== today) {
                        this.messageCount = 0;
                        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                            date: today,
                            count: 0,
                            messages: []
                        }));
                    } else {
                        this.messageCount = data.count || 0;
                        this.messages = data.messages || [];
                        
                        // Restore previous messages
                        if (this.messages.length > 0) {
                            this.messages.slice(-10).forEach(msg => {
                                this.addMessage(msg.text, msg.sender);
                            });
                        }
                    }
                } catch (e) {
                    this.messageCount = 0;
                    this.messages = [];
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
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.aiAssistant = new AIAssistantSidebar();
        });
    } else {
        window.aiAssistant = new AIAssistantSidebar();
    }
})();