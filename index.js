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
async function injectAll() {
    const elements = document.querySelectorAll("div[include]");
    const promises = Array.from(elements).map((elem) => {
        return injectHTML(elem.getAttribute("include"), elem);
    });
    
    // Wait for all injections to complete
    await Promise.all(promises);
}

// Initialize content injection with better error handling
async function initializeContent() {
    try {
        await injectAll();
        
        // Wait a bit more for all content to be fully rendered
        setTimeout(() => {
            // Initialize enhancements after content is fully loaded
            addVisualEnhancements();
        }, 800);
        
    } catch (error) {
        console.error('Error initializing content:', error);
    }
}

// Start content initialization
initializeContent();

// Load advertising systems after content injection
window.addEventListener('DOMContentLoaded', function() {
    // Load FPL Premium Ads System
    (function loadFPLAds() {
        // Load FPL banner on all pages
        const script = document.createElement('script');
        script.src = '/fpl-ads.js';
        script.async = true;
        document.head.appendChild(script);
    })();

});

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

// Enhanced visual interactions for static site
function addVisualEnhancements() {
    // Add loading animation to images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.complete) {
            img.style.opacity = '1';
            img.style.transform = 'scale(1)';
        } else {
            img.addEventListener('load', function() {
                this.style.opacity = '1';
                this.style.transform = 'scale(1)';
            });
            
            // Set initial state
            img.style.opacity = '0';
            img.style.transform = 'scale(0.95)';
            img.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        }
    });

    // Add intersection observer for scroll animations (one-time only)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.add('animate-in');
                // Stop observing once animated - prevents re-triggering
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations (skip elements already visible)
    const animatedElements = document.querySelectorAll('.main_headline, .main_subheadline, .main_subheadline2, .main_subheadline3, .story-card, .featured-main');
    animatedElements.forEach(el => {
        // Skip if already in view or already animated
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (isVisible || el.classList.contains('animate-in')) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            el.classList.add('animate-in');
        } else {
            el.style.opacity = '0.3';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        }
    });

    // Add smooth hover effects for buttons
    const buttons = document.querySelectorAll('button, .newsletter-form button');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Initialize membership system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize membership system
    initializeMembershipSystem();
});

// ===== MEMBERSHIP SYSTEM =====

/**
 * Global function to check if user has active membership
 */
window.checkMembership = function() {
    const membership = localStorage.getItem('eplMembership');
    if (membership) {
        const data = JSON.parse(membership);
        return data.status === 'active' ? data : null;
    }
    return null;
};

/**
 * Global function to check if user has specific plan access
 */
window.hasPlanAccess = function(requiredPlan) {
    const membership = window.checkMembership();
    if (!membership) return false;
    
    const planHierarchy = {
        'starter': 1,
        'starter-annual': 1,
        'pro': 2,
        'pro-annual': 2
    };
    
    const userPlanLevel = planHierarchy[membership.plan] || 0;
    const requiredLevel = planHierarchy[requiredPlan] || 0;
    
    return userPlanLevel >= requiredLevel;
};

/**
 * Function to show/hide premium content based on membership
 */
function initializeMembershipSystem() {
    // Handle premium content visibility
    handlePremiumContent();
    
    // Add membership badges to content
    addMembershipBadges();
    
    // Initialize premium content access controls
    initializePremiumContentAccess();
}

/**
 * Handle showing/hiding premium content
 */
function handlePremiumContent() {
    const premiumElements = document.querySelectorAll('[data-premium]');
    const membership = window.checkMembership();
    
    premiumElements.forEach(element => {
        const requiredPlan = element.getAttribute('data-premium');
        
        if (!membership || !window.hasPlanAccess(requiredPlan)) {
            // User doesn't have access, show upgrade prompt
            showUpgradePrompt(element, requiredPlan);
        } else {
            // User has access, show content
            element.style.display = 'block';
            element.classList.add('premium-unlocked');
        }
    });
}

/**
 * Show upgrade prompt for premium content
 */
function showUpgradePrompt(element, requiredPlan) {
    const planNames = {
        'starter': 'Starter',
        'pro': 'Pro'
    };
    
    const planName = planNames[requiredPlan] || 'Premium';
    
    // Hide original content
    element.style.display = 'none';
    
    // Create upgrade prompt
    const upgradePrompt = document.createElement('div');
    upgradePrompt.className = 'premium-upgrade-prompt';
    upgradePrompt.innerHTML = `
        <div class="upgrade-content">
            <div class="upgrade-icon">🔒</div>
            <h3>Premium Content</h3>
            <p>This content requires a ${planName} membership to access.</p>
            <div class="upgrade-benefits">
                <span class="benefit">📰 Exclusive articles</span>
                <span class="benefit">🎯 Transfer insider info</span>
                <span class="benefit">📊 Advanced analytics</span>
            </div>
            <div class="upgrade-buttons">
                <a href="/membership.html" class="upgrade-btn primary">Upgrade to ${planName}</a>
                <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" class="upgrade-btn secondary">Maybe Later</button>
            </div>
        </div>
    `;
    
    // Insert after the premium element
    element.parentNode.insertBefore(upgradePrompt, element.nextSibling);
    
    // Add CSS for upgrade prompt if not already added
    if (!document.getElementById('premium-styles')) {
        addPremiumStyles();
    }
}

/**
 * Add membership badges to content
 */
function addMembershipBadges() {
    const membership = window.checkMembership();
    
    if (membership) {
        const planNames = {
            'starter': 'Starter',
            'starter-annual': 'Starter',
            'pro': 'Pro',
            'pro-annual': 'Pro'
        };
        
        const planName = planNames[membership.plan] || 'Premium';
        
        // Add membership badge to header if it exists
        const header = document.querySelector('.header, nav, .top-nav');
        if (header && !header.querySelector('.membership-badge')) {
            const badge = document.createElement('div');
            badge.className = 'membership-badge';
            badge.innerHTML = `✨ ${planName} Member`;
            badge.title = `Active ${planName} membership`;
            header.appendChild(badge);
        }
    }
}

/**
 * Initialize premium content access controls
 */
function initializePremiumContentAccess() {
    // Add premium indicators to articles
    const articleLinks = document.querySelectorAll('a[href*="/articles/"]');
    
    articleLinks.forEach(link => {
        // Check if this article should be premium (you can customize this logic)
        const href = link.getAttribute('href');
        
        // Mark certain articles as premium (you can expand this logic)
        if (href.includes('exclusive') || href.includes('insider') || href.includes('premium')) {
            if (!window.hasPlanAccess('starter')) {
                // Add premium indicator
                const premiumIndicator = document.createElement('span');
                premiumIndicator.className = 'premium-indicator';
                premiumIndicator.innerHTML = '👑 Premium';
                premiumIndicator.title = 'Requires membership';
                
                link.appendChild(premiumIndicator);
                
                // Add click handler to show upgrade prompt
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    showMembershipModal();
                });
            }
        }
    });
}

/**
 * Show membership upgrade modal
 */
function showMembershipModal() {
    const modal = document.createElement('div');
    modal.className = 'membership-modal';
    modal.innerHTML = `
        <div class="membership-modal-content">
            <div class="membership-header">
                <h2>🔒 Premium Content</h2>
                <button class="close-membership" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="membership-body">
                <p>This article requires a premium membership to read.</p>
                <div class="membership-benefits">
                    <div class="benefit-item">📰 Unlimited exclusive articles</div>
                    <div class="benefit-item">🎯 Premium transfer insider info</div>
                    <div class="benefit-item">📊 Advanced match analytics</div>
                    <div class="benefit-item">🏆 Early access to content</div>
                </div>
                <div class="membership-actions">
                    <a href="/membership.html" class="membership-btn primary">View Membership Plans</a>
                    <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="membership-btn secondary">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (!document.getElementById('membership-modal-styles')) {
        addMembershipModalStyles();
    }
}

/**
 * Add CSS styles for premium content
 */
function addPremiumStyles() {
    const style = document.createElement('style');
    style.id = 'premium-styles';
    style.textContent = `
        .premium-upgrade-prompt {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 2px solid #37003c;
            border-radius: 12px;
            padding: 24px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 4px 20px rgba(55,0,60,0.1);
        }
        
        .upgrade-content .upgrade-icon {
            font-size: 2.5rem;
            margin-bottom: 12px;
        }
        
        .upgrade-content h3 {
            color: #37003c;
            margin: 0 0 12px 0;
            font-size: 1.4rem;
        }
        
        .upgrade-content p {
            color: #666;
            margin-bottom: 16px;
        }
        
        .upgrade-benefits {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .benefit {
            background: rgba(55,0,60,0.1);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #37003c;
            font-weight: 500;
        }
        
        .upgrade-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .upgrade-btn {
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .upgrade-btn.primary {
            background: linear-gradient(135deg, #37003c, #6f42c1);
            color: white;
        }
        
        .upgrade-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(55,0,60,0.3);
        }
        
        .upgrade-btn.secondary {
            background: transparent;
            color: #666;
            border: 1px solid #ddd;
        }
        
        .upgrade-btn.secondary:hover {
            background: #f8f9fa;
        }
        
        .membership-badge {
            background: linear-gradient(135deg, #37003c, #6f42c1);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-left: auto;
            display: inline-block;
        }
        
        .premium-indicator {
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #333;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 8px;
            display: inline-block;
        }
        
        .premium-unlocked {
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 12px;
            background: rgba(40,167,69,0.05);
        }
        
        @media (max-width: 768px) {
            .upgrade-benefits {
                flex-direction: column;
                align-items: center;
            }
            
            .upgrade-buttons {
                flex-direction: column;
            }
            
            .upgrade-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Add CSS styles for membership modal
 */
function addMembershipModalStyles() {
    const style = document.createElement('style');
    style.id = 'membership-modal-styles';
    style.textContent = `
        .membership-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        
        .membership-modal-content {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        }
        
        .membership-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e9ecef;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 16px 16px 0 0;
        }
        
        .membership-header h2 {
            margin: 0;
            color: #37003c;
            font-size: 1.5rem;
        }
        
        .close-membership {
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
        
        .close-membership:hover {
            background: rgba(0,0,0,0.1);
        }
        
        .membership-body {
            padding: 24px;
        }
        
        .membership-body p {
            color: #666;
            margin-bottom: 20px;
            font-size: 1.1rem;
        }
        
        .membership-benefits {
            margin-bottom: 24px;
        }
        
        .benefit-item {
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
            color: #333;
            font-weight: 500;
        }
        
        .benefit-item:last-child {
            border-bottom: none;
        }
        
        .membership-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
        }
        
        .membership-btn {
            padding: 14px 28px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
        }
        
        .membership-btn.primary {
            background: linear-gradient(135deg, #37003c, #6f42c1);
            color: white;
        }
        
        .membership-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(55,0,60,0.3);
        }
        
        .membership-btn.secondary {
            background: #f8f9fa;
            color: #666;
            border: 1px solid #ddd;
        }
        
        .membership-btn.secondary:hover {
            background: #e9ecef;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .membership-actions {
                flex-direction: column;
            }
            
            .membership-btn {
                width: 100%;
            }
        }
    `;
    document.head.appendChild(style);
}
