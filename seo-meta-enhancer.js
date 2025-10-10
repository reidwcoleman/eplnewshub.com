// EPL News Hub - SEO & Meta Enhancement Script
// This script optimizes all pages for maximum search engine visibility

(function() {
    'use strict';
    
    // Enhanced SEO Meta Tags
    function enhanceSEO() {
        const head = document.head;
        
        // Schema.org Structured Data for Sports Website
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            "name": "EPL News Hub",
            "url": "https://eplnewshub.com",
            "logo": "https://eplnewshub.com/eplnewshubnewlogo.png",
            "description": "Premier League's #1 source for breaking news, transfers, live scores, and FPL tips",
            "sameAs": [
                "https://twitter.com/eplnewshub",
                "https://facebook.com/eplnewshub",
                "https://instagram.com/eplnewshub"
            ],
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://eplnewshub.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        });
        head.appendChild(schemaScript);
        
        // Add News Article Schema for articles
        if (window.location.pathname.includes('/articles/')) {
            const articleSchema = document.createElement('script');
            articleSchema.type = 'application/ld+json';
            articleSchema.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": document.title,
                "image": document.querySelector('meta[property="og:image"]')?.content || "https://eplnewshub.com/0x0.webp",
                "datePublished": new Date().toISOString(),
                "dateModified": new Date().toISOString(),
                "author": {
                    "@type": "Organization",
                    "name": "EPL News Hub"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "EPL News Hub",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://eplnewshub.com/eplnewshubnewlogo.png"
                    }
                },
                "description": document.querySelector('meta[name="description"]')?.content || "Latest EPL News"
            });
            head.appendChild(articleSchema);
        }
        
        // Add FAQ Schema for common questions
        const faqSchema = document.createElement('script');
        faqSchema.type = 'application/ld+json';
        faqSchema.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "What is the latest Premier League transfer news?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Get real-time Premier League transfer updates, confirmed deals, and rumors on our Transfer Hub page."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How can I improve my FPL team?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Use our AI-powered FPL Assistant for personalized tips, captain picks, and differential suggestions."
                    }
                }
            ]
        });
        head.appendChild(faqSchema);
        
        // Breadcrumb Schema
        if (window.location.pathname !== '/') {
            const breadcrumbSchema = document.createElement('script');
            breadcrumbSchema.type = 'application/ld+json';
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const breadcrumbItems = [{
                "@type": "ListItem",
                "position": 1,
                "item": {
                    "@id": "https://eplnewshub.com",
                    "name": "Home"
                }
            }];
            
            pathParts.forEach((part, index) => {
                breadcrumbItems.push({
                    "@type": "ListItem",
                    "position": index + 2,
                    "item": {
                        "@id": `https://eplnewshub.com/${pathParts.slice(0, index + 1).join('/')}`,
                        "name": part.replace(/-/g, ' ').replace('.html', '').toUpperCase()
                    }
                });
            });
            
            breadcrumbSchema.textContent = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "itemListElement": breadcrumbItems
            });
            head.appendChild(breadcrumbSchema);
        }
        
        // Event Schema for match previews
        const eventSchema = document.createElement('script');
        eventSchema.type = 'application/ld+json';
        eventSchema.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": "Premier League Match",
            "startDate": new Date(Date.now() + 86400000).toISOString(),
            "location": {
                "@type": "Place",
                "name": "Premier League Stadium",
                "address": "England, UK"
            },
            "organizer": {
                "@type": "SportsOrganization",
                "name": "Premier League"
            }
        });
        head.appendChild(eventSchema);
    }
    
    // Add trending keywords to meta tags
    function addTrendingKeywords() {
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        const trendingTerms = [
            "EPL news today",
            "Premier League live",
            "FPL tips 2025",
            "EPL transfer news",
            "Manchester United news",
            "Arsenal transfer",
            "Chelsea FC",
            "Liverpool updates",
            "Man City news",
            "Tottenham transfers",
            "FPL gameweek",
            "EPL fixtures",
            "Premier League table",
            "EPL highlights",
            "football news UK"
        ];
        
        if (metaKeywords) {
            metaKeywords.content += ', ' + trendingTerms.join(', ');
        }
    }
    
    // Optimize page load for Core Web Vitals
    function optimizePerformance() {
        // Preconnect to external domains
        const preconnects = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.googletagmanager.com',
            'https://pagead2.googlesyndication.com'
        ];
        
        preconnects.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            document.head.appendChild(link);
        });
        
        // Add DNS prefetch for faster loading
        const dnsPrefetch = [
            '//cdnjs.cloudflare.com',
            '//ajax.googleapis.com',
            '//www.google-analytics.com'
        ];
        
        dnsPrefetch.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = url;
            document.head.appendChild(link);
        });
    }
    
    // Initialize all SEO enhancements
    function init() {
        enhanceSEO();
        addTrendingKeywords();
        optimizePerformance();
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();