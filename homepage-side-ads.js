// Homepage Right Sidebar Ads Component
// Creates a fixed right sidebar with rotating promotional content

(function() {
    'use strict';

    // Array of different ads to rotate
    const sidebarAds = [
        {
            icon: '🤖',
            image: '/fpl-ai-assistant-icon.png',
            title: 'FPL AI Assistant',
            desc: 'Get instant transfer advice & captain picks',
            price: '$2/mo',
            link: '/fpl-ai-assistant.html',
            cta: 'Try Now →',
            color: '#37003c'
        },
        {
            icon: '🔄',
            image: '/transfer-simulator-icon.png',
            title: 'Transfer Simulator',
            desc: 'AI-powered squad optimization',
            price: 'Pro Feature',
            link: '/transfer-simulator-pro.html',
            cta: 'Optimize →',
            color: '#00ff87'
        },
        {
            icon: '🔮',
            image: '/points-predictor-icon.png',
            title: 'Points Predictor',
            desc: 'ML-powered gameweek predictions',
            price: 'Pro Feature',
            link: '/fpl-player-analyzer.html',
            cta: 'Predict →',
            color: '#667eea'
        },
        {
            icon: '💎',
            image: '/premium-hub-icon.png',
            title: 'Premium Hub',
            desc: 'All FPL tools in one place',
            price: 'From $2/mo',
            link: '/fpl-premium-hub.html',
            cta: 'Explore →',
            color: '#ffd700'
        }
    ];

    let currentAdIndex = 0;

    // Create sidebar ad HTML
    function createSidebarAd(ad) {
        return `
            <div class="homepage-sidebar-ad" style="border-color: ${ad.color};">
                <div class="sidebar-ad-content">
                    <div class="sidebar-ad-image-container">
                        <img src="${ad.image}" alt="${ad.title}" class="sidebar-ad-image" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div class="sidebar-ad-icon" style="display:none;">${ad.icon}</div>
                    </div>
                    <h4 class="sidebar-ad-title">${ad.title}</h4>
                    <p class="sidebar-ad-desc">${ad.desc}</p>
                    <div class="sidebar-ad-price">${ad.price}</div>
                    <a href="${ad.link}" class="sidebar-ad-btn" style="background: linear-gradient(135deg, ${ad.color}, ${ad.color}dd);">
                        ${ad.cta}
                    </a>
                </div>
            </div>
        `;
    }

    // Create the sidebar container
    function createSidebarContainer() {
        const container = document.createElement('div');
        container.className = 'homepage-right-sidebar';
        container.id = 'homepage-right-sidebar';
        
        // Create initial content
        container.innerHTML = `
            <div class="sidebar-header">
                <h3>🌟 Premium Tools</h3>
            </div>
            <div class="sidebar-ads-container" id="sidebar-ads-container">
                ${createSidebarAd(sidebarAds[0])}
            </div>
            <div class="sidebar-footer">
                <button class="sidebar-rotate-btn" onclick="rotateSidebarAd()">
                    <span>Next Tool</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="13 17 18 12 13 7"></polyline>
                        <polyline points="6 17 11 12 6 7"></polyline>
                    </svg>
                </button>
            </div>
        `;
        
        return container;
    }

    // Rotate to next ad
    window.rotateSidebarAd = function() {
        currentAdIndex = (currentAdIndex + 1) % sidebarAds.length;
        const container = document.getElementById('sidebar-ads-container');
        
        if (container) {
            // Add fade out effect
            container.style.opacity = '0';
            container.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                container.innerHTML = createSidebarAd(sidebarAds[currentAdIndex]);
                // Fade in
                setTimeout(() => {
                    container.style.opacity = '1';
                    container.style.transform = 'translateX(0)';
                }, 50);
            }, 300);
        }
    };

    // Auto-rotate ads every 15 seconds
    function startAutoRotate() {
        setInterval(() => {
            rotateSidebarAd();
        }, 15000);
    }

    // Add styles
    function addSidebarStyles() {
        if (document.getElementById('homepage-sidebar-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'homepage-sidebar-styles';
        styles.textContent = `
            .homepage-right-sidebar {
                position: fixed;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                width: 250px;
                background: linear-gradient(135deg, #ffffff, #f8f9ff);
                border-radius: 20px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.15);
                padding: 25px;
                z-index: 100;
                backdrop-filter: blur(10px);
                border: 2px solid #e9ecef;
                max-height: 600px;
                display: flex;
                flex-direction: column;
            }

            .sidebar-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #e9ecef;
            }

            .sidebar-header h3 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 700;
                color: #37003c;
                letter-spacing: -0.5px;
            }

            .sidebar-ads-container {
                flex: 1;
                transition: all 0.3s ease;
            }

            .homepage-sidebar-ad {
                background: white;
                border-radius: 16px;
                padding: 20px;
                border: 2px solid;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            }

            .homepage-sidebar-ad:hover {
                transform: scale(1.03);
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            }

            .sidebar-ad-content {
                text-align: center;
            }

            .sidebar-ad-image-container {
                width: 100px;
                height: 100px;
                margin: 0 auto 15px;
                position: relative;
            }

            .sidebar-ad-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 16px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }

            .sidebar-ad-icon {
                font-size: 4rem;
                background: linear-gradient(135deg, #37003c, #00ff87);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .sidebar-ad-title {
                font-size: 1.3rem;
                font-weight: 800;
                color: #37003c;
                margin: 0 0 10px 0;
                line-height: 1.2;
            }

            .sidebar-ad-desc {
                font-size: 0.9rem;
                color: #6c757d;
                line-height: 1.4;
                margin: 0 0 15px 0;
            }

            .sidebar-ad-price {
                font-size: 1.5rem;
                font-weight: 900;
                background: linear-gradient(135deg, #00ff87, #28a745);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
            }

            .sidebar-ad-btn {
                display: inline-block;
                color: white;
                padding: 14px 24px;
                border-radius: 30px;
                text-decoration: none;
                font-size: 1rem;
                font-weight: 700;
                transition: all 0.3s ease;
                width: 100%;
                box-sizing: border-box;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                position: relative;
                overflow: hidden;
            }

            .sidebar-ad-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            }

            .sidebar-ad-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                transition: left 0.6s ease;
            }

            .sidebar-ad-btn:hover::before {
                left: 100%;
            }

            .sidebar-footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 2px solid #e9ecef;
                text-align: center;
            }

            .sidebar-rotate-btn {
                background: #f8f9fa;
                border: 2px solid #dee2e6;
                border-radius: 25px;
                padding: 10px 20px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 600;
                color: #495057;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .sidebar-rotate-btn:hover {
                background: #37003c;
                color: white;
                border-color: #37003c;
                transform: translateX(5px);
            }

            /* Hide on tablets and smaller */
            @media (max-width: 1400px) {
                .homepage-right-sidebar {
                    right: 10px;
                    width: 220px;
                    padding: 20px;
                }

                .sidebar-ad-image-container {
                    width: 80px;
                    height: 80px;
                }

                .sidebar-ad-title {
                    font-size: 1.1rem;
                }

                .sidebar-ad-desc {
                    font-size: 0.85rem;
                }

                .sidebar-ad-price {
                    font-size: 1.3rem;
                }
            }

            @media (max-width: 1200px) {
                .homepage-right-sidebar {
                    display: none;
                }
            }

            /* Animation for entrance */
            .homepage-right-sidebar {
                animation: slideInRight 0.5s ease;
            }

            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px) translateY(-50%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) translateY(-50%);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Initialize sidebar
    function initHomepageSidebar() {
        // Only run on homepage
        if (window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
            return;
        }

        // Add styles
        addSidebarStyles();

        // Create and add sidebar
        const sidebar = createSidebarContainer();
        document.body.appendChild(sidebar);

        // Start auto-rotation
        startAutoRotate();

        // Track impressions
        if (typeof gtag !== 'undefined') {
            gtag('event', 'homepage_sidebar_impression', {
                'event_category': 'Homepage_Ads',
                'event_label': 'Right Sidebar'
            });
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initHomepageSidebar, 500);
        });
    } else {
        setTimeout(initHomepageSidebar, 500);
    }
})();