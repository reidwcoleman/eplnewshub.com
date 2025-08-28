// Read Next Articles Loader
(function() {
    // Define recent articles with metadata
    const recentArticles = [
        {
            title: "Latest EPL News: Manager Reactions & Financial Drama",
            date: "February 7, 2025",
            excerpt: "Postecoglou defends Tottenham after Liverpool defeat, Premier League debates celebration rules.",
            url: "/articles/latest-epl-news-2025-02-07.html",
            image: "/upscalemedia-transformed.png"
        },
        {
            title: "Liverpool Triumph Over Bournemouth",
            date: "February 2, 2025",
            excerpt: "Liverpool secured a crucial victory against Bournemouth in a thrilling Premier League encounter.",
            url: "/articles/liverpool-triumph-over-bournemouth-2025-02-02.html",
            image: "/upscalemedia-transformed.png"
        },
        {
            title: "Bournemouth vs Liverpool: Heavily Anticipated Match Preview",
            date: "January 31, 2025",
            excerpt: "Preview of the highly anticipated clash between Bournemouth and Liverpool at the Vitality Stadium.",
            url: "/articles/bournmouth-vs-liverpool-heavily-anticipated-match-preview-2025-01-31.html",
            image: "/upscalemedia-transformed.png"
        },
        {
            title: "Michael Oliver Banned from Refereeing Arsenal Games",
            date: "January 27, 2025",
            excerpt: "Controversial referee Michael Oliver faces restrictions following recent Arsenal match incidents.",
            url: "/articles/michal-oliver-banned-from-reffing-arsenal-games-01-27-2025.html",
            image: "/upscalemedia-transformed.png"
        },
        {
            title: "Manchester United's Worst Team in Years",
            date: "January 20, 2025",
            excerpt: "Analysis of Manchester United's struggling squad and what it means for the club's future.",
            url: "/articles/Manchester-Uniteds-worst-team-in-years-20-01-2025.html",
            image: "/upscalemedia-transformed.png"
        },
        {
            title: "Eze Free-Kick Disallowed: Chelsea VAR Controversy",
            date: "January 17, 2025",
            excerpt: "VAR controversy as Eberechi Eze's free-kick goal is ruled out in Chelsea match.",
            url: "/articles/eze-free-kick-disallowed-chelsea-var-2025-01-17.html",
            image: "/upscalemedia-transformed.png"
        },
        {
            title: "Nottingham Forest Rises to Third in EPL Standings",
            date: "January 6, 2025",
            excerpt: "Nottingham Forest's remarkable rise to third place in the Premier League standings shocks fans.",
            url: "/articles/nottingham-forest-rises-to-an-incredible-third-in-the-epl-standings-01-06-2025.html",
            image: "/upscalemedia-transformed.png"
        },
        {
            title: "A New Year, A New Football: 2025 Edition",
            date: "January 5, 2025",
            excerpt: "What to expect from the Premier League in 2025 as teams gear up for the second half of the season.",
            url: "/articles/a-new-year-a-new-football-2025-edition-01-05-2025.html",
            image: "/upscalemedia-transformed.png"
        }
    ];

    function loadReadNextArticles() {
        // Wait for HTML injection to complete
        setTimeout(() => {
            const readNextContainer = document.querySelector('.read-next');
            if (!readNextContainer) return;
            
            // Get current article URL to exclude it from recommendations
            const currentUrl = window.location.pathname.split('/').pop();
            
            // Filter out current article and get up to 4 recent articles
            const articlesToShow = recentArticles
                .filter(article => !article.url.includes(currentUrl))
                .slice(0, 4);

        // Generate HTML for each article
        const articlesHTML = articlesToShow.map(article => `
            <article class="read-next-item">
                <a href="${article.url}" class="read-next-link">
                    <div class="read-next-image-container">
                        <img src="${article.image}" alt="${article.title}" class="read-next-image" loading="lazy">
                    </div>
                    <div class="read-next-content">
                        <h3 class="read-next-item-title">${article.title}</h3>
                        <p class="read-next-excerpt">${article.excerpt}</p>
                        <time class="read-next-date">${article.date}</time>
                    </div>
                </a>
            </article>
        `).join('');

            // Create the complete HTML structure
            const readNextHTML = `
                <div class="read-next-section">
                    <h2 class="read-next-title">You Should Read Next</h2>
                    <div class="read-next-grid">
                        ${articlesHTML}
                    </div>
                </div>
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