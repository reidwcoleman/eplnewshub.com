const fs = require('fs');
const path = require('path');

const SCHEDULED_DIR = './scheduled-articles';
const ARTICLES_DIR = './articles';

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];

console.log(`Checking for articles scheduled for: ${today}`);

// Check if scheduled directory exists
if (!fs.existsSync(SCHEDULED_DIR)) {
    console.log('No scheduled-articles directory found');
    process.exit(0);
}

// Read all files in scheduled directory
const scheduledFiles = fs.readdirSync(SCHEDULED_DIR);

// Find articles scheduled for today or earlier
const articlesToPublish = scheduledFiles.filter(filename => {
    // Expected format: YYYY-MM-DD-article-title.html
    const dateMatch = filename.match(/^(\d{4}-\d{2}-\d{2})-/);
    if (!dateMatch) return false;

    const articleDate = dateMatch[1];
    return articleDate <= today;
});

if (articlesToPublish.length === 0) {
    console.log('No articles ready to publish');
    process.exit(0);
}

console.log(`Found ${articlesToPublish.length} article(s) to publish:`);

articlesToPublish.forEach(filename => {
    console.log(`  - ${filename}`);

    // Read the scheduled article metadata file
    const scheduledPath = path.join(SCHEDULED_DIR, filename);
    const metadata = JSON.parse(fs.readFileSync(scheduledPath, 'utf8'));

    // Move article file to articles directory
    const articleFilename = metadata.articleFile;
    const scheduledArticlePath = path.join(SCHEDULED_DIR, articleFilename);
    const articlePath = path.join(ARTICLES_DIR, articleFilename);

    if (fs.existsSync(scheduledArticlePath)) {
        fs.renameSync(scheduledArticlePath, articlePath);
        console.log(`    ✓ Moved article to ${articlePath}`);
    }

    // Update homepage components (cascade articles)
    cascadeArticles(metadata);

    // Update sitemap
    updateSitemap(metadata);

    // Remove the metadata file
    fs.unlinkSync(scheduledPath);
    console.log(`    ✓ Published successfully`);
});

function cascadeArticles(metadata) {
    const components = [
        'main_headline.html',
        'main_subheadline1.html',
        'main_subheadline2.html',
        'main_subheadline3.html',
        'headline1.html',
        'headline2.html',
        'headline3.html',
        'headline4.html',
        'headline5.html',
        'headline6.html',
        'headline7.html',
        'headline8.html',
        'headline9.html',
        'headline10.html',
        'headline11.html',
        'headline12.html'
    ];

    // Save current main_headline
    const currentContent = {};
    components.forEach(comp => {
        const filepath = `./${comp}`;
        if (fs.existsSync(filepath)) {
            currentContent[comp] = fs.readFileSync(filepath, 'utf8');
        }
    });

    // Write new main_headline
    fs.writeFileSync('./main_headline.html', metadata.headlineHtml);

    // Cascade down
    for (let i = 0; i < components.length - 1; i++) {
        if (currentContent[components[i]]) {
            fs.writeFileSync(`./${components[i + 1]}`, currentContent[components[i]]);
        }
    }

    console.log('    ✓ Updated homepage headlines');
}

function updateSitemap(metadata) {
    const sitemapPath = './sitemap.xml';
    if (!fs.existsSync(sitemapPath)) return;

    let sitemap = fs.readFileSync(sitemapPath, 'utf8');

    // Add new URL entry before closing </urlset>
    const newUrl = `
  <url>
    <loc>https://www.eplnewshub.com/${metadata.articleFile}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

    sitemap = sitemap.replace('</urlset>', newUrl);
    fs.writeFileSync(sitemapPath, sitemap);

    console.log('    ✓ Updated sitemap.xml');
}
