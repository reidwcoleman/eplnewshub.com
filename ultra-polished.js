/* ================================================
   EPL News Hub - Ultra Polished JavaScript v2.0
   ================================================ */

// ==================== PERFORMANCE MONITORING ====================
const performanceMonitor = {
  init() {
    // Log page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        console.log(`Page load time: ${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`);
      }
    });
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long task detected:', entry);
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }
  }
};

// ==================== LAZY LOADING ====================
const lazyLoader = {
  init() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            // Add loading animation
            img.classList.add('loading');
            
            // Load the image
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            
            // When image loads, remove loading class
            img.onload = () => {
              img.classList.remove('loading');
              img.classList.add('loaded');
            };
            
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
      
      // Observe all lazy images
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }
};

// ==================== SMOOTH SCROLL ====================
const smoothScroll = {
  init() {
    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    // Update progress on scroll
    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      progressBar.style.transform = `scaleX(${scrolled / 100})`;
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
};

// ==================== ANIMATION ON SCROLL ====================
const scrollAnimations = {
  init() {
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            
            // Stagger animations for child elements
            const children = entry.target.querySelectorAll('.animate-child');
            children.forEach((child, index) => {
              setTimeout(() => {
                child.classList.add('animate-in');
              }, index * 100);
            });
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      // Observe elements with animation classes
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        animationObserver.observe(el);
      });
    }
  }
};

// ==================== SEARCH FUNCTIONALITY ====================
const searchSystem = {
  init() {
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    
    if (!searchInput || !searchResults) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        searchResults.classList.add('hidden');
        return;
      }
      
      searchTimeout = setTimeout(() => {
        this.performSearch(query, searchResults);
      }, 300);
    });
    
    // Close search on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        searchResults.classList.add('hidden');
      }
    });
  },
  
  async performSearch(query, resultsContainer) {
    // Show loading state
    resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';
    resultsContainer.classList.remove('hidden');
    
    try {
      // Simulate search (replace with actual search API)
      const results = await this.mockSearch(query);
      
      if (results.length > 0) {
        resultsContainer.innerHTML = results.map(result => `
          <a href="${result.url}" class="search-result-item">
            <div class="search-result-title">${result.title}</div>
            <div class="search-result-excerpt">${result.excerpt}</div>
          </a>
        `).join('');
      } else {
        resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
      }
    } catch (error) {
      resultsContainer.innerHTML = '<div class="search-error">Search error occurred</div>';
    }
  },
  
  mockSearch(query) {
    // Mock search function - replace with actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            title: 'Sample Article Title',
            excerpt: 'This is a sample excerpt containing the search query...',
            url: '/articles/sample-article.html'
          }
        ]);
      }, 500);
    });
  }
};

// ==================== THEME SWITCHER ====================
const themeSwitcher = {
  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Animate theme change
        document.body.style.transition = 'background-color 0.3s ease';
      });
    }
  }
};

// ==================== SHARE FUNCTIONALITY ====================
const shareSystem = {
  init() {
    document.querySelectorAll('.share-button').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const url = button.dataset.url || window.location.href;
        const title = button.dataset.title || document.title;
        const text = button.dataset.text || '';
        
        // Check if Web Share API is available
        if (navigator.share && button.classList.contains('native-share')) {
          try {
            await navigator.share({ title, text, url });
          } catch (err) {
            console.log('Share cancelled or failed');
          }
        } else {
          // Fallback to opening share URLs
          const platform = button.dataset.platform;
          const shareUrl = this.getShareUrl(platform, url, title, text);
          if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
          }
        }
      });
    });
  },
  
  getShareUrl(platform, url, title, text) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
    };
    
    return urls[platform];
  }
};

// ==================== READING PROGRESS ====================
const readingProgress = {
  init() {
    const article = document.querySelector('.article-content');
    if (!article) return;
    
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    progressBar.innerHTML = '<div class="reading-progress-bar"></div>';
    document.body.appendChild(progressBar);
    
    const updateProgress = () => {
      const scrollHeight = article.scrollHeight - window.innerHeight;
      const scrollPosition = window.pageYOffset - article.offsetTop;
      const progress = Math.max(0, Math.min(100, (scrollPosition / scrollHeight) * 100));
      
      progressBar.querySelector('.reading-progress-bar').style.width = `${progress}%`;
      
      // Update reading time
      const wordsRead = Math.floor((progress / 100) * this.countWords(article));
      const timeRemaining = Math.ceil((this.countWords(article) - wordsRead) / 200); // 200 words per minute
      
      const timeElement = document.querySelector('.reading-time-remaining');
      if (timeElement && timeRemaining > 0) {
        timeElement.textContent = `${timeRemaining} min remaining`;
      }
    };
    
    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress();
  },
  
  countWords(element) {
    return element.textContent.trim().split(/\s+/).length;
  }
};

// ==================== INFINITE SCROLL ====================
const infiniteScroll = {
  init() {
    const container = document.querySelector('.articles-grid');
    if (!container) return;
    
    let isLoading = false;
    let currentPage = 1;
    
    const loadMoreArticles = async () => {
      if (isLoading) return;
      
      const scrollPosition = window.innerHeight + window.pageYOffset;
      const threshold = document.body.offsetHeight - 1000;
      
      if (scrollPosition > threshold) {
        isLoading = true;
        currentPage++;
        
        // Show loading indicator
        const loader = document.createElement('div');
        loader.className = 'articles-loader';
        loader.innerHTML = '<div class="spinner"></div>';
        container.appendChild(loader);
        
        try {
          // Fetch more articles (replace with actual API call)
          const articles = await this.fetchArticles(currentPage);
          
          // Remove loader
          loader.remove();
          
          // Add new articles
          articles.forEach(article => {
            const articleElement = this.createArticleElement(article);
            container.appendChild(articleElement);
          });
          
          isLoading = false;
        } catch (error) {
          console.error('Failed to load articles:', error);
          loader.innerHTML = '<div class="error">Failed to load more articles</div>';
          isLoading = false;
        }
      }
    };
    
    window.addEventListener('scroll', loadMoreArticles);
  },
  
  async fetchArticles(page) {
    // Mock fetch - replace with actual API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { title: 'New Article', excerpt: 'Article content...', image: '/placeholder.jpg' }
        ]);
      }, 1000);
    });
  },
  
  createArticleElement(article) {
    const div = document.createElement('div');
    div.className = 'article-card animate-on-scroll';
    div.innerHTML = `
      <div class="article-card-image">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
      </div>
      <div class="article-card-content">
        <h3 class="article-card-title">${article.title}</h3>
        <p class="article-card-excerpt">${article.excerpt}</p>
      </div>
    `;
    return div;
  }
};

// ==================== TOOLTIP SYSTEM ====================
const tooltipSystem = {
  init() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        const text = e.target.dataset.tooltip;
        const tooltip = this.createTooltip(text);
        document.body.appendChild(tooltip);
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
      });
      
      element.addEventListener('mouseleave', () => {
        document.querySelectorAll('.tooltip').forEach(t => t.remove());
      });
    });
  },
  
  createTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    return tooltip;
  }
};

// ==================== COPY TO CLIPBOARD ====================
const clipboardSystem = {
  init() {
    document.querySelectorAll('.copy-button').forEach(button => {
      button.addEventListener('click', async () => {
        const text = button.dataset.copyText || button.textContent;
        
        try {
          await navigator.clipboard.writeText(text);
          
          // Show success feedback
          const originalText = button.textContent;
          button.textContent = '✓ Copied!';
          button.classList.add('copied');
          
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  }
};

// ==================== NOTIFICATION SYSTEM ====================
const notificationSystem = {
  init() {
    this.container = document.createElement('div');
    this.container.className = 'notifications-container';
    document.body.appendChild(this.container);
  },
  
  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">${message}</div>
      <button class="notification-close">×</button>
    `;
    
    this.container.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('notification-show'), 10);
    
    // Auto dismiss
    const dismiss = () => {
      notification.classList.remove('notification-show');
      setTimeout(() => notification.remove(), 300);
    };
    
    notification.querySelector('.notification-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  }
};

// ==================== FORM VALIDATION ====================
const formValidation = {
  init() {
    document.querySelectorAll('form[data-validate]').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (this.validateForm(form)) {
          // Submit form or handle submission
          this.handleSubmit(form);
        }
      });
      
      // Real-time validation
      form.querySelectorAll('input, textarea').forEach(field => {
        field.addEventListener('blur', () => this.validateField(field));
        field.addEventListener('input', () => {
          if (field.classList.contains('error')) {
            this.validateField(field);
          }
        });
      });
    });
  },
  
  validateForm(form) {
    let isValid = true;
    
    form.querySelectorAll('[required]').forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    return isValid;
  },
  
  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required validation
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }
    
    // Update UI
    if (isValid) {
      field.classList.remove('error');
      field.classList.add('success');
      this.removeError(field);
    } else {
      field.classList.add('error');
      field.classList.remove('success');
      this.showError(field, errorMessage);
    }
    
    return isValid;
  },
  
  showError(field, message) {
    this.removeError(field);
    const error = document.createElement('div');
    error.className = 'field-error';
    error.textContent = message;
    field.parentElement.appendChild(error);
  },
  
  removeError(field) {
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  },
  
  async handleSubmit(form) {
    // Show loading state
    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;
    
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success
      notificationSystem.show('Form submitted successfully!', 'success');
      form.reset();
    } catch (error) {
      notificationSystem.show('Submission failed. Please try again.', 'error');
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }
};

// ==================== INITIALIZE EVERYTHING ====================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all systems
  performanceMonitor.init();
  lazyLoader.init();
  smoothScroll.init();
  scrollAnimations.init();
  searchSystem.init();
  themeSwitcher.init();
  shareSystem.init();
  readingProgress.init();
  infiniteScroll.init();
  tooltipSystem.init();
  clipboardSystem.init();
  notificationSystem.init();
  formValidation.init();
  
  // Add loaded class to body
  document.body.classList.add('loaded');
  
  // Log initialization
  console.log('EPL News Hub - Ultra Polished v2.0 initialized');
});

// ==================== SERVICE WORKER REGISTRATION ====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('ServiceWorker registered:', registration))
      .catch(error => console.log('ServiceWorker registration failed:', error));
  });
}