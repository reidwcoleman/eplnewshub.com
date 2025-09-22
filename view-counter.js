// Enhanced View Counter - Persistent article view tracking
// Stores views in localStorage and syncs with optional backend
(function() {
    'use strict';
    
    const VIEW_CONFIG = {
        STORAGE_KEY: 'eplnews_article_views',
        SESSION_KEY: 'eplnews_view_session',
        API_ENDPOINT: '/api/views', // Optional backend endpoint
        USE_API: false, // Set to true when backend is available
        CACHE_DURATION: 3600000, // 1 hour
        MIN_VIEW_DURATION: 3000 // 3 seconds minimum to count as view
    };
    
    class PersistentViewCounter {
        constructor() {
            this.articleId = this.getArticleId();
            this.startTime = Date.now();
            this.viewData = this.loadViewData();
            this.sessionViews = this.getSessionViews();
            this.elements = [];
            this.hasTrackedView = false;
            
            this.init();
        }
        
        init() {
            // Find all view counter elements
            this.findElements();
            
            // Display current count immediately
            this.updateDisplay();
            
            // Track view after minimum duration
            setTimeout(() => {
                if (!this.hasTrackedView) {
                    this.trackView();
                }
            }, VIEW_CONFIG.MIN_VIEW_DURATION);
            
            // Update on visibility change
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden' && !this.hasTrackedView) {
                    const viewDuration = Date.now() - this.startTime;
                    if (viewDuration >= VIEW_CONFIG.MIN_VIEW_DURATION) {
                        this.trackView();
                    }
                }
            });
            
            // Save before unload
            window.addEventListener('beforeunload', () => {
                this.saveViewData();
            });
        }
        
        getArticleId() {
            const path = window.location.pathname;
            const match = path.match(/articles\/([^\/\?#]+\.html)/);
            
            if (match) return match[1];
            if (path === '/' || path.includes('index.html')) return 'homepage';
            
            // Use full path as ID
            return path.replace(/^\//, '').replace(/\//g, '-') || 'unknown';
        }
        
        loadViewData() {
            try {
                const stored = localStorage.getItem(VIEW_CONFIG.STORAGE_KEY);
                if (stored) {
                    const data = JSON.parse(stored);
                    // Migrate old format if needed
                    if (typeof data === 'object' && !Array.isArray(data)) {
                        return data;
                    }
                }
            } catch (e) {
                console.error('Failed to load view data:', e);
            }
            return {};
        }
        
        saveViewData() {
            try {
                localStorage.setItem(VIEW_CONFIG.STORAGE_KEY, JSON.stringify(this.viewData));
            } catch (e) {
                console.error('Failed to save view data:', e);
            }
        }
        
        getSessionViews() {
            try {
                const stored = sessionStorage.getItem(VIEW_CONFIG.SESSION_KEY);
                return stored ? JSON.parse(stored) : {};
            } catch {
                return {};
            }
        }
        
        saveSessionViews() {
            try {
                sessionStorage.setItem(VIEW_CONFIG.SESSION_KEY, JSON.stringify(this.sessionViews));
            } catch (e) {
                console.error('Failed to save session views:', e);
            }
        }
        
        trackView() {
            if (this.hasTrackedView) return;
            
            const articleId = this.articleId;
            
            // Check if already viewed in this session
            if (this.sessionViews[articleId]) {
                console.log('Already viewed in this session:', articleId);
                this.hasTrackedView = true;
                return;
            }
            
            // Initialize article data if needed
            if (!this.viewData[articleId]) {
                this.viewData[articleId] = {
                    count: 0,
                    firstView: new Date().toISOString(),
                    lastView: null,
                    uniqueViews: []
                };
            }
            
            // Increment count
            this.viewData[articleId].count++;
            this.viewData[articleId].lastView = new Date().toISOString();
            
            // Track unique view with timestamp
            const viewRecord = {
                timestamp: new Date().toISOString(),
                duration: Date.now() - this.startTime,
                referrer: document.referrer || 'direct'
            };
            
            // Keep only last 100 view records per article
            if (this.viewData[articleId].uniqueViews.length >= 100) {
                this.viewData[articleId].uniqueViews.shift();
            }
            this.viewData[articleId].uniqueViews.push(viewRecord);
            
            // Mark as viewed in session
            this.sessionViews[articleId] = true;
            
            // Save data
            this.saveViewData();
            this.saveSessionViews();
            
            // Update display with animation
            this.updateDisplay(true);
            
            // Sync with backend if enabled
            if (VIEW_CONFIG.USE_API) {
                this.syncWithBackend(articleId);
            }
            
            this.hasTrackedView = true;
            console.log('View tracked for:', articleId, 'Total:', this.viewData[articleId].count);
        }
        
        async syncWithBackend(articleId) {
            try {
                const response = await fetch(VIEW_CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        articleId: articleId,
                        url: window.location.href,
                        timestamp: new Date().toISOString()
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Synced with backend:', data);
                }
            } catch (error) {
                console.error('Failed to sync with backend:', error);
            }
        }
        
        findElements() {
            // Find all elements that should display view count
            const selectors = [
                '.view-count-number',
                '.view-counter',
                '[data-view-count]',
                '#view-count',
                '.article-views'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (!this.elements.includes(el)) {
                        this.elements.push(el);
                    }
                });
            });
            
            // Find floating counter
            const floatingCounter = document.querySelector('#floating-view-counter .view-count-number');
            if (floatingCounter && !this.elements.includes(floatingCounter)) {
                this.elements.push(floatingCounter);
            }
        }
        
        updateDisplay(animate = false) {
            const count = this.getViewCount();
            
            this.elements.forEach(element => {
                if (animate) {
                    this.animateNumber(element, parseInt(element.textContent) || 0, count);
                } else {
                    element.textContent = this.formatNumber(count);
                }
                
                // Update parent container
                const container = element.closest('.view-counter-container, .floating-view-counter');
                if (container) {
                    container.classList.add('has-views');
                    if (animate) {
                        container.classList.add('pulse');
                        setTimeout(() => container.classList.remove('pulse'), 600);
                    }
                }
            });
            
            // Show floating counter if it exists and has views
            const floatingCounter = document.getElementById('floating-view-counter');
            if (floatingCounter && count > 0) {
                floatingCounter.style.display = 'block';
                setTimeout(() => {
                    floatingCounter.classList.add('show');
                }, 100);
            }
        }
        
        animateNumber(element, start, end) {
            const duration = 500;
            const startTime = Date.now();
            const difference = end - start;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeOutQuad = progress * (2 - progress);
                const current = Math.floor(start + difference * easeOutQuad);
                
                element.textContent = this.formatNumber(current);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        }
        
        formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'K';
            }
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        
        getViewCount() {
            const articleData = this.viewData[this.articleId];
            return articleData ? articleData.count : 0;
        }
        
        // Public methods for external access
        getTotalViews() {
            let total = 0;
            for (const article in this.viewData) {
                total += this.viewData[article].count;
            }
            return total;
        }
        
        getArticleViews(articleId) {
            return this.viewData[articleId]?.count || 0;
        }
        
        getTopArticles(limit = 10) {
            const articles = Object.entries(this.viewData)
                .map(([id, data]) => ({
                    id: id,
                    views: data.count,
                    lastView: data.lastView
                }))
                .sort((a, b) => b.views - a.views)
                .slice(0, limit);
            
            return articles;
        }
        
        // Admin function to reset views (can be called from console)
        resetArticleViews(articleId) {
            if (articleId && this.viewData[articleId]) {
                delete this.viewData[articleId];
                this.saveViewData();
                console.log('Reset views for:', articleId);
            }
        }
        
        resetAllViews() {
            if (confirm('Are you sure you want to reset ALL view counts?')) {
                this.viewData = {};
                this.saveViewData();
                console.log('All view counts reset');
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.EPLViewCounter = new PersistentViewCounter();
        });
    } else {
        window.EPLViewCounter = new PersistentViewCounter();
    }
    
    // Add styles for animations
    const style = document.createElement('style');
    style.textContent = `
        .view-counter-container.pulse,
        .floating-view-counter.pulse {
            animation: viewPulse 0.6s ease;
        }
        
        @keyframes viewPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
        }
        
        .view-count-number {
            transition: color 0.3s ease;
        }
        
        .view-counter-container.has-views .view-count-number {
            color: #667eea;
            font-weight: 600;
        }
        
        .floating-view-counter.show {
            animation: slideInBounce 0.5s ease-out;
        }
        
        @keyframes slideInBounce {
            0% {
                transform: translateX(-50%) translateY(-100px);
                opacity: 0;
            }
            60% {
                transform: translateX(-50%) translateY(10px);
                opacity: 1;
            }
            100% {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Console helper message
    console.log('%c📊 View Counter Active', 'color: #667eea; font-weight: bold; font-size: 14px;');
    console.log('Access counter via: window.EPLViewCounter');
    console.log('Methods: getTotalViews(), getTopArticles(), getArticleViews(id)');
})();