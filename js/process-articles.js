/**
 * Article Processing Script for EPL News Hub
 * Node.js script to read article files and extract metadata
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

class ArticleProcessor {
    constructor() {
        // Create a JSDOM instance for parsing HTML
        this.dom = new JSDOM();
        this.parser = this.dom.window.DOMParser;
    }

    /**
     * Read all article files from the articles directory
     * @param {string} articlesDir - Path to articles directory
     * @returns {Array} Array of file objects with content and filePath
     */
    readArticleFiles(articlesDir = './articles') {
        try {
            const files = fs.readdirSync(articlesDir);
            const htmlFiles = files.filter(file => file.endsWith('.html'));
            
            return htmlFiles.map(filename => {
                const filePath = path.join(articlesDir, filename);
                const content = fs.readFileSync(filePath, 'utf8');
                return {
                    content,
                    filePath: filename, // Use just filename for consistency
                    fullPath: filePath
                };
            });
        } catch (error) {
            console.error('Error reading article files:', error);
            return [];
        }
    }

    /**
     * Extract metadata from a single HTML article
     * @param {string} htmlContent - The HTML content
     * @param {string} filePath - The file path
     * @returns {Object} Article metadata
     */
    extractArticleMetadata(htmlContent, filePath) {
        const dom = new JSDOM(htmlContent);
        const doc = dom.window.document;
        
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
            publishDate: publishDate.toISOString(),
            categories,
            tags: categories,
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
        const h1 = doc.querySelector('h1');
        if (h1 && h1.textContent.trim()) {
            return h1.textContent.trim();
        }
        
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
        const mainContent = doc.querySelector('.main') || doc.querySelector('main') || doc.body;
        const paragraphs = mainContent.querySelectorAll('p');
        
        for (let p of paragraphs) {
            const text = p.textContent.trim();
            if (text.length > 50 && !this.isAdOrMetaParagraph(text)) {
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
        
        // Try to extract date from filename
        const filename = filePath.split(/[/\\]/).pop();
        
        // Pattern 1: YYYY-MM-DD
        const datePattern1 = filename.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (datePattern1) {
            const [, year, month, day] = datePattern1;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        // Pattern 2: MM-DD-YYYY
        const datePattern2 = filename.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
        if (datePattern2) {
            const [, month, day, year] = datePattern2;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        
        // Pattern 3: MM-DD-YY
        const datePattern3 = filename.match(/(\d{1,2})-(\d{1,2})-(\d{2})/);
        if (datePattern3) {
            const [, month, day, shortYear] = datePattern3;
            const year = parseInt(shortYear) > 50 ? 1900 + parseInt(shortYear) : 2000 + parseInt(shortYear);
            return new Date(year, parseInt(month) - 1, parseInt(day));
        }
        
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
        const authorMeta = doc.querySelector('meta[property="article:author"]');
        if (authorMeta) {
            return authorMeta.getAttribute('content');
        }
        
        const authorMetaName = doc.querySelector('meta[name="author"]');
        if (authorMetaName) {
            return authorMetaName.getAttribute('content');
        }
        
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
     * Calculate estimated read time
     */
    calculateReadTime(doc) {
        const wordCount = this.calculateWordCount(doc);
        const minutes = Math.ceil(wordCount / 200);
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
     * Process all articles and return metadata
     * @param {string} articlesDir - Path to articles directory
     * @returns {Array} Array of article metadata objects
     */
    processAllArticles(articlesDir = './articles') {
        const articleFiles = this.readArticleFiles(articlesDir);
        
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
     * Save metadata to JSON file
     * @param {Array} articles - Array of article metadata
     * @param {string} outputPath - Output file path
     */
    saveMetadataToFile(articles, outputPath = './articles-metadata.json') {
        try {
            const sortedArticles = articles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
            fs.writeFileSync(outputPath, JSON.stringify(sortedArticles, null, 2), 'utf8');
            console.log(`Metadata saved to ${outputPath}`);
            console.log(`Processed ${articles.length} articles`);
        } catch (error) {
            console.error('Error saving metadata:', error);
        }
    }
}

// CLI usage
if (require.main === module) {
    const processor = new ArticleProcessor();
    
    // Check if JSDOM is available
    try {
        require('jsdom');
    } catch (error) {
        console.error('JSDOM not found. Please install it with: npm install jsdom');
        process.exit(1);
    }
    
    console.log('Processing articles...');
    const articles = processor.processAllArticles('./articles');
    processor.saveMetadataToFile(articles);
    
    // Display sample results
    if (articles.length > 0) {
        console.log('\nSample article metadata:');
        console.log(JSON.stringify(articles[0], null, 2));
    }
}

module.exports = ArticleProcessor;