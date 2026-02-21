// Article Enhancement Script for EPL News Hub
// This script automatically enhances existing articles with modern styling

document.addEventListener('DOMContentLoaded', function() {
    enhanceArticle();
});

function loadFloatingSideAds() {
    // Check if we're on an article page
    const isArticle = window.location.pathname.includes('/articles/') ||
                     document.querySelector('.nyt-article') ||
                     document.querySelector('article');

    if (isArticle) {
        const script = document.createElement('script');
        script.src = '/article-side-ads.js';
        script.async = true;
        document.head.appendChild(script);
    }
}

function loadEditorialAds() {
    const isArticle = window.location.pathname.includes('/articles/') ||
                     document.querySelector('.article-body') ||
                     document.querySelector('.article-content') ||
                     document.querySelector('.nyt-article');

    if (isArticle && !document.querySelector('script[src*="/editorial-ads.js"]')) {
        const script = document.createElement('script');
        script.src = '/editorial-ads.js?v=5';
        document.head.appendChild(script);
    }
}

function enhanceArticle() {
    const article = document.querySelector('.nyt-article');
    if (!article) return;

    // Add enhanced article class
    article.classList.add('enhanced-article');

    // Create enhanced header if article has h1
    const h1 = article.querySelector('h1');
    const byline = article.querySelector('.byline');
    
    if (h1) {
        createEnhancedHeader(h1, byline, article);
    }

    // Add reading progress bar
    addReadingProgressBar();

    // Enhance paragraphs and sections
    enhanceParagraphs(article);

    // Add visual separators
    addVisualSeparators(article);

    // Enhance links
    enhanceLinks(article);

    // Create stats boxes where appropriate
    createStatsBoxes(article);

    // Enhance existing related articles section
    enhanceRelatedArticles(article);

    // Add CTA boxes
    addCTABoxes(article);

    // Add smooth scroll and interaction effects
    addInteractionEffects();

    // Load editorial ad placement system
    loadEditorialAds();
}

function createEnhancedHeader(h1, byline, article) {
    const header = document.createElement('header');
    header.className = 'article-header';

    const title = document.createElement('h1');
    title.className = 'article-title';
    title.textContent = h1.textContent;

    const subtitle = document.createElement('p');
    subtitle.className = 'article-subtitle';
    
    // Extract subtitle from title if it contains a colon
    const titleParts = h1.textContent.split(':');
    if (titleParts.length > 1) {
        title.textContent = titleParts[0].trim();
        subtitle.textContent = titleParts.slice(1).join(':').trim();
    } else {
        subtitle.textContent = 'Latest Premier League Analysis & News';
    }

    const meta = document.createElement('div');
    meta.className = 'article-meta';
    
    if (byline) {
        const metaContent = byline.innerHTML
            .replace('By ', '📝 By ')
            .replace('|', '<span class="meta-item">📅')
            .concat('</span><span class="meta-item">⏱️ 5 min read</span><span class="meta-item">🏆 Premier League</span>');
        meta.innerHTML = `<span class="meta-item">${metaContent}</span>`;
    } else {
        meta.innerHTML = `
            <span class="meta-item">📝 By EPL News Hub</span>
            <span class="meta-item">📅 ${new Date().toLocaleDateString()}</span>
            <span class="meta-item">⏱️ 5 min read</span>
            <span class="meta-item">🏆 Premier League</span>
        `;
    }

    header.appendChild(title);
    header.appendChild(subtitle);
    header.appendChild(meta);

    // Replace original h1 and byline
    article.insertBefore(header, article.firstChild);
    h1.remove();
    if (byline) byline.remove();
}

function addReadingProgressBar() {
    if (!document.getElementById('reading-progress')) {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.id = 'reading-progress';
        document.body.insertBefore(progressBar, document.body.firstChild);

        // Progress bar functionality
        window.addEventListener('scroll', function() {
            const article = document.querySelector('.enhanced-article');
            if (article) {
                const scrollTop = window.pageYOffset;
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrollPercent = scrollTop / docHeight;
                progressBar.style.width = (scrollPercent * 100) + '%';
            }
        });
    }
}

function enhanceParagraphs(article) {
    const paragraphs = article.querySelectorAll('p');
    if (paragraphs.length > 0) {
        // Make first paragraph special
        const firstP = paragraphs[0];
        if (firstP && !firstP.querySelector('script')) {
            firstP.style.cssText = `
                font-size: 1.2rem;
                font-weight: 500;
                color: #37003c;
                border-left: 4px solid #20c997;
                background: linear-gradient(90deg, rgba(32, 201, 151, 0.05) 0%, transparent 100%);
                padding: 20px;
                border-radius: 0 8px 8px 0;
                margin-bottom: 30px;
            `;
        }
    }
}

function addVisualSeparators(article) {
    const headings = article.querySelectorAll('h2');
    headings.forEach((heading, index) => {
        if (index > 0 && !heading.previousElementSibling?.classList.contains('section-divider')) {
            const divider = document.createElement('div');
            divider.className = 'section-divider';
            heading.parentNode.insertBefore(divider, heading);
        }
        
        // Add emoji to headings if they don't have one
        if (!/^[\u{1F600}-\u{1F64F}]|^[\u{1F300}-\u{1F5FF}]|^[\u{1F680}-\u{1F6FF}]|^[\u{1F1E0}-\u{1F1FF}]/u.test(heading.textContent)) {
            const emojis = ['⚽', '🏆', '🌟', '🔥', '⚡', '🎯', '💪', '🚀'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            heading.textContent = `${randomEmoji} ${heading.textContent}`;
        }
    });
}

function enhanceLinks(article) {
    const links = article.querySelectorAll('a');
    links.forEach(link => {
        if (!link.classList.contains('cta-button')) {
            link.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        }
    });
}

function createStatsBoxes(article) {
    const paragraphs = article.querySelectorAll('p');
    
    // Look for paragraphs with numbers that could be turned into stats
    paragraphs.forEach(p => {
        const text = p.textContent;
        
        // Check for goal-related stats
        if (text.includes('goals') && text.match(/\d+/g)) {
            const goals = text.match(/(\d+)\s+goals?/i);
            if (goals && !p.nextElementSibling?.classList.contains('stats-box')) {
                const statsBox = createStatsBox([
                    { number: goals[1], label: 'Goals Scored' },
                    { number: '90', label: 'Minutes' },
                    { number: '1', label: 'Season' },
                    { number: '⭐', label: 'Performance' }
                ]);
                p.parentNode.insertBefore(statsBox, p.nextSibling);
            }
        }
    });
}

function createStatsBox(stats) {
    const statsBox = document.createElement('div');
    statsBox.className = 'stats-box';
    
    const title = document.createElement('h4');
    title.textContent = 'Key Statistics';
    
    const grid = document.createElement('div');
    grid.className = 'stats-grid';
    
    stats.forEach(stat => {
        const item = document.createElement('div');
        item.className = 'stat-item';
        item.innerHTML = `
            <span class="stat-number">${stat.number}</span>
            <span class="stat-label">${stat.label}</span>
        `;
        grid.appendChild(item);
    });
    
    statsBox.appendChild(title);
    statsBox.appendChild(grid);
    
    return statsBox;
}

function enhanceRelatedArticles(article) {
    const relatedSection = article.querySelector('[style*="Related"]');
    if (relatedSection) {
        relatedSection.className = 'related-articles';
        
        const title = relatedSection.querySelector('h3');
        if (title) {
            title.textContent = '📰 Related Premier League Coverage';
        }
        
        const links = relatedSection.querySelectorAll('div[style*="flex"]');
        if (links.length > 0) {
            const grid = document.createElement('div');
            grid.className = 'related-grid';
            
            links.forEach(linkDiv => {
                const item = document.createElement('div');
                item.className = 'related-item';
                
                const span = linkDiv.querySelector('span');
                const link = linkDiv.querySelector('a');
                
                if (span && link) {
                    const category = document.createElement('span');
                    category.className = 'related-category';
                    category.textContent = span.textContent;
                    
                    const titleLink = document.createElement('a');
                    titleLink.className = 'related-title';
                    titleLink.href = link.href;
                    titleLink.textContent = link.textContent;
                    
                    item.appendChild(category);
                    item.appendChild(titleLink);
                    grid.appendChild(item);
                }
                
                linkDiv.remove();
            });
            
            relatedSection.appendChild(grid);
        }
    }
}

function addCTABoxes(article) {
    const headings = article.querySelectorAll('h2');
    const middleIndex = Math.floor(headings.length / 2);
    
    if (headings[middleIndex] && !headings[middleIndex].nextElementSibling?.classList.contains('cta-box')) {
        const ctaBox = document.createElement('div');
        ctaBox.className = 'cta-box';
        ctaBox.innerHTML = `
            <h3>🔥 Stay Updated</h3>
            <p>Get the latest Premier League news, analysis, and exclusive content delivered straight to your inbox.</p>
            <a href="../index.html#newsletter-signup" class="cta-button">Subscribe Now</a>
        `;
        
        headings[middleIndex].parentNode.insertBefore(ctaBox, headings[middleIndex].nextSibling);
    }
}

function addInteractionEffects() {
    // Add smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Add hover effects to enhanced elements
    document.querySelectorAll('.related-item, .stats-box, .cta-box').forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.transition = 'all 0.3s ease';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Auto-enhance articles when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceArticle);
} else {
    enhanceArticle();
}