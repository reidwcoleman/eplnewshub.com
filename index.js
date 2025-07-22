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

// User Menu Functions
function toggleMenu() {
    const menu = document.getElementById('user-menu');
    const isVisible = menu.style.display !== 'none';
    
    if (isVisible) {
        closeMenu();
    } else {
        showMenu();
    }
}

function showMenu() {
    const menu = document.getElementById('user-menu');
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    overlay.id = 'menu-overlay';
    overlay.onclick = closeMenu;
    
    document.body.appendChild(overlay);
    menu.style.display = 'block';
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 100);
}

function closeMenu() {
    const menu = document.getElementById('user-menu');
    const overlay = document.getElementById('menu-overlay');
    
    menu.style.display = 'none';
    
    if (overlay) {
        overlay.remove();
    }
    
    document.removeEventListener('click', handleOutsideClick);
}

function handleOutsideClick(event) {
    const menu = document.getElementById('user-menu');
    const menuBtn = document.querySelector('.menu-btn');
    
    if (!menu.contains(event.target) && !menuBtn.contains(event.target)) {
        closeMenu();
    }
}

function showSignIn() {
    closeMenu();
    // Create sign-in modal
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-header">
                <h2>Sign In to EPL News Hub</h2>
                <button class="close-auth" onclick="closeAuthModal()">×</button>
            </div>
            <form class="auth-form">
                <div class="form-group">
                    <label for="signin-email">Email</label>
                    <input type="email" id="signin-email" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="signin-password">Password</label>
                    <input type="password" id="signin-password" placeholder="Enter your password" required>
                </div>
                <button type="submit" class="auth-btn">Sign In</button>
                <div class="auth-links">
                    <a href="#" onclick="showSignUp(); return false;">Don't have an account? Sign up</a>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add CSS for modal if not already added
    if (!document.getElementById('auth-modal-styles')) {
        addAuthModalStyles();
    }
}

function showSignUp() {
    closeAuthModal();
    closeMenu();
    
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <div class="auth-header">
                <h2>Create Account</h2>
                <button class="close-auth" onclick="closeAuthModal()">×</button>
            </div>
            <form class="auth-form">
                <div class="form-group">
                    <label for="signup-name">Full Name</label>
                    <input type="text" id="signup-name" placeholder="Enter your full name" required>
                </div>
                <div class="form-group">
                    <label for="signup-email">Email</label>
                    <input type="email" id="signup-email" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="signup-password">Password</label>
                    <input type="password" id="signup-password" placeholder="Create a password" required>
                </div>
                <button type="submit" class="auth-btn">Create Account</button>
                <div class="auth-links">
                    <a href="#" onclick="showSignIn(); return false;">Already have an account? Sign in</a>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (!document.getElementById('auth-modal-styles')) {
        addAuthModalStyles();
    }
}

function closeAuthModal() {
    const modal = document.querySelector('.auth-modal');
    if (modal) {
        modal.remove();
    }
}

function addAuthModalStyles() {
    const style = document.createElement('style');
    style.id = 'auth-modal-styles';
    style.textContent = `
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        }
        
        .auth-modal-content {
            background: white;
            padding: 0;
            border-radius: 12px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .auth-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 25px;
            border-bottom: 1px solid #e2e2e2;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px 12px 0 0;
        }
        
        .auth-header h2 {
            margin: 0;
            font-family: 'Helvetica Neue', sans-serif;
            font-size: 1.3rem;
            color: #333;
        }
        
        .close-auth {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
            padding: 5px;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .close-auth:hover {
            background: rgba(0,0,0,0.1);
            color: #333;
        }
        
        .auth-form {
            padding: 25px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-family: 'Helvetica Neue', sans-serif;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e2e2;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s ease;
            font-family: 'Helvetica Neue', sans-serif;
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #0066cc;
        }
        
        .auth-btn {
            width: 100%;
            padding: 12px;
            background: #0066cc;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            font-family: 'Helvetica Neue', sans-serif;
        }
        
        .auth-btn:hover {
            background: #0052a3;
        }
        
        .auth-links {
            text-align: center;
            margin-top: 20px;
        }
        
        .auth-links a {
            color: #0066cc;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .auth-links a:hover {
            text-decoration: underline;
        }
    `;
    document.head.appendChild(style);
}
