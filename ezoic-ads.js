/**
 * Ezoic Ad Placement Management System
 * This script handles dynamic ad placement throughout the site
 */

(function() {
    'use strict';

    // Ezoic Ad Configuration
    const EzoicAds = {
        // Ad placement IDs - These will be provided by Ezoic
        placements: {
            header: 'ezoic-pub-ad-placeholder-100',
            sidebar_top: 'ezoic-pub-ad-placeholder-101',
            sidebar_bottom: 'ezoic-pub-ad-placeholder-102',
            in_article_1: 'ezoic-pub-ad-placeholder-103',
            in_article_2: 'ezoic-pub-ad-placeholder-104',
            footer: 'ezoic-pub-ad-placeholder-105',
            floating: 'ezoic-pub-ad-placeholder-106',
            between_articles: 'ezoic-pub-ad-placeholder-107'
        },

        // Initialize Ezoic ads
        init: function() {
            // Check if user is premium (no ads for premium users)
            if (this.isPremiumUser()) {
                // Premium user - Ezoic ads will not display
                return;
            }

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupAds());
            } else {
                this.setupAds();
            }
        },

        // Check if user has premium membership
        isPremiumUser: function() {
            try {
                const membershipData = localStorage.getItem('membership') || localStorage.getItem('eplMembership');
                if (membershipData) {
                    const membership = JSON.parse(membershipData);
                    return membership.plan && membership.plan !== 'free';
                }
            } catch (error) {
                console.error('Error checking premium status:', error);
            }
            return false;
        },

        // Setup ad placements
        setupAds: function() {
            // Mark title-to-image zone as ad-free for Ezoic auto-placement
            document.querySelectorAll('.article-header, .hero-section, .article-meta, .article-byline').forEach(el => {
                el.setAttribute('data-ez-no-ads', '');
            });

            // Collect all placement IDs that need to be shown
            const placementsToShow = [];
            
            // Check if bottom ad placeholder already exists (from footer.html)
            const bottomAdExists = document.getElementById('ezoic-pub-ad-placeholder-103');
            if (bottomAdExists) {
                placementsToShow.push(103);
            }
            
            // Insert header ad
            this.insertHeaderAd();
            if (document.getElementById(this.placements.header)) {
                placementsToShow.push(100);
            }
            
            // Insert sidebar ads
            this.insertSidebarAds();
            if (document.getElementById(this.placements.sidebar_top)) {
                placementsToShow.push(101);
            }
            if (document.getElementById(this.placements.sidebar_bottom)) {
                placementsToShow.push(102);
            }
            
            // Insert in-article ads
            this.insertInArticleAds();
            if (document.getElementById(this.placements.in_article_1)) {
                placementsToShow.push(103);
            }
            if (document.getElementById(this.placements.in_article_2)) {
                placementsToShow.push(104);
            }
            
            // Insert footer ad (if not already present)
            if (!bottomAdExists) {
                this.insertFooterAd();
                if (document.getElementById(this.placements.footer)) {
                    placementsToShow.push(105);
                }
            }
            
            // Insert floating ad (mobile) with 5s delay
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    this.insertFloatingAd();
                    if (document.getElementById(this.placements.floating) && window.ezstandalone) {
                        ezstandalone.cmd.push(function() {
                            ezstandalone.showAds(106);
                        });
                    }
                }, 5000);
            }

            // Insert between article ads on homepage
            if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
                this.insertBetweenArticleAds();
            }
            
            // Initialize all ads at once for better performance
            if (window.ezstandalone && placementsToShow.length > 0) {
                ezstandalone.cmd.push(function() {
                    // Show all ads with a single call for better performance
                    ezstandalone.showAds(...placementsToShow);
                });
            }

            // Ad refresh handled by Ezoic automatically
        },

        // Create ad placeholder div
        createAdPlaceholder: function(placementId, className = '') {
            const div = document.createElement('div');
            div.id = placementId;
            div.className = `ezoic-ad ${className}`;
            div.innerHTML = `
                <script>
                    ezstandalone.cmd.push(function() {
                        ezstandalone.define('${placementId}');
                        ezstandalone.refresh();
                    });
                </script>
            `;
            return div;
        },

        // Insert header ad (below navigation)
        insertHeaderAd: function() {
            const nav = document.querySelector('.main-nav, nav');
            if (nav && !document.getElementById(this.placements.header)) {
                const headerAd = this.createAdPlaceholder(this.placements.header, 'header-ad');
                nav.insertAdjacentElement('afterend', headerAd);
            }
        },

        // Insert sidebar ads
        insertSidebarAds: function() {
            const sidebar = document.querySelector('.sidebar, aside, .article-sidebar');
            if (sidebar) {
                // Top sidebar ad
                if (!document.getElementById(this.placements.sidebar_top)) {
                    const topAd = this.createAdPlaceholder(this.placements.sidebar_top, 'sidebar-ad-top');
                    sidebar.insertBefore(topAd, sidebar.firstChild);
                }

                // Bottom sidebar ad
                if (!document.getElementById(this.placements.sidebar_bottom)) {
                    const bottomAd = this.createAdPlaceholder(this.placements.sidebar_bottom, 'sidebar-ad-bottom');
                    sidebar.appendChild(bottomAd);
                }
            }
        },

        // Insert in-article ads
        insertInArticleAds: function() {
            const articleContent = document.querySelector('.article-content, .main-content article, article, .content');
            if (articleContent) {
                const paragraphs = articleContent.querySelectorAll('p');
                
                // Insert first ad after 3rd paragraph
                if (paragraphs.length > 3 && !document.getElementById(this.placements.in_article_1)) {
                    const ad1 = this.createAdPlaceholder(this.placements.in_article_1, 'in-article-ad');
                    paragraphs[2].insertAdjacentElement('afterend', ad1);
                }

                // Insert second ad after 7th paragraph
                if (paragraphs.length > 7 && !document.getElementById(this.placements.in_article_2)) {
                    const ad2 = this.createAdPlaceholder(this.placements.in_article_2, 'in-article-ad');
                    paragraphs[6].insertAdjacentElement('afterend', ad2);
                }
            }
        },

        // Insert footer ad
        insertFooterAd: function() {
            const footer = document.querySelector('footer, .footer');
            if (footer && !document.getElementById(this.placements.footer)) {
                const footerAd = this.createAdPlaceholder(this.placements.footer, 'footer-ad');
                footer.insertBefore(footerAd, footer.firstChild);
            }
        },

        // Insert floating ad (mobile only)
        insertFloatingAd: function() {
            if (!document.getElementById(this.placements.floating)) {
                const floatingAd = document.createElement('div');
                floatingAd.id = this.placements.floating;
                floatingAd.className = 'ezoic-floating-ad';
                floatingAd.innerHTML = `
                    <button class="close-floating-ad" onclick="this.parentElement.remove()">×</button>
                    <script>
                        ezstandalone.cmd.push(function() {
                            ezstandalone.define('${this.placements.floating}');
                            ezstandalone.refresh();
                        });
                    </script>
                `;
                document.body.appendChild(floatingAd);
            }
        },

        // Insert ads between articles on homepage
        insertBetweenArticleAds: function() {
            const articles = document.querySelectorAll('.article-card, .news-item, .post');
            
            // Insert ad after every 3rd article
            articles.forEach((article, index) => {
                if ((index + 1) % 3 === 0 && index < articles.length - 1) {
                    const adId = `${this.placements.between_articles}-${index}`;
                    if (!document.getElementById(adId)) {
                        const betweenAd = this.createAdPlaceholder(adId, 'between-articles-ad');
                        article.insertAdjacentElement('afterend', betweenAd);
                    }
                }
            });
        },

        // Ad refresh handled by Ezoic's own optimization
        setupAdRefresh: function() {
            // Intentionally empty - Ezoic handles its own refresh
        }
    };

    // Add CSS styles for ad containers
    const styles = `
        <style>
            /* Ezoic Ad Container Styles — Dark Mode */
            .ezoic-ad {
                margin: 24px 0;
                min-height: 0;
                text-align: center;
                clear: both;
                border: none;
                background: #1a1a1a;
                border-radius: 12px;
            }

            /* Bottom of Page Ad */
            .ezoic-bottom-ad,
            #ezoic-pub-ad-placeholder-103 {
                margin: 40px auto 20px;
                max-width: 970px;
                min-height: 0;
                text-align: center;
                background: transparent;
                padding: 0;
                border: none;
            }

            .header-ad {
                margin: 20px auto;
                max-width: 728px;
                background: #111;
                border-radius: 12px;
                overflow: hidden;
            }

            .sidebar-ad-top,
            .sidebar-ad-bottom {
                margin: 20px 0;
                padding: 12px;
                background: #1e1e1e;
                border-radius: 12px;
                border: 1px solid #2a2a2a;
            }

            .in-article-ad {
                margin: 40px 0;
                padding: 24px;
                background: #1e1e1e;
                border-radius: 12px;
                border: 1px solid #2a2a2a;
            }

            .footer-ad {
                margin: 30px auto 20px;
                max-width: 728px;
                background: #111;
                border-radius: 12px;
                overflow: hidden;
            }

            .between-articles-ad {
                margin: 30px 0;
                padding: 20px;
                background: #1e1e1e;
                border-radius: 12px;
                border: 1px solid #2a2a2a;
            }

            /* Floating Ad (Mobile) */
            .ezoic-floating-ad {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #111;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.5);
                z-index: 999;
                padding: 10px;
                display: none;
                border-top: 1px solid #2a2a2a;
            }

            @media (max-width: 768px) {
                .ezoic-floating-ad {
                    display: block;
                }
            }

            .close-floating-ad {
                position: absolute;
                top: 6px;
                right: 6px;
                background: #333;
                color: #ccc;
                border: 1px solid #444;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                font-size: 16px;
                cursor: pointer;
                z-index: 1000;
                transition: background 0.2s;
            }

            .close-floating-ad:hover {
                background: #555;
                color: #fff;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .header-ad,
                .footer-ad {
                    margin: 15px 10px;
                }

                .in-article-ad {
                    margin: 24px 0;
                    padding: 16px;
                    border-radius: 10px;
                }
            }

            /* Block ads between article title and featured image */
            .article-header ins,
            .article-header .ezoic-ad,
            .article-header .adsbygoogle,
            .article-header iframe[id^="google_ads"],
            .article-header [id^="ezoic-pub-ad"],
            .hero-section ins,
            .hero-section .ezoic-ad,
            .hero-section .adsbygoogle,
            .hero-section iframe[id^="google_ads"],
            .hero-section [id^="ezoic-pub-ad"],
            .article-meta ins,
            .article-meta .ezoic-ad,
            .article-meta .adsbygoogle,
            .article-byline ins,
            .article-byline .ezoic-ad,
            .article-byline .adsbygoogle {
                display: none !important;
                height: 0 !important;
                min-height: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            /* Hide ads for premium users */
            .ezoic-ads-disabled .ezoic-ad {
                display: none !important;
            }

            /* Hide empty ad placeholders completely */
            .ezoic-ad:empty {
                display: none !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
            }
        </style>
    `;

    // Inject styles
    document.head.insertAdjacentHTML('beforeend', styles);

    // Guard: remove any ads auto-injected between article title and featured image
    function guardTitleImageZone() {
        const zones = document.querySelectorAll('.article-header, .hero-section, .article-meta, .article-byline');
        if (zones.length === 0) return;

        const adSelectors = 'ins.adsbygoogle, [id^="ezoic-pub-ad"], .ezoic-ad, iframe[id^="google_ads"], [data-ad-slot]';

        zones.forEach(zone => {
            // Remove any ads already present
            zone.querySelectorAll(adSelectors).forEach(ad => ad.remove());
        });

        // Watch for dynamically injected ads
        const guardObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== 1) return;
                    if (node.matches && node.matches(adSelectors)) {
                        node.remove();
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll(adSelectors).forEach(ad => ad.remove());
                    }
                });
            });
        });

        zones.forEach(zone => {
            guardObserver.observe(zone, { childList: true, subtree: true });
        });
    }

    // Run guard after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', guardTitleImageZone);
    } else {
        guardTitleImageZone();
    }

    // Initialize Ezoic ads when ready
    if (window.ezstandalone) {
        EzoicAds.init();
    } else {
        // Wait for Ezoic to load
        window.addEventListener('load', () => {
            setTimeout(() => EzoicAds.init(), 1000);
        });
    }

    // Expose to global scope for debugging
    window.EzoicAds = EzoicAds;
})();