// Article Sidebar Ads Injector
// Automatically adds sidebar ads to all article pages

(function() {
    'use strict';

    // Check if we're on an article page
    function isArticlePage() {
        const path = window.location.pathname;
        return path.includes('/articles/') || 
               document.querySelector('.nyt-article') || 
               document.querySelector('article');
    }

    // Create the sidebar HTML
    function createSidebarHTML() {
        return `
        <div class="article-sidebar-injected">
            <!-- FPL AI Assistant Premium Ad -->
            <div class="sidebar-ad premium-highlight">
                <div class="ad-badge">🔥 MOST POPULAR</div>
                <div class="ad-icon">
                    <span>🤖</span>
                </div>
                <h3 class="ad-title">FPL AI Assistant</h3>
                <p class="ad-description">Get personalized transfer advice, captain picks, and differential recommendations powered by AI</p>
                <ul class="ad-features">
                    <li>✓ Spell-check aware</li>
                    <li>✓ Remembers your team</li>
                    <li>✓ xG & xA analysis</li>
                </ul>
                <div class="ad-pricing">
                    <span class="price-label">From</span>
                    <span class="price">$2/mo</span>
                </div>
                <a href="/fpl-ai-assistant.html" class="ad-cta premium-cta">
                    Try AI Assistant
                    <span class="cta-arrow">→</span>
                </a>
            </div>

            <!-- Transfer Simulator Pro Ad -->
            <div class="sidebar-ad">
                <div class="ad-icon gradient-purple">
                    <span>🔄</span>
                </div>
                <h3 class="ad-title">Transfer Simulator Pro</h3>
                <p class="ad-description">AI-powered squad optimization with real-time price predictions</p>
                <ul class="ad-features">
                    <li>✓ Build perfect squads</li>
                    <li>✓ Price change alerts</li>
                    <li>✓ What-if analysis</li>
                </ul>
                <a href="/transfer-simulator-pro.html" class="ad-cta">
                    Optimize Squad
                    <span class="cta-arrow">→</span>
                </a>
            </div>

            <!-- Points Predictor Ad -->
            <div class="sidebar-ad">
                <div class="ad-icon gradient-blue">
                    <span>🔮</span>
                </div>
                <h3 class="ad-title">Points Predictor</h3>
                <p class="ad-description">ML-powered predictions for upcoming gameweeks</p>
                <ul class="ad-features">
                    <li>✓ 5 GWs ahead</li>
                    <li>✓ 85% accuracy</li>
                    <li>✓ Captain picks</li>
                </ul>
                <a href="/player-predictor.html" class="ad-cta">
                    Predict Points
                    <span class="cta-arrow">→</span>
                </a>
            </div>

            <!-- Premium Membership CTA -->
            <div class="sidebar-ad membership-cta">
                <div class="membership-header">
                    <span class="crown-icon">👑</span>
                    <h3>Go Premium</h3>
                </div>
                <p class="membership-text">Unlock all FPL tools & exclusive content</p>
                <div class="membership-benefits">
                    <div class="benefit">📊 All Premium Tools</div>
                    <div class="benefit">📰 Exclusive Articles</div>
                    <div class="benefit">🚫 Ad-Free Browsing</div>
                    <div class="benefit">⚡ Priority Support</div>
                </div>
                <div class="membership-options">
                    <a href="/membership.html" class="membership-btn starter">
                        <span class="plan-name">Starter</span>
                        <span class="plan-price">$2/mo</span>
                    </a>
                    <a href="/membership.html" class="membership-btn pro">
                        <span class="plan-name">Pro</span>
                        <span class="plan-price">$7/mo</span>
                    </a>
                </div>
            </div>
        </div>`;
    }

    // Inject sidebar into article layout
    function injectSidebar() {
        if (!isArticlePage()) return;

        // Find the main content area
        const mainContent = document.querySelector('.main-content') || 
                          document.querySelector('main') || 
                          document.querySelector('.content-wrapper');
        
        if (!mainContent) return;

        // Check if sidebar already exists
        if (document.querySelector('.article-sidebar-injected')) return;

        // Find the article content
        const articleContent = document.querySelector('.nyt-article') || 
                             document.querySelector('article') || 
                             document.querySelector('.article-content');
        
        if (!articleContent) return;

        // Create wrapper if needed
        let wrapper = articleContent.parentElement;
        if (!wrapper.classList.contains('article-with-sidebar-wrapper')) {
            wrapper = document.createElement('div');
            wrapper.className = 'article-with-sidebar-wrapper';
            articleContent.parentNode.insertBefore(wrapper, articleContent);
            wrapper.appendChild(articleContent);
        }

        // Create and add sidebar
        const sidebarDiv = document.createElement('div');
        sidebarDiv.className = 'article-sidebar-container';
        sidebarDiv.innerHTML = createSidebarHTML();
        wrapper.appendChild(sidebarDiv);

        // Add wrapper styles
        addWrapperStyles();
    }

    // Add necessary styles
    function addWrapperStyles() {
        if (document.getElementById('sidebar-injector-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'sidebar-injector-styles';
        styles.textContent = `
            .article-with-sidebar-wrapper {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 40px;
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 20px;
            }

            .article-sidebar-container {
                width: 100%;
            }

            .article-sidebar-injected {
                position: sticky;
                top: 80px;
                max-height: calc(100vh - 100px);
                overflow-y: auto;
                padding-right: 10px;
            }

            .article-sidebar-injected::-webkit-scrollbar {
                width: 6px;
            }

            .article-sidebar-injected::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .article-sidebar-injected::-webkit-scrollbar-thumb {
                background: #37003c;
                border-radius: 3px;
            }

            /* Sidebar Ad Styles */
            .sidebar-ad {
                background: white;
                border-radius: 12px;
                padding: 25px;
                margin-bottom: 25px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .sidebar-ad:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.12);
            }

            .sidebar-ad.premium-highlight {
                border: 2px solid #ffd700;
                background: linear-gradient(135deg, #fffef5, #ffffff);
            }

            .ad-badge {
                position: absolute;
                top: -1px;
                right: -1px;
                background: linear-gradient(135deg, #ff3366, #ff6633);
                color: white;
                padding: 5px 15px;
                border-radius: 0 10px 0 10px;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.5px;
            }

            .ad-icon {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #37003c, #00ff87);
                border-radius: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                margin-bottom: 15px;
            }

            .ad-icon.gradient-purple {
                background: linear-gradient(135deg, #667eea, #764ba2);
            }

            .ad-icon.gradient-blue {
                background: linear-gradient(135deg, #4facfe, #00f2fe);
            }

            .ad-title {
                font-size: 1.3rem;
                font-weight: 700;
                color: #37003c;
                margin: 0 0 10px 0;
            }

            .ad-description {
                font-size: 0.9rem;
                color: #666;
                line-height: 1.5;
                margin: 0 0 15px 0;
            }

            .ad-features {
                list-style: none;
                padding: 0;
                margin: 0 0 20px 0;
            }

            .ad-features li {
                padding: 5px 0;
                font-size: 0.85rem;
                color: #555;
            }

            .ad-pricing {
                display: flex;
                align-items: baseline;
                gap: 5px;
                margin-bottom: 15px;
            }

            .price-label {
                font-size: 0.8rem;
                color: #888;
            }

            .price {
                font-size: 1.5rem;
                font-weight: 800;
                color: #00ff87;
            }

            .ad-cta {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                padding: 12px 20px;
                background: #37003c;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                transition: all 0.3s ease;
                position: relative;
            }

            .ad-cta:hover {
                background: #00ff87;
                color: #37003c;
                padding-right: 30px;
            }

            .ad-cta.premium-cta {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                color: #37003c;
            }

            .cta-arrow {
                position: absolute;
                right: 20px;
                transition: right 0.3s ease;
            }

            .ad-cta:hover .cta-arrow {
                right: 15px;
            }

            /* Membership CTA */
            .membership-cta {
                background: linear-gradient(135deg, #37003c, #4a0e4e);
                color: white;
                padding: 30px 25px;
            }

            .membership-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }

            .crown-icon {
                font-size: 2rem;
            }

            .membership-header h3 {
                color: white;
                margin: 0;
            }

            .membership-text {
                color: rgba(255,255,255,0.9);
                margin-bottom: 20px;
            }

            .membership-benefits {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
                margin-bottom: 20px;
            }

            .benefit {
                background: rgba(255,255,255,0.1);
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.85rem;
            }

            .membership-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }

            .membership-btn {
                background: rgba(255,255,255,0.2);
                color: white;
                padding: 10px;
                border-radius: 8px;
                text-decoration: none;
                text-align: center;
                transition: all 0.3s ease;
                border: 1px solid rgba(255,255,255,0.3);
            }

            .membership-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.05);
            }

            .membership-btn.pro {
                background: linear-gradient(135deg, #00ff87, #60efaa);
                color: #37003c;
                border: none;
            }

            .plan-name {
                display: block;
                font-weight: 700;
                font-size: 0.9rem;
            }

            .plan-price {
                display: block;
                font-size: 1.1rem;
                margin-top: 3px;
            }

            /* Responsive */
            @media (max-width: 1200px) {
                .article-with-sidebar-wrapper {
                    grid-template-columns: 1fr;
                }

                .article-sidebar-injected {
                    position: relative;
                    top: 0;
                    max-height: none;
                    margin-top: 40px;
                }
            }

            @media (max-width: 768px) {
                .article-with-sidebar-wrapper {
                    padding: 0 15px;
                }

                .sidebar-ad {
                    padding: 20px;
                }

                .ad-title {
                    font-size: 1.1rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSidebar);
    } else {
        injectSidebar();
    }
})();