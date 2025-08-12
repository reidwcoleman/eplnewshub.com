// Image Enhancement and Lazy Loading for EPL News Hub

document.addEventListener('DOMContentLoaded', function() {
    // Lazy Loading for Images
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const wrapper = img.closest('.story-image-wrapper');
                
                // Add loading class
                if (wrapper) {
                    wrapper.classList.add('loading');
                }
                
                // Load the image
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                
                // Remove loading class once loaded
                img.addEventListener('load', () => {
                    if (wrapper) {
                        wrapper.classList.remove('loading');
                    }
                    img.classList.add('loaded');
                });
                
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px',
        threshold: 0.01
    });
    
    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
    
    // Smooth reveal animation for article cards
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1
    });
    
    // Observe all story cards
    document.querySelectorAll('.story-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        cardObserver.observe(card);
    });
    
    // Add visible class styles
    const style = document.createElement('style');
    style.textContent = `
        .story-card.visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
            transition: opacity 0.6s ease, transform 0.6s ease !important;
        }
        
        img.loaded {
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                filter: blur(5px);
            }
            to {
                opacity: 1;
                filter: blur(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Parallax effect for featured images
    const featuredImages = document.querySelectorAll('.featured-story .story-image-wrapper img');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        featuredImages.forEach(img => {
            const rect = img.getBoundingClientRect();
            const speed = 0.5;
            
            if (rect.bottom >= 0 && rect.top <= window.innerHeight) {
                const yPos = -(scrolled * speed);
                img.style.transform = `translateY(${yPos}px) scale(1.1)`;
            }
        });
    });
    
    // Image error handling
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
            const wrapper = this.closest('.story-image-wrapper');
            if (wrapper) {
                wrapper.innerHTML = `
                    <div class="image-placeholder">
                        <span class="placeholder-icon">⚽</span>
                        <span class="placeholder-text">EPL News Hub</span>
                    </div>
                `;
            }
        });
    });
    
    // Add image placeholder styles
    const placeholderStyle = document.createElement('style');
    placeholderStyle.textContent = `
        .image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #37003c 0%, #6f42c1 100%);
            color: white;
        }
        
        .placeholder-icon {
            font-size: 3rem;
            margin-bottom: 10px;
            animation: bounce 2s infinite;
        }
        
        .placeholder-text {
            font-size: 1rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(placeholderStyle);
    
    // Preload critical images
    const criticalImages = document.querySelectorAll('.featured-story img, .story-card:nth-child(-n+3) img');
    criticalImages.forEach(img => {
        if (img.dataset.src) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = img.dataset.src;
            document.head.appendChild(preloadLink);
        }
    });
    
    // Progressive image loading with blur effect
    document.querySelectorAll('.story-image-wrapper').forEach(wrapper => {
        const img = wrapper.querySelector('img');
        if (img && img.complete) {
            wrapper.classList.add('image-loaded');
        } else if (img) {
            img.addEventListener('load', () => {
                wrapper.classList.add('image-loaded');
            });
        }
    });
    
    // Add progressive loading styles
    const progressiveStyle = document.createElement('style');
    progressiveStyle.textContent = `
        .story-image-wrapper {
            position: relative;
            background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
        }
        
        .story-image-wrapper::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: inherit;
            backdrop-filter: blur(10px);
            opacity: 1;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        
        .story-image-wrapper.image-loaded::after {
            opacity: 0;
        }
    `;
    document.head.appendChild(progressiveStyle);
});

// Export functions for external use
window.EPLImageEnhancement = {
    // Refresh lazy loading for dynamically added content
    refreshLazyLoading: function() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    },
    
    // Preload specific images
    preloadImages: function(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
};