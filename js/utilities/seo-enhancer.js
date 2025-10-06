// SEO Enhancement Script for EPL News Hub
// Implements traffic-driving strategies from content marketing best practices

(function() {
    'use strict';

    // 1. Internal Linking System
    const internalLinkKeywords = {
        'premier league': '/articles/latest-premier-league-standings-and-highlights-2025-edition-01-05-2025.html',
        'fpl': '/fpl.html',
        'fantasy premier league': '/fpl.html',
        'gameweek': '/fpl.html',
        'arsenal': '/articles/arsenals-corner-kick-mastery-10-06-2024.html',
        'manchester united': '/articles/Manchester-Uniteds-worst-team-in-years-20-01-2025.html',
        'liverpool': '/articles/liverpool-triumph-over-bournemouth-2025-02-02.html',
        'man city': '/articles/man-citys-rodri-out-for-season-with-acl-injury-09-27-2024.html',
        'transfers': '/articles/premier-league-transfer-window-latest-rumors-07-20-2025.html',
        'champions league': '/articles/champions-league-matchday-2-fixtures-09-28-2024.html'
    };

    // 2. Auto-generate Table of Contents for long articles
    function generateTableOfContents() {
        const article = document.querySelector('.nyt-article');
        if (!article) return;

        const headings = article.querySelectorAll('h2, h3');
        if (headings.length < 3) return; // Only add TOC for longer articles

        const tocContainer = document.createElement('div');
        tocContainer.className = 'table-of-contents';
        tocContainer.innerHTML = `
            <h3>📋 Table of Contents</h3>
            <ul class="toc-list"></ul>
        `;

        const tocList = tocContainer.querySelector('.toc-list');
        
        headings.forEach((heading, index) => {
            const id = `section-${index + 1}`;
            heading.id = id;
            
            const li = document.createElement('li');
            li.innerHTML = `<a href="#${id}" class="toc-link">${heading.textContent}</a>`;
            tocList.appendChild(li);
        });

        // Insert TOC after first paragraph
        const firstParagraph = article.querySelector('p');
        if (firstParagraph) {
            firstParagraph.parentNode.insertBefore(tocContainer, firstParagraph.nextSibling);
        }
    }

    // 3. Add Related Articles section
    function addRelatedArticles() {
        const article = document.querySelector('.nyt-article');
        if (!article) return;

        // Get current article keywords from meta tags
        const keywords = document.querySelector('meta[name="keywords"]')?.content?.split(',') || [];
        
        const relatedSection = document.createElement('div');
        relatedSection.className = 'related-articles';
        relatedSection.innerHTML = `
            <h3>🔗 Related Articles</h3>
            <div class="related-grid">
                <a href="/articles/latest-premier-league-standings-and-highlights-2025-edition-01-05-2025.html" class="related-card">
                    <h4>Latest Premier League Standings & Highlights</h4>
                    <p>Stay updated with the current table positions and recent match highlights</p>
                </a>
                <a href="/fpl.html" class="related-card">
                    <h4>Fantasy Premier League Hub</h4>
                    <p>Get the latest FPL tips, analysis, and team building tools</p>
                </a>
                <a href="/articles/premier-league-transfer-window-latest-rumors-07-20-2025.html" class="related-card">
                    <h4>Transfer Window Latest</h4>
                    <p>All the latest transfer rumors and confirmed deals</p>
                </a>
            </div>
        `;

        article.appendChild(relatedSection);
    }

    // 4. Add social sharing buttons
    function addSocialSharing() {
        const article = document.querySelector('.nyt-article');
        if (!article) return;

        const currentUrl = encodeURIComponent(window.location.href);
        const articleTitle = encodeURIComponent(document.title);
        
        const sharingSection = document.createElement('div');
        sharingSection.className = 'social-sharing';
        sharingSection.innerHTML = `
            <h4>📱 Share This Article</h4>
            <div class="share-buttons">
                <a href="https://twitter.com/intent/tweet?url=${currentUrl}&text=${articleTitle}" target="_blank" class="share-btn twitter">
                    🐦 Tweet
                </a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${currentUrl}" target="_blank" class="share-btn facebook">
                    📘 Share
                </a>
                <a href="https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}" target="_blank" class="share-btn linkedin">
                    💼 LinkedIn
                </a>
                <button onclick="navigator.clipboard.writeText('${decodeURIComponent(currentUrl)}')" class="share-btn copy">
                    📋 Copy Link
                </button>
            </div>
        `;

        // Insert before related articles or at end
        const relatedSection = article.querySelector('.related-articles');
        if (relatedSection) {
            relatedSection.parentNode.insertBefore(sharingSection, relatedSection);
        } else {
            article.appendChild(sharingSection);
        }
    }

    // 5. Auto-link internal content
    function addInternalLinks() {
        const article = document.querySelector('.nyt-article');
        if (!article) return;

        const paragraphs = article.querySelectorAll('p');
        
        paragraphs.forEach(paragraph => {
            let html = paragraph.innerHTML;
            
            Object.entries(internalLinkKeywords).forEach(([keyword, url]) => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const existing = paragraph.querySelector(`a[href*="${url}"]`);
                
                if (!existing && regex.test(html)) {
                    html = html.replace(regex, (match) => {
                        return `<a href="${url}" class="internal-link">${match}</a>`;
                    });
                }
            });
            
            paragraph.innerHTML = html;
        });
    }

    // 6. Add reading time estimate
    function addReadingTime() {
        const article = document.querySelector('.nyt-article');
        if (!article) return;

        const text = article.textContent;
        const wordsPerMinute = 200;
        const wordCount = text.trim().split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);

        const readingTimeEl = document.createElement('div');
        readingTimeEl.className = 'reading-time';
        readingTimeEl.innerHTML = `📖 ${readingTime} min read • ${wordCount.toLocaleString()} words`;

        // Insert after byline or at beginning of article
        const byline = article.querySelector('.byline');
        if (byline) {
            byline.parentNode.insertBefore(readingTimeEl, byline.nextSibling);
        } else {
            const firstChild = article.firstElementChild;
            article.insertBefore(readingTimeEl, firstChild);
        }
    }

    // 7. Add structured data (JSON-LD)
    function addStructuredData() {
        const title = document.title.replace(' | EPL News Hub', '');
        const description = document.querySelector('meta[name="description"]')?.content || '';
        const publishDate = document.querySelector('meta[property="article:published_time"]')?.content || new Date().toISOString();
        const author = document.querySelector('meta[property="article:author"]')?.content || 'EPL News Hub';
        const image = document.querySelector('meta[property="og:image"]')?.content || '';

        const structuredData = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": title,
            "description": description,
            "image": image,
            "datePublished": publishDate,
            "dateModified": publishDate,
            "author": {
                "@type": "Organization",
                "name": author,
                "url": "https://eplnewshub.com"
            },
            "publisher": {
                "@type": "Organization",
                "name": "EPL News Hub",
                "url": "https://eplnewshub.com",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://eplnewshub.com/reidsnbest.webp"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            },
            "articleSection": "Sports",
            "keywords": document.querySelector('meta[name="keywords"]')?.content || 'Premier League, Football, EPL'
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    // 8. Add newsletter signup
    function addNewsletterSignup() {
        const article = document.querySelector('.nyt-article');
        if (!article) return;

        const newsletterSection = document.createElement('div');
        newsletterSection.className = 'newsletter-signup';
        newsletterSection.innerHTML = `
            <div class="newsletter-card">
                <h3>⚽ Stay Updated with EPL News</h3>
                <p>Get the latest Premier League news, FPL tips, and transfer updates delivered to your inbox!</p>
                <button onclick="document.querySelector('.popup-form').style.display = 'flex'" class="newsletter-btn">
                    📧 Subscribe Now
                </button>
            </div>
        `;

        // Insert in middle of article for better engagement
        const paragraphs = article.querySelectorAll('p');
        if (paragraphs.length > 5) {
            const middleIndex = Math.floor(paragraphs.length / 2);
            paragraphs[middleIndex].parentNode.insertBefore(newsletterSection, paragraphs[middleIndex].nextSibling);
        }
    }

    // Initialize all enhancements when DOM is ready
    function initializeEnhancements() {
        addReadingTime();
        generateTableOfContents();
        addInternalLinks();
        addSocialSharing();
        addRelatedArticles();
        addNewsletterSignup();
        addStructuredData();
    }

    // Run when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEnhancements);
    } else {
        initializeEnhancements();
    }

    // CSS Styles for enhancements
    const styles = `
        <style>
        .table-of-contents {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-left: 4px solid #37003c;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        
        .table-of-contents h3 {
            margin: 0 0 15px 0;
            color: #37003c;
            font-size: 1.1rem;
        }
        
        .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .toc-list li {
            margin: 8px 0;
        }
        
        .toc-link {
            color: #555;
            text-decoration: none;
            transition: color 0.3s ease;
            font-weight: 500;
        }
        
        .toc-link:hover {
            color: #37003c;
        }
        
        .reading-time {
            background: rgba(55,0,60,0.1);
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            color: #666;
            margin: 15px 0;
            display: inline-block;
        }
        
        .related-articles {
            background: #f8f9fa;
            padding: 30px;
            margin: 40px 0;
            border-radius: 12px;
            border-top: 3px solid #37003c;
        }
        
        .related-articles h3 {
            margin: 0 0 20px 0;
            color: #37003c;
        }
        
        .related-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .related-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-decoration: none;
            color: inherit;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border: 1px solid #e0e0e0;
        }
        
        .related-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .related-card h4 {
            margin: 0 0 10px 0;
            color: #37003c;
            font-size: 1rem;
        }
        
        .related-card p {
            margin: 0;
            font-size: 0.9rem;
            color: #666;
        }
        
        .social-sharing {
            text-align: center;
            padding: 25px;
            background: linear-gradient(135deg, #37003c, #6f42c1);
            color: white;
            border-radius: 12px;
            margin: 30px 0;
        }
        
        .social-sharing h4 {
            margin: 0 0 15px 0;
        }
        
        .share-buttons {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .share-btn {
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            color: white;
            font-weight: 600;
            transition: transform 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .share-btn:hover {
            transform: translateY(-2px);
        }
        
        .share-btn.twitter { background: #1da1f2; }
        .share-btn.facebook { background: #4267b2; }
        .share-btn.linkedin { background: #0077b5; }
        .share-btn.copy { background: #28a745; }
        
        .newsletter-signup {
            margin: 40px 0;
        }
        
        .newsletter-card {
            background: linear-gradient(135deg, #00ff87, #28a745);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
        }
        
        .newsletter-card h3 {
            margin: 0 0 10px 0;
        }
        
        .newsletter-card p {
            margin: 0 0 20px 0;
            opacity: 0.9;
        }
        
        .newsletter-btn {
            background: white;
            color: #28a745;
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        
        .newsletter-btn:hover {
            transform: translateY(-2px);
        }
        
        .internal-link {
            color: #37003c;
            font-weight: 600;
            text-decoration: underline;
            text-decoration-color: rgba(55,0,60,0.3);
        }
        
        .internal-link:hover {
            text-decoration-color: #37003c;
        }
        
        @media (max-width: 768px) {
            .related-grid {
                grid-template-columns: 1fr;
            }
            
            .share-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .share-btn {
                width: 200px;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);

})();