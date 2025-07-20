/**
 * Function injects specified HTML file to specified HTML 
 * node of the current file
 * 
 * @param filePath - a path to a source HTML file to inject
 * @param elem - an HTML element to which this content will 
 * be injected
 */
async function injectHTML(filePath,elem) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            return;
        }
        const text = await response.text();
        elem.innerHTML = text;
        // reinject all <script> tags
        // for each <script> tag on injected html
        elem.querySelectorAll("script").forEach(script => {
            // create a new empty <script> tag
            const newScript = document.createElement("script");
            // copy attributes of existing script tag 
            // to a new one
            Array.from(script.attributes).forEach(attr =>
                newScript.setAttribute(attr.name, attr.value)
            );
            // inject a content of existing script tag 
            // to a new one
            newScript.appendChild(
                document.createTextNode(script.innerHTML)
            )
            // replace existing script tag to a new one
            script.parentNode.replaceChild(newScript, script);
        })
    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Function used to process all HTML tags of the following
 * format: <div include="<filename>"></div>
 * 
 * This function injects a content of <filename> to
 * each div with the "include" attribute
 */
function injectAll() {
    document.querySelectorAll("div[include]")
            .forEach((elem) => {
                injectHTML(elem.getAttribute("include"),elem);
    })
}

injectAll();

// Search functionality
const articles = [
    {
        title: "Premier League Transfer Window: Latest Rumors & Breaking News",
        url: "articles/premier-league-transfer-window-latest-rumors-07-20-2025.html",
        excerpt: "The Premier League transfer window is in full swing with Manchester United targeting Kvaratskhelia, Arsenal pursuing Šeško, and Liverpool rebuilding their midfield."
    },
    {
        title: "Victor Gyokeres New Transfer News and Rumoured Clubs",
        url: "articles/victor-gyokeres-premier-league-giants-in-hot-pursuit-05-25-25.html",
        excerpt: "Viktor Gyökeres has taken European football by storm in the 2024-25 season, cementing his status as one of the continent's most lethal strikers."
    },
    {
        title: "Premier League 2024/25 Final Day Drama",
        url: "articles/Premier-League-Final-Day-Drama-05-24-25.html",
        excerpt: "The 2024/2025 Premier League season wraps up on May 25, 2025, with all 20 teams playing simultaneously at 4:00 PM BST."
    },
    {
        title: "Latest EPL News: Manager Reactions, Financial, and Match Highlights",
        url: "articles/latest-epl-news-2025-02-07.html",
        excerpt: "The English Premier League has been abuzz with significant developments both on and off the pitch."
    },
    {
        title: "Manchester United's Worst Team in Years",
        url: "articles/Manchester-Uniteds-worst-team-in-years-20-01-2025.html",
        excerpt: "Analysis of Manchester United's challenging season and team performance."
    },
    {
        title: "Liverpool Triumph Over Bournemouth",
        url: "articles/liverpool-triumph-over-bournemouth-2025-02-02.html",
        excerpt: "Liverpool secured a convincing victory against Bournemouth in their latest Premier League encounter."
    },
    {
        title: "Nottingham Forest Rises to Third in EPL Standings",
        url: "articles/nottingham-forest-rises-to-an-incredible-third-in-the-epl-standings-01-06-2025.html",
        excerpt: "Nottingham Forest's remarkable rise to third place in the Premier League standings."
    },
    {
        title: "Cole Palmer's Rise and Domination of the Premier League",
        url: "articles/cole-palmers-rise-and-domination-of-the-premier-league-09-30-2024.html",
        excerpt: "Cole Palmer has emerged as one of the Premier League's most exciting talents."
    },
    {
        title: "Why Erling Haaland is Unstoppable in 2024-2025 Season",
        url: "articles/why-erling-haaland-is-unstopable-in-2024-2025-season-09-17-2024.html",
        excerpt: "Erling Haaland continues to dominate the Premier League with his incredible goal-scoring record."
    },
    {
        title: "Arsenal's Corner Kick Mastery",
        url: "articles/arsenals-corner-kick-mastery-10-06-2024.html",
        excerpt: "How Arsenal has perfected their corner kick strategies to become a major threat."
    },
    {
        title: "Man City's Legal Battle vs EPL Updates",
        url: "articles/man-citys-legal-battle-vs-epl-updates-10-09-2024.html",
        excerpt: "Latest updates on Manchester City's ongoing legal disputes with the Premier League."
    }
];

function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('search-results');
    
    if (query.length < 2) {
        resultsContainer.style.display = 'none';
        return;
    }
    
    const filteredArticles = articles.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.excerpt.toLowerCase().includes(query)
    );
    
    if (filteredArticles.length === 0) {
        resultsContainer.innerHTML = '<div class="search-result-item"><div class="search-result-title">No results found</div><div class="search-result-excerpt">Try different keywords</div></div>';
    } else {
        resultsContainer.innerHTML = filteredArticles.map(article => `
            <div class="search-result-item" onclick="window.location.href='${article.url}'">
                <div class="search-result-title">${highlightText(article.title, query)}</div>
                <div class="search-result-excerpt">${highlightText(article.excerpt, query)}</div>
            </div>
        `).join('');
    }
    
    resultsContainer.style.display = 'block';
}

function highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong style="background-color: #fff3cd;">$1</strong>');
}

// Real-time search as user types
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        
        // Hide results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                resultsContainer.style.display = 'none';
            }
        });
        
        // Show results when clicking on search input
        searchInput.addEventListener('focus', function() {
            if (searchInput.value.trim().length >= 2) {
                resultsContainer.style.display = 'block';
            }
        });
    }
});
