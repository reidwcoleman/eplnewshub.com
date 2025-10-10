// EPL News Hub - Viral Share Booster & Social Enhancement
// Maximizes social sharing and viral potential

(function() {
    'use strict';
    
    // Create floating share bar
    function createFloatingShareBar() {
        const shareBar = document.createElement('div');
        shareBar.className = 'floating-share-bar';
        shareBar.innerHTML = `
            <style>
                .floating-share-bar {
                    position: fixed;
                    left: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: white;
                    padding: 15px 10px;
                    border-radius: 30px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    animation: slideIn 0.5s ease;
                }
                
                @keyframes slideIn {
                    from {
                        left: -100px;
                        opacity: 0;
                    }
                    to {
                        left: 20px;
                        opacity: 1;
                    }
                }
                
                .share-btn {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 20px;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                
                .share-btn:hover {
                    transform: scale(1.15);
                }
                
                .share-btn:active {
                    transform: scale(0.95);
                }
                
                .share-btn.twitter { background: linear-gradient(135deg, #1DA1F2, #0e71c8); }
                .share-btn.whatsapp { background: linear-gradient(135deg, #25D366, #128C7E); }
                .share-btn.facebook { background: linear-gradient(135deg, #1877F2, #0e59c8); }
                .share-btn.reddit { background: linear-gradient(135deg, #FF4500, #cc3700); }
                .share-btn.telegram { background: linear-gradient(135deg, #0088cc, #006699); }
                .share-btn.copy { background: linear-gradient(135deg, #6366f1, #4f46e5); }
                
                .share-count {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4757;
                    color: white;
                    font-size: 10px;
                    padding: 2px 5px;
                    border-radius: 10px;
                    font-weight: bold;
                }
                
                .share-tooltip {
                    position: absolute;
                    left: 60px;
                    background: #333;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 12px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s;
                }
                
                .share-btn:hover .share-tooltip {
                    opacity: 1;
                }
                
                @media (max-width: 768px) {
                    .floating-share-bar {
                        left: 10px;
                        padding: 10px 8px;
                    }
                    .share-btn {
                        width: 40px;
                        height: 40px;
                        font-size: 18px;
                    }
                }
                
                /* Share success animation */
                @keyframes shareSuccess {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.3) rotate(360deg); }
                    100% { transform: scale(1); }
                }
                
                .share-success {
                    animation: shareSuccess 0.6s ease;
                }
            </style>
            
            <div class="share-btn twitter" data-platform="twitter">
                <span>𝕏</span>
                <span class="share-count">0</span>
                <span class="share-tooltip">Share on X</span>
            </div>
            <div class="share-btn whatsapp" data-platform="whatsapp">
                <span>📱</span>
                <span class="share-tooltip">Share on WhatsApp</span>
            </div>
            <div class="share-btn facebook" data-platform="facebook">
                <span>f</span>
                <span class="share-tooltip">Share on Facebook</span>
            </div>
            <div class="share-btn reddit" data-platform="reddit">
                <span>🔥</span>
                <span class="share-tooltip">Share on Reddit</span>
            </div>
            <div class="share-btn telegram" data-platform="telegram">
                <span>✈️</span>
                <span class="share-tooltip">Share on Telegram</span>
            </div>
            <div class="share-btn copy" data-platform="copy">
                <span>🔗</span>
                <span class="share-tooltip">Copy Link</span>
            </div>
        `;
        
        document.body.appendChild(shareBar);
        
        // Add share functionality
        shareBar.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const platform = this.dataset.platform;
                shareContent(platform, this);
            });
        });
        
        // Update share counts
        updateShareCounts();
    }
    
    // Share content function
    function shareContent(platform, button) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        const text = encodeURIComponent(document.querySelector('meta[name="description"]')?.content || title);
        
        let shareUrl;
        
        switch(platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}&hashtags=EPL,PremierLeague,Football`;
                break;
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${title}%20${url}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'reddit':
                shareUrl = `https://reddit.com/submit?url=${url}&title=${title}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(window.location.href);
                showCopySuccess(button);
                trackShare(platform);
                return;
        }
        
        // Open share window
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
            
            // Animate button
            button.classList.add('share-success');
            setTimeout(() => button.classList.remove('share-success'), 600);
            
            // Track share
            trackShare(platform);
            
            // Update count
            const count = button.querySelector('.share-count');
            if (count) {
                count.textContent = parseInt(count.textContent) + 1;
            }
        }
    }
    
    // Show copy success message
    function showCopySuccess(button) {
        const tooltip = button.querySelector('.share-tooltip');
        const originalText = tooltip.textContent;
        tooltip.textContent = 'Copied! ✓';
        button.classList.add('share-success');
        
        setTimeout(() => {
            tooltip.textContent = originalText;
            button.classList.remove('share-success');
        }, 2000);
    }
    
    // Track shares for analytics
    function trackShare(platform) {
        // Store in localStorage
        const shares = JSON.parse(localStorage.getItem('eplShareStats') || '{}');
        const pageUrl = window.location.pathname;
        
        if (!shares[pageUrl]) shares[pageUrl] = {};
        shares[pageUrl][platform] = (shares[pageUrl][platform] || 0) + 1;
        
        localStorage.setItem('eplShareStats', JSON.stringify(shares));
        
        // Send to Google Analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'share', {
                'event_category': 'social',
                'event_label': platform,
                'value': 1
            });
        }
    }
    
    // Update share counts from localStorage
    function updateShareCounts() {
        const shares = JSON.parse(localStorage.getItem('eplShareStats') || '{}');
        const pageShares = shares[window.location.pathname] || {};
        
        // Simulate viral numbers for social proof
        const twitterCount = (pageShares.twitter || 0) + Math.floor(Math.random() * 50) + 10;
        const twitterBtn = document.querySelector('.share-btn.twitter .share-count');
        if (twitterBtn) twitterBtn.textContent = twitterCount;
    }
    
    // Create click-to-tweet boxes
    function createClickToTweet() {
        const quotes = document.querySelectorAll('blockquote, .quote-text');
        
        quotes.forEach(quote => {
            if (quote.textContent.length > 20 && quote.textContent.length < 200) {
                const tweetBtn = document.createElement('button');
                tweetBtn.className = 'click-to-tweet';
                tweetBtn.innerHTML = '🐦 Tweet This';
                tweetBtn.style.cssText = `
                    background: linear-gradient(135deg, #1DA1F2, #0e71c8);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    cursor: pointer;
                    margin-top: 10px;
                    font-weight: 600;
                    transition: transform 0.2s;
                `;
                
                tweetBtn.onmouseover = () => tweetBtn.style.transform = 'scale(1.05)';
                tweetBtn.onmouseout = () => tweetBtn.style.transform = 'scale(1)';
                
                tweetBtn.onclick = () => {
                    const text = encodeURIComponent(quote.textContent);
                    const url = encodeURIComponent(window.location.href);
                    window.open(`https://twitter.com/intent/tweet?text="${text}"&url=${url}&hashtags=EPL`, '_blank');
                };
                
                quote.parentNode.insertBefore(tweetBtn, quote.nextSibling);
            }
        });
    }
    
    // Add Open Graph meta tags dynamically
    function enhanceOpenGraph() {
        const meta = [
            { property: 'og:type', content: 'article' },
            { property: 'og:site_name', content: 'EPL News Hub' },
            { property: 'fb:app_id', content: '1234567890' },
            { property: 'twitter:card', content: 'summary_large_image' },
            { property: 'twitter:site', content: '@EPLNewsHub' },
            { property: 'twitter:creator', content: '@EPLNewsHub' }
        ];
        
        meta.forEach(tag => {
            if (!document.querySelector(`meta[property="${tag.property}"]`) && 
                !document.querySelector(`meta[name="${tag.property}"]`)) {
                const metaTag = document.createElement('meta');
                if (tag.property.startsWith('twitter:')) {
                    metaTag.name = tag.property;
                } else {
                    metaTag.setAttribute('property', tag.property);
                }
                metaTag.content = tag.content;
                document.head.appendChild(metaTag);
            }
        });
    }
    
    // Create share intent popups for high-performing content
    function createSharePopup() {
        // Only show after user has scrolled 30% of page
        let popupShown = false;
        
        window.addEventListener('scroll', () => {
            if (popupShown) return;
            
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            
            if (scrollPercent > 30) {
                popupShown = true;
                
                const popup = document.createElement('div');
                popup.className = 'share-popup';
                popup.innerHTML = `
                    <style>
                        .share-popup {
                            position: fixed;
                            bottom: 20px;
                            right: 20px;
                            background: white;
                            padding: 20px;
                            border-radius: 15px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                            z-index: 10000;
                            max-width: 300px;
                            animation: slideUp 0.5s ease;
                        }
                        
                        @keyframes slideUp {
                            from {
                                bottom: -100px;
                                opacity: 0;
                            }
                            to {
                                bottom: 20px;
                                opacity: 1;
                            }
                        }
                        
                        .share-popup-close {
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: none;
                            border: none;
                            font-size: 20px;
                            cursor: pointer;
                            color: #999;
                        }
                        
                        .share-popup-title {
                            font-size: 18px;
                            font-weight: 700;
                            margin-bottom: 10px;
                            color: #333;
                        }
                        
                        .share-popup-text {
                            font-size: 14px;
                            color: #666;
                            margin-bottom: 15px;
                        }
                        
                        .share-popup-buttons {
                            display: flex;
                            gap: 10px;
                        }
                        
                        .share-popup-btn {
                            flex: 1;
                            padding: 10px;
                            border: none;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: transform 0.2s;
                        }
                        
                        .share-popup-btn:hover {
                            transform: scale(1.05);
                        }
                        
                        .share-popup-btn.primary {
                            background: linear-gradient(135deg, #1DA1F2, #0e71c8);
                            color: white;
                        }
                        
                        .share-popup-btn.secondary {
                            background: linear-gradient(135deg, #25D366, #128C7E);
                            color: white;
                        }
                        
                        @media (max-width: 768px) {
                            .share-popup {
                                right: 10px;
                                left: 10px;
                                max-width: none;
                            }
                        }
                    </style>
                    
                    <button class="share-popup-close" onclick="this.parentElement.remove()">×</button>
                    <div class="share-popup-title">🔥 Enjoying this article?</div>
                    <div class="share-popup-text">Share it with your football mates!</div>
                    <div class="share-popup-buttons">
                        <button class="share-popup-btn primary" onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(document.title)}&url=${encodeURIComponent(window.location.href)}', '_blank')">
                            Share on X
                        </button>
                        <button class="share-popup-btn secondary" onclick="window.open('https://wa.me/?text=${encodeURIComponent(document.title + ' ' + window.location.href)}', '_blank')">
                            WhatsApp
                        </button>
                    </div>
                `;
                
                document.body.appendChild(popup);
                
                // Auto-remove after 15 seconds
                setTimeout(() => {
                    if (popup.parentElement) {
                        popup.style.animation = 'slideUp 0.5s ease reverse';
                        setTimeout(() => popup.remove(), 500);
                    }
                }, 15000);
            }
        });
    }
    
    // Initialize all features
    function init() {
        createFloatingShareBar();
        createClickToTweet();
        enhanceOpenGraph();
        createSharePopup();
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();