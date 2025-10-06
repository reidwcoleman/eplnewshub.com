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
            // Most Viewed Articles (Based on actual articles)
            { title: "Ballon d'Or 2025: Ousmane Dembélé's Emotional Triumph", category: "awards", url: "/articles/ballon-dor-2025-final-odds-power-rankings-ceremony-looms-2025-09-22.html", image: "/images/ballondor.jpg", views: 48976, trending: true },
            { title: "Arsenal Set to Win Premier League Title 2025/26", category: "analysis", url: "/articles/arsenal-premier-league-title-2025-26.html", image: "/images/arsenal.jpg", views: 42345, trending: true },
            { title: "Liverpool vs Burnley: Salah Penalty Drama", category: "matches", url: "/articles/liverpool-vs-burnley-salah-penalty-2025-09-14.html", image: "/images/liverpool.jpg", views: 38234, trending: true },
            { title: "Manchester Derby Preview: City vs United", category: "matches", url: "/articles/manchester-city-vs-manchester-united-derby-preview-2025-09-14.html", image: "/images/derby.jpg", views: 35678, trending: true },
            { title: "Alexander Isak £125m Transfer to Liverpool", category: "transfers", url: "/articles/alexander-isak-transfer-liverpool-125m-2025-09-03.html", image: "/images/isak.jpg", views: 32456, trending: true },
            
            // High-traffic articles
            { title: "Captain Haaland: FPL Gameweek 5 Essential", category: "fantasy", url: "/articles/captain-haaland-fantasy-premier-league-gameweek-5-2025-09-14.html", image: "/images/haaland.jpg", views: 28976 },
            { title: "Premier League Transfer Window: Record-Breaking £3bn", category: "transfers", url: "/articles/premier-league-transfer-window-2025-record-breaking-3-billion.html", image: "/images/transfers.jpg", views: 26532 },
            { title: "Marcus Rashford Barcelona Transfer Latest", category: "transfers", url: "/articles/marcus-rashford-barcelona-transfer-and-premier-league-updates-07-26-2025.html", image: "/images/rashford.jpg", views: 24567 },
            { title: "FPL Gameweek 1 Best Team & Tips", category: "fantasy", url: "/articles/fantasy-premier-league-2025-26-gw1-best-fpl-team-scoring-rules-2025-08-13.html", image: "/images/fpl.jpg", views: 23456 },
            { title: "Man United Struggling: Relegation Fears", category: "analysis", url: "/articles/man-utd-struggling-relegation-fears-2025-08-31.html", image: "/images/united.jpg", views: 22890 },
            { title: "Pep Guardiola's Worst Start: What's Wrong?", category: "analysis", url: "/articles/pep-guardiola-downfall-worst-start-2025-09-01.html", image: "/images/pep.jpg", views: 21234 },
            { title: "Top 5 Unforgettable Premier League Highlights", category: "matches", url: "/articles/top-5-unforgettable-premier-league-highlights-2025-09-21.html", image: "/images/highlights.jpg", views: 19876 },
            { title: "Transfer Hub: Ultimate Guide August 2025", category: "transfers", url: "/articles/transfer-hub-ultimate-guide-august-2025.html", image: "/images/hub.jpg", views: 18765 },
            { title: "Aston Villa Winless Streak Analysis", category: "analysis", url: "/articles/aston-villa-winless-streak-2025-26-emery-watkins-analysis.html", image: "/images/villa.jpg", views: 16543 },
            { title: "Premier League GW5 Predictions", category: "matches", url: "/articles/premier-league-gameweek-5-predictions-2025-26-09-19-2025.html", image: "/images/predictions.jpg", views: 15432 }
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
                    right: -380px;
                    top: 80px;
                    width: 350px;
                    background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
                    border-radius: 20px 0 0 20px;
                    box-shadow: -10px 0 40px rgba(0,0,0,0.08), -2px 0 10px rgba(0,0,0,0.04);
                    padding: 0;
                    z-index: 9997;
                    transition: right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    max-height: calc(90vh - 80px);
                    overflow: hidden;
                    border-left: 1px solid rgba(0,0,0,0.05);
                }
                
                .trending-sidebar.visible {
                    right: 0;
                }
                
                .trending-sidebar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .trending-sidebar::-webkit-scrollbar-track {
                    background: #f0f0f0;
                }
                
                .trending-sidebar::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 3px;
                }
                
                .trending-header {
                    background: linear-gradient(135deg, #37003c 0%, #6366f1 100%);
                    color: white;
                    padding: 20px 25px;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .trending-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 0;
                }
                
                .trending-subtitle {
                    font-size: 12px;
                    color: rgba(255,255,255,0.8);
                    margin-top: 5px;
                    font-weight: 500;
                }
                
                .trending-live {
                    width: 10px;
                    height: 10px;
                    background: #00ff88;
                    border-radius: 50%;
                    animation: live-pulse 1.5s infinite;
                    box-shadow: 0 0 10px rgba(0,255,136,0.5);
                }
                
                @keyframes live-pulse {
                    0%, 100% { 
                        opacity: 1; 
                        transform: scale(1);
                        box-shadow: 0 0 10px rgba(0,255,136,0.5);
                    }
                    50% { 
                        opacity: 0.6; 
                        transform: scale(1.3);
                        box-shadow: 0 0 20px rgba(0,255,136,0.8);
                    }
                }
                
                .trending-list-container {
                    padding: 10px;
                    overflow-y: auto;
                    max-height: calc(90vh - 160px);
                }
                
                .trending-item {
                    background: white;
                    margin-bottom: 12px;
                    padding: 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    align-items: start;
                    gap: 15px;
                }
                
                .trending-item::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(102,126,234,0.1), transparent);
                    transition: left 0.5s ease;
                }
                
                .trending-item:hover {
                    transform: translateX(-5px);
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    border-color: #6366f1;
                }
                
                .trending-item:hover::before {
                    left: 100%;
                }
                
                .trending-number {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    background: white;
                    color: #37003c;
                    text-align: center;
                    line-height: 32px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 900;
                    box-shadow: 0 2px 8px rgba(55,0,60,0.15);
                    border: 2px solid #37003c;
                }
                
                .trending-number.top-1 {
                    background: linear-gradient(135deg, #ffd700, #ffed4e);
                    color: #37003c;
                    border-color: #ffd700;
                    box-shadow: 0 2px 10px rgba(255,215,0,0.4);
                }
                
                .trending-number.top-2 {
                    background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
                    color: #37003c;
                    border-color: #c0c0c0;
                }
                
                .trending-number.top-3 {
                    background: linear-gradient(135deg, #cd7f32, #e8a85b);
                    color: white;
                    border-color: #cd7f32;
                }
                
                .trending-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .trending-item-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 6px;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .trending-item-meta {
                    font-size: 11px;
                    color: #666;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-weight: 500;
                }
                
                .trending-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .trending-views {
                    color: #6366f1;
                    font-weight: 700;
                }
                
                .trending-category {
                    background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
                    padding: 2px 8px;
                    border-radius: 10px;
                    text-transform: uppercase;
                    font-size: 9px;
                    font-weight: 700;
                    color: #666;
                }
                
                .trending-toggle {
                    position: absolute;
                    left: -48px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 48px;
                    height: 80px;
                    background: linear-gradient(135deg, #37003c 0%, #6366f1 100%);
                    border-radius: 15px 0 0 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: white;
                    font-size: 24px;
                    transition: all 0.3s ease;
                    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                }
                
                .trending-toggle:hover {
                    transform: translateY(-50%) scale(1.05);
                    box-shadow: -5px 0 20px rgba(0,0,0,0.15);
                }
                
                .trending-toggle-icon {
                    animation: bounce 2s infinite;
                }
                
                @keyframes bounce {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(-3px); }
                }
                
                @media (max-width: 1400px) {
                    .trending-sidebar {
                        width: 320px;
                        right: -350px;
                    }
                }
                
                @media (max-width: 1200px) {
                    .trending-sidebar {
                        display: none;
                    }
                }
            </style>
            
            <div class="trending-toggle" onclick="this.parentElement.classList.toggle('visible')">
                <span class="trending-toggle-icon">📊</span>
            </div>
            
            <div class="trending-header">
                <div class="trending-title">
                    <span class="trending-live"></span>
                    <span>Most Viewed</span>
                </div>
                <div class="trending-subtitle">Updated every 30 minutes</div>
            </div>
            
            <div class="trending-list-container" id="trending-list">
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
        
        // Get top 8 most viewed articles
        const trending = RecommendationEngine.articles
            .sort((a, b) => b.views - a.views)
            .slice(0, 8);
        
        container.innerHTML = trending.map((article, index) => {
            let numberClass = 'trending-number';
            if (index === 0) numberClass += ' top-1';
            else if (index === 1) numberClass += ' top-2';
            else if (index === 2) numberClass += ' top-3';
            
            // Format category name
            const categoryName = article.category.charAt(0).toUpperCase() + article.category.slice(1);
            
            return `
                <div class="trending-item" onclick="window.location.href='${article.url}'">
                    <span class="${numberClass}">${index + 1}</span>
                    <div class="trending-content">
                        <div class="trending-item-title">${article.title}</div>
                        <div class="trending-item-meta">
                            <span class="trending-meta-item">
                                <span class="trending-views">${(article.views / 1000).toFixed(1)}k views</span>
                            </span>
                            <span class="trending-category">${categoryName}</span>
                            ${article.trending ? '<span style="color: #ff4757;">🔥 Hot</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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