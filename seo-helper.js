// SEO Helper - Dynamic meta tags and structured data for EPL News Hub
class SEOHelper {
    constructor() {
        this.siteUrl = 'https://eplnewshub.com';
        this.siteName = 'EPL News Hub';
        this.siteDescription = 'Your ultimate source for Premier League news, live scores, transfers, fantasy football tools, and in-depth analysis';
        this.siteImage = 'https://eplnewshub.com/images/epl-news-hub-og.jpg';
        this.twitterHandle = '@EPLNewsHub';
    }

    // Initialize SEO for the page
    init(pageConfig = {}) {
        this.setMetaTags(pageConfig);
        this.setOpenGraphTags(pageConfig);
        this.setTwitterCardTags(pageConfig);
        this.setStructuredData(pageConfig);
        this.setCanonicalUrl(pageConfig);
        this.optimizeHeadings();
        this.addSearchEngineVerification();
    }

    // Set basic meta tags
    setMetaTags(config) {
        const {
            title = this.siteName,
            description = this.siteDescription,
            keywords = 'Premier League, EPL, football news, soccer, transfers, live scores, fantasy football, FPL, match results, team news',
            author = 'EPL News Hub',
            robots = 'index, follow'
        } = config;

        // Title
        document.title = title.includes(this.siteName) ? title : `${title} | ${this.siteName}`;

        // Description
        this.setOrCreateMeta('name', 'description', description);
        
        // Keywords
        this.setOrCreateMeta('name', 'keywords', keywords);
        
        // Author
        this.setOrCreateMeta('name', 'author', author);
        
        // Robots
        this.setOrCreateMeta('name', 'robots', robots);
        
        // Viewport (mobile optimization)
        this.setOrCreateMeta('name', 'viewport', 'width=device-width, initial-scale=1, maximum-scale=5');
        
        // Language
        this.setOrCreateMeta('http-equiv', 'content-language', 'en-GB');
        
        // Character set
        this.setOrCreateMeta('charset', 'UTF-8', null, true);
        
        // Theme color
        this.setOrCreateMeta('name', 'theme-color', '#38003c');
        
        // Apple mobile web app
        this.setOrCreateMeta('name', 'apple-mobile-web-app-capable', 'yes');
        this.setOrCreateMeta('name', 'apple-mobile-web-app-status-bar-style', 'black-translucent');
    }

    // Set Open Graph tags for social sharing
    setOpenGraphTags(config) {
        const {
            title = this.siteName,
            description = this.siteDescription,
            type = 'website',
            image = this.siteImage,
            url = window.location.href,
            locale = 'en_GB',
            siteName = this.siteName
        } = config;

        this.setOrCreateMeta('property', 'og:title', title);
        this.setOrCreateMeta('property', 'og:description', description);
        this.setOrCreateMeta('property', 'og:type', type);
        this.setOrCreateMeta('property', 'og:image', image);
        this.setOrCreateMeta('property', 'og:url', url);
        this.setOrCreateMeta('property', 'og:locale', locale);
        this.setOrCreateMeta('property', 'og:site_name', siteName);
        
        // Additional Open Graph tags
        if (config.article) {
            this.setOrCreateMeta('property', 'article:published_time', config.article.publishedTime);
            this.setOrCreateMeta('property', 'article:modified_time', config.article.modifiedTime);
            this.setOrCreateMeta('property', 'article:author', config.article.author);
            this.setOrCreateMeta('property', 'article:section', config.article.section || 'Football');
            
            if (config.article.tags) {
                config.article.tags.forEach(tag => {
                    this.setOrCreateMeta('property', 'article:tag', tag);
                });
            }
        }
    }

    // Set Twitter Card tags
    setTwitterCardTags(config) {
        const {
            card = 'summary_large_image',
            title = this.siteName,
            description = this.siteDescription,
            image = this.siteImage,
            site = this.twitterHandle,
            creator = this.twitterHandle
        } = config;

        this.setOrCreateMeta('name', 'twitter:card', card);
        this.setOrCreateMeta('name', 'twitter:title', title);
        this.setOrCreateMeta('name', 'twitter:description', description);
        this.setOrCreateMeta('name', 'twitter:image', image);
        this.setOrCreateMeta('name', 'twitter:site', site);
        this.setOrCreateMeta('name', 'twitter:creator', creator);
    }

    // Set structured data (JSON-LD)
    setStructuredData(config) {
        const { type = 'WebSite', customData = {} } = config;
        
        let structuredData;
        
        switch(type) {
            case 'WebSite':
                structuredData = this.getWebSiteSchema(customData);
                break;
            case 'NewsArticle':
                structuredData = this.getNewsArticleSchema(customData);
                break;
            case 'SportsEvent':
                structuredData = this.getSportsEventSchema(customData);
                break;
            case 'FAQPage':
                structuredData = this.getFAQSchema(customData);
                break;
            case 'BreadcrumbList':
                structuredData = this.getBreadcrumbSchema(customData);
                break;
            default:
                structuredData = this.getWebSiteSchema(customData);
        }

        // Remove existing JSON-LD scripts
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => script.remove());

        // Add new JSON-LD script
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
    }

    // Get WebSite schema
    getWebSiteSchema(customData) {
        return {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.siteName,
            "description": this.siteDescription,
            "url": this.siteUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.siteUrl}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            },
            "publisher": {
                "@type": "Organization",
                "name": this.siteName,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${this.siteUrl}/images/logo.png`
                }
            },
            ...customData
        };
    }

    // Get NewsArticle schema
    getNewsArticleSchema(article) {
        return {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.headline,
            "description": article.description,
            "image": article.image || this.siteImage,
            "datePublished": article.datePublished,
            "dateModified": article.dateModified || article.datePublished,
            "author": {
                "@type": "Person",
                "name": article.author || "EPL News Hub Team"
            },
            "publisher": {
                "@type": "Organization",
                "name": this.siteName,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${this.siteUrl}/images/logo.png`
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": article.url || window.location.href
            },
            "keywords": article.keywords || "Premier League, EPL, football news"
        };
    }

    // Get SportsEvent schema
    getSportsEventSchema(event) {
        return {
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": event.name,
            "description": event.description,
            "startDate": event.startDate,
            "endDate": event.endDate || event.startDate,
            "location": {
                "@type": "Place",
                "name": event.venue,
                "address": event.address
            },
            "homeTeam": {
                "@type": "SportsTeam",
                "name": event.homeTeam
            },
            "awayTeam": {
                "@type": "SportsTeam",
                "name": event.awayTeam
            },
            "sport": "Football",
            "organizer": {
                "@type": "Organization",
                "name": "Premier League"
            }
        };
    }

    // Get FAQ schema
    getFAQSchema(faqs) {
        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        };
    }

    // Get Breadcrumb schema
    getBreadcrumbSchema(breadcrumbs) {
        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": crumb.name,
                "item": crumb.url
            }))
        };
    }

    // Set canonical URL
    setCanonicalUrl(config) {
        const { url = window.location.href } = config;
        
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        
        // Clean URL (remove query parameters if not needed)
        const cleanUrl = url.split('?')[0].replace(/\/$/, '');
        canonical.href = cleanUrl;
    }

    // Optimize heading structure
    optimizeHeadings() {
        // Ensure there's only one H1
        const h1s = document.querySelectorAll('h1');
        if (h1s.length > 1) {
            console.warn('Multiple H1 tags found. Consider using only one H1 per page for better SEO.');
        }
        
        // Check heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        
        headings.forEach(heading => {
            const level = parseInt(heading.tagName.charAt(1));
            if (level - lastLevel > 1) {
                console.warn(`Heading hierarchy issue: ${heading.tagName} follows H${lastLevel}`);
            }
            lastLevel = level;
        });
    }

    // Add search engine verification meta tags
    addSearchEngineVerification() {
        // Google Search Console
        if (!document.querySelector('meta[name="google-site-verification"]')) {
            // Add your verification code when available
            // this.setOrCreateMeta('name', 'google-site-verification', 'YOUR_GOOGLE_VERIFICATION_CODE');
        }
        
        // Bing Webmaster Tools
        if (!document.querySelector('meta[name="msvalidate.01"]')) {
            // Add your verification code when available
            // this.setOrCreateMeta('name', 'msvalidate.01', 'YOUR_BING_VERIFICATION_CODE');
        }
    }

    // Helper function to set or create meta tags
    setOrCreateMeta(attrName, attrValue, content, isCharset = false) {
        if (isCharset) {
            let meta = document.querySelector('meta[charset]');
            if (!meta) {
                meta = document.createElement('meta');
                meta.charset = 'UTF-8';
                document.head.insertBefore(meta, document.head.firstChild);
            }
            return;
        }

        let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attrName, attrValue);
            document.head.appendChild(meta);
        }
        if (content !== null) {
            meta.content = content;
        }
    }

    // Generate meta tags for FPL tools
    generateFPLToolMeta(toolName, toolDescription) {
        return {
            title: `${toolName} - Fantasy Premier League Tool`,
            description: toolDescription,
            keywords: `FPL, Fantasy Premier League, ${toolName}, FPL tools, fantasy football, Premier League fantasy`,
            type: 'website',
            article: null
        };
    }

    // Generate meta tags for articles
    generateArticleMeta(article) {
        return {
            title: article.title,
            description: article.excerpt || article.description,
            keywords: article.tags ? article.tags.join(', ') : 'Premier League, EPL, football news',
            type: 'article',
            article: {
                publishedTime: article.publishedDate,
                modifiedTime: article.modifiedDate || article.publishedDate,
                author: article.author,
                section: article.section || 'News',
                tags: article.tags
            }
        };
    }

    // Track page views for SEO analysis
    trackPageView() {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
        }
    }

    // Add hreflang tags for international SEO
    addHreflangTags(languages = []) {
        const defaultLang = { lang: 'en-GB', url: window.location.href };
        const allLanguages = [defaultLang, ...languages];
        
        allLanguages.forEach(({ lang, url }) => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = lang;
            link.href = url;
            document.head.appendChild(link);
        });
        
        // Add x-default
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = defaultLang.url;
        document.head.appendChild(defaultLink);
    }

    // Optimize images for SEO
    optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Add alt text if missing
            if (!img.alt) {
                const src = img.src;
                const filename = src.split('/').pop().split('.')[0];
                const altText = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                img.alt = altText;
                console.warn(`Added alt text "${altText}" to image: ${src}`);
            }
            
            // Add loading="lazy" for images below the fold
            if (!img.loading && !this.isInViewport(img)) {
                img.loading = 'lazy';
            }
            
            // Add width and height to prevent layout shift
            if (!img.width && img.naturalWidth) {
                img.width = img.naturalWidth;
            }
            if (!img.height && img.naturalHeight) {
                img.height = img.naturalHeight;
            }
        });
    }

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Add schema markup for search box
    addSiteSearchSchema() {
        const searchSchema = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": this.siteUrl,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.siteUrl}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        };
        
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(searchSchema);
        document.head.appendChild(script);
    }

    // Monitor Core Web Vitals
    monitorCoreWebVitals() {
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Cumulative Layout Shift
            let clsScore = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsScore += entry.value;
                        console.log('CLS:', clsScore);
                    }
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }
}

// Auto-initialize SEO Helper
const seoHelper = new SEOHelper();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.SEOHelper = SEOHelper;
    window.seoHelper = seoHelper;
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Default initialization
    seoHelper.init();
    seoHelper.optimizeImages();
    seoHelper.trackPageView();
    seoHelper.monitorCoreWebVitals();
});