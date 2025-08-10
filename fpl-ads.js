// FPL Premium Tools Advertisement System
(function() {
    'use strict';

    // Ad configurations with rotating content
    const fplAds = [
        {
            id: 'ai-assistant-ad',
            title: '🤖 FPL AI Assistant',
            subtitle: 'Your Personal FPL Expert',
            description: 'Get instant transfer advice, captain picks, and differential recommendations',
            cta: 'Try AI Assistant FREE',
            link: '/fpl-ai-assistant.html',
            color: 'linear-gradient(135deg, #667eea, #764ba2)',
            features: ['Spell-check aware', 'Remembers your team', 'xG Analysis'],
            priority: 1
        },
        {
            id: 'transfer-simulator-ad',
            title: '🔄 Transfer Simulator Pro',
            subtitle: 'Plan Perfect Transfers',
            description: 'AI-powered squad optimization with price predictions',
            cta: 'Optimize Squad Now',
            link: '/transfer-simulator-pro.html',
            color: 'linear-gradient(135deg, #f093fb, #f5576c)',
            features: ['AI Optimization', 'Price Tracking', 'What-if Analysis'],
            priority: 2
        },
        {
            id: 'predictor-ad',
            title: '🔮 Points Predictor',
            subtitle: 'ML-Powered Predictions',
            description: 'Know who will score big before the gameweek starts',
            cta: 'Predict Points',
            link: '/player-predictor.html',
            color: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            features: ['5 GWs ahead', 'Captain picks', '85% accuracy'],
            priority: 3
        },
        {
            id: 'premium-bundle-ad',
            title: '💎 Premium Bundle',
            subtitle: 'Save 50% Today',
            description: 'Get all premium tools for the price of one',
            cta: 'Unlock Everything',
            link: '/fpl-premium-hub.html',
            color: 'linear-gradient(135deg, #fa709a, #fee140)',
            features: ['All Tools Included', 'Priority Support', 'Season Pass'],
            priority: 1,
            special: true
        }
    ];

    // Create sidebar ad HTML
    function createSidebarAd(ad) {
        return `
            <div class="fpl-sidebar-ad ${ad.special ? 'special-offer' : ''}" data-ad-id="${ad.id}">
                <div class="fpl-ad-header" style="background: ${ad.color}">
                    <h3 class="fpl-ad-title">${ad.title}</h3>
                    <p class="fpl-ad-subtitle">${ad.subtitle}</p>
                </div>
                <div class="fpl-ad-body">
                    <p class="fpl-ad-description">${ad.description}</p>
                    <ul class="fpl-ad-features">
                        ${ad.features.map(f => `<li>✓ ${f}</li>`).join('')}
                    </ul>
                    <a href="${ad.link}" class="fpl-ad-cta">
                        ${ad.cta}
                        <span class="cta-arrow">→</span>
                    </a>
                </div>
                ${ad.special ? '<div class="special-badge">LIMITED OFFER</div>' : ''}
            </div>
        `;
    }

    // Create floating corner ad
    function createFloatingAd() {
        return `
            <div class="fpl-floating-ad" id="fpl-floating-ad">
                <button class="floating-close" onclick="this.parentElement.style.display='none'">×</button>
                <div class="floating-content">
                    <div class="floating-icon">🤖</div>
                    <div class="floating-text">
                        <strong>Need FPL Help?</strong>
                        <span>AI Assistant is online!</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Create banner ad for article pages
    function createBannerAd() {
        const randomAd = fplAds[Math.floor(Math.random() * fplAds.length)];
        return `
            <div class="fpl-banner-ad" style="background: ${randomAd.color}">
                <div class="banner-content">
                    <div class="banner-left">
                        <h3>${randomAd.title}</h3>
                        <p>${randomAd.description}</p>
                    </div>
                    <div class="banner-right">
                        <a href="${randomAd.link}" class="banner-cta">${randomAd.cta}</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Add CSS styles
    function injectStyles() {
        const styles = `
            <style>
                /* Sidebar Ads */
                .fpl-sidebar-ad {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                    transition: transform 0.3s ease;
                    position: relative;
                }

                .fpl-sidebar-ad:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                }

                .fpl-ad-header {
                    padding: 20px;
                    color: white;
                    text-align: center;
                }

                .fpl-ad-title {
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin-bottom: 5px;
                }

                .fpl-ad-subtitle {
                    font-size: 0.9rem;
                    opacity: 0.95;
                }

                .fpl-ad-body {
                    padding: 20px;
                }

                .fpl-ad-description {
                    color: #666;
                    margin-bottom: 15px;
                    line-height: 1.5;
                }

                .fpl-ad-features {
                    list-style: none;
                    padding: 0;
                    margin-bottom: 20px;
                }

                .fpl-ad-features li {
                    padding: 5px 0;
                    color: #444;
                    font-size: 0.9rem;
                }

                .fpl-ad-cta {
                    display: block;
                    width: 100%;
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #38003c, #4a0e4e);
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 700;
                    text-align: center;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .fpl-ad-cta:hover {
                    background: linear-gradient(135deg, #4a0e4e, #38003c);
                    padding-right: 35px;
                }

                .cta-arrow {
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    transition: right 0.3s ease;
                }

                .fpl-ad-cta:hover .cta-arrow {
                    right: 15px;
                }

                .special-offer {
                    border: 2px solid #ffd700;
                }

                .special-badge {
                    position: absolute;
                    top: 10px;
                    right: -35px;
                    background: linear-gradient(135deg, #ff3366, #ff6633);
                    color: white;
                    padding: 5px 40px;
                    transform: rotate(45deg);
                    font-size: 0.7rem;
                    font-weight: 700;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                }

                /* Floating Corner Ad */
                .fpl-floating-ad {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #38003c, #00ff87);
                    border-radius: 60px;
                    padding: 15px 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    z-index: 1000;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .fpl-floating-ad:hover {
                    transform: scale(1.1);
                    box-shadow: 0 15px 40px rgba(0,0,0,0.4);
                }

                .floating-close {
                    position: absolute;
                    top: -5px;
                    right: 5px;
                    background: rgba(255,255,255,0.9);
                    border: none;
                    border-radius: 50%;
                    width: 25px;
                    height: 25px;
                    font-size: 18px;
                    cursor: pointer;
                    display: none;
                }

                .fpl-floating-ad:hover .floating-close {
                    display: block;
                }

                .floating-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: white;
                }

                .floating-icon {
                    font-size: 2rem;
                }

                .floating-text {
                    display: flex;
                    flex-direction: column;
                }

                .floating-text strong {
                    font-size: 0.9rem;
                }

                .floating-text span {
                    font-size: 0.75rem;
                    opacity: 0.9;
                }

                /* Banner Ads */
                .fpl-banner-ad {
                    border-radius: 12px;
                    padding: 25px;
                    margin: 30px 0;
                    color: white;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                }

                .banner-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .banner-left h3 {
                    font-size: 1.5rem;
                    margin-bottom: 5px;
                }

                .banner-left p {
                    opacity: 0.95;
                }

                .banner-cta {
                    background: rgba(255,255,255,0.2);
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 700;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                    display: inline-block;
                }

                .banner-cta:hover {
                    background: rgba(255,255,255,0.3);
                    transform: scale(1.05);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .fpl-floating-ad {
                        bottom: 10px;
                        right: 10px;
                        padding: 10px 15px;
                    }

                    .floating-text {
                        display: none;
                    }

                    .banner-content {
                        flex-direction: column;
                        text-align: center;
                    }

                    .fpl-sidebar-ad {
                        margin: 10px;
                    }
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Insert ads into sidebar
    function insertSidebarAds() {
        // Check if we're on an article page or main page
        const isArticlePage = window.location.pathname.includes('/articles/');
        const sidebar = document.querySelector('.sidebar, .article-sidebar, aside');
        
        if (sidebar) {
            // Select 2 random ads to show
            const selectedAds = fplAds.sort(() => 0.5 - Math.random()).slice(0, 2);
            const adsHTML = selectedAds.map(ad => createSidebarAd(ad)).join('');
            
            // Create ads container
            const adsContainer = document.createElement('div');
            adsContainer.className = 'fpl-ads-container';
            adsContainer.innerHTML = adsHTML;
            
            // Insert at the top of sidebar
            sidebar.insertBefore(adsContainer, sidebar.firstChild);
        }
    }

    // Insert banner ad in articles
    function insertBannerAd() {
        const articleContent = document.querySelector('.article-content, .main-content article, article');
        if (articleContent) {
            const paragraphs = articleContent.querySelectorAll('p');
            if (paragraphs.length > 3) {
                // Insert after 3rd paragraph
                const bannerDiv = document.createElement('div');
                bannerDiv.innerHTML = createBannerAd();
                paragraphs[2].after(bannerDiv);
            }
        }
    }

    // Insert floating ad
    function insertFloatingAd() {
        // Only show on certain pages
        if (!window.location.pathname.includes('fpl-premium-hub')) {
            const floatingDiv = document.createElement('div');
            floatingDiv.innerHTML = createFloatingAd();
            document.body.appendChild(floatingDiv.firstElementChild);
            
            // Add click handler
            const floatingAd = document.getElementById('fpl-floating-ad');
            if (floatingAd) {
                floatingAd.addEventListener('click', function(e) {
                    if (!e.target.classList.contains('floating-close')) {
                        window.location.href = '/fpl-ai-assistant.html';
                    }
                });
            }
        }
    }

    // Track ad impressions and clicks
    function trackAdEvent(eventType, adId) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventType, {
                'event_category': 'FPL_Ads',
                'event_label': adId
            });
        }
    }

    // Rotate ads periodically
    function rotateAds() {
        setInterval(() => {
            const adsContainer = document.querySelector('.fpl-ads-container');
            if (adsContainer) {
                const selectedAds = fplAds.sort(() => 0.5 - Math.random()).slice(0, 2);
                adsContainer.innerHTML = selectedAds.map(ad => createSidebarAd(ad)).join('');
                attachAdListeners();
            }
        }, 30000); // Rotate every 30 seconds
    }

    // Attach click listeners to ads
    function attachAdListeners() {
        document.querySelectorAll('.fpl-ad-cta').forEach(cta => {
            cta.addEventListener('click', function(e) {
                const adId = this.closest('.fpl-sidebar-ad')?.dataset.adId;
                if (adId) {
                    trackAdEvent('click', adId);
                }
            });
        });
    }

    // Initialize ads system
    function init() {
        // Don't show ads on FPL tool pages themselves
        const fplPages = ['/fpl-ai-assistant.html', '/transfer-simulator-pro.html', '/player-predictor.html'];
        const currentPath = window.location.pathname;
        
        if (!fplPages.some(page => currentPath.includes(page))) {
            injectStyles();
            insertSidebarAds();
            insertBannerAd();
            insertFloatingAd();
            attachAdListeners();
            rotateAds();
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();