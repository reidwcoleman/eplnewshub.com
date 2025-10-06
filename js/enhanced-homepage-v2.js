// Enhanced Homepage JavaScript Functionality
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeEnhancedHomepage();
});

function initializeEnhancedHomepage() {
    // Initialize all features
    initDarkMode();
    initLoadingScreen();
    initFloatingActionButton();
    initEnhancedSearch();
    initLiveTicker();
    initPersonalizedDashboard();
    initHeroCarousel();
    initInteractiveTools();
    initNewsGrid();
    initCommunityFeatures();
    initNotifications();
    initPerformanceOptimizations();
    initBackToTop();
    initKeyboardNavigation();
    
    console.log('Enhanced Homepage initialized successfully');
}

// Dark Mode Implementation
// ========================
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
        updateDarkModeIcon(savedTheme === 'dark-mode');
    }
    
    darkModeToggle.addEventListener('click', function() {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        
        localStorage.setItem('theme', isDark ? 'dark-mode' : '');
        updateDarkModeIcon(isDark);
        
        // Animate the toggle
        this.style.transform = 'scale(0.8)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
}

function updateDarkModeIcon(isDark) {
    const icon = document.querySelector('#darkModeToggle i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Loading Screen
// ==============
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    
    // Check if loading screen exists
    if (!loadingScreen) {
        console.log('Loading screen element not found');
        return;
    }
    
    // Hide loading screen after page load
    window.addEventListener('load', function() {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                }, 500);
            }
        }, 1500);
    });
}

// Floating Action Button
// ======================
function initFloatingActionButton() {
    const fabMain = document.getElementById('fabMain');
    const fabOptions = document.getElementById('fabOptions');
    
    // Check if elements exist before adding listeners
    if (!fabMain || !fabOptions) {
        console.log('FAB elements not found, skipping initialization');
        return;
    }
    
    let isOpen = false;
    
    fabMain.addEventListener('click', function() {
        isOpen = !isOpen;
        
        if (isOpen) {
            fabOptions.classList.add('active');
            fabMain.style.transform = 'rotate(45deg)';
        } else {
            fabOptions.classList.remove('active');
            fabMain.style.transform = 'rotate(0deg)';
        }
    });
    
    // Handle FAB option clicks
    const fabOptionElements = document.querySelectorAll('.fab-option');
    fabOptionElements.forEach(option => {
        option.addEventListener('click', function() {
            const action = this.dataset.action;
            handleFabAction(action);
        });
    });
}

function handleFabAction(action) {
    switch(action) {
        case 'bookmark':
            showBookmarks();
            break;
        case 'notification':
            toggleNotifications();
            break;
        case 'share':
            shareCurrentPage();
            break;
    }
}

// Enhanced Search Functionality
// =============================
function initEnhancedSearch() {
    const searchInput = document.getElementById('enhancedSearch');
    const searchSuggestions = document.getElementById('searchSuggestions');
    const filtersBtn = document.getElementById('searchFiltersBtn');
    const filtersPanel = document.getElementById('searchFiltersPanel');
    
    // Check if elements exist
    if (!searchInput) {
        console.log('Enhanced search elements not found');
        return;
    }
    
    let searchTimeout;
    
    // Real-time search suggestions
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value);
            }, 300);
        });
    }
    
    // Toggle filters panel
    if (filtersBtn && filtersPanel) {
        filtersBtn.addEventListener('click', function() {
            filtersPanel.classList.toggle('active');
        });
    }
    
    // Filter buttons functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            applySearchFilters();
        });
    });
}

function performSearch(query) {
    if (query.length < 2) {
        hideSuggestions();
        return;
    }
    
    // Simulate search suggestions
    const suggestions = generateSearchSuggestions(query);
    displaySuggestions(suggestions);
}

function generateSearchSuggestions(query) {
    const sampleSuggestions = [
        'Alexander Isak transfer',
        'Liverpool news',
        'Arsenal transfers',
        'Premier League standings',
        'FPL tips',
        'Manchester United',
        'Chelsea news',
        'Transfer deadline day'
    ];
    
    return sampleSuggestions.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
}

function displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (suggestions.length === 0) {
        hideSuggestions();
        return;
    }
    
    suggestionsContainer.innerHTML = suggestions.map(suggestion => 
        `<div class="search-suggestion" onclick="selectSuggestion('${suggestion}')">${suggestion}</div>`
    ).join('');
    
    suggestionsContainer.classList.add('active');
}

function hideSuggestions() {
    document.getElementById('searchSuggestions').classList.remove('active');
}

function selectSuggestion(suggestion) {
    document.getElementById('enhancedSearch').value = suggestion;
    hideSuggestions();
    // Perform actual search with selected suggestion
    console.log('Searching for:', suggestion);
}

// Live Ticker
// ===========
function initLiveTicker() {
    const tickerText = document.getElementById('tickerText');
    const tickerContent = [
        '🚨 BREAKING: Alexander Isak refuses to train for Newcastle',
        '💰 Liverpool preparing £120M bid for Isak',
        '✅ Jack Grealish completes Everton medical',
        '⏰ Transfer deadline day approaching fast',
        '🔥 Marc Guéhi to Liverpool 85% likely'
    ];
    
    let currentIndex = 0;
    
    setInterval(() => {
        tickerText.style.opacity = '0';
        setTimeout(() => {
            tickerText.textContent = tickerContent[currentIndex];
            tickerText.style.opacity = '1';
            currentIndex = (currentIndex + 1) % tickerContent.length;
        }, 500);
    }, 5000);
}

// Personalized Dashboard
// ======================
function initPersonalizedDashboard() {
    updateTimeOfDay();
    loadUserStats();
    initMyTeams();
}

function updateTimeOfDay() {
    const hour = new Date().getHours();
    const timeOfDayElement = document.getElementById('timeOfDay');
    
    if (hour < 12) {
        timeOfDayElement.textContent = 'morning';
    } else if (hour < 17) {
        timeOfDayElement.textContent = 'afternoon';
    } else {
        timeOfDayElement.textContent = 'evening';
    }
}

function loadUserStats() {
    // Simulate loading user stats
    animateCounter('readingStreak', 7);
    animateCounter('articlesRead', 23);
    animateCounter('pointsEarned', 1250);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    let currentValue = 0;
    const increment = targetValue / 50;
    
    const counter = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = targetValue.toLocaleString();
            clearInterval(counter);
        } else {
            element.textContent = Math.floor(currentValue).toLocaleString();
        }
    }, 20);
}

function initMyTeams() {
    const editTeamsBtn = document.getElementById('editTeamsBtn');
    const teamCards = document.querySelectorAll('.team-card');
    
    editTeamsBtn.addEventListener('click', function() {
        alert('Team editing functionality would open here');
    });
    
    teamCards.forEach(card => {
        card.addEventListener('click', function() {
            const team = this.dataset.team;
            showTeamNews(team);
        });
    });
}

// Hero Carousel
// =============
function initHeroCarousel() {
    const carousel = document.getElementById('heroCarousel');
    const slides = carousel.querySelectorAll('.hero-slide');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const indicators = document.querySelectorAll('.indicator');
    
    let currentSlide = 0;
    
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
        
        currentSlide = index;
    }
    
    prevBtn.addEventListener('click', () => {
        const newIndex = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
        showSlide(newIndex);
    });
    
    nextBtn.addEventListener('click', () => {
        const newIndex = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
        showSlide(newIndex);
    });
    
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => showSlide(index));
    });
    
    // Auto-advance carousel
    setInterval(() => {
        const newIndex = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
        showSlide(newIndex);
    }, 8000);
}

// Interactive Tools
// =================
function initInteractiveTools() {
    initTransferCalculator();
    initFPLBuilder();
    initMatchPredictor();
    initLivePoll();
}

function initTransferCalculator() {
    const calculateBtn = document.getElementById('calculateProbability');
    const resultDiv = document.getElementById('probabilityResult');
    
    calculateBtn.addEventListener('click', function() {
        const player = document.getElementById('playerSelect').value;
        const club = document.getElementById('clubSelect').value;
        
        if (!player || !club) {
            resultDiv.innerHTML = '<p style="color: #ff4444;">Please select both player and destination club</p>';
            return;
        }
        
        // Simulate probability calculation
        const probability = Math.floor(Math.random() * 40) + 60; // 60-99%
        resultDiv.innerHTML = `
            <div class="probability-display">
                <div class="probability-circle">
                    <span class="probability-number">${probability}%</span>
                </div>
                <p>Transfer likelihood based on current rumors and insider reports</p>
            </div>
        `;
    });
}

function initFPLBuilder() {
    const formationBtns = document.querySelectorAll('.formation-btn');
    const viewTeamBtn = document.getElementById('viewFPLTeam');
    
    formationBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            formationBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateBudgetDisplay();
        });
    });
    
    viewTeamBtn.addEventListener('click', function() {
        alert('FPL Team Builder would open here with the selected formation');
    });
}

function initMatchPredictor() {
    const predictBtn = document.getElementById('predictMatch');
    const resultDiv = document.getElementById('predictionResult');
    
    predictBtn.addEventListener('click', function() {
        // Simulate match prediction
        const predictions = [
            '2-1 Home Win (45% probability)',
            '1-1 Draw (30% probability)',
            '0-2 Away Win (25% probability)'
        ];
        
        resultDiv.innerHTML = `
            <div class="prediction-results">
                ${predictions.map(pred => `<div class="prediction-item">${pred}</div>`).join('')}
            </div>
        `;
    });
}

function initLivePoll() {
    const voteBtn = document.getElementById('submitVote');
    const pollOptions = document.querySelectorAll('.poll-option');
    let selectedOption = null;
    
    pollOptions.forEach(option => {
        option.addEventListener('click', function() {
            pollOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedOption = this.dataset.option;
        });
    });
    
    voteBtn.addEventListener('click', function() {
        if (!selectedOption) {
            alert('Please select an option before voting');
            return;
        }
        
        // Simulate vote submission
        this.textContent = 'Vote Submitted!';
        this.disabled = true;
        
        setTimeout(() => {
            this.textContent = 'Vote';
            this.disabled = false;
            selectedOption = null;
            pollOptions.forEach(opt => opt.classList.remove('selected'));
        }, 3000);
    });
}

// News Grid & Content Management
// ==============================
function initNewsGrid() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const sortSelect = document.getElementById('sortSelect');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const newsGrid = document.getElementById('newsGrid');
    
    // View switching
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            switchNewsView(this.dataset.view);
        });
    });
    
    // Filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterNews(this.dataset.category);
        });
    });
    
    // Sort functionality
    sortSelect.addEventListener('change', function() {
        sortNews(this.value);
    });
    
    // Load more articles
    loadMoreBtn.addEventListener('click', function() {
        loadMoreArticles();
    });
    
    // Initial news load
    loadNewsArticles();
}

function loadNewsArticles() {
    // Simulate loading news articles
    const newsGrid = document.getElementById('newsGrid');
    const sampleArticles = generateSampleArticles();
    
    newsGrid.innerHTML = sampleArticles.map(article => `
        <article class="news-article" data-category="${article.category}">
            <div class="article-image">
                <img src="${article.image}" alt="${article.title}" loading="lazy">
                <div class="article-badge ${article.category}">${article.badge}</div>
            </div>
            <div class="article-content">
                <h3 class="article-title">${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span class="article-date">${article.date}</span>
                    <span class="reading-time">${article.readTime} min read</span>
                </div>
            </div>
        </article>
    `).join('');
}

function generateSampleArticles() {
    return [
        {
            title: "Liverpool's £120M Isak Bid Confirmed",
            excerpt: "Exclusive: Liverpool have submitted official bid for Newcastle striker",
            category: "transfers",
            badge: "BREAKING",
            image: "placeholder-400x250.jpg",
            date: "2 hours ago",
            readTime: 3
        },
        {
            title: "Arsenal's Title Chances Analyzed",
            excerpt: "Deep dive into Arsenal's squad depth and title credentials",
            category: "analysis",
            badge: "ANALYSIS",
            image: "placeholder-400x250.jpg",
            date: "4 hours ago",
            readTime: 5
        },
        {
            title: "FPL GW1 Essential Picks",
            excerpt: "Must-have players for Fantasy Premier League Gameweek 1",
            category: "fantasy",
            badge: "FPL",
            image: "placeholder-400x250.jpg",
            date: "6 hours ago",
            readTime: 4
        }
    ];
}

// Community Features
// ==================
function initCommunityFeatures() {
    const participateBtn = document.querySelector('.participate-btn');
    const commentActions = document.querySelectorAll('.comment-actions button');
    
    participateBtn.addEventListener('click', function() {
        alert('Challenge participation feature would open here');
    });
    
    commentActions.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.innerHTML.includes('heart') ? 'like' : 'reply';
            handleCommentAction(action, this);
        });
    });
}

function handleCommentAction(action, button) {
    if (action === 'like') {
        const likeCount = button.querySelector('i').nextSibling;
        const currentCount = parseInt(likeCount.textContent.trim());
        likeCount.textContent = ` ${currentCount + 1}`;
        button.style.color = '#ff4444';
    } else {
        alert('Reply functionality would open here');
    }
}

// Notifications
// =============
function initNotifications() {
    const notificationBell = document.getElementById('notificationBell');
    const userPreferences = document.getElementById('userPreferences');
    
    notificationBell.addEventListener('click', function() {
        showNotificationPanel();
    });
    
    userPreferences.addEventListener('click', function() {
        showUserPreferences();
    });
    
    // Simulate real-time notifications
    simulateNotifications();
}

function simulateNotifications() {
    // Disabled automatic popups for better user experience
    // Users can still check notifications manually via the bell icon
}

function updateNotificationCount(count) {
    const countElement = document.querySelector('.notification-count');
    countElement.textContent = count;
    countElement.style.animation = 'pulse 0.5s ease';
}

function showToast(message) {
    // Toast notifications disabled for better user experience
    // Uncomment below to re-enable toast notifications
    /*
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 5000);
    */
}

// Performance Optimizations
// =========================
function initPerformanceOptimizations() {
    // Lazy loading for images
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Preload critical resources
    preloadCriticalResources();
}

function preloadCriticalResources() {
    const criticalImages = [
        'upscalemedia-transformed.png',
        'fpl-picks-gameweek-1.jpg'
    ];
    
    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// Back to Top Button
// ==================
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Keyboard Navigation
// ===================
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Escape key to close modals/panels
        if (e.key === 'Escape') {
            closeAllPanels();
        }
        
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('enhancedSearch').focus();
        }
        
        // Ctrl/Cmd + D for dark mode
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            document.getElementById('darkModeToggle').click();
        }
    });
}

// Utility Functions
// =================
function closeAllPanels() {
    document.getElementById('searchFiltersPanel').classList.remove('active');
    document.getElementById('fabOptions').classList.remove('active');
    hideSuggestions();
}

function showTeamNews(team) {
    console.log(`Showing news for team: ${team}`);
    // This would filter and show news for the selected team
}

function showBookmarks() {
    alert('Bookmarks feature would open here');
}

function toggleNotifications() {
    alert('Notification settings would open here');
}

function shareCurrentPage() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        });
    } else {
        // Fallback for browsers without Web Share API
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!');
    }
}

function showNotificationPanel() {
    alert('Notification panel would open here');
}

function showUserPreferences() {
    alert('User preferences panel would open here');
}

function applySearchFilters() {
    console.log('Applying search filters...');
}

function switchNewsView(view) {
    const newsGrid = document.getElementById('newsGrid');
    newsGrid.className = `news-grid ${view}-view`;
}

function filterNews(category) {
    console.log(`Filtering news by category: ${category}`);
}

function sortNews(sortBy) {
    console.log(`Sorting news by: ${sortBy}`);
}

function loadMoreArticles() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    setTimeout(() => {
        loadMoreBtn.innerHTML = '<span>Load More Articles</span><i class="fas fa-chevron-down"></i>';
        showToast('More articles loaded!');
    }, 1500);
}

function updateBudgetDisplay() {
    // Simulate budget calculation
    const budget = (Math.random() * 20 + 80).toFixed(1);
    document.getElementById('remainingBudget').textContent = budget;
}

// Real-time Updates
// =================
function initRealTimeUpdates() {
    // Simulate real-time data updates
    setInterval(updateLiveScores, 30000); // Update every 30 seconds
    setInterval(updateTransferActivity, 60000); // Update every minute
    setInterval(updateFPLCountdown, 1000); // Update every second
}

function updateLiveScores() {
    console.log('Updating live scores...');
    // This would fetch real live score data
}

function updateTransferActivity() {
    console.log('Updating transfer activity...');
    // This would fetch latest transfer rumors
}

function updateFPLCountdown() {
    // Calculate time until FPL deadline (example: Friday 6:30 PM)
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(18, 30, 0, 0); // 6:30 PM
    
    // If it's past deadline today, set for next Friday
    if (now > deadline) {
        deadline.setDate(deadline.getDate() + ((5 - deadline.getDay() + 7) % 7 || 7));
    }
    
    const diff = deadline - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    const hoursElement = document.getElementById('fplHours');
    const minutesElement = document.getElementById('fplMinutes');
    
    if (hoursElement) hoursElement.textContent = hours;
    if (minutesElement) minutesElement.textContent = minutes;
}

// Initialize real-time updates
setTimeout(initRealTimeUpdates, 2000);

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeEnhancedHomepage,
        initDarkMode,
        performSearch,
        updateNotificationCount
    };
}