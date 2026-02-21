// Floating Side Ads for Articles
// Creates fixed position ads on both sides of article content

(function() {
    'use strict';

    // Check if we're on an article page
    function isArticlePage() {
        const path = window.location.pathname;
        return path.includes('/articles/') || 
               document.querySelector('.nyt-article') || 
               document.querySelector('article');
    }

    // Create left side ad (FPL AI Assistant)
    function createLeftSideAd() {
        return `
        <div class="floating-side-ad left-side-ad" id="left-side-ad">
            <button class="close-ad-btn" onclick="closeAd('left-side-ad')">×</button>
            <div class="side-ad-content">
                <div class="ad-image-container">
                    <img src="/fpl-ai-assistant-icon.png" alt="FPL AI Assistant" class="ad-image-small" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="ad-icon-small" style="display:none;">🤖</div>
                </div>
                <h4 class="ad-title-small">FPL AI Assistant</h4>
                <p class="ad-desc-small">Get instant transfer advice & captain picks</p>
                <div class="ad-price-small">$2/mo</div>
                <a href="/fpl-ai-assistant.html" class="ad-btn-small">Try Now →</a>
            </div>
        </div>`;
    }

    // Create right side ad (Transfer Simulator)
    function createRightSideAd() {
        return `
        <div class="floating-side-ad right-side-ad" id="right-side-ad">
            <button class="close-ad-btn" onclick="closeAd('right-side-ad')">×</button>
            <div class="side-ad-content">
                <div class="ad-image-container">
                    <img src="/transfer-simulator-icon.png" alt="Transfer Simulator" class="ad-image-small" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="ad-icon-small" style="display:none;">🔄</div>
                </div>
                <h4 class="ad-title-small">Transfer Simulator</h4>
                <p class="ad-desc-small">AI-powered squad optimization</p>
                <div class="ad-price-small">Pro Feature</div>
                <a href="/transfer-simulator-pro.html" class="ad-btn-small">Optimize →</a>
            </div>
        </div>`;
    }

    // Close ad function
    window.closeAd = function(adId) {
        const ad = document.getElementById(adId);
        if (ad) {
            ad.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                ad.remove();
            }, 300);
            // Save closed state in session
            sessionStorage.setItem(adId + '_closed', 'true');
        }
    };

    // Add styles
    function addSideAdStyles() {
        if (document.getElementById('side-ads-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'side-ads-styles';
        styles.textContent = `
            .floating-side-ad {
                position: fixed;
                top: 50%;
                transform: translateY(-50%);
                width: 200px;
                background: linear-gradient(135deg, #ffffff, #f8f9ff);
                border-radius: 16px;
                box-shadow: 0 15px 40px rgba(0,0,0,0.2);
                padding: 25px 20px;
                z-index: 100;
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                animation: slideIn 0.5s ease;
                border: 2px solid transparent;
                backdrop-filter: blur(10px);
            }

            .left-side-ad {
                left: 20px;
            }

            .right-side-ad {
                right: 20px;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translateY(-50%) scale(1);
                }
            }

            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateY(-50%) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-50%) scale(0.8);
                }
            }

            .floating-side-ad:hover {
                transform: translateY(-50%) scale(1.08);
                box-shadow: 0 20px 50px rgba(0,0,0,0.25);
                border: 2px solid #37003c;
            }

            .close-ad-btn {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(240, 240, 240, 0.9);
                border: none;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                font-size: 16px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                opacity: 0.8;
                backdrop-filter: blur(5px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .close-ad-btn:hover {
                background: #ff4444;
                color: white;
                opacity: 1;
                transform: rotate(90deg);
            }

            .side-ad-content {
                text-align: center;
            }

            .ad-image-container {
                width: 80px;
                height: 80px;
                margin: 0 auto 15px;
                position: relative;
            }

            .ad-image-small {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: transform 0.3s ease;
            }

            .floating-side-ad:hover .ad-image-small {
                transform: scale(1.1) rotate(2deg);
            }

            .ad-icon-small {
                font-size: 3rem;
                margin-bottom: 15px;
                background: linear-gradient(135deg, #37003c, #00ff87);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                filter: drop-shadow(0 3px 6px rgba(0,0,0,0.15));
                transition: transform 0.3s ease;
            }

            .floating-side-ad:hover .ad-icon-small {
                transform: scale(1.1) rotate(5deg);
            }

            .ad-title-small {
                font-size: 1.1rem;
                font-weight: 800;
                color: #37003c;
                margin: 0 0 12px 0;
                line-height: 1.3;
                text-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }

            .ad-desc-small {
                font-size: 0.85rem;
                color: #555;
                line-height: 1.4;
                margin: 0 0 15px 0;
                font-weight: 400;
            }

            .ad-price-small {
                font-size: 1.3rem;
                font-weight: 900;
                background: linear-gradient(135deg, #00ff87, #28a745);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 18px;
                text-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .ad-btn-small {
                display: inline-block;
                background: linear-gradient(135deg, #37003c, #4a0e4e);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                text-decoration: none;
                font-size: 0.9rem;
                font-weight: 700;
                transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                width: 100%;
                box-sizing: border-box;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 15px rgba(55, 0, 60, 0.3);
                position: relative;
                overflow: hidden;
            }

            .ad-btn-small:hover {
                background: linear-gradient(135deg, #00ff87, #28a745);
                transform: translateY(-2px) scale(1.05);
                box-shadow: 0 8px 25px rgba(0,255,135,0.4);
            }

            .ad-btn-small::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.6s ease;
            }

            .ad-btn-small:hover::before {
                left: 100%;
            }

            /* Adjust on large screens */
            @media (max-width: 1600px) {
                .floating-side-ad {
                    width: 180px;
                    padding: 22px 18px;
                }

                .left-side-ad {
                    left: 15px;
                }

                .right-side-ad {
                    right: 15px;
                }

                .ad-image-container {
                    width: 70px;
                    height: 70px;
                }

                .ad-icon-small {
                    font-size: 2.7rem;
                }

                .ad-title-small {
                    font-size: 1rem;
                }

                .ad-desc-small {
                    font-size: 0.8rem;
                }
            }

            /* Hide on tablets and mobile */
            @media (max-width: 1200px) {
                .floating-side-ad {
                    display: none;
                }
            }

            /* Pulse animation for attention */
            .floating-side-ad {
                animation: slideIn 0.5s ease, pulse 4s ease-in-out 3;
            }

            @keyframes pulse {
                0%, 100% {
                    transform: translateY(-50%) scale(1);
                }
                50% {
                    transform: translateY(-50%) scale(1.02);
                }
            }

            /* Special styling for left ad */
            .left-side-ad {
                background: linear-gradient(135deg, #ffffff, #f8f9ff);
                border: 2px solid #37003c;
                box-shadow: 0 15px 40px rgba(55, 0, 60, 0.2);
            }

            .left-side-ad .ad-icon-small {
                animation: bounce 2s ease-in-out infinite;
            }

            @keyframes bounce {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-5px);
                }
            }

            /* Special styling for right ad */
            .right-side-ad {
                background: linear-gradient(135deg, #ffffff, #f0fff9);
                border: 2px solid #00ff87;
                box-shadow: 0 15px 40px rgba(0, 255, 135, 0.2);
            }

            .right-side-ad .ad-price-small {
                background: linear-gradient(135deg, #ffd700, #ffed4e);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            /* Rotate ads periodically */
            .floating-side-ad.rotate-ad {
                animation: rotateAd 0.5s ease;
            }

            @keyframes rotateAd {
                0% {
                    transform: translateY(-50%) rotateY(0);
                }
                50% {
                    transform: translateY(-50%) rotateY(90deg);
                    opacity: 0;
                }
                100% {
                    transform: translateY(-50%) rotateY(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Array of different ads to rotate
    const leftAds = [
        {
            icon: '🤖',
            image: '/fpl-ai-assistant-icon.png',
            title: 'FPL AI Assistant',
            desc: 'Get instant transfer advice & captain picks',
            price: '$2/mo',
            link: '/fpl-ai-assistant.html',
            cta: 'Try Now →'
        },
        {
            icon: '🔮',
            image: '/fpl-player-analyzer-icon.png',
            title: 'Player Analyzer',
            desc: 'ML-powered gameweek predictions',
            price: 'Pro Feature',
            link: '/fpl-player-analyzer.html',
            cta: 'Analyze →'
        }
    ];

    const rightAds = [
        {
            icon: '🔄',
            image: '/transfer-simulator-icon.png',
            title: 'Transfer Simulator',
            desc: 'AI-powered squad optimization',
            price: 'Pro Feature',
            link: '/transfer-simulator-pro.html',
            cta: 'Optimize →'
        },
        {
            icon: '💎',
            image: '/premium-hub-icon.png',
            title: 'Premium Hub',
            desc: 'All FPL tools in one place',
            price: 'From $2/mo',
            link: '/fpl-premium-hub.html',
            cta: 'Explore →'
        }
    ];

    let currentLeftIndex = 0;
    let currentRightIndex = 0;

    // Rotate ads every 30 seconds
    function rotateAds() {
        setInterval(() => {
            // Rotate left ad
            const leftAd = document.getElementById('left-side-ad');
            if (leftAd && !sessionStorage.getItem('left-side-ad_closed')) {
                currentLeftIndex = (currentLeftIndex + 1) % leftAds.length;
                const newAd = leftAds[currentLeftIndex];
                
                leftAd.classList.add('rotate-ad');
                setTimeout(() => {
                    // Update image or icon
                    const imageContainer = leftAd.querySelector('.ad-image-container');
                    if (imageContainer) {
                        imageContainer.innerHTML = `
                            <img src="${newAd.image}" alt="${newAd.title}" class="ad-image-small" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="ad-icon-small" style="display:none;">${newAd.icon}</div>
                        `;
                    }
                    leftAd.querySelector('.ad-title-small').textContent = newAd.title;
                    leftAd.querySelector('.ad-desc-small').textContent = newAd.desc;
                    leftAd.querySelector('.ad-price-small').textContent = newAd.price;
                    leftAd.querySelector('.ad-btn-small').href = newAd.link;
                    leftAd.querySelector('.ad-btn-small').textContent = newAd.cta;
                    leftAd.classList.remove('rotate-ad');
                }, 250);
            }

            // Rotate right ad
            const rightAd = document.getElementById('right-side-ad');
            if (rightAd && !sessionStorage.getItem('right-side-ad_closed')) {
                currentRightIndex = (currentRightIndex + 1) % rightAds.length;
                const newAd = rightAds[currentRightIndex];
                
                rightAd.classList.add('rotate-ad');
                setTimeout(() => {
                    // Update image or icon
                    const imageContainer = rightAd.querySelector('.ad-image-container');
                    if (imageContainer) {
                        imageContainer.innerHTML = `
                            <img src="${newAd.image}" alt="${newAd.title}" class="ad-image-small" 
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <div class="ad-icon-small" style="display:none;">${newAd.icon}</div>
                        `;
                    }
                    rightAd.querySelector('.ad-title-small').textContent = newAd.title;
                    rightAd.querySelector('.ad-desc-small').textContent = newAd.desc;
                    rightAd.querySelector('.ad-price-small').textContent = newAd.price;
                    rightAd.querySelector('.ad-btn-small').href = newAd.link;
                    rightAd.querySelector('.ad-btn-small').textContent = newAd.cta;
                    rightAd.classList.remove('rotate-ad');
                }, 250);
            }
        }, 30000); // Rotate every 30 seconds
    }

    // Initialize side ads
    function initSideAds() {
        // Internal promo ads disabled on article pages
        return;

        // Check if ads were already closed this session
        const leftClosed = sessionStorage.getItem('left-side-ad_closed');
        const rightClosed = sessionStorage.getItem('right-side-ad_closed');

        // Add styles
        addSideAdStyles();

        // Add left ad if not closed
        if (!leftClosed && !document.getElementById('left-side-ad')) {
            const leftAdDiv = document.createElement('div');
            leftAdDiv.innerHTML = createLeftSideAd();
            document.body.appendChild(leftAdDiv.firstElementChild);
        }

        // Add right ad if not closed
        if (!rightClosed && !document.getElementById('right-side-ad')) {
            const rightAdDiv = document.createElement('div');
            rightAdDiv.innerHTML = createRightSideAd();
            document.body.appendChild(rightAdDiv.firstElementChild);
        }

        // Start rotation
        rotateAds();

        // Track impressions
        if (typeof gtag !== 'undefined') {
            gtag('event', 'side_ads_impression', {
                'event_category': 'Article_Ads',
                'event_label': 'Side Floating Ads'
            });
        }
    }

    // Wait for DOM and delay slightly to not interfere with page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initSideAds, 1000); // Delay 1 second after page load
        });
    } else {
        setTimeout(initSideAds, 1000);
    }
})();