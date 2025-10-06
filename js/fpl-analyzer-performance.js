/**
 * FPL Player Analyzer - Performance Optimized Main Controller
 * Integrates real-time data, visualizations, and UI with performance optimizations
 */

class FPLAnalyzerController {
    constructor() {
        this.dataManager = null;
        this.visualization = null;
        this.players = [];
        this.filteredPlayers = [];
        this.selectedPlayers = new Set();
        this.viewMode = 'grid';
        this.sortConfig = { field: 'points', direction: 'desc' };
        this.filters = {
            team: 'all',
            position: 'all',
            priceMin: 0,
            priceMax: 15,
            search: ''
        };
        this.lazyLoadObserver = null;
        this.performanceMonitor = new PerformanceMonitor();
        this.initialized = false;
    }

    /**
     * Initialize the analyzer with progressive enhancement
     */
    async init() {
        if (this.initialized) return;
        
        this.performanceMonitor.mark('init-start');
        
        try {
            // Show loading state
            this.showLoadingState();
            
            // Initialize components in parallel
            await Promise.all([
                this.initDataManager(),
                this.initVisualization(),
                this.initUI()
            ]);
            
            // Load initial data
            await this.loadPlayers();
            
            // Set up event listeners
            this.attachEventListeners();
            
            // Initialize lazy loading
            this.initLazyLoading();
            
            // Set up real-time updates
            this.setupRealtimeUpdates();
            
            // Register service worker for offline support
            this.registerServiceWorker();
            
            this.initialized = true;
            this.performanceMonitor.mark('init-end');
            this.performanceMonitor.measure('initialization', 'init-start', 'init-end');
            
            // Hide loading state
            this.hideLoadingState();
            
            console.log('FPL Analyzer initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize analyzer. Please refresh the page.');
        }
    }

    /**
     * Initialize data manager
     */
    async initDataManager() {
        if (typeof FPLRealtimeDataManager !== 'undefined') {
            this.dataManager = new FPLRealtimeDataManager();
        } else {
            // Fallback to basic data manager
            this.dataManager = new BasicDataManager();
        }
    }

    /**
     * Initialize visualization
     */
    async initVisualization() {
        if (typeof PlayerVisualization !== 'undefined') {
            this.visualization = new PlayerVisualization();
            await this.visualization.initChartLibrary();
        }
    }

    /**
     * Initialize UI components
     */
    async initUI() {
        // Initialize filter controls
        this.initFilters();
        
        // Initialize view mode toggle
        this.initViewModeToggle();
        
        // Initialize search with debouncing
        this.initSearch();
        
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize keyboard shortcuts
        this.initKeyboardShortcuts();
    }

    /**
     * Load players with performance optimization
     */
    async loadPlayers() {
        this.performanceMonitor.mark('load-players-start');
        
        try {
            if (this.dataManager) {
                this.players = await this.dataManager.getAllPlayers();
            } else {
                // Fallback to static data
                this.players = await this.loadStaticPlayers();
            }
            
            // Apply initial filters and sorting
            this.applyFiltersAndSort();
            
            // Render players with virtual scrolling for performance
            this.renderPlayers();
            
            this.performanceMonitor.mark('load-players-end');
            this.performanceMonitor.measure('load-players', 'load-players-start', 'load-players-end');
        } catch (error) {
            console.error('Error loading players:', error);
            this.showError('Failed to load player data');
        }
    }

    /**
     * Apply filters and sorting
     */
    applyFiltersAndSort() {
        this.performanceMonitor.mark('filter-start');
        
        // Filter players
        this.filteredPlayers = this.players.filter(player => {
            if (this.filters.team !== 'all' && player.team !== this.filters.team) return false;
            if (this.filters.position !== 'all' && player.position !== this.filters.position) return false;
            if (player.price < this.filters.priceMin || player.price > this.filters.priceMax) return false;
            if (this.filters.search && !this.matchesSearch(player, this.filters.search)) return false;
            return true;
        });
        
        // Sort players
        this.filteredPlayers.sort((a, b) => {
            const aValue = this.getNestedProperty(a, this.sortConfig.field);
            const bValue = this.getNestedProperty(b, this.sortConfig.field);
            
            if (typeof aValue === 'string') {
                return this.sortConfig.direction === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
            
            return this.sortConfig.direction === 'asc'
                ? aValue - bValue
                : bValue - aValue;
        });
        
        this.performanceMonitor.mark('filter-end');
        this.performanceMonitor.measure('filter-sort', 'filter-start', 'filter-end');
    }

    /**
     * Render players with virtual scrolling
     */
    renderPlayers() {
        const container = document.getElementById('players-container');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
            if (this.viewMode === 'grid') {
                this.renderGrid(container);
            } else if (this.viewMode === 'table') {
                this.renderTable(container);
            } else if (this.viewMode === 'cards') {
                this.renderCards(container);
            }
            
            // Update stats
            this.updateStats();
            
            // Initialize visualizations for visible players
            this.updateVisualizations();
        });
    }

    /**
     * Render grid view with lazy loading
     */
    renderGrid(container) {
        const grid = document.createElement('div');
        grid.className = 'players-grid';
        
        // Render only first 20 players initially
        const initialPlayers = this.filteredPlayers.slice(0, 20);
        
        initialPlayers.forEach(player => {
            const card = this.createPlayerCard(player);
            grid.appendChild(card);
        });
        
        // Add sentinel for lazy loading more players
        if (this.filteredPlayers.length > 20) {
            const sentinel = document.createElement('div');
            sentinel.className = 'load-more-sentinel';
            sentinel.setAttribute('data-offset', '20');
            grid.appendChild(sentinel);
        }
        
        container.appendChild(grid);
    }

    /**
     * Create optimized player card
     */
    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.dataset.playerId = player.id;
        
        // Use template literals for better performance
        card.innerHTML = `
            <div class="player-card-header">
                <img class="player-photo" 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23ddd' width='80' height='80'/%3E%3C/svg%3E"
                     data-src="${player.photo}" 
                     alt="${player.name}"
                     loading="lazy">
                <div class="player-info">
                    <h3 class="player-name">${player.webName}</h3>
                    <p class="player-team">${player.teamShort} - ${player.position}</p>
                </div>
                <div class="player-price">£${player.price}m</div>
            </div>
            <div class="player-stats">
                <div class="stat-row">
                    <span class="stat-label">Points:</span>
                    <span class="stat-value">${player.points}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Form:</span>
                    <span class="stat-value ${player.form > 5 ? 'positive' : ''}">${player.form}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Ownership:</span>
                    <span class="stat-value">${player.ownership}%</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">xGI:</span>
                    <span class="stat-value">${player.stats.xGI?.toFixed(2) || 0}</span>
                </div>
            </div>
            <div class="player-actions">
                <button class="btn-compare" data-player-id="${player.id}" aria-label="Compare player">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 12h18m-9-9v18"/>
                    </svg>
                </button>
                <button class="btn-detail" data-player-id="${player.id}" aria-label="View details">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12" y2="8"/>
                    </svg>
                </button>
            </div>
        `;
        
        // Add click handler with event delegation
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-compare')) {
                this.togglePlayerComparison(player.id);
            } else if (e.target.closest('.btn-detail')) {
                this.showPlayerDetail(player.id);
            }
        });
        
        return card;
    }

    /**
     * Initialize lazy loading
     */
    initLazyLoading() {
        // Lazy load images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
            
            // Lazy load more players
            const sentinelObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sentinel = entry.target;
                        const offset = parseInt(sentinel.dataset.offset);
                        this.loadMorePlayers(offset);
                        sentinelObserver.unobserve(sentinel);
                    }
                });
            }, { rootMargin: '100px' });
            
            const sentinel = document.querySelector('.load-more-sentinel');
            if (sentinel) {
                sentinelObserver.observe(sentinel);
            }
        }
    }

    /**
     * Load more players for infinite scroll
     */
    loadMorePlayers(offset) {
        const container = document.querySelector('.players-grid');
        if (!container) return;
        
        const batchSize = 20;
        const nextPlayers = this.filteredPlayers.slice(offset, offset + batchSize);
        
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();
        
        nextPlayers.forEach(player => {
            const card = this.createPlayerCard(player);
            fragment.appendChild(card);
        });
        
        // Remove old sentinel
        const oldSentinel = container.querySelector('.load-more-sentinel');
        if (oldSentinel) {
            oldSentinel.remove();
        }
        
        // Add new players
        container.appendChild(fragment);
        
        // Add new sentinel if more players exist
        if (offset + batchSize < this.filteredPlayers.length) {
            const sentinel = document.createElement('div');
            sentinel.className = 'load-more-sentinel';
            sentinel.setAttribute('data-offset', offset + batchSize);
            container.appendChild(sentinel);
            
            // Re-observe new sentinel
            this.initLazyLoading();
        }
        
        // Re-init lazy loading for new images
        this.initLazyLoading();
    }

    /**
     * Setup real-time updates
     */
    setupRealtimeUpdates() {
        if (!this.dataManager) return;
        
        // Subscribe to updates
        this.dataManager.onUpdate((update) => {
            console.log('Real-time update received:', update.type);
            
            if (update.type === 'player_update') {
                this.handlePlayerUpdate(update.player);
            } else if (update.type === 'price_change') {
                this.handlePriceChange(update);
            } else if (update.type === 'data_refreshed') {
                this.refreshDisplay();
            }
        });
    }

    /**
     * Handle player update
     */
    handlePlayerUpdate(updatedPlayer) {
        // Find and update player in local array
        const index = this.players.findIndex(p => p.id === updatedPlayer.id);
        if (index !== -1) {
            this.players[index] = { ...this.players[index], ...updatedPlayer };
            
            // Re-apply filters and render if player is visible
            this.applyFiltersAndSort();
            
            // Update only the affected player card
            this.updatePlayerCard(updatedPlayer.id);
        }
    }

    /**
     * Update single player card
     */
    updatePlayerCard(playerId) {
        const card = document.querySelector(`[data-player-id="${playerId}"]`);
        if (!card) return;
        
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        // Update card content with animation
        card.classList.add('updating');
        
        requestAnimationFrame(() => {
            // Update relevant fields
            card.querySelector('.player-price').textContent = `£${player.price}m`;
            card.querySelector('.stat-value').textContent = player.points;
            
            // Remove animation class
            setTimeout(() => card.classList.remove('updating'), 300);
        });
    }

    /**
     * Register service worker for offline support
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw-ultra-polished.js');
                console.log('Service Worker registered:', registration.scope);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        const loader = document.createElement('div');
        loader.className = 'analyzer-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p>Loading player data...</p>
        `;
        document.body.appendChild(loader);
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        const loader = document.querySelector('.analyzer-loader');
        if (loader) {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 300);
        }
    }

    /**
     * Helper functions
     */
    matchesSearch(player, search) {
        const searchLower = search.toLowerCase();
        return player.name.toLowerCase().includes(searchLower) ||
               player.webName.toLowerCase().includes(searchLower) ||
               player.team.toLowerCase().includes(searchLower);
    }

    getNestedProperty(obj, path) {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }

    /**
     * Initialize filters
     */
    initFilters() {
        // Team filter
        const teamFilter = document.getElementById('filter-team');
        if (teamFilter) {
            teamFilter.addEventListener('change', (e) => {
                this.filters.team = e.target.value;
                this.applyFiltersAndSort();
                this.renderPlayers();
            });
        }

        // Position filter
        const positionFilter = document.getElementById('filter-position');
        if (positionFilter) {
            positionFilter.addEventListener('change', (e) => {
                this.filters.position = e.target.value;
                this.applyFiltersAndSort();
                this.renderPlayers();
            });
        }

        // Price range filter
        const priceMin = document.getElementById('filter-price-min');
        const priceMax = document.getElementById('filter-price-max');
        if (priceMin && priceMax) {
            const updatePriceFilter = () => {
                this.filters.priceMin = parseFloat(priceMin.value);
                this.filters.priceMax = parseFloat(priceMax.value);
                this.applyFiltersAndSort();
                this.renderPlayers();
            };
            priceMin.addEventListener('input', updatePriceFilter);
            priceMax.addEventListener('input', updatePriceFilter);
        }
    }

    /**
     * Initialize search with debouncing
     */
    initSearch() {
        const searchInput = document.getElementById('player-search');
        if (!searchInput) return;

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.filters.search = e.target.value;
                this.applyFiltersAndSort();
                this.renderPlayers();
            }, 300);
        });
    }

    /**
     * Initialize view mode toggle
     */
    initViewModeToggle() {
        const viewButtons = document.querySelectorAll('[data-view-mode]');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.viewMode = button.dataset.viewMode;
                viewButtons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
                this.renderPlayers();
            });
        });
    }

    /**
     * Initialize tooltips
     */
    initTooltips() {
        // Implement tooltip functionality
    }

    /**
     * Initialize keyboard shortcuts
     */
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + F - Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('player-search')?.focus();
            }
            
            // Escape - Clear selection
            if (e.key === 'Escape') {
                this.clearSelection();
            }
        });
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Sort headers
        document.querySelectorAll('[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                if (this.sortConfig.field === field) {
                    this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortConfig.field = field;
                    this.sortConfig.direction = 'desc';
                }
                this.applyFiltersAndSort();
                this.renderPlayers();
            });
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        
        setTimeout(() => errorEl.remove(), 5000);
    }

    /**
     * Fallback data manager
     */
}

class BasicDataManager {
    async getAllPlayers() {
        // Fallback to static data
        return [];
    }
}

/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
        this.measures = new Map();
    }

    mark(name) {
        if (window.performance && window.performance.mark) {
            performance.mark(name);
        }
        this.marks.set(name, Date.now());
    }

    measure(name, startMark, endMark) {
        if (window.performance && window.performance.measure) {
            try {
                performance.measure(name, startMark, endMark);
            } catch (e) {
                console.log(`Performance measure: ${name}`);
            }
        }
        
        const start = this.marks.get(startMark);
        const end = this.marks.get(endMark);
        if (start && end) {
            const duration = end - start;
            this.measures.set(name, duration);
            console.log(`${name}: ${duration}ms`);
        }
    }

    getMetrics() {
        return {
            marks: Object.fromEntries(this.marks),
            measures: Object.fromEntries(this.measures)
        };
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.fplAnalyzer = new FPLAnalyzerController();
        window.fplAnalyzer.init();
    });
} else {
    window.fplAnalyzer = new FPLAnalyzerController();
    window.fplAnalyzer.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPLAnalyzerController;
}