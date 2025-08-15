// Article Freshness Banner for EPL News Hub
// Shows latest article info as a banner at the top of the page

(function() {
    'use strict';
    
    // Latest article data - Update this when new articles are published
    const latestArticle = {
        title: "Soccer Barclays Premier League: Ultimate SEO Guide",
        description: "Complete EPL resource with all-time records, team analysis, and viewing options",
        publishDate: "2025-08-15T10:00:00Z",
        url: "articles/soccer-barclays-premier-league-seo-guide-2025.html"
    };
    
    function getTimeAgo(dateString) {
        const publishDate = new Date(dateString);
        const now = new Date();
        const diffInMs = now - publishDate;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInHours < 1) return "Just published";
        if (diffInHours === 1) return "1 hour ago";
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        if (diffInDays === 1) return "1 day ago";
        return `${diffInDays} days ago`;
    }
    
    function createBanner() {
        const banner = document.createElement('div');
        banner.className = 'article-freshness-banner';
        banner.innerHTML = `
            <div class="freshness-banner-content">
                <span class="freshness-banner-new">NEW</span>
                <span class="freshness-banner-time">${getTimeAgo(latestArticle.publishDate)}</span>
                <span class="freshness-banner-divider">•</span>
                <a href="${latestArticle.url}" class="freshness-banner-link">
                    <strong>${latestArticle.title}</strong> - ${latestArticle.description}
                </a>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .article-freshness-banner {
                background: linear-gradient(90deg, #38003c 0%, #5a006d 50%, #38003c 100%);
                background-size: 200% 100%;
                animation: gradientMove 10s ease infinite;
                color: white;
                padding: 12px 20px;
                text-align: center;
                position: relative;
                font-size: 14px;
                border-bottom: 2px solid #00ff87;
            }
            
            @keyframes gradientMove {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .freshness-banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .freshness-banner-new {
                background: #00ff87;
                color: #38003c;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 700;
                font-size: 11px;
                animation: blink 2s infinite;
            }
            
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .freshness-banner-time {
                color: #00ff87;
                font-weight: 600;
            }
            
            .freshness-banner-divider {
                opacity: 0.5;
            }
            
            .freshness-banner-link {
                color: white;
                text-decoration: none;
                transition: color 0.3s ease;
            }
            
            .freshness-banner-link:hover {
                color: #00ff87;
                text-decoration: underline;
            }
            
            @media (max-width: 768px) {
                .article-freshness-banner {
                    font-size: 12px;
                    padding: 10px 15px;
                }
                
                .freshness-banner-content {
                    gap: 8px;
                }
            }
        `;
        document.head.appendChild(style);
        
        return banner;
    }
    
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        const banner = createBanner();
        const header = document.querySelector('.header');
        
        if (header) {
            // Insert banner after header
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            // Fallback: insert at the beginning of body
            document.body.insertBefore(banner, document.body.firstChild);
        }
        
        // Update time every hour
        setInterval(() => {
            const timeSpan = banner.querySelector('.freshness-banner-time');
            if (timeSpan) {
                timeSpan.textContent = getTimeAgo(latestArticle.publishDate);
            }
        }, 3600000);
    }
    
    init();
})();