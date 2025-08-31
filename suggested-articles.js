// Suggested Articles Component
(function() {
    // Define categorized articles for better suggestions
    const articleCategories = {
        transfers: [
            {
                title: "Latest Transfer News & Updates",
                excerpt: "Breaking transfer rumors and confirmed deals from the Premier League",
                url: "/articles/latest-transfer-news.html",
                category: "Transfers"
            },
            {
                title: "January Transfer Window Analysis",
                excerpt: "Complete breakdown of all January transfer window activity",
                url: "/articles/january-transfer-window.html",
                category: "Transfers"
            }
        ],
        analysis: [
            {
                title: "Tactical Analysis: Top 6 Teams",
                excerpt: "In-depth tactical breakdown of the Premier League's elite teams",
                url: "/articles/tactical-analysis-top-6.html",
                category: "Analysis"
            },
            {
                title: "Season Performance Review",
                excerpt: "Comprehensive review of team performances this season",
                url: "/articles/season-performance-review.html",
                category: "Analysis"
            }
        ],
        news: [
            {
                title: "Latest EPL News: Manager Reactions & Financial Drama",
                url: "/articles/latest-epl-news-2025-02-07.html",
                excerpt: "Postecoglou defends Tottenham after Liverpool defeat",
                category: "News"
            },
            {
                title: "Liverpool Triumph Over Bournemouth",
                url: "/articles/liverpool-triumph-over-bournemouth-2025-02-02.html",
                excerpt: "Liverpool secured a crucial victory against Bournemouth",
                category: "Match Report"
            },
            {
                title: "Michael Oliver Banned from Refereeing Arsenal Games",
                url: "/articles/michal-oliver-banned-from-reffing-arsenal-games-01-27-2025.html",
                excerpt: "Controversial referee faces restrictions following Arsenal incidents",
                category: "Controversy"
            }
        ],
        features: [
            {
                title: "Manchester United's Worst Team in Years",
                url: "/articles/Manchester-Uniteds-worst-team-in-years-20-01-2025.html",
                excerpt: "Analysis of Manchester United's struggling squad",
                category: "Feature"
            },
            {
                title: "Nottingham Forest Rises to Third",
                url: "/articles/nottingham-forest-rises-to-an-incredible-third-in-the-epl-standings-01-06-2025.html",
                excerpt: "Forest's remarkable rise shocks the Premier League",
                category: "Feature"
            }
        ]
    };

    // Get all articles in a flat array for random suggestions
    function getAllArticles() {
        const allArticles = [];
        Object.values(articleCategories).forEach(category => {
            allArticles.push(...category);
        });
        return allArticles;
    }

    // Get suggested articles based on current article
    function getSuggestedArticles() {
        const currentUrl = window.location.pathname.split('/').pop();
        const allArticles = getAllArticles();
        
        // Filter out current article
        const availableArticles = allArticles.filter(article => 
            !article.url.includes(currentUrl)
        );
        
        // Shuffle and select 3 articles
        const shuffled = availableArticles.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }

    function insertSuggestedArticles() {
        // Wait for page content to load
        setTimeout(() => {
            // Find the main article content area
            const mainContent = document.querySelector('.main') || document.querySelector('.container');
            if (!mainContent) return;

            // Check if suggested articles already exist
            if (document.querySelector('.suggested-articles-section')) return;

            // Get suggested articles
            const suggestedArticles = getSuggestedArticles();
            
            // Create suggested articles HTML
            const suggestedHTML = `
                <div class="suggested-articles-section">
                    <div class="suggested-articles-container">
                        <h2 class="suggested-articles-title">
                            <span class="suggested-icon">📚</span>
                            Suggested Articles
                        </h2>
                        <div class="suggested-articles-list">
                            ${suggestedArticles.map(article => `
                                <a href="${article.url}" class="suggested-article-card">
                                    <div class="suggested-article-category">${article.category}</div>
                                    <h3 class="suggested-article-title">${article.title}</h3>
                                    <p class="suggested-article-excerpt">${article.excerpt}</p>
                                    <span class="suggested-article-arrow">→</span>
                                </a>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Create a div element
            const suggestedDiv = document.createElement('div');
            suggestedDiv.innerHTML = suggestedHTML;

            // Find the best insertion point (after main article content)
            const articleEnd = mainContent.querySelector('ul:last-of-type') || 
                             mainContent.querySelector('p:last-of-type') ||
                             mainContent.lastElementChild;
            
            if (articleEnd && articleEnd.parentNode) {
                // Insert after the last content element
                articleEnd.parentNode.insertBefore(suggestedDiv.firstElementChild, articleEnd.nextSibling);
            } else {
                // Fallback: append to main content
                mainContent.appendChild(suggestedDiv.firstElementChild);
            }
        }, 500);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertSuggestedArticles);
    } else {
        insertSuggestedArticles();
    }

    // Export for potential use elsewhere
    window.loadSuggestedArticles = insertSuggestedArticles;
})();