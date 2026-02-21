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

async function publishAll() {
    for (const filename of articlesToPublish) {
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

        // Request Google indexing
        const articleUrl = `https://www.eplnewshub.com/articles/${articleFilename}`;
        await requestIndexing(articleUrl);

        // Remove the metadata file
        fs.unlinkSync(scheduledPath);
        console.log(`    ✓ Published successfully`);
    }
}

publishAll().catch(e => {
    console.error('Publish failed:', e.message);
    process.exit(1);
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

    // Cascade down and fix sidebar styling
    for (let i = 0; i < components.length - 1; i++) {
        if (currentContent[components[i]]) {
            let content = currentContent[components[i]];

            // Fix sidebar articles (main_subheadline1-3) to use proper CSS classes
            if (components[i + 1].startsWith('main_subheadline')) {
                content = convertToSidebarStyle(content);
            }

            fs.writeFileSync(`./${components[i + 1]}`, content);
        }
    }

    console.log('    ✓ Updated homepage headlines');
}

function convertToSidebarStyle(html) {
    // If it already uses the correct classes, return as-is
    if (html.includes('class="nyt-sidebar-story-image"')) {
        return html;
    }

    // Extract components using regex
    const urlMatch = html.match(/href="([^"]+)"/);
    const imgMatch = html.match(/src="([^"]+)"/);
    const altMatch = html.match(/alt="([^"]+)"/);
    const titleMatch = html.match(/<h[1-3][^>]*>(.+?)<\/h[1-3]>/);
    const summaryMatch = html.match(/<p[^>]*>(.+?)<\/p>/);
    const dateMatch = html.match(/<time[^>]*>(.+?)<\/time>/);

    if (!urlMatch || !imgMatch || !titleMatch) {
        return html; // Can't parse, return original
    }

    const url = urlMatch[1];
    const img = imgMatch[1];
    const alt = altMatch ? altMatch[1] : '';
    const title = titleMatch[1];
    const summary = summaryMatch ? summaryMatch[1] : '';
    const date = dateMatch ? dateMatch[1] : '';

    // Determine category from URL or default
    let category = 'PREMIER LEAGUE';
    if (url.includes('manchester-city')) category = 'MANCHESTER CITY';
    else if (url.includes('liverpool')) category = 'LIVERPOOL';
    else if (url.includes('arsenal')) category = 'ARSENAL';
    else if (url.includes('transfer')) category = 'TRANSFERS';
    else if (url.includes('fpl') || url.includes('fantasy')) category = 'FPL';

    // Build properly styled sidebar HTML
    return `<a href="${url}">
    <img src="${img}" alt="${alt}" class="nyt-sidebar-story-image" loading="lazy">
    <div class="nyt-sidebar-story-content">
        <span class="nyt-category">${category}</span>
        <h3 class="nyt-sidebar-story-title">${title}</h3>
        <p class="nyt-sidebar-story-summary">${summary}</p>
        <div class="nyt-sidebar-story-meta">${date}</div>
    </div>
</a>`;
}

function updateSitemap(metadata) {
    const sitemapPath = './sitemap.xml';
    if (!fs.existsSync(sitemapPath)) return;

    let sitemap = fs.readFileSync(sitemapPath, 'utf8');

    // Add new URL entry before closing </urlset>
    const newEntry = `
    <url>
        <loc>https://www.eplnewshub.com/articles/${metadata.articleFile}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;

    sitemap = sitemap.replace('</urlset>', newEntry + '\n</urlset>');
    fs.writeFileSync(sitemapPath, sitemap);

    console.log('    ✓ Updated sitemap.xml');
}

async function requestIndexing(articleUrl) {
    // 1. Google Indexing API (primary)
    const serviceAccountPath = './google-service-account.json';
    try {
        if (fs.existsSync(serviceAccountPath)) {
            const { GoogleAuth } = require('google-auth-library');
            const auth = new GoogleAuth({
                keyFile: serviceAccountPath,
                scopes: ['https://www.googleapis.com/auth/indexing']
            });
            const client = await auth.getClient();
            const res = await client.request({
                url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
                method: 'POST',
                data: { url: articleUrl, type: 'URL_UPDATED' }
            });
            console.log(`    ✓ Google Indexing API: ${articleUrl} — status ${res.status}`);
        } else {
            console.log('    ⚠ No service account key found, skipping Google Indexing API');
        }
    } catch (e) {
        console.error(`    ✗ Google Indexing API failed: ${e.message}`);
    }

    // 2. IndexNow (Bing, Yandex, etc.)
    try {
        const indexNowKey = process.env.INDEXNOW_KEY;
        if (indexNowKey) {
            const res = await fetch(`https://api.indexnow.org/indexnow?url=${encodeURIComponent(articleUrl)}&key=${indexNowKey}`);
            console.log(`    ✓ IndexNow: ${articleUrl} — status ${res.status}`);
        }
    } catch (e) {
        console.log(`    ✗ IndexNow failed: ${e.message}`);
    }

    // 3. Ping sitemap to Google and Bing
    try {
        const sitemapUrl = 'https://www.eplnewshub.com/sitemap.xml';
        const [googleRes, bingRes] = await Promise.allSettled([
            fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
            fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
        ]);
        console.log(`    ✓ Sitemap ping: Google=${googleRes.status === 'fulfilled' ? googleRes.value.status : 'failed'}, Bing=${bingRes.status === 'fulfilled' ? bingRes.value.status : 'failed'}`);
    } catch (e) {
        console.log(`    ✗ Sitemap ping failed: ${e.message}`);
    }
}
