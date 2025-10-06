// Article Freshness Indicator for EPL News Hub
// Shows how long ago the latest article was published

(function() {
    'use strict';
    
    // Latest article data - Update this when new articles are published
    const latestArticle = {
        title: "Soccer Barclays Premier League: Ultimate SEO Guide to History, Champions, Records, 2025-26 Fixtures, Transfers, Predictions & How to Watch",
        description: "Ultimate guide to Soccer Barclays Premier League: History, champions, 2025-26 fixtures, transfers, predictions, and how to watch. Complete EPL resource with all-time records, team analysis, and US viewing options.",
        publishDate: "2025-08-15T10:00:00Z", // ISO format for accurate time calculation
        url: "articles/soccer-barclays-premier-league-seo-guide-2025.html",
        category: "Ultimate Guide",
        author: "EPL News Hub"
    };
    
    // Function to calculate time ago
    function getTimeAgo(dateString) {
        const publishDate = new Date(dateString);
        const now = new Date();
        const diffInMs = now - publishDate;
        const diffInSeconds = Math.floor(diffInMs / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInWeeks = Math.floor(diffInDays / 7);
        const diffInMonths = Math.floor(diffInDays / 30);
        
        if (diffInSeconds < 60) {
            return "Just now";
        } else if (diffInMinutes < 60) {
            return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
        } else if (diffInHours < 24) {
            return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
        } else if (diffInDays < 7) {
            return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
        } else if (diffInWeeks < 4) {
            return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
        } else if (diffInMonths < 12) {
            return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
        } else {
            const diffInYears = Math.floor(diffInDays / 365);
            return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
        }
    }
    
    // Function to create the freshness indicator element
    function createFreshnessIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'article-freshness-indicator';
        indicator.innerHTML = `
            <div class="freshness-container">
                <div class="freshness-header">
                    <span class="freshness-icon">🔥</span>
                    <span class="freshness-label">Latest Article</span>
                    <span class="freshness-time" id="freshness-time">${getTimeAgo(latestArticle.publishDate)}</span>
                </div>
                <div class="freshness-content">
                    <h3 class="freshness-title">
                        <a href="${latestArticle.url}" class="freshness-link">
                            ${latestArticle.title}
                        </a>
                    </h3>
                    <p class="freshness-description">${latestArticle.description}</p>
                    <div class="freshness-meta">
                        <span class="freshness-category">${latestArticle.category}</span>
                        <span class="freshness-author">by ${latestArticle.author}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .article-freshness-indicator {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 350px;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(56, 0, 60, 0.15);
                z-index: 1000;
                padding: 20px;
                border: 2px solid #38003c;
                animation: slideIn 0.5s ease-out;
                transition: all 0.3s ease;
            }
            
            .article-freshness-indicator:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 50px rgba(56, 0, 60, 0.25);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .freshness-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e0e0e0;
            }
            
            .freshness-icon {
                font-size: 1.5rem;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .freshness-label {
                font-weight: 700;
                color: #38003c;
                text-transform: uppercase;
                font-size: 0.8rem;
                letter-spacing: 1px;
            }
            
            .freshness-time {
                margin-left: auto;
                background: linear-gradient(135deg, #38003c, #00ff87);
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .freshness-title {
                margin: 0 0 10px 0;
                font-size: 1rem;
                line-height: 1.3;
            }
            
            .freshness-link {
                color: #38003c;
                text-decoration: none;
                transition: color 0.3s ease;
            }
            
            .freshness-link:hover {
                color: #00ff87;
                text-decoration: underline;
            }
            
            .freshness-description {
                font-size: 0.85rem;
                color: #666;
                line-height: 1.5;
                margin: 0 0 10px 0;
            }
            
            .freshness-meta {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.75rem;
                color: #888;
            }
            
            .freshness-category {
                background: #f0f0f0;
                padding: 3px 8px;
                border-radius: 10px;
                font-weight: 600;
                color: #38003c;
            }
            
            .freshness-close {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 24px;
                height: 24px;
                background: rgba(0, 0, 0, 0.1);
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                color: #666;
                transition: all 0.3s ease;
            }
            
            .freshness-close:hover {
                background: rgba(0, 0, 0, 0.2);
                transform: rotate(90deg);
            }
            
            @media (max-width: 768px) {
                .article-freshness-indicator {
                    width: calc(100% - 40px);
                    right: 20px;
                    left: 20px;
                    top: auto;
                    bottom: 20px;
                }
            }
            
            @media (max-width: 480px) {
                .article-freshness-indicator {
                    width: calc(100% - 20px);
                    right: 10px;
                    left: 10px;
                }
                
                .freshness-title {
                    font-size: 0.9rem;
                }
                
                .freshness-description {
                    font-size: 0.8rem;
                }
            }
            
            /* Minimized state */
            .article-freshness-indicator.minimized {
                width: auto;
                padding: 10px 15px;
            }
            
            .article-freshness-indicator.minimized .freshness-content {
                display: none;
            }
            
            .article-freshness-indicator.minimized .freshness-header {
                margin-bottom: 0;
                padding-bottom: 0;
                border-bottom: none;
            }
        `;
        document.head.appendChild(style);
        
        return indicator;
    }
    
    // Function to update the time ago display
    function updateTimeDisplay() {
        const timeElement = document.getElementById('freshness-time');
        if (timeElement) {
            timeElement.textContent = getTimeAgo(latestArticle.publishDate);
        }
    }
    
    // Initialize the freshness indicator
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Create and add the indicator
        const indicator = createFreshnessIndicator();
        document.body.appendChild(indicator);
        
        // Add close button functionality
        const closeBtn = document.createElement('button');
        closeBtn.className = 'freshness-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = function() {
            indicator.classList.toggle('minimized');
            this.innerHTML = indicator.classList.contains('minimized') ? '☰' : '×';
        };
        indicator.querySelector('.freshness-container').appendChild(closeBtn);
        
        // Update time every minute
        setInterval(updateTimeDisplay, 60000);
        
        // Auto-minimize after 30 seconds
        setTimeout(() => {
            if (!indicator.classList.contains('minimized')) {
                indicator.classList.add('minimized');
                closeBtn.innerHTML = '☰';
            }
        }, 30000);
    }
    
    // Start the initialization
    init();
})();