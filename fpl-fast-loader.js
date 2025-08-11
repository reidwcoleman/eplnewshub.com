// FPL Fast Loader - Instant UI with skeleton loaders and progressive enhancement
class FPLFastLoader {
    constructor() {
        this.skeletonStyles = `
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 1000px 100%;
                animation: shimmer 2s infinite;
                border-radius: 4px;
            }
            
            .skeleton-text {
                height: 16px;
                margin-bottom: 8px;
                border-radius: 4px;
            }
            
            .skeleton-title {
                height: 24px;
                width: 60%;
                margin-bottom: 16px;
                border-radius: 4px;
            }
            
            .skeleton-card {
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }
            
            .skeleton-player {
                display: flex;
                align-items: center;
                padding: 15px;
                background: white;
                border-radius: 8px;
                margin-bottom: 10px;
                border: 1px solid #e9ecef;
            }
            
            .skeleton-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                margin-right: 15px;
            }
            
            .skeleton-content {
                flex: 1;
            }
            
            .skeleton-price {
                width: 60px;
                height: 24px;
                border-radius: 4px;
            }
            
            .fade-in {
                animation: fadeIn 0.3s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .instant-load {
                min-height: 600px;
                transition: min-height 0.3s ease;
            }
        `;
        
        this.injectStyles();
        this.initializeCache();
    }
    
    injectStyles() {
        if (!document.getElementById('fpl-fast-loader-styles')) {
            const style = document.createElement('style');
            style.id = 'fpl-fast-loader-styles';
            style.textContent = this.skeletonStyles;
            document.head.appendChild(style);
        }
    }
    
    initializeCache() {
        // Pre-warm the cache
        if ('serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
        
        // Prefetch common FPL resources
        this.prefetchResources();
    }
    
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/fpl-service-worker.js');
            console.log('Service Worker registered');
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
    
    prefetchResources() {
        // Prefetch FPL API data
        const prefetchUrls = [
            'https://fantasy.premierleague.com/api/bootstrap-static/',
            'https://fantasy.premierleague.com/api/fixtures/'
        ];
        
        prefetchUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    
    // Generate skeleton loader for player list
    generatePlayerListSkeleton(count = 10) {
        let html = '<div class="skeleton-container">';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-player">
                    <div class="skeleton skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton skeleton-text" style="width: 150px;"></div>
                        <div class="skeleton skeleton-text" style="width: 100px; height: 12px;"></div>
                    </div>
                    <div class="skeleton skeleton-price"></div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }
    
    // Generate skeleton loader for team cards
    generateTeamCardSkeleton(count = 2) {
        let html = '<div class="skeleton-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }
    
    // Generate skeleton for stats grid
    generateStatsSkeleton(count = 6) {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card" style="text-align: center;">
                    <div class="skeleton skeleton-text" style="width: 60px; height: 30px; margin: 0 auto 10px;"></div>
                    <div class="skeleton skeleton-text" style="width: 80%; margin: 0 auto;"></div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }
    
    // Show skeleton loader
    showSkeleton(container, type = 'players') {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;
        
        container.classList.add('instant-load');
        
        switch(type) {
            case 'players':
                container.innerHTML = this.generatePlayerListSkeleton();
                break;
            case 'teams':
                container.innerHTML = this.generateTeamCardSkeleton();
                break;
            case 'stats':
                container.innerHTML = this.generateStatsSkeleton();
                break;
            default:
                container.innerHTML = this.generatePlayerListSkeleton();
        }
    }
    
    // Replace skeleton with real content
    showContent(container, content) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        
        if (!container) return;
        
        container.classList.add('fade-in');
        container.innerHTML = content;
        container.classList.remove('instant-load');
    }
    
    // Lazy load images
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Progressive data loading
    async loadDataProgressive(loadFunc, container, type) {
        // Show skeleton immediately
        this.showSkeleton(container, type);
        
        try {
            // Check cache first
            const cachedData = this.getCachedData(type);
            if (cachedData) {
                // Show cached data immediately
                this.showContent(container, cachedData);
                
                // Load fresh data in background
                loadFunc().then(freshData => {
                    if (freshData && freshData !== cachedData) {
                        this.showContent(container, freshData);
                        this.setCachedData(type, freshData);
                    }
                });
            } else {
                // No cache, load fresh data
                const data = await loadFunc();
                this.showContent(container, data);
                this.setCachedData(type, data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            // Show cached data or error message
            const cachedData = this.getCachedData(type);
            if (cachedData) {
                this.showContent(container, cachedData);
            } else {
                this.showContent(container, '<div class="error">Failed to load data. Please try again.</div>');
            }
        }
    }
    
    getCachedData(key) {
        try {
            const cached = localStorage.getItem(`fpl_quick_${key}`);
            if (cached) {
                const data = JSON.parse(cached);
                // Check if cache is less than 5 minutes old
                if (Date.now() - data.timestamp < 5 * 60 * 1000) {
                    return data.content;
                }
            }
        } catch (error) {
            console.error('Cache read error:', error);
        }
        return null;
    }
    
    setCachedData(key, content) {
        try {
            localStorage.setItem(`fpl_quick_${key}`, JSON.stringify({
                content: content,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Cache write error:', error);
        }
    }
    
    // Optimize initial render
    deferNonCritical() {
        // Defer non-critical JavaScript
        const scripts = document.querySelectorAll('script[data-defer]');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.src = script.src;
            newScript.async = true;
            document.body.appendChild(newScript);
            script.remove();
        });
        
        // Lazy load styles
        const styles = document.querySelectorAll('link[data-defer]');
        styles.forEach(style => {
            style.media = 'all';
        });
    }
    
    // Initialize fast loader
    init() {
        // Start loading immediately
        document.addEventListener('DOMContentLoaded', () => {
            this.deferNonCritical();
            this.lazyLoadImages();
        });
        
        // Prefetch on idle
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.prefetchResources();
            });
        } else {
            setTimeout(() => {
                this.prefetchResources();
            }, 1);
        }
    }
}

// Auto-initialize
const fplFastLoader = new FPLFastLoader();
fplFastLoader.init();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.FPLFastLoader = FPLFastLoader;
    window.fplFastLoader = fplFastLoader;
}