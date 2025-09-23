// EPL News Hub - Content Discovery & Recommendation Engine
// Personalized content recommendations to increase page views

(function() {
    'use strict';
    
    // Track user behavior and preferences
    const UserBehavior = {
        views: JSON.parse(localStorage.getItem('eplUserViews') || '[]'),
        interests: JSON.parse(localStorage.getItem('eplInterests') || '{}'),
        lastVisit: localStorage.getItem('eplLastVisit') || null,
        
        trackView(article) {
            this.views.push({
                url: window.location.href,
                title: document.title,
                timestamp: Date.now(),
                category: this.detectCategory()
            });
            
            // Keep only last 50 views
            if (this.views.length > 50) {
                this.views = this.views.slice(-50);
            }
            
            localStorage.setItem('eplUserViews', JSON.stringify(this.views));
            this.updateInterests();
        },
        
        detectCategory() {
            const url = window.location.pathname;
            const title = document.title.toLowerCase();
            
            if (url.includes('transfer') || title.includes('transfer')) return 'transfers';
            if (url.includes('fpl') || title.includes('fantasy')) return 'fantasy';
            if (title.includes('match') || title.includes('game')) return 'matches';
            if (title.includes('player')) return 'players';
            if (title.includes('analysis')) return 'analysis';
            return 'news';
        },
        
        updateInterests() {
            const category = this.detectCategory();
            this.interests[category] = (this.interests[category] || 0) + 1;
            localStorage.setItem('eplInterests', JSON.stringify(this.interests));
        },
        
        getTopInterests() {
            return Object.entries(this.interests)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([category]) => category);
        }
    };
    
    // Content recommendation system
    const RecommendationEngine = {
        articles: [
            // Transfers
            { title: "BREAKING: Liverpool Close to Signing €80m Star", category: "transfers", url: "/articles/liverpool-transfer-news.html", image: "/images/liverpool.jpg", views: 15234, trending: true },
            { title: "Chelsea's January Transfer Plans Revealed", category: "transfers", url: "/articles/chelsea-transfers.html", image: "/images/chelsea.jpg", views: 12456 },
            { title: "Man United Eye Three January Signings", category: "transfers", url: "/articles/united-transfers.html", image: "/images/united.jpg", views: 11234 },
            
            // Fantasy
            { title: "FPL Captain Picks GW22: Salah vs Haaland", category: "fantasy", url: "/fpl-ai-assistant.html", image: "/images/fpl.jpg", views: 18976, trending: true },
            { title: "Top 5 FPL Differentials for GW23", category: "fantasy", url: "/fpl-premium-hub.html", image: "/images/fpl2.jpg", views: 14532 },
            { title: "FPL Wildcard Strategy Guide", category: "fantasy", url: "/transfer-simulator-pro.html", image: "/images/wildcard.jpg", views: 13456 },
            
            // Matches
            { title: "Arsenal vs Liverpool: Tactical Preview", category: "matches", url: "/articles/arsenal-liverpool.html", image: "/images/arsenal.jpg", views: 21345, trending: true },
            { title: "Man City's Title Race Analysis", category: "matches", url: "/articles/city-analysis.html", image: "/images/city.jpg", views: 16789 },
            
            // Players
            { title: "Exclusive: Haaland Interview", category: "players", url: "/articles/haaland-interview.html", image: "/images/haaland.jpg", views: 25678, trending: true },
            { title: "Rising Stars: Top 10 Young EPL Talents", category: "players", url: "/articles/young-talents.html", image: "/images/talents.jpg", views: 14567 },
            
            // Analysis
            { title: "How Arsenal Fixed Their Defense", category: "analysis", url: "/articles/arsenal-defense.html", image: "/images/tactics.jpg", views: 12890 },
            { title: "Why Liverpool's System Works", category: "analysis", url: "/articles/liverpool-system.html", image: "/images/klopp.jpg", views: 11234 }
        ],
        
        getRecommendations(count = 6) {
            const interests = UserBehavior.getTopInterests();
            const currentUrl = window.location.href;
            
            // Filter out current article
            let available = this.articles.filter(a => !currentUrl.includes(a.url));
            
            // Prioritize by user interests
            if (interests.length > 0) {
                available.sort((a, b) => {
                    const aScore = interests.indexOf(a.category) !== -1 ? 10 - interests.indexOf(a.category) : 0;
                    const bScore = interests.indexOf(b.category) !== -1 ? 10 - interests.indexOf(b.category) : 0;
                    
                    // Also factor in trending and views
                    const aTrendScore = a.trending ? 5 : 0;
                    const bTrendScore = b.trending ? 5 : 0;
                    
                    return (bScore + bTrendScore + b.views/1000) - (aScore + aTrendScore + a.views/1000);
                });
            }
            
            return available.slice(0, count);
        }
    };
    
    // Create recommendation widgets
    function createRecommendationWidget() {
        const widget = document.createElement('div');
        widget.className = 'recommendation-widget';
        widget.innerHTML = `
            <style>
                .recommendation-widget {
                    margin: 40px 0;
                    padding: 30px;
                    background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
                    border-radius: 15px;
                }
                
                .rec-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 25px;
                }
                
                .rec-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: #1a1a1a;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .rec-badge {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .rec-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                
                .rec-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    cursor: pointer;
                    position: relative;
                }
                
                .rec-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                }
                
                .rec-card-image {
                    width: 100%;
                    height: 180px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    position: relative;
                    overflow: hidden;
                }
                
                .rec-card-image::after {
                    content: '⚽';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 48px;
                    opacity: 0.5;
                }
                
                .rec-trending {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .rec-card-content {
                    padding: 20px;
                }
                
                .rec-card-category {
                    color: #6366f1;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-bottom: 8px;
                }
                
                .rec-card-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 10px;
                    line-height: 1.3;
                }
                
                .rec-card-stats {
                    display: flex;
                    gap: 15px;
                    font-size: 13px;
                    color: #666;
                }
                
                .rec-stat {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                @media (max-width: 768px) {
                    .rec-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .recommendation-widget {
                        padding: 20px 15px;
                    }
                }
            </style>
            
            <div class="rec-header">
                <h2 class="rec-title">
                    <span>🔥 Recommended For You</span>
                    <span class="rec-badge">PERSONALIZED</span>
                </h2>
            </div>
            
            <div class="rec-grid" id="recommendations-container">
                <!-- Recommendations will be inserted here -->
            </div>
        `;
        
        return widget;
    }
    
    // Create infinite scroll widget
    function createInfiniteScroll() {
        const scrollWidget = document.createElement('div');
        scrollWidget.className = 'infinite-scroll-widget';
        scrollWidget.innerHTML = `
            <style>
                .infinite-scroll-widget {
                    margin: 40px 0;
                    text-align: center;
                }
                
                .load-more-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    border-radius: 30px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .load-more-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
                }
                
                .load-more-btn.loading {
                    pointer-events: none;
                    opacity: 0.7;
                }
                
                .load-more-btn.loading::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: loading-shine 1s infinite;
                }
                
                @keyframes loading-shine {
                    to { left: 100%; }
                }
                
                .articles-end {
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }
            </style>
            
            <button class="load-more-btn" id="load-more">
                Load More Articles
            </button>
        `;
        
        return scrollWidget;
    }
    
    // Create trending sidebar
    function createTrendingSidebar() {
        const sidebar = document.createElement('div');
        sidebar.className = 'trending-sidebar';
        sidebar.innerHTML = `
            <style>
                .trending-sidebar {
                    position: fixed;
                    right: -350px;
                    top: 100px;
                    width: 320px;
                    background: white;
                    border-radius: 15px 0 0 15px;
                    box-shadow: -5px 0 20px rgba(0,0,0,0.1);
                    padding: 20px;
                    z-index: 9997;
                    transition: right 0.5s ease;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                
                .trending-sidebar.visible {
                    right: 0;
                }
                
                .trending-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f0f0f0;
                }
                
                .trending-title {
                    font-size: 18px;
                    font-weight: 800;
                    color: #1a1a1a;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .trending-live {
                    width: 8px;
                    height: 8px;
                    background: #ff4757;
                    border-radius: 50%;
                    animation: live-pulse 1.5s infinite;
                }
                
                @keyframes live-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.5); }
                }
                
                .trending-item {
                    padding: 15px 0;
                    border-bottom: 1px solid #f0f0f0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .trending-item:hover {
                    padding-left: 10px;
                }
                
                .trending-number {
                    display: inline-block;
                    width: 24px;
                    height: 24px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                    line-height: 24px;
                    border-radius: 50%;
                    font-size: 12px;
                    font-weight: 700;
                    margin-right: 10px;
                }
                
                .trending-item-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 5px;
                }
                
                .trending-item-meta {
                    font-size: 12px;
                    color: #999;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .trending-toggle {
                    position: absolute;
                    left: -40px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 40px;
                    height: 60px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px 0 0 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    font-size: 20px;
                }
                
                @media (max-width: 1200px) {
                    .trending-sidebar {
                        display: none;
                    }
                }
            </style>
            
            <div class="trending-toggle" onclick="this.parentElement.classList.toggle('visible')">
                📈
            </div>
            
            <div class="trending-header">
                <div class="trending-title">
                    <span class="trending-live"></span>
                    <span>Trending Now</span>
                </div>
            </div>
            
            <div id="trending-list">
                <!-- Trending items will be inserted here -->
            </div>
        `;
        
        return sidebar;
    }
    
    // Populate recommendations
    function populateRecommendations() {
        const container = document.getElementById('recommendations-container');
        if (!container) return;
        
        const recommendations = RecommendationEngine.getRecommendations(6);
        
        container.innerHTML = recommendations.map(article => `
            <div class="rec-card" onclick="window.location.href='${article.url}'">
                <div class="rec-card-image">
                    ${article.trending ? '<div class="rec-trending">🔥 Trending</div>' : ''}
                </div>
                <div class="rec-card-content">
                    <div class="rec-card-category">${article.category}</div>
                    <div class="rec-card-title">${article.title}</div>
                    <div class="rec-card-stats">
                        <span class="rec-stat">👁 ${(article.views / 1000).toFixed(1)}k views</span>
                        <span class="rec-stat">⏱ 3 min read</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    // Populate trending sidebar
    function populateTrending() {
        const container = document.getElementById('trending-list');
        if (!container) return;
        
        const trending = RecommendationEngine.articles
            .filter(a => a.trending)
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);
        
        container.innerHTML = trending.map((article, index) => `
            <div class="trending-item" onclick="window.location.href='${article.url}'">
                <span class="trending-number">${index + 1}</span>
                <div class="trending-item-title">${article.title}</div>
                <div class="trending-item-meta">
                    <span>👁 ${(article.views / 1000).toFixed(1)}k</span>
                    <span>🔥 ${article.category}</span>
                </div>
            </div>
        `).join('');
    }
    
    // Initialize content discovery
    function init() {
        // Track current page view
        UserBehavior.trackView();
        
        // Find main content area
        const mainContent = document.querySelector('article, main, .content, .container') || document.body;
        
        // Add recommendation widget after main content
        const recWidget = createRecommendationWidget();
        mainContent.appendChild(recWidget);
        populateRecommendations();
        
        // Add infinite scroll
        const scrollWidget = createInfiniteScroll();
        mainContent.appendChild(scrollWidget);
        
        // Add trending sidebar
        const sidebar = createTrendingSidebar();
        document.body.appendChild(sidebar);
        populateTrending();
        
        // Show trending sidebar after scroll
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY > 500;
            const sidebar = document.querySelector('.trending-sidebar');
            if (sidebar && scrolled && !sidebar.classList.contains('visible')) {
                sidebar.classList.add('visible');
            }
        });
        
        // Handle load more button
        document.getElementById('load-more')?.addEventListener('click', function() {
            this.classList.add('loading');
            this.textContent = 'Loading...';
            
            setTimeout(() => {
                // Simulate loading more content
                const newRecs = RecommendationEngine.getRecommendations(3);
                const container = document.getElementById('recommendations-container');
                
                newRecs.forEach(article => {
                    const card = document.createElement('div');
                    card.className = 'rec-card';
                    card.onclick = () => window.location.href = article.url;
                    card.innerHTML = `
                        <div class="rec-card-image">
                            ${article.trending ? '<div class="rec-trending">🔥 Trending</div>' : ''}
                        </div>
                        <div class="rec-card-content">
                            <div class="rec-card-category">${article.category}</div>
                            <div class="rec-card-title">${article.title}</div>
                            <div class="rec-card-stats">
                                <span class="rec-stat">👁 ${(article.views / 1000).toFixed(1)}k views</span>
                                <span class="rec-stat">⏱ 3 min read</span>
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                });
                
                this.classList.remove('loading');
                this.textContent = 'Load More Articles';
            }, 1000);
        });
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();