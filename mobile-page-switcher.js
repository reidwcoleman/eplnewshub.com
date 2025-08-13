// Mobile Page Switcher for EPL News Hub
(function() {
    'use strict';
    
    // Enhanced mobile detection
    const MobileDetector = {
        // Check user agent for mobile devices
        isMobileDevice() {
            const userAgent = navigator.userAgent.toLowerCase();
            const mobileKeywords = [
                'android', 'webos', 'iphone', 'ipad', 'ipod', 
                'blackberry', 'iemobile', 'opera mini', 'mobile',
                'tablet', 'kindle', 'silk', 'phone'
            ];
            
            return mobileKeywords.some(keyword => userAgent.includes(keyword));
        },
        
        // Check screen size
        isMobileScreen() {
            return window.innerWidth <= 768 || window.innerHeight <= 600;
        },
        
        // Check touch support
        isTouchDevice() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },
        
        // Combined mobile detection
        isMobile() {
            return this.isMobileDevice() || (this.isMobileScreen() && this.isTouchDevice());
        },
        
        // Check if user prefers mobile experience
        prefersMobile() {
            return localStorage.getItem('preferMobile') === 'true';
        },
        
        // Check if user prefers desktop experience
        prefersDesktop() {
            return localStorage.getItem('preferDesktop') === 'true';
        }
    };
    
    // Page switcher functionality
    const PageSwitcher = {
        init() {
            this.checkAndSwitchPage();
            this.addViewToggleButtons();
            this.handleOrientationChange();
        },
        
        checkAndSwitchPage() {
            const isMobile = MobileDetector.isMobile();
            const prefersMobile = MobileDetector.prefersMobile();
            const prefersDesktop = MobileDetector.prefersDesktop();
            
            // Don't switch if user has explicitly chosen a preference
            if (prefersDesktop && !prefersMobile) {
                return;
            }
            
            // Switch to mobile page if mobile device or user prefers mobile
            if (isMobile || prefersMobile) {
                this.loadMobilePage();
            }
        },
        
        loadMobilePage() {
            // Check if we're already on mobile page
            if (document.body.classList.contains('mobile-page-active')) {
                return;
            }
            
            // Add mobile page class
            document.body.classList.add('mobile-page-active');
            
            // Replace page content with mobile version
            this.replaceMobileContent();
            
            // Load mobile-specific styles
            this.loadMobileStyles();
            
            // Initialize mobile-specific functionality
            this.initMobileFeatures();
        },
        
        replaceMobileContent() {
            // Create mobile page structure
            const mobileHTML = `
                <div class="mobile-page-wrapper">
                    <!-- Mobile Header -->
                    <header class="mobile-header">
                        <div class="mobile-header-content">
                            <div class="mobile-logo">
                                <img src="eplnewshub.png" alt="EPL News Hub" class="mobile-logo-img">
                                <h1>EPL News Hub</h1>
                            </div>
                            <button class="mobile-menu-btn" id="mobileMenuBtn">
                                <span></span>
                                <span></span>
                                <span></span>
                            </button>
                        </div>
                        
                        <!-- Mobile Navigation -->
                        <nav class="mobile-nav" id="mobileNav">
                            <ul class="mobile-nav-list">
                                <li><a href="/">Home</a></li>
                                <li><a href="/articles.html">News</a></li>
                                <li><a href="/fpl.html">FPL Tools</a></li>
                                <li><a href="/epl-table.html">Table</a></li>
                                <li><a href="/transfer-hub.html">Transfers</a></li>
                                <li><a href="/premium.html">Premium</a></li>
                            </ul>
                        </nav>
                    </header>
                    
                    <!-- Mobile Content -->
                    <main class="mobile-main">
                        <!-- Quick Action Cards -->
                        <section class="mobile-quick-actions">
                            <div class="action-card" onclick="location.href='/fpl.html'">
                                <div class="action-icon">⚽</div>
                                <div class="action-text">
                                    <h3>FPL Tools</h3>
                                    <p>Optimize your team</p>
                                </div>
                            </div>
                            <div class="action-card" onclick="location.href='/epl-table.html'">
                                <div class="action-icon">📊</div>
                                <div class="action-text">
                                    <h3>Live Table</h3>
                                    <p>Current standings</p>
                                </div>
                            </div>
                            <div class="action-card" onclick="location.href='/transfer-hub.html'">
                                <div class="action-icon">🔄</div>
                                <div class="action-text">
                                    <h3>Transfers</h3>
                                    <p>Latest moves</p>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Featured News -->
                        <section class="mobile-featured-news">
                            <h2>Latest News</h2>
                            <div class="mobile-news-grid" id="mobileNewsGrid">
                                <!-- News articles will be loaded here -->
                            </div>
                        </section>
                        
                        <!-- Mobile FPL Widget -->
                        <section class="mobile-fpl-widget">
                            <h2>FPL Quick Tools</h2>
                            <div class="fpl-tools-grid">
                                <div class="fpl-tool-card" onclick="location.href='/player-predictor.html'">
                                    <h3>Player Predictor</h3>
                                    <p>AI-powered predictions</p>
                                </div>
                                <div class="fpl-tool-card" onclick="location.href='/budget-optimizer.html'">
                                    <h3>Budget Optimizer</h3>
                                    <p>Maximize your budget</p>
                                </div>
                            </div>
                        </section>
                        
                        <!-- Mobile Newsletter -->
                        <section class="mobile-newsletter">
                            <h2>Stay Updated</h2>
                            <form class="mobile-newsletter-form">
                                <input type="email" placeholder="Enter your email" required>
                                <button type="submit">Subscribe</button>
                            </form>
                        </section>
                    </main>
                    
                    <!-- Mobile Footer -->
                    <footer class="mobile-footer">
                        <div class="mobile-footer-content">
                            <div class="mobile-footer-links">
                                <a href="/private_policy.html">Privacy</a>
                                <a href="/terms.html">Terms</a>
                                <a href="/contact.html">Contact</a>
                            </div>
                            <div class="mobile-social">
                                <a href="#" class="social-link">📘</a>
                                <a href="#" class="social-link">🐦</a>
                                <a href="#" class="social-link">📷</a>
                            </div>
                            <p>&copy; 2025 EPL News Hub. All rights reserved.</p>
                        </div>
                    </footer>
                    
                    <!-- View Toggle -->
                    <div class="view-toggle">
                        <button onclick="PageSwitcher.switchToDesktop()">Desktop View</button>
                    </div>
                </div>
            `;
            
            // Replace body content
            document.body.innerHTML = mobileHTML;
        },
        
        loadMobileStyles() {
            const mobileStyles = `
                <style id="mobile-page-styles">
                    /* Mobile Page Specific Styles */
                    .mobile-page-wrapper {
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        background: #f8f9fa;
                    }
                    
                    /* Mobile Header */
                    .mobile-header {
                        background: linear-gradient(135deg, #37003c, #6f42c1);
                        color: white;
                        position: sticky;
                        top: 0;
                        z-index: 1000;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    
                    .mobile-header-content {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px 20px;
                    }
                    
                    .mobile-logo {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    
                    .mobile-logo-img {
                        height: 35px;
                        width: auto;
                    }
                    
                    .mobile-logo h1 {
                        font-size: 1.2rem;
                        margin: 0;
                        font-weight: 700;
                    }
                    
                    .mobile-menu-btn {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 8px;
                    }
                    
                    .mobile-menu-btn span {
                        width: 25px;
                        height: 3px;
                        background: white;
                        transition: 0.3s;
                    }
                    
                    .mobile-nav {
                        background: rgba(255,255,255,0.1);
                        backdrop-filter: blur(10px);
                        max-height: 0;
                        overflow: hidden;
                        transition: max-height 0.3s ease;
                    }
                    
                    .mobile-nav.active {
                        max-height: 300px;
                    }
                    
                    .mobile-nav-list {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }
                    
                    .mobile-nav-list li {
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    
                    .mobile-nav-list a {
                        display: block;
                        padding: 15px 20px;
                        color: white;
                        text-decoration: none;
                        font-weight: 500;
                        transition: background 0.3s;
                    }
                    
                    .mobile-nav-list a:hover {
                        background: rgba(255,255,255,0.1);
                    }
                    
                    /* Mobile Main Content */
                    .mobile-main {
                        flex: 1;
                        padding: 20px;
                    }
                    
                    /* Quick Action Cards */
                    .mobile-quick-actions {
                        margin-bottom: 30px;
                    }
                    
                    .action-card {
                        background: white;
                        border-radius: 15px;
                        padding: 20px;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        cursor: pointer;
                        transition: transform 0.3s ease;
                    }
                    
                    .action-card:active {
                        transform: scale(0.98);
                    }
                    
                    .action-icon {
                        font-size: 2rem;
                        width: 50px;
                        height: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, #37003c, #6f42c1);
                        color: white;
                        border-radius: 12px;
                    }
                    
                    .action-text h3 {
                        margin: 0;
                        font-size: 1.1rem;
                        color: #333;
                    }
                    
                    .action-text p {
                        margin: 5px 0 0 0;
                        color: #666;
                        font-size: 0.9rem;
                    }
                    
                    /* Featured News */
                    .mobile-featured-news {
                        margin-bottom: 30px;
                    }
                    
                    .mobile-featured-news h2 {
                        margin-bottom: 20px;
                        color: #333;
                        font-size: 1.5rem;
                    }
                    
                    .mobile-news-grid {
                        display: grid;
                        gap: 15px;
                    }
                    
                    .mobile-news-item {
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    
                    .mobile-news-image {
                        width: 100%;
                        height: 200px;
                        object-fit: cover;
                    }
                    
                    .mobile-news-content {
                        padding: 15px;
                    }
                    
                    .mobile-news-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        margin-bottom: 8px;
                        color: #333;
                    }
                    
                    .mobile-news-excerpt {
                        color: #666;
                        font-size: 0.9rem;
                        line-height: 1.4;
                        margin-bottom: 10px;
                    }
                    
                    .mobile-news-meta {
                        font-size: 0.8rem;
                        color: #999;
                    }
                    
                    /* FPL Widget */
                    .mobile-fpl-widget {
                        margin-bottom: 30px;
                    }
                    
                    .mobile-fpl-widget h2 {
                        margin-bottom: 20px;
                        color: #333;
                        font-size: 1.5rem;
                    }
                    
                    .fpl-tools-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
                    
                    .fpl-tool-card {
                        background: linear-gradient(135deg, #37003c, #6f42c1);
                        color: white;
                        padding: 20px;
                        border-radius: 12px;
                        text-align: center;
                        cursor: pointer;
                        transition: transform 0.3s ease;
                    }
                    
                    .fpl-tool-card:active {
                        transform: scale(0.98);
                    }
                    
                    .fpl-tool-card h3 {
                        margin: 0 0 10px 0;
                        font-size: 1rem;
                    }
                    
                    .fpl-tool-card p {
                        margin: 0;
                        font-size: 0.85rem;
                        opacity: 0.9;
                    }
                    
                    /* Newsletter */
                    .mobile-newsletter {
                        background: white;
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        margin-bottom: 30px;
                    }
                    
                    .mobile-newsletter h2 {
                        margin-bottom: 15px;
                        color: #333;
                        font-size: 1.3rem;
                        text-align: center;
                    }
                    
                    .mobile-newsletter-form {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .mobile-newsletter-form input {
                        padding: 15px;
                        border: 2px solid #e0e0e0;
                        border-radius: 10px;
                        font-size: 1rem;
                    }
                    
                    .mobile-newsletter-form button {
                        background: linear-gradient(135deg, #37003c, #6f42c1);
                        color: white;
                        border: none;
                        padding: 15px;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                    }
                    
                    /* Mobile Footer */
                    .mobile-footer {
                        background: #262627;
                        color: white;
                        padding: 25px 20px;
                        text-align: center;
                    }
                    
                    .mobile-footer-links {
                        display: flex;
                        justify-content: center;
                        gap: 20px;
                        margin-bottom: 15px;
                    }
                    
                    .mobile-footer-links a {
                        color: white;
                        text-decoration: none;
                        font-size: 0.9rem;
                    }
                    
                    .mobile-social {
                        display: flex;
                        justify-content: center;
                        gap: 15px;
                        margin-bottom: 15px;
                    }
                    
                    .social-link {
                        font-size: 1.5rem;
                        text-decoration: none;
                        opacity: 0.8;
                        transition: opacity 0.3s;
                    }
                    
                    .social-link:hover {
                        opacity: 1;
                    }
                    
                    .mobile-footer p {
                        margin: 0;
                        font-size: 0.8rem;
                        opacity: 0.7;
                    }
                    
                    /* View Toggle */
                    .view-toggle {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        z-index: 1000;
                    }
                    
                    .view-toggle button {
                        background: rgba(0,0,0,0.7);
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 25px;
                        font-size: 0.8rem;
                        cursor: pointer;
                        backdrop-filter: blur(10px);
                    }
                    
                    /* Responsive adjustments */
                    @media (max-width: 480px) {
                        .mobile-main {
                            padding: 15px;
                        }
                        
                        .fpl-tools-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        .action-icon {
                            font-size: 1.5rem;
                            width: 40px;
                            height: 40px;
                        }
                    }
                </style>
            `;
            
            document.head.insertAdjacentHTML('beforeend', mobileStyles);
        },
        
        initMobileFeatures() {
            // Mobile menu toggle
            const menuBtn = document.getElementById('mobileMenuBtn');
            const mobileNav = document.getElementById('mobileNav');
            
            if (menuBtn && mobileNav) {
                menuBtn.addEventListener('click', () => {
                    mobileNav.classList.toggle('active');
                });
            }
            
            // Load news articles
            this.loadMobileNews();
            
            // Initialize mobile-specific optimizations
            if (window.initMobileOptimizations) {
                window.initMobileOptimizations();
            }
        },
        
        loadMobileNews() {
            const newsGrid = document.getElementById('mobileNewsGrid');
            if (!newsGrid) return;
            
            // Sample news items (replace with actual data loading)
            const sampleNews = [
                {
                    title: "Premier League Transfer News",
                    excerpt: "Latest updates on January transfer window moves...",
                    image: "premier-league-transfer-deadline-day-january-2025-watkins-marmoush-dorgu.avif",
                    meta: "2 hours ago"
                },
                {
                    title: "EPL Table Updates",
                    excerpt: "Current standings and analysis of recent results...",
                    image: "DALL·E 2025-01-05 17.03.36 - A visually detailed and dramatic image of the Premier League trophy on a podium, surrounded by cheering fans in a packed stadium under bright floodlig.webp",
                    meta: "4 hours ago"
                },
                {
                    title: "FPL Gameweek Preview",
                    excerpt: "Essential tips and predictions for the upcoming gameweek...",
                    image: "DALL·E 2024-09-25 18.33.02 - A dynamic scene showing a Premier League Fantasy Football (FPL) concept. The image includes a stadium backdrop with vibrant lighting, featuring a mix .webp",
                    meta: "6 hours ago"
                }
            ];
            
            sampleNews.forEach(item => {
                const newsItem = document.createElement('div');
                newsItem.className = 'mobile-news-item';
                newsItem.innerHTML = `
                    <img src="${item.image}" alt="${item.title}" class="mobile-news-image" onerror="this.style.display='none'">
                    <div class="mobile-news-content">
                        <h3 class="mobile-news-title">${item.title}</h3>
                        <p class="mobile-news-excerpt">${item.excerpt}</p>
                        <div class="mobile-news-meta">${item.meta}</div>
                    </div>
                `;
                newsGrid.appendChild(newsItem);
            });
        },
        
        switchToDesktop() {
            localStorage.setItem('preferDesktop', 'true');
            localStorage.removeItem('preferMobile');
            window.location.reload();
        },
        
        switchToMobile() {
            localStorage.setItem('preferMobile', 'true');
            localStorage.removeItem('preferDesktop');
            this.loadMobilePage();
        },
        
        addViewToggleButtons() {
            // Add desktop view toggle button to desktop version
            if (!MobileDetector.isMobile() && !document.body.classList.contains('mobile-page-active')) {
                const toggleButton = document.createElement('div');
                toggleButton.className = 'desktop-view-toggle';
                toggleButton.innerHTML = '<button onclick="PageSwitcher.switchToMobile()">Mobile View</button>';
                toggleButton.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                `;
                document.body.appendChild(toggleButton);
            }
        },
        
        handleOrientationChange() {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.checkAndSwitchPage();
                }, 500);
            });
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PageSwitcher.init();
        });
    } else {
        PageSwitcher.init();
    }
    
    // Make functions globally available
    window.PageSwitcher = PageSwitcher;
    window.MobileDetector = MobileDetector;
    
})();