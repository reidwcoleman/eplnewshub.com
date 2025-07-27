/**
 * Article Metadata Extractor for EPL News Hub
 * Extracts metadata from HTML articles for news feed generation
 */

class ArticleMetadataExtractor {
    constructor() {
        this.parser = new DOMParser();
    }

    /**
     * Extract metadata from a single HTML article file
     * @param {string} htmlContent - The HTML content of the article
     * @param {string} filePath - The file path of the article
     * @returns {Object} Article metadata object
     */
    extractArticleMetadata(htmlContent, filePath) {
        const doc = this.parser.parseFromString(htmlContent, 'text/html');
        
        // Extract title from h1 tag or title tag
        const title = this.extractTitle(doc);
        
        // Extract first paragraph as excerpt
        const excerpt = this.extractExcerpt(doc);
        
        // Extract publication date from filename or meta tags
        const publishDate = this.extractPublishDate(doc, filePath);
        
        // Extract category/tags from meta tags or content analysis
        const categories = this.extractCategories(doc);
        
        // Extract meta description
        const description = this.extractDescription(doc);
        
        // Extract author information
        const author = this.extractAuthor(doc);
        
        // Generate slug from filename
        const slug = this.generateSlug(filePath);
        
        return {
            title,
            excerpt,
            description,
            publishDate,
            categories,
            tags: categories, // For compatibility
            author,
            slug,
            filePath,
            url: `/articles/${slug}.html`,
            wordCount: this.calculateWordCount(doc),
            readTime: this.calculateReadTime(doc)
        };
    }

    /**
     * Extract title from h1 tag or title tag
     */
    extractTitle(doc) {
        // Try h1 first (preferred)
        const h1 = doc.querySelector('h1');
        if (h1 && h1.textContent.trim()) {
            return h1.textContent.trim();
        }
        
        // Fallback to title tag
        const titleTag = doc.querySelector('title');
        if (titleTag && titleTag.textContent.trim()) {
            return titleTag.textContent.trim();
        }
        
        return 'Untitled Article';
    }

    /**
     * Extract first meaningful paragraph as excerpt
     */
    extractExcerpt(doc) {
        // Look for paragraphs in main content area
        const mainContent = doc.querySelector('.main') || doc.querySelector('main') || doc.body;
        const paragraphs = mainContent.querySelectorAll('p');
        
        for (let p of paragraphs) {
            const text = p.textContent.trim();
            // Skip very short paragraphs and those that might be ads/metadata
            if (text.length > 50 && !this.isAdOrMetaParagraph(text)) {
                // Limit excerpt to ~150 characters for better display
                return text.length > 150 ? text.substring(0, 147) + '...' : text;
            }
        }
        
        return 'No excerpt available';
    }

    /**
     * Extract publication date from filename or meta tags
     */
    extractPublishDate(doc, filePath) {
        // First try article:published_time meta tag
        const publishedTimeMeta = doc.querySelector('meta[property="article:published_time"]');
        if (publishedTimeMeta) {
            return new Date(publishedTimeMeta.getAttribute('content'));
        }
        
        // Try to extract date from filename pattern: YYYY-MM-DD or MM-DD-YYYY
        const filename = filePath.split(/[/\\]/).pop();
        
        // Pattern 1: ends with YYYY-MM-DD.html
        const datePattern1 = filename.match(/(\d{4})-(\d{1,2})-(\d{1,2})\.html$/);
        if (datePattern1) {
            const [, year, month, day] = datePattern1;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        // Pattern 2: ends with MM-DD-YYYY.html
        const datePattern2 = filename.match(/(\d{1,2})-(\d{1,2})-(\d{4})\.html$/);
        if (datePattern2) {
            const [, month, day, year] = datePattern2;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        // Pattern 3: MM-DD-YY format
        const datePattern3 = filename.match(/(\d{1,2})-(\d{1,2})-(\d{2})\.html$/);
        if (datePattern3) {
            const [, month, day, shortYear] = datePattern3;
            const year = 2000 + parseInt(shortYear);
            return new Date(year, parseInt(month) - 1, parseInt(day));
        }
        
        // Fallback to file modification date or current date
        return new Date();
    }

    /**
     * Extract categories/tags from meta tags and content analysis
     */
    extractCategories(doc) {
        const categories = new Set();
        
        // Check article:tag meta tags
        const tagMetas = doc.querySelectorAll('meta[property="article:tag"]');
        tagMetas.forEach(meta => {
            const tag = meta.getAttribute('content');
            if (tag) categories.add(tag);
        });
        
        // Check keywords meta tag
        const keywordsMeta = doc.querySelector('meta[name="keywords"]');
        if (keywordsMeta) {
            const keywords = keywordsMeta.getAttribute('content').split(',');
            keywords.forEach(keyword => {
                const trimmed = keyword.trim();
                if (trimmed) categories.add(trimmed);
            });
        }
        
        // Content-based category detection
        const contentCategories = this.detectCategoriesFromContent(doc);
        contentCategories.forEach(cat => categories.add(cat));
        
        return Array.from(categories);
    }

    /**
     * Detect categories from content analysis
     */
    detectCategoriesFromContent(doc) {
        const categories = [];
        const content = doc.body.textContent.toLowerCase();
        
        // Football-specific categories
        const categoryKeywords = {
            'Transfer News': ['transfer', 'signing', 'rumour', 'move', 'deal'],
            'Match Analysis': ['match', 'game', 'fixture', 'vs', 'preview', 'review'],
            'Fantasy Premier League': ['fpl', 'fantasy', 'gameweek', 'captain', 'lineup'],
            'Tactical Analysis': ['tactics', 'formation', 'strategy', 'corner', 'set-piece'],
            'Player Profile': ['rise', 'domination', 'profile', 'career', 'performance'],
            'Premier League': ['premier league', 'epl', 'standings', 'table'],
            'Champions League': ['champions league', 'uefa', 'european'],
            'Injury News': ['injury', 'injured', 'out for', 'banned', 'suspended']
        };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                categories.push(category);
            }
        }
        
        return categories;
    }

    /**
     * Extract meta description
     */
    extractDescription(doc) {
        const descMeta = doc.querySelector('meta[name="description"]');
        if (descMeta) {
            return descMeta.getAttribute('content');
        }
        
        // Fallback to Open Graph description
        const ogDescMeta = doc.querySelector('meta[property="og:description"]');
        if (ogDescMeta) {
            return ogDescMeta.getAttribute('content');
        }
        
        return this.extractExcerpt(doc);
    }

    /**
     * Extract author information
     */
    extractAuthor(doc) {
        // Check article:author meta tag
        const authorMeta = doc.querySelector('meta[property="article:author"]');
        if (authorMeta) {
            return authorMeta.getAttribute('content');
        }
        
        // Check author meta tag
        const authorMetaName = doc.querySelector('meta[name="author"]');
        if (authorMetaName) {
            return authorMetaName.getAttribute('content');
        }
        
        // Check structured data
        const structuredData = doc.querySelector('script[type="application/ld+json"]');
        if (structuredData) {
            try {
                const data = JSON.parse(structuredData.textContent);
                if (data.author && data.author.name) {
                    return data.author.name;
                }
            } catch (e) {
                // Ignore JSON parsing errors
            }
        }
        
        return 'EPL News Hub';
    }

    /**
     * Generate slug from file path
     */
    generateSlug(filePath) {
        const filename = filePath.split(/[/\\]/).pop();
        return filename.replace('.html', '');
    }

    /**
     * Calculate word count
     */
    calculateWordCount(doc) {
        const mainContent = doc.querySelector('.main') || doc.querySelector('main') || doc.body;
        const text = mainContent.textContent.trim();
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Calculate estimated read time (assuming 200 words per minute)
     */
    calculateReadTime(doc) {
        const wordCount = this.calculateWordCount(doc);
        const wordsPerMinute = 200;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    }

    /**
     * Check if paragraph is likely an ad or metadata
     */
    isAdOrMetaParagraph(text) {
        const adKeywords = ['advertisement', 'sponsored', 'ad', 'google', 'adsense'];
        const lowerText = text.toLowerCase();
        return adKeywords.some(keyword => lowerText.includes(keyword));
    }

    /**
     * Process multiple articles from an array of file data
     * @param {Array} articleFiles - Array of objects with {content, filePath}
     * @returns {Array} Array of article metadata objects
     */
    processMultipleArticles(articleFiles) {
        return articleFiles.map(file => {
            try {
                return this.extractArticleMetadata(file.content, file.filePath);
            } catch (error) {
                console.error(`Error processing article ${file.filePath}:`, error);
                return null;
            }
        }).filter(article => article !== null);
    }

    /**
     * Sort articles by publication date (newest first)
     * @param {Array} articles - Array of article metadata objects
     * @returns {Array} Sorted array of articles
     */
    sortArticlesByDate(articles) {
        return articles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    }

    /**
     * Filter articles by category
     * @param {Array} articles - Array of article metadata objects
     * @param {string} category - Category to filter by
     * @returns {Array} Filtered array of articles
     */
    filterByCategory(articles, category) {
        return articles.filter(article => 
            article.categories.some(cat => 
                cat.toLowerCase().includes(category.toLowerCase())
            )
        );
    }

    /**
     * Get articles for news feed with pagination
     * @param {Array} articles - Array of article metadata objects
     * @param {number} page - Page number (1-based)
     * @param {number} limit - Number of articles per page
     * @returns {Object} Object with articles, pagination info
     */
    getArticlesForFeed(articles, page = 1, limit = 10) {
        const sortedArticles = this.sortArticlesByDate(articles);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedArticles = sortedArticles.slice(startIndex, endIndex);
        
        return {
            articles: paginatedArticles,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(sortedArticles.length / limit),
                totalArticles: sortedArticles.length,
                hasNext: endIndex < sortedArticles.length,
                hasPrev: page > 1
            }
        };
    }
}

// Usage example:
// const extractor = new ArticleMetadataExtractor();
// const metadata = extractor.extractArticleMetadata(htmlContent, filePath);
// console.log(metadata);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArticleMetadataExtractor;
} else if (typeof window !== 'undefined') {
    window.ArticleMetadataExtractor = ArticleMetadataExtractor;
}