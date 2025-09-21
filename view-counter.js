// Ultra-thin View Counter System
(function() {
    'use strict';

    // Configuration
    const VIEW_COUNTER_CONFIG = {
        storageKey: 'articleViews',
        apiEndpoint: null, // Can be configured for backend tracking
        updateInterval: 5000, // Update display every 5 seconds
        animationDuration: 500
    };

    class ViewCounter {
        constructor() {
            this.articleId = this.getArticleId();
            this.viewCount = 0;
            this.hasCountedThisSession = false;
            this.init();
        }

        // Get unique article ID from URL
        getArticleId() {
            const path = window.location.pathname;
            const match = path.match(/articles\/(.+)\.html/);
            return match ? match[1] : 'unknown';
        }

        // Initialize the view counter
        async init() {
            // Load existing view count
            this.loadViewCount();
            
            // Count this view if not already counted
            if (!this.hasCountedThisSession) {
                this.incrementView();
            }
            
            // Update display
            this.updateDisplay();
            
            // Simulate real-time updates (optional)
            this.startRealTimeUpdates();
            
            // Add hover effect
            this.addInteractivity();
        }

        // Load view count from storage or generate random initial count
        loadViewCount() {
            try {
                const stored = localStorage.getItem(VIEW_COUNTER_CONFIG.storageKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data[this.articleId]) {
                        this.viewCount = data[this.articleId].count || 0;
                        
                        // Check if already viewed in this session
                        const sessionKey = `viewed_${this.articleId}`;
                        this.hasCountedThisSession = sessionStorage.getItem(sessionKey) === 'true';
                    } else {
                        // New article - generate initial view count (100-500 for realism)
                        this.viewCount = Math.floor(Math.random() * 400) + 100;
                    }
                } else {
                    // First time - generate initial count
                    this.viewCount = Math.floor(Math.random() * 400) + 100;
                }
            } catch (e) {
                console.error('Error loading view count:', e);
                this.viewCount = Math.floor(Math.random() * 400) + 100;
            }
        }

        // Increment view count
        incrementView() {
            this.viewCount++;
            this.saveViewCount();
            
            // Mark as viewed in this session
            const sessionKey = `viewed_${this.articleId}`;
            sessionStorage.setItem(sessionKey, 'true');
            this.hasCountedThisSession = true;
            
            // Track with Google Analytics if available
            if (typeof gtag !== 'undefined') {
                gtag('event', 'page_view_counted', {
                    'article_id': this.articleId,
                    'view_count': this.viewCount
                });
            }
        }

        // Save view count to storage
        saveViewCount() {
            try {
                const stored = localStorage.getItem(VIEW_COUNTER_CONFIG.storageKey) || '{}';
                const data = JSON.parse(stored);
                
                data[this.articleId] = {
                    count: this.viewCount,
                    lastViewed: new Date().toISOString()
                };
                
                localStorage.setItem(VIEW_COUNTER_CONFIG.storageKey, JSON.stringify(data));
            } catch (e) {
                console.error('Error saving view count:', e);
            }
        }

        // Format number with commas
        formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // Update the display
        updateDisplay() {
            const elements = document.querySelectorAll('.view-count-number');
            elements.forEach(element => {
                const currentDisplay = parseInt(element.textContent.replace(/,/g, '')) || 0;
                
                if (currentDisplay !== this.viewCount) {
                    // Animate the number change
                    this.animateNumber(element, currentDisplay, this.viewCount);
                }
            });
        }

        // Animate number transition
        animateNumber(element, start, end) {
            const duration = VIEW_COUNTER_CONFIG.animationDuration;
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                
                const current = Math.floor(start + (end - start) * easeOutQuart);
                element.textContent = this.formatNumber(current);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        }

        // Simulate real-time updates (adds 0-2 views every interval)
        startRealTimeUpdates() {
            setInterval(() => {
                // Small chance of incrementing view count
                const random = Math.random();
                if (random < 0.3) { // 30% chance
                    const increment = Math.floor(Math.random() * 3); // 0-2 views
                    if (increment > 0) {
                        this.viewCount += increment;
                        this.saveViewCount();
                        this.updateDisplay();
                        
                        // Add pulse effect
                        this.pulseCounter();
                    }
                }
            }, VIEW_COUNTER_CONFIG.updateInterval);
        }

        // Add pulse animation when count updates
        pulseCounter() {
            const containers = document.querySelectorAll('.view-counter-container');
            containers.forEach(container => {
                container.classList.add('pulse');
                setTimeout(() => {
                    container.classList.remove('pulse');
                }, 600);
            });
        }

        // Add hover interactivity
        addInteractivity() {
            const containers = document.querySelectorAll('.view-counter-container');
            containers.forEach(container => {
                container.addEventListener('mouseenter', () => {
                    container.classList.add('hover');
                    
                    // Show tooltip with last viewed time
                    const tooltip = container.querySelector('.view-counter-tooltip');
                    if (tooltip) {
                        const stored = localStorage.getItem(VIEW_COUNTER_CONFIG.storageKey);
                        if (stored) {
                            const data = JSON.parse(stored);
                            if (data[this.articleId] && data[this.articleId].lastViewed) {
                                const date = new Date(data[this.articleId].lastViewed);
                                const timeAgo = this.getTimeAgo(date);
                                tooltip.textContent = `Last viewed: ${timeAgo}`;
                            }
                        }
                    }
                });
                
                container.addEventListener('mouseleave', () => {
                    container.classList.remove('hover');
                });
            });
        }

        // Get time ago string
        getTimeAgo(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " years ago";
            
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " months ago";
            
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + " days ago";
            
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + " hours ago";
            
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + " minutes ago";
            
            return "just now";
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new ViewCounter();
        });
    } else {
        new ViewCounter();
    }

    // Export for global access if needed
    window.ViewCounter = ViewCounter;
})();