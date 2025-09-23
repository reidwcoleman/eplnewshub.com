// Maximum Ad Revenue Optimization Script
// This script implements multiple ad strategies to maximize earnings

// 1. Auto-refresh ads for users who stay on page longer than 30 seconds
let adRefreshInterval;
let refreshCount = 0;
const MAX_REFRESHES = 10; // Limit to prevent policy violations

function initAdRefresh() {
    adRefreshInterval = setInterval(() => {
        if (refreshCount < MAX_REFRESHES) {
            // Only refresh ads that are in viewport
            const ads = document.querySelectorAll('.adsbygoogle');
            ads.forEach(ad => {
                if (isInViewport(ad) && ad.dataset.refreshable === 'true') {
                    // Refresh the ad
                    const parent = ad.parentNode;
                    const newAd = ad.cloneNode(true);
                    parent.replaceChild(newAd, ad);
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    refreshCount++;
                }
            });
        } else {
            clearInterval(adRefreshInterval);
        }
    }, 30000); // Refresh every 30 seconds
}

// 2. Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// 3. Sticky sidebar ad that follows user scroll
function initStickyAd() {
    const stickyAdContainer = document.createElement('div');
    stickyAdContainer.id = 'sticky-sidebar-ad';
    stickyAdContainer.innerHTML = `
        <div style="position: fixed; top: 100px; right: 20px; width: 300px; z-index: 999; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="font-size: 10px; color: #999; margin-bottom: 5px; text-align: center;">ADVERTISEMENT</div>
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-6480210605786899"
                 data-ad-slot="7891234570"
                 data-ad-format="rectangle"
                 data-refreshable="true"></ins>
        </div>
    `;
    
    // Only show on desktop
    if (window.innerWidth > 1200) {
        document.body.appendChild(stickyAdContainer);
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
}

// 4. Interstitial ad between article sections
function insertInterstitialAds() {
    const contentSections = document.querySelectorAll('.content-section, article p');
    let adCount = 0;
    
    contentSections.forEach((section, index) => {
        // Insert ad every 3 paragraphs/sections
        if (index > 0 && index % 3 === 0 && adCount < 5) {
            const adContainer = document.createElement('div');
            adContainer.className = 'in-article-ad-container';
            adContainer.innerHTML = `
                <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                    <div style="font-size: 10px; color: #999; margin-bottom: 10px; text-align: center;">ADVERTISEMENT</div>
                    <ins class="adsbygoogle"
                         style="display:block"
                         data-ad-format="fluid"
                         data-ad-layout-key="-fb+5w+4e-db+86"
                         data-ad-client="ca-pub-6480210605786899"
                         data-ad-slot="2887667887"
                         data-refreshable="true"></ins>
                </div>
            `;
            section.parentNode.insertBefore(adContainer, section.nextSibling);
            (adsbygoogle = window.adsbygoogle || []).push({});
            adCount++;
        }
    });
}

// 5. Bottom sticky banner ad (mobile)
function initMobileStickyBanner() {
    if (window.innerWidth <= 768) {
        const stickyBanner = document.createElement('div');
        stickyBanner.id = 'mobile-sticky-banner';
        stickyBanner.innerHTML = `
            <div style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; background: white; padding: 5px; box-shadow: 0 -2px 10px rgba(0,0,0,0.1);">
                <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">×</button>
                <ins class="adsbygoogle"
                     style="display:inline-block;width:320px;height:50px"
                     data-ad-client="ca-pub-6480210605786899"
                     data-ad-slot="9165888353"></ins>
            </div>
        `;
        document.body.appendChild(stickyBanner);
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
}

// 6. Exit intent popup ad
let exitIntentShown = false;
function initExitIntentAd() {
    document.addEventListener('mouseout', function(e) {
        if (e.clientY < 10 && !exitIntentShown) {
            exitIntentShown = true;
            const popup = document.createElement('div');
            popup.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                    <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; position: relative;">
                        <button onclick="this.parentElement.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: #ff4444; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
                        <h3 style="margin-bottom: 20px; color: #333;">⚽ Before You Go!</h3>
                        <p style="margin-bottom: 20px; color: #666;">Check out these premium EPL tools:</p>
                        <ins class="adsbygoogle"
                             style="display:block"
                             data-ad-client="ca-pub-6480210605786899"
                             data-ad-slot="7891234570"
                             data-ad-format="auto"></ins>
                        <div style="margin-top: 20px; text-align: center;">
                            <a href="/fpl-premium-hub.html" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">Explore Premium Tools</a>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(popup);
            (adsbygoogle = window.adsbygoogle || []).push({});
            
            // Auto-close after 10 seconds
            setTimeout(() => {
                if (popup && popup.parentNode) {
                    popup.remove();
                }
            }, 10000);
        }
    });
}

// 7. Matched content / Native ads
function initMatchedContent() {
    const footer = document.querySelector('.footer');
    if (footer) {
        const matchedContent = document.createElement('div');
        matchedContent.innerHTML = `
            <div style="margin: 40px auto; max-width: 1200px; padding: 0 20px;">
                <h3 style="text-align: center; margin-bottom: 20px; color: #333;">Recommended for You</h3>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-format="autorelaxed"
                     data-ad-client="ca-pub-6480210605786899"
                     data-ad-slot="2887667887"></ins>
            </div>
        `;
        footer.parentNode.insertBefore(matchedContent, footer);
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
}

// 8. Video ad placeholder (for future implementation)
function initVideoAds() {
    const videoAdPlaceholder = document.createElement('div');
    videoAdPlaceholder.innerHTML = `
        <div style="margin: 30px 0; padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">
            <div style="font-size: 10px; color: #999; margin-bottom: 10px;">VIDEO ADVERTISEMENT</div>
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-6480210605786899"
                 data-ad-slot="7891234570"
                 data-ad-format="fluid"
                 data-ad-layout="in-article"></ins>
        </div>
    `;
    
    const mainContent = document.querySelector('.article-content, .main-content');
    if (mainContent) {
        const midPoint = Math.floor(mainContent.children.length / 2);
        if (mainContent.children[midPoint]) {
            mainContent.insertBefore(videoAdPlaceholder, mainContent.children[midPoint]);
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
    }
}

// 9. Optimize ad loading with lazy loading
function optimizeAdLoading() {
    const lazyAds = document.querySelectorAll('.lazy-ad');
    
    if ('IntersectionObserver' in window) {
        const adObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const ad = entry.target;
                    if (!ad.classList.contains('loaded')) {
                        ad.classList.add('loaded');
                        (adsbygoogle = window.adsbygoogle || []).push({});
                    }
                }
            });
        });
        
        lazyAds.forEach(ad => adObserver.observe(ad));
    }
}

// 10. Track ad performance
function trackAdPerformance() {
    // Send events to Google Analytics
    if (typeof gtag !== 'undefined') {
        // Track ad views
        document.querySelectorAll('.adsbygoogle').forEach((ad, index) => {
            if (isInViewport(ad)) {
                gtag('event', 'ad_view', {
                    'ad_position': index,
                    'page_url': window.location.href
                });
            }
        });
        
        // Track time on page for ad optimization
        let timeOnPage = 0;
        setInterval(() => {
            timeOnPage += 10;
            if (timeOnPage % 60 === 0) { // Every minute
                gtag('event', 'time_on_page', {
                    'time_seconds': timeOnPage,
                    'page_url': window.location.href
                });
            }
        }, 10000);
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for initial ads to load
    setTimeout(() => {
        initAdRefresh();
        initStickyAd();
        insertInterstitialAds();
        initMobileStickyBanner();
        initExitIntentAd();
        initMatchedContent();
        initVideoAds();
        optimizeAdLoading();
        trackAdPerformance();
    }, 2000);
});

// Handle infinite scroll ad loading
let lastScrollPosition = 0;
window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    // Load more ads as user scrolls
    if (currentScroll > lastScrollPosition + 1000) {
        const adContainer = document.createElement('div');
        adContainer.innerHTML = `
            <ins class="adsbygoogle lazy-ad"
                 style="display:block"
                 data-ad-client="ca-pub-6480210605786899"
                 data-ad-slot="2887667887"
                 data-ad-format="auto"></ins>
        `;
        
        const content = document.querySelector('.article-content, .main-content');
        if (content) {
            content.appendChild(adContainer);
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
        
        lastScrollPosition = currentScroll;
    }
});