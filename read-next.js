// Read Next Articles Loader - Most Popular Articles
(function() {
    // Define most popular articles based on traffic and engagement
    const mostPopularArticles = [
        {
            title: "Captain Haaland for FPL Gameweek 5: Why the Norwegian Is Your Essential Pick",
            date: "September 14, 2025",
            excerpt: "With 9 goals in 4 matches, Haaland delivers unprecedented FPL returns. Complete analysis reveals why he's the optimal captaincy choice for Gameweek 5.",
            url: "/articles/captain-haaland-fantasy-premier-league-gameweek-5-2025-09-14.html",
            image: "/Erling Haaland Man City 2025-26.jpg.webp",
            views: "125.4K views",
            category: "FPL Guide"
        },
        {
            title: "City vs United: Tactical Preview of the 197th Manchester Derby",
            date: "September 14, 2025",
            excerpt: "The Manchester Derby arrives with City atop the Premier League table. In-depth tactical analysis of this pivotal clash at the Etihad Stadium.",
            url: "/articles/manchester-city-vs-manchester-united-derby-preview-2025-09-14.html",
            image: "/24_023_Manchester.webp",
            views: "98.2K views",
            category: "Match Preview"
        },
        {
            title: "Supercomputer: Liverpool Favorites for Premier League Title",
            date: "September 11, 2025",
            excerpt: "Opta's model gives Liverpool 28.9% probability to win 2025/26 title, ahead of Arsenal and Chelsea in 10,000 season simulations.",
            url: "/articles/supercomputer-predicts-liverpool-premier-league-2025-26.html",
            image: "/1ec43f70-8e24-11f0-a7c8-151354d0eaad.jpg.webp",
            views: "87.6K views",
            category: "AI Predictions"
        },
        {
            title: "Liverpool's £125m Isak Deal Headlines Record Transfer Deadline Day",
            date: "September 7, 2025",
            excerpt: "Transfer Deadline Day 2025 saw Liverpool shatter British records signing Alexander Isak. Complete analysis of all deadline deals.",
            url: "/articles/transfer-deadline-day-2025-premier-league-analysis.html",
            image: "/tPyXeVGpybfpwSYcoAAnGH-970-80.jpg.webp",
            views: "76.9K views",
            category: "Transfer News"
        },
        {
            title: "Why 2025-26 Could Be Arsenal's Year to Win the Premier League",
            date: "September 8, 2025",
            excerpt: "Arsenal's £150m summer signings and tactical evolution under Arteta could finally end their 21-year title drought.",
            url: "/articles/arsenal-premier-league-title-2025-26.html",
            image: "/saka.png",
            views: "72.3K views",
            category: "Analysis"
        },
        {
            title: "Premier League Shatters £3 Billion Transfer Record",
            date: "September 6, 2025",
            excerpt: "Transfer window closes with unprecedented £3.087 billion spending. Liverpool leads with £442 million in acquisitions.",
            url: "/articles/premier-league-transfer-window-2025-record-breaking-3-billion.html",
            image: "/0_GettyImages-2233072459.webp",
            views: "68.4K views",
            category: "Transfer Special"
        },
        {
            title: "Liverpool: Salah's 95th-Minute Penalty Seals Dramatic Win",
            date: "September 14, 2025",
            excerpt: "Mohamed Salah's stoppage-time penalty secured Liverpool's dramatic 1-0 victory over Burnley in another late thriller.",
            url: "/articles/liverpool-vs-burnley-salah-penalty-2025-09-14.html",
            image: "/1977.avif",
            views: "65.1K views",
            category: "Match Report"
        },
        {
            title: "FPL GW4: Best Picks, Captain Choices & Transfer Tips",
            date: "September 5, 2025",
            excerpt: "Ultimate Fantasy Premier League Gameweek 4 preview with expert picks, fixture analysis, and crucial transfer tips.",
            url: "/articles/fpl-gameweek-4-preview-2025-26-september-13.html",
            image: "/upscalemedia-transformed.png",
            views: "61.7K views",
            category: "FPL Guide"
        }
    ];

    function loadReadNextArticles() {
        // Wait for HTML injection to complete
        setTimeout(() => {
            const readNextContainer = document.querySelector('.read-next');
            if (!readNextContainer) return;
            
            // Get current article URL to exclude it from recommendations
            const currentUrl = window.location.pathname.split('/').pop();
            
            // Filter out current article and get top 3 most popular articles
            const articlesToShow = mostPopularArticles
                .filter(article => !article.url.includes(currentUrl))
                .slice(0, 3);

            // Generate HTML for each article with enhanced styling
            const articlesHTML = articlesToShow.map((article, index) => `
                <article class="read-next-item popular-article" style="animation-delay: ${index * 0.1}s;">
                    <a href="${article.url}" class="read-next-link">
                        <div class="read-next-image-container">
                            <img src="${article.image}" alt="${article.title}" class="read-next-image" loading="lazy">
                            <div class="article-overlay">
                                <span class="article-category">${article.category}</span>
                            </div>
                            <div class="popularity-badge">
                                <span class="badge-icon">🔥</span>
                                <span class="badge-text">POPULAR</span>
                            </div>
                        </div>
                        <div class="read-next-content">
                            <h3 class="read-next-item-title">${article.title}</h3>
                            <p class="read-next-excerpt">${article.excerpt}</p>
                            <div class="article-meta">
                                <time class="read-next-date">${article.date}</time>
                                <span class="article-views">${article.views}</span>
                            </div>
                        </div>
                    </a>
                </article>
            `).join('');

            // Create the complete HTML structure with enhanced styling
            const readNextHTML = `
                <div class="read-next-section">
                    <div class="section-header">
                        <h2 class="read-next-title">
                            <span class="title-icon">🔥</span>
                            Most Popular Articles
                        </h2>
                        <p class="section-subtitle">Trending stories our readers love</p>
                    </div>
                    <div class="read-next-grid">
                        ${articlesHTML}
                    </div>
                </div>
                <style>
                    .read-next-section {
                        max-width: 1200px;
                        margin: 60px auto;
                        padding: 0 20px;
                    }
                    
                    .section-header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    
                    .read-next-title {
                        font-size: 2.5rem;
                        font-weight: 900;
                        color: #0a0a0a;
                        margin-bottom: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                    }
                    
                    .title-icon {
                        font-size: 2rem;
                        animation: pulse 2s infinite;
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                    }
                    
                    .section-subtitle {
                        font-size: 1.1rem;
                        color: #666;
                        margin: 0;
                    }
                    
                    .read-next-grid {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 30px;
                    }
                    
                    .popular-article {
                        background: white;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                        transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
                        animation: slideUp 0.6s ease-out backwards;
                    }
                    
                    @keyframes slideUp {
                        from {
                            opacity: 0;
                            transform: translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .popular-article:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                    }
                    
                    .read-next-link {
                        text-decoration: none;
                        display: block;
                        height: 100%;
                    }
                    
                    .read-next-image-container {
                        position: relative;
                        height: 200px;
                        overflow: hidden;
                    }
                    
                    .read-next-image {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        transition: transform 0.6s ease;
                        filter: saturate(1.2) contrast(1.05);
                    }
                    
                    .popular-article:hover .read-next-image {
                        transform: scale(1.1);
                    }
                    
                    .article-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%);
                        z-index: 1;
                    }
                    
                    .article-category {
                        position: absolute;
                        top: 16px;
                        left: 16px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        z-index: 2;
                    }
                    
                    .popularity-badge {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 20px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        z-index: 2;
                        box-shadow: 0 4px 10px rgba(255,107,107,0.3);
                    }
                    
                    .badge-icon {
                        font-size: 14px;
                        animation: pulse 2s infinite;
                    }
                    
                    .badge-text {
                        font-size: 10px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                    }
                    
                    .read-next-content {
                        padding: 24px;
                    }
                    
                    .read-next-item-title {
                        font-size: 1.25rem;
                        font-weight: 800;
                        color: #0a0a0a;
                        margin: 0 0 12px;
                        line-height: 1.3;
                        letter-spacing: -0.02em;
                        transition: color 0.3s;
                    }
                    
                    .popular-article:hover .read-next-item-title {
                        color: #667eea;
                    }
                    
                    .read-next-excerpt {
                        font-size: 0.95rem;
                        color: #4a5568;
                        line-height: 1.6;
                        margin: 0 0 16px;
                    }
                    
                    .article-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-top: 16px;
                        border-top: 1px solid rgba(0,0,0,0.06);
                    }
                    
                    .read-next-date {
                        font-size: 0.85rem;
                        color: #718096;
                        font-weight: 600;
                    }
                    
                    .article-views {
                        font-size: 0.85rem;
                        color: #667eea;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    
                    .article-views::before {
                        content: "👁️";
                        font-size: 14px;
                    }
                    
                    @media (max-width: 768px) {
                        .read-next-grid {
                            grid-template-columns: 1fr;
                            gap: 20px;
                        }
                        
                        .read-next-title {
                            font-size: 2rem;
                        }
                        
                        .title-icon {
                            font-size: 1.5rem;
                        }
                    }
                </style>
            `;
            
            readNextContainer.innerHTML = readNextHTML;
        }, 100); // Small delay to ensure HTML injection has completed
    }

    // Load articles when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadReadNextArticles);
    } else {
        loadReadNextArticles();
    }
})();