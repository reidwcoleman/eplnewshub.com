// EPL News Hub - Optimized Performance Loader
(function() {
  'use strict';

  // Performance monitoring
  const perf = {
    start: performance.now(),
    marks: new Map()
  };

  // Critical content loader with caching
  const ContentLoader = {
    cache: new Map(),
    loading: new Map(),
    
    async load(url) {
      if (this.cache.has(url)) return this.cache.get(url);
      if (this.loading.has(url)) return this.loading.get(url);
      
      const loadPromise = fetch(url)
        .then(r => r.ok ? r.text() : '')
        .catch(() => '');
      
      this.loading.set(url, loadPromise);
      const content = await loadPromise;
      this.cache.set(url, content);
      this.loading.delete(url);
      return content;
    }
  };

  // Intersection Observer for lazy loading
  const lazyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const elem = entry.target;
        
        // Load images
        if (elem.tagName === 'IMG' && elem.dataset.src) {
          elem.src = elem.dataset.src;
          elem.removeAttribute('data-src');
          elem.classList.add('lazy-loaded');
        }
        
        // Load content includes
        if (elem.hasAttribute('include')) {
          loadInclude(elem);
        }
        
        lazyObserver.unobserve(elem);
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.01
  });

  // Optimized include loader
  async function loadInclude(elem) {
    const url = elem.getAttribute('include');
    if (!url) return;
    
    elem.classList.add('loading');
    const content = await ContentLoader.load(url);
    
    if (content) {
      elem.innerHTML = content;
      elem.classList.remove('loading');
      elem.classList.add('loaded', 'fade-in');
      
      // Process nested includes and images
      processNewContent(elem);
    }
  }

  // Process dynamically added content
  function processNewContent(container) {
    // Lazy load images
    container.querySelectorAll('img[data-src]').forEach(img => {
      lazyObserver.observe(img);
    });
    
    // Process nested includes
    container.querySelectorAll('[include]').forEach(elem => {
      lazyObserver.observe(elem);
    });
    
    // Re-run scripts if needed
    container.querySelectorAll('script').forEach(script => {
      const newScript = document.createElement('script');
      Array.from(script.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = script.textContent;
      script.parentNode.replaceChild(newScript, script);
    });
  }

  // Priority content loader
  async function loadPriorityContent() {
    const priority = ['./header.html', './main_headline.html'];
    const promises = priority.map(url => ContentLoader.load(url));
    await Promise.all(promises);
    
    // Load priority includes immediately
    document.querySelectorAll('[include][data-priority="high"]').forEach(elem => {
      loadInclude(elem);
    });
  }

  // Deferred content loader
  function loadDeferredContent() {
    // Load all other includes
    document.querySelectorAll('[include]:not([data-priority="high"])').forEach(elem => {
      lazyObserver.observe(elem);
    });
    
    // Load all lazy images
    document.querySelectorAll('img[data-src]').forEach(img => {
      lazyObserver.observe(img);
    });
  }

  // Optimized search functionality
  const Search = {
    articles: [],
    index: null,
    
    init() {
      // Load search data asynchronously
      this.loadArticles();
      this.setupSearch();
    },
    
    async loadArticles() {
      try {
        const response = await fetch('/search-index.json');
        this.articles = await response.json();
      } catch (e) {
        // Fallback to embedded articles if needed
        this.articles = window.articleData || [];
      }
    },
    
    setupSearch() {
      const searchInput = document.getElementById('search-input');
      const resultsContainer = document.getElementById('search-results');
      
      if (!searchInput) return;
      
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.performSearch(e.target.value, resultsContainer);
        }, 300);
      });
      
      // Hide results on outside click
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer?.contains(e.target)) {
          if (resultsContainer) resultsContainer.style.display = 'none';
        }
      });
    },
    
    performSearch(query, container) {
      if (!container) return;
      
      query = query.toLowerCase().trim();
      if (query.length < 2) {
        container.style.display = 'none';
        return;
      }
      
      const results = this.articles.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.excerpt.toLowerCase().includes(query)
      ).slice(0, 5);
      
      if (results.length === 0) {
        container.innerHTML = '<div class="search-no-results">No results found</div>';
      } else {
        container.innerHTML = results.map(article => `
          <a href="${article.url}" class="search-result-item">
            <div class="search-result-title">${this.highlight(article.title, query)}</div>
            <div class="search-result-excerpt">${this.highlight(article.excerpt, query)}</div>
          </a>
        `).join('');
      }
      
      container.style.display = 'block';
    },
    
    highlight(text, query) {
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }
  };

  // Service Worker registration for offline support
  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) {
        console.log('SW registration failed');
      }
    }
  }

  // Prefetch critical resources
  function prefetchResources() {
    const links = [
      '/styles.css',
      '/main_headline.html',
      '/header.html',
      '/footer.html'
    ];
    
    links.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  // Initialize smooth scroll
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // Mobile menu handler
  function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const menu = document.querySelector('.nav-menu');
    
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
      });
    }
  }

  // Performance optimized initialization
  async function init() {
    perf.marks.set('init', performance.now());
    
    // Start loading priority content immediately
    loadPriorityContent();
    
    // Setup core functionality
    Search.init();
    prefetchResources();
    
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDOMReady);
    } else {
      onDOMReady();
    }
  }

  async function onDOMReady() {
    perf.marks.set('dom', performance.now());
    
    // Load deferred content
    loadDeferredContent();
    
    // Initialize features
    initSmoothScroll();
    initMobileMenu();
    
    // Register service worker
    registerServiceWorker();
    
    // Add visual enhancements after content loads
    setTimeout(() => {
      document.body.classList.add('loaded');
      addVisualEnhancements();
    }, 100);
    
    // Log performance metrics
    console.log('Page load time:', performance.now() - perf.start, 'ms');
  }

  // Visual enhancements
  function addVisualEnhancements() {
    // Add parallax effect to hero images
    const heroImages = document.querySelectorAll('.hero-image, .featured-image');
    if (heroImages.length > 0) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        heroImages.forEach(img => {
          const rate = scrolled * -0.5;
          img.style.transform = `translateY(${rate}px)`;
        });
      }, { passive: true });
    }
    
    // Add hover effects
    document.querySelectorAll('.card, .article-item').forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
      });
      item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
    });
  }

  // Start initialization
  init();
})();