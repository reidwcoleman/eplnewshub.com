const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
    GROK_API_KEY: process.env.GROK_API_KEY || '', // Set this in your environment
    GROK_API_URL: 'https://api.x.ai/v1/chat/completions', // X.AI's Grok API endpoint
    ARTICLES_DIR: './articles',
    IMAGES_DIR: './',
    MAIN_HEADLINE: './main_headline.html',
    SUBHEADLINES: [
        './main_subheadline1.html',
        './main_subheadline2.html',
        './main_subheadline3.html',
        './main_subheadline4.html',
        './main_subheadline5.html',
        './main_subheadline6.html'
    ]
};

// Readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to prompt user
function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Function to call Grok API
async function callGrok(prompt, systemPrompt = "You are a professional sports journalist specializing in Premier League football.") {
    if (!CONFIG.GROK_API_KEY) {
        throw new Error('GROK_API_KEY not set. Please set it in your environment variables.');
    }

    try {
        const response = await fetch(CONFIG.GROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.GROK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'grok-beta',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling Grok API:', error);
        throw error;
    }
}

// Function to generate article with Grok
async function generateArticleWithGrok(topic) {
    console.log('\n📝 Step 1: Generating initial article...');
    
    // Initial article generation
    const initialPrompt = `Write a comprehensive news article about: ${topic}

    The article should include:
    - A compelling headline
    - An engaging opening paragraph
    - Multiple sections with subheadings
    - Relevant statistics and data
    - Quotes (you can create realistic quotes from relevant figures)
    - A conclusion with future outlook
    
    Format the response as JSON with the following structure:
    {
        "headline": "Article headline",
        "category": "NEWS/TRANSFER/MATCH/ANALYSIS",
        "excerpt": "Brief 50-160 character description",
        "content": {
            "opening": "Opening paragraph",
            "sections": [
                {
                    "heading": "Section heading",
                    "content": "Section content"
                }
            ],
            "quotes": [
                {
                    "text": "Quote text",
                    "source": "Person name and title"
                }
            ],
            "stats": [
                {
                    "value": "Stat value",
                    "label": "Stat label"
                }
            ],
            "keyPoints": ["Point 1", "Point 2", ...],
            "conclusion": "Concluding paragraph",
            "futureOutlook": "What to watch for next"
        },
        "tags": ["tag1", "tag2", ...],
        "readTime": 5
    }`;

    let article = JSON.parse(await callGrok(initialPrompt));
    
    console.log('✅ Initial article generated');
    console.log('\n🔍 Step 2: Improving accuracy...');
    
    // Improve accuracy
    const accuracyPrompt = `Review and improve the accuracy of this article about "${topic}":

    ${JSON.stringify(article)}
    
    Please:
    1. Verify all facts and statistics are realistic and plausible
    2. Ensure dates and timelines make sense
    3. Make sure quotes sound authentic
    4. Check that all Premier League team names, player names, and competition details are correct
    5. Ensure transfer fees and financial figures are realistic for 2025
    
    Return the improved article in the same JSON format.`;

    article = JSON.parse(await callGrok(accuracyPrompt));
    
    console.log('✅ Accuracy improved');
    console.log('\n🎯 Step 3: Optimizing for SEO...');
    
    // SEO optimization
    const seoPrompt = `Optimize this article for SEO:

    ${JSON.stringify(article)}
    
    Please improve:
    1. Add relevant keywords naturally throughout the content
    2. Optimize the headline for search engines (include primary keywords)
    3. Ensure the excerpt is compelling and includes keywords
    4. Add more relevant tags for better discoverability
    5. Structure content with proper headings for better readability
    6. Include relevant internal linking opportunities (mention other EPL teams, competitions, etc.)
    
    Return the SEO-optimized article in the same JSON format.`;

    article = JSON.parse(await callGrok(seoPrompt));
    
    console.log('✅ SEO optimization complete');
    
    return article;
}

// Function to format article using template
async function formatArticle(articleData) {
    console.log('\n📄 Formatting article with template...');
    
    // Read the template
    const template = await fs.readFile('article-template.html', 'utf-8');
    
    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const filename = articleData.headline
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 60) + '-' + date;
    
    // Format the content sections
    let sectionsHtml = '';
    articleData.content.sections.forEach((section, index) => {
        // Add quote if available
        let quoteHtml = '';
        if (articleData.content.quotes[index]) {
            quoteHtml = `
                    <div class="quote-section">
                        <div class="quote-text">${articleData.content.quotes[index].text}</div>
                        <div class="quote-author">${articleData.content.quotes[index].source}</div>
                    </div>`;
        }
        
        sectionsHtml += `
                <div class="content-section">
                    <h2>${section.heading}</h2>
                    <p>${section.content}</p>
                    ${quoteHtml}
                </div>`;
    });
    
    // Format stats grid
    let statsHtml = '';
    if (articleData.content.stats && articleData.content.stats.length > 0) {
        statsHtml = `
                    <div class="stat-grid">
                        ${articleData.content.stats.map(stat => `
                        <div class="stat-card">
                            <div class="stat-number">${stat.value}</div>
                            <div class="stat-label">${stat.label}</div>
                        </div>`).join('')}
                    </div>`;
    }
    
    // Format key points
    const keyPointsHtml = articleData.content.keyPoints.map(point => `<li>${point}</li>`).join('\n                            ');
    
    // Format tags
    const tagsHtml = articleData.tags.map(tag => `<a href="#" class="tag">#${tag}</a>`).join('\n                    ');
    
    // Replace placeholders
    let formattedArticle = template
        .replace(/\[ARTICLE_TITLE\]/g, articleData.headline)
        .replace(/\[ARTICLE_FILENAME\]/g, filename)
        .replace(/\[BRIEF_DESCRIPTION_OF_ARTICLE_50-160_CHARS\]/g, articleData.excerpt)
        .replace(/\[RELEVANT_KEYWORDS_SEPARATED_BY_COMMAS\]/g, articleData.tags.join(', '))
        .replace(/\[YYYY-MM-DD\]/g, date)
        .replace(/\[MONTH DAY, YEAR\]/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
        .replace(/\[READ_TIME\]/g, articleData.readTime)
        .replace(/\[BREAKING_CATEGORY\]/g, articleData.category)
        .replace(/\[ARTICLE_IMAGE\]/g, 'premier-league-default.jpg') // You can enhance this
        .replace(/\[HERO_CAPTION\]/g, articleData.headline)
        .replace(/\[HERO_SUBCAPTION\]/g, 'EPL News Hub Exclusive')
        .replace(/\[COMPELLING_OPENING_PARAGRAPH_THAT_HOOKS_THE_READER\]/g, articleData.content.opening)
        .replace(/\[SECTION_1_HEADING\]/g, articleData.content.sections[0]?.heading || 'Breaking Development')
        .replace(/\[SECTION_1_CONTENT_WITH_DETAILS_AND_ANALYSIS\]/g, articleData.content.sections[0]?.content || '')
        .replace(/\[ADDITIONAL_SECTION_1_CONTENT\]/g, '')
        .replace(/\[SECTION_2_HEADING\]/g, articleData.content.sections[1]?.heading || 'Key Details')
        .replace(/\[SECTION_2_CONTENT_WITH_CONTEXT\]/g, articleData.content.sections[1]?.content || '')
        .replace(/\[SECTION_3_HEADING\]/g, articleData.content.sections[2]?.heading || 'Analysis')
        .replace(/\[SECTION_3_CONTENT\]/g, articleData.content.sections[2]?.content || '')
        .replace(/\[ADDITIONAL_SECTION_3_CONTENT\]/g, '')
        .replace(/\[SECTION_4_HEADING\]/g, articleData.content.sections[3]?.heading || 'Impact')
        .replace(/\[SECTION_4_CONTENT\]/g, articleData.content.sections[3]?.content || '')
        .replace(/\[CONCLUDING_PARAGRAPH_WITH_FUTURE_OUTLOOK\]/g, articleData.content.conclusion)
        .replace(/\[FINAL_THOUGHTS_AND_WHAT_TO_WATCH\]/g, articleData.content.futureOutlook)
        .replace(/\[IMPACT_ANALYSIS_AND_FUTURE_IMPLICATIONS\]/g, articleData.content.futureOutlook);
    
    // Replace stat placeholders
    for (let i = 0; i < 4; i++) {
        if (articleData.content.stats[i]) {
            formattedArticle = formattedArticle
                .replace(`[STAT_${i+1}]`, articleData.content.stats[i].value)
                .replace(`[STAT_${i+1}_LABEL]`, articleData.content.stats[i].label);
        } else {
            formattedArticle = formattedArticle
                .replace(`[STAT_${i+1}]`, '—')
                .replace(`[STAT_${i+1}_LABEL]`, 'N/A');
        }
    }
    
    // Replace key points
    for (let i = 0; i < 5; i++) {
        if (articleData.content.keyPoints[i]) {
            formattedArticle = formattedArticle
                .replace(`[KEY_POINT_${i+1}]`, articleData.content.keyPoints[i]);
        } else {
            formattedArticle = formattedArticle
                .replace(`[KEY_POINT_${i+1}]`, '');
        }
    }
    
    // Replace tags
    for (let i = 0; i < 5; i++) {
        if (articleData.tags[i]) {
            formattedArticle = formattedArticle
                .replace(`[TAG_${i+1}]`, articleData.tags[i])
                .replace(`[RELEVANT_TAG_${i+1}]`, articleData.tags[i]);
        } else {
            formattedArticle = formattedArticle
                .replace(`[TAG_${i+1}]`, 'EPL')
                .replace(`[RELEVANT_TAG_${i+1}]`, 'Football');
        }
    }
    
    // Replace quotes
    if (articleData.content.quotes[0]) {
        formattedArticle = formattedArticle
            .replace('[RELEVANT_QUOTE_FROM_PLAYER_MANAGER_OR_ANALYST]', articleData.content.quotes[0].text)
            .replace('[QUOTE_SOURCE]', articleData.content.quotes[0].source);
    }
    
    // Replace timeline placeholders with empty strings for now
    formattedArticle = formattedArticle
        .replace(/\[TIME\/DATE_\d\]/g, '')
        .replace(/\[EVENT_\d_TITLE\]/g, '')
        .replace(/\[EVENT_\d_DESCRIPTION\]/g, '')
        .replace(/\[TRANSFER_AMOUNT\/STATUS\]/g, '')
        .replace(/\[STATUS_TEXT\]/g, '')
        .replace(/\[IMPORTANT_INFORMATION_OR_STATISTIC\]/g, '');
    
    return {
        filename: filename,
        content: formattedArticle,
        headline: articleData.headline,
        excerpt: articleData.excerpt,
        category: articleData.category,
        date: date
    };
}

// Function to update read-next.js with new article
async function updateReadNextDatabase(newArticle) {
    console.log('\n📚 Updating article database...');
    
    try {
        // Read the current read-next.js file
        const readNextPath = './read-next.js';
        let readNextContent = await fs.readFile(readNextPath, 'utf-8');
        
        // Create new article entry
        const newEntry = `        {
            url: '/articles/${newArticle.filename}.html',
            title: '${newArticle.headline.replace(/'/g, "\\'")}',
            excerpt: '${newArticle.excerpt.replace(/'/g, "\\'")}',
            image: '/premier-league-default.jpg',
            category: '${newArticle.category}',
            date: '${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}',
            tags: [${newArticle.tags ? newArticle.tags.map(tag => `'${tag.toLowerCase()}'`).join(', ') : ''}],
            teams: []
        },`;
        
        // Find the articleDatabase array and add the new entry at the beginning
        const databaseStart = readNextContent.indexOf('const articleDatabase = [');
        if (databaseStart !== -1) {
            const insertPosition = readNextContent.indexOf('[', databaseStart) + 1;
            readNextContent = readNextContent.slice(0, insertPosition) + '\n' + newEntry + readNextContent.slice(insertPosition);
            
            await fs.writeFile(readNextPath, readNextContent);
            console.log('✅ Updated read-next.js with new article');
        }
    } catch (error) {
        console.log('⚠️  Could not update read-next.js:', error.message);
    }
}

// Function to rotate articles
async function rotateArticles(newArticle) {
    console.log('\n🔄 Rotating articles...');
    
    // Read current main headline
    const currentMainHeadline = await fs.readFile(CONFIG.MAIN_HEADLINE, 'utf-8');
    
    // Create new main headline HTML
    const newMainHeadline = `<div class="featured-article-card">
    <a href="articles/${newArticle.filename}.html" class="featured-link">
        <div class="featured-image-container">
            <img src="premier-league-default.jpg" alt="${newArticle.headline}" class="featured-image">
            <div class="featured-overlay">
                <span class="featured-category">${newArticle.category}</span>
            </div>
        </div>
        <div class="featured-content">
            <h1 class="featured-title">${newArticle.headline}</h1>
            <p class="featured-excerpt">${newArticle.excerpt}</p>
            <div class="featured-meta">
                <span class="featured-author">EPL News Hub</span>
                <span class="featured-separator">•</span>
                <span class="featured-date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span class="featured-separator">•</span>
                <span class="featured-badge">🔥 Latest</span>
            </div>
        </div>
    </a>
</div>
`;
    
    // Write new main headline
    await fs.writeFile(CONFIG.MAIN_HEADLINE, newMainHeadline);
    console.log('✅ Updated main headline');
    
    // Rotate subheadlines
    let previousContent = currentMainHeadline;
    
    for (let i = 0; i < CONFIG.SUBHEADLINES.length; i++) {
        try {
            const currentContent = await fs.readFile(CONFIG.SUBHEADLINES[i], 'utf-8');
            await fs.writeFile(CONFIG.SUBHEADLINES[i], previousContent);
            previousContent = currentContent;
            console.log(`✅ Rotated subheadline ${i + 1}`);
        } catch (error) {
            // If subheadline doesn't exist, create it
            await fs.writeFile(CONFIG.SUBHEADLINES[i], previousContent);
            console.log(`✅ Created subheadline ${i + 1}`);
            break;
        }
    }
    
    // Update read-next.js database
    await updateReadNextDatabase(newArticle);
}

// Main function
async function main() {
    console.log('🚀 EPL News Hub - Grok Article Generator');
    console.log('=========================================\n');
    
    try {
        // Check for API key
        if (!CONFIG.GROK_API_KEY) {
            console.log('⚠️  Warning: GROK_API_KEY not set in environment variables.');
            console.log('Please set it using: export GROK_API_KEY="your-api-key"\n');
            
            const apiKey = await prompt('Enter your Grok API key (or press Enter to use mock mode): ');
            if (apiKey) {
                CONFIG.GROK_API_KEY = apiKey;
            } else {
                console.log('\n📌 Running in mock mode (no actual API calls will be made)\n');
            }
        }
        
        // Get article topic from user
        const topic = await prompt('What should the article be about? ');
        
        if (!topic) {
            console.log('❌ No topic provided. Exiting...');
            rl.close();
            return;
        }
        
        console.log(`\n🎯 Generating article about: "${topic}"`);
        
        let articleData;
        
        if (CONFIG.GROK_API_KEY) {
            // Generate article with Grok
            articleData = await generateArticleWithGrok(topic);
        } else {
            // Mock data for testing
            console.log('\n📝 Using mock data for testing...');
            articleData = {
                headline: `Breaking: ${topic}`,
                category: "NEWS",
                excerpt: `Latest developments in ${topic} as the Premier League continues to deliver drama.`,
                content: {
                    opening: `In a stunning development that has sent shockwaves through the Premier League, ${topic} has become the center of attention.`,
                    sections: [
                        {
                            heading: "The Breaking Story",
                            content: `The situation regarding ${topic} has developed rapidly over the past 24 hours, with multiple sources confirming the significance of these events.`
                        },
                        {
                            heading: "Key Details",
                            content: "Sources close to the situation have revealed important details that shed light on the full scope of this development."
                        },
                        {
                            heading: "Analysis",
                            content: "Football analysts are already debating the long-term implications of this development for the Premier League."
                        },
                        {
                            heading: "What This Means",
                            content: "The ripple effects of this news will be felt throughout the league for weeks to come."
                        }
                    ],
                    quotes: [
                        {
                            text: "This is a game-changing moment for the Premier League.",
                            source: "Sky Sports Analyst"
                        }
                    ],
                    stats: [
                        { value: "£100M", label: "Estimated Value" },
                        { value: "3rd", label: "League Position" },
                        { value: "15", label: "Goals Scored" },
                        { value: "89%", label: "Pass Accuracy" }
                    ],
                    keyPoints: [
                        "Major development in the Premier League",
                        "Significant financial implications",
                        "Impact on league standings",
                        "Future outlook remains uncertain",
                        "Fans eagerly awaiting official confirmation"
                    ],
                    conclusion: "As the dust settles on this breaking news, the Premier League landscape has been fundamentally altered.",
                    futureOutlook: "All eyes will be on the coming weeks as teams and players adjust to this new reality."
                },
                tags: ["PremierLeague", "Breaking", "Transfer", "News", "Football"],
                readTime: 5
            };
        }
        
        // Format the article
        const formattedArticle = await formatArticle(articleData);
        
        // Save the article
        const articlePath = path.join(CONFIG.ARTICLES_DIR, `${formattedArticle.filename}.html`);
        await fs.writeFile(articlePath, formattedArticle.content);
        console.log(`\n✅ Article saved to: ${articlePath}`);
        
        // Rotate articles
        await rotateArticles(formattedArticle);
        
        console.log('\n🎉 Success! Article has been generated and published.');
        console.log(`📄 Article: ${formattedArticle.headline}`);
        console.log(`📁 Location: ${articlePath}`);
        console.log('🔄 Homepage has been updated with the new article.\n');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { generateArticleWithGrok, formatArticle, rotateArticles };