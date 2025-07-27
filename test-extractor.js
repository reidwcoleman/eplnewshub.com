/**
 * Test script for Article Metadata Extractor
 * Demonstrates usage with sample articles
 */

const fs = require('fs');
const path = require('path');

// Simple HTML parser for Node.js environment (alternative to JSDOM for testing)
function parseHTML(htmlContent) {
    // This is a simplified parser for demonstration
    // In production, use JSDOM or run in browser environment
    
    const extractTag = (html, tag, attribute = null) => {
        const regex = attribute 
            ? new RegExp(`<${tag}[^>]*${attribute}=["']([^"']*)["'][^>]*>([^<]*)</${tag}>`, 'i')
            : new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i');
        const match = html.match(regex);
        return match ? (attribute ? match[1] : match[1]) : null;
    };

    const extractMeta = (html, name, property = false) => {
        const attr = property ? 'property' : 'name';
        const regex = new RegExp(`<meta[^>]*${attr}=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
        const match = html.match(regex);
        return match ? match[1] : null;
    };

    const extractFirstParagraph = (html) => {
        // Look for paragraphs after h1 and before ads
        const regex = /<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi;
        const matches = [...html.matchAll(regex)];
        
        for (let match of matches) {
            const text = match[1].replace(/<[^>]*>/g, '').trim();
            if (text.length > 50 && !text.toLowerCase().includes('advertisement')) {
                return text.length > 150 ? text.substring(0, 147) + '...' : text;
            }
        }
        return 'No excerpt available';
    };

    const extractDate = (filename) => {
        // Extract date from filename patterns
        const patterns = [
            /(\d{4})-(\d{1,2})-(\d{1,2})/,  // YYYY-MM-DD
            /(\d{1,2})-(\d{1,2})-(\d{4})/,  // MM-DD-YYYY
            /(\d{1,2})-(\d{1,2})-(\d{2})/   // MM-DD-YY
        ];

        for (let pattern of patterns) {
            const match = filename.match(pattern);
            if (match) {
                if (pattern === patterns[0]) { // YYYY-MM-DD
                    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                } else if (pattern === patterns[1]) { // MM-DD-YYYY
                    return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
                } else { // MM-DD-YY
                    const year = parseInt(match[3]) > 50 ? 1900 + parseInt(match[3]) : 2000 + parseInt(match[3]);
                    return new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
                }
            }
        }
        return new Date();
    };

    const detectCategories = (html) => {
        const categories = [];
        const content = html.toLowerCase();
        
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
    };

    return {
        extractTag,
        extractMeta,
        extractFirstParagraph,
        extractDate,
        detectCategories
    };
}

/**
 * Simple metadata extractor for testing
 */
function extractMetadata(htmlContent, filePath) {
    const parser = parseHTML(htmlContent);
    
    // Extract title
    const title = parser.extractTag(htmlContent, 'h1') || 
                 parser.extractTag(htmlContent, 'title') || 
                 'Untitled Article';
    
    // Extract excerpt
    const excerpt = parser.extractFirstParagraph(htmlContent);
    
    // Extract date
    const publishDate = parser.extractDate(filePath);
    
    // Extract description
    const description = parser.extractMeta(htmlContent, 'description') || excerpt;
    
    // Extract author
    const author = parser.extractMeta(htmlContent, 'author') || 
                  parser.extractMeta(htmlContent, 'article:author', true) || 
                  'EPL News Hub';
    
    // Detect categories
    const categories = parser.detectCategories(htmlContent);
    
    // Generate slug
    const slug = path.basename(filePath, '.html');
    
    // Calculate word count (simplified)
    const wordCount = htmlContent.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    
    return {
        title: title.trim(),
        excerpt,
        description,
        publishDate: publishDate.toISOString(),
        categories,
        author,
        slug,
        filePath,
        url: `/articles/${slug}.html`,
        wordCount,
        readTime: `${readTime} min read`
    };
}

/**
 * Test the extractor with sample articles
 */
function testExtractor() {
    console.log('Testing Article Metadata Extractor...\n');
    
    // Test with a few sample articles
    const testFiles = [
        'Manchester-Uniteds-worst-team-in-years-20-01-2025.html',
        'cole-palmers-rise-and-domination-of-the-premier-league-09-30-2024.html',
        'arsenals-corner-kick-mastery-10-06-2024.html'
    ];
    
    const results = [];
    
    for (const filename of testFiles) {
        const filePath = path.join('./articles', filename);
        
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const metadata = extractMetadata(content, filename);
                results.push(metadata);
                
                console.log(`✓ Processed: ${filename}`);
                console.log(`  Title: ${metadata.title}`);
                console.log(`  Date: ${new Date(metadata.publishDate).toLocaleDateString()}`);
                console.log(`  Categories: ${metadata.categories.join(', ')}`);
                console.log(`  Word Count: ${metadata.wordCount}`);
                console.log(`  Excerpt: ${metadata.excerpt.substring(0, 80)}...`);
                console.log('');
            } else {
                console.log(`✗ File not found: ${filename}`);
            }
        } catch (error) {
            console.error(`✗ Error processing ${filename}:`, error.message);
        }
    }
    
    // Save results to JSON file
    if (results.length > 0) {
        const outputPath = './test-metadata.json';
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\n📄 Metadata saved to ${outputPath}`);
        console.log(`📊 Processed ${results.length} articles successfully`);
        
        // Show sample data structure
        console.log('\n📋 Sample metadata structure:');
        console.log(JSON.stringify(results[0], null, 2));
    }
}

// Run test if script is executed directly
if (require.main === module) {
    testExtractor();
}

module.exports = { extractMetadata, testExtractor };