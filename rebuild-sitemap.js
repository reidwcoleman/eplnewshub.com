const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.eplnewshub.com';
const ROOT = __dirname;
const ARTICLES_DIR = path.join(ROOT, 'articles');
const TODAY = new Date().toISOString().split('T')[0];

// User-facing pages (not includes/components/templates)
const mainPages = [
  { path: '/', changefreq: 'hourly', priority: '1.0' },
  { path: '/news.html', changefreq: 'daily', priority: '0.9' },
  { path: '/transfer-center.html', changefreq: 'daily', priority: '0.9' },
  { path: '/stats.html', changefreq: 'daily', priority: '0.9' },
  { path: '/articles.html', changefreq: 'daily', priority: '0.8' },
  { path: '/match-predictions.html', changefreq: 'daily', priority: '0.8' },
  { path: '/epl-table.html', changefreq: 'daily', priority: '0.8' },
  { path: '/epl_fixtures.html', changefreq: 'daily', priority: '0.8' },
  { path: '/polls.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/social.html', changefreq: 'daily', priority: '0.7' },
  // FPL Tools
  { path: '/fpl.html', changefreq: 'daily', priority: '0.9' },
  { path: '/fpl-premium-hub.html', changefreq: 'weekly', priority: '0.9' },
  { path: '/fpl-ai-assistant.html', changefreq: 'daily', priority: '0.9' },
  { path: '/fpl-team-builder.html', changefreq: 'daily', priority: '0.9' },
  { path: '/player-data-enhanced.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/budget-optimizer.html', changefreq: 'weekly', priority: '0.7' },
  { path: '/fantasy.html', changefreq: 'weekly', priority: '0.7' },
  // Tools & Features
  { path: '/team-analyzer.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/fixture-analyzer-pro.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/fixture-tracker.html', changefreq: 'daily', priority: '0.8' },
  { path: '/fixture-tracker-pro.html', changefreq: 'daily', priority: '0.8' },
  { path: '/epl-predictor-game.html', changefreq: 'weekly', priority: '0.8' },
  { path: '/epl-logo-quiz-game.html', changefreq: 'monthly', priority: '0.6' },
  { path: '/transfer-simulator.html', changefreq: 'weekly', priority: '0.7' },
  { path: '/club-comparison.html', changefreq: 'weekly', priority: '0.7' },
  { path: '/predict-the-score.html', changefreq: 'weekly', priority: '0.7' },
  { path: '/player-data.html', changefreq: 'weekly', priority: '0.7' },
  { path: '/top-scorers.html', changefreq: 'daily', priority: '0.7' },
  { path: '/premier_league_guide.html', changefreq: 'monthly', priority: '0.6' },
  // Account & Membership
  { path: '/membership.html', changefreq: 'monthly', priority: '0.8' },
  { path: '/premium.html', changefreq: 'monthly', priority: '0.7' },
  { path: '/account.html', changefreq: 'weekly', priority: '0.6' },
  { path: '/create-account.html', changefreq: 'monthly', priority: '0.6' },
  { path: '/signin.html', changefreq: 'monthly', priority: '0.5' },
  // Utility
  { path: '/social-media.html', changefreq: 'weekly', priority: '0.6' },
  { path: '/private_policy.html', changefreq: 'monthly', priority: '0.3' },
  { path: '/terms.html', changefreq: 'monthly', priority: '0.3' },
  { path: '/cookies.html', changefreq: 'monthly', priority: '0.3' },
  { path: '/buy-me-a-coffee.html', changefreq: 'monthly', priority: '0.4' },
];

// Filter to only pages that exist on disk
const validPages = mainPages.filter(p => {
  if (p.path === '/') return true; // homepage always exists
  return fs.existsSync(path.join(ROOT, p.path.slice(1)));
});

// Get all article files
const articleFiles = fs.readdirSync(ARTICLES_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

// Extract date from filename where possible
function extractDate(filename) {
  // Try pattern: ...-YYYY-MM-DD.html
  const match = filename.match(/(\d{4}-\d{2}-\d{2})\.html$/);
  if (match) return match[1];
  // Try pattern: ...-MM-DD-YYYY.html
  const match2 = filename.match(/(\d{2}-\d{2}-\d{4})\.html$/);
  if (match2) {
    const [mm, dd, yyyy] = match2[1].split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  return TODAY;
}

// Build sitemap XML
let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <!-- Homepage & Main Pages -->`;

for (const page of validPages) {
  const lastmod = page.path === '/' ? TODAY : '2026-02-16';
  xml += `
    <url>
        <loc>${BASE_URL}${page.path}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
}

xml += `

    <!-- Articles -->`;

for (const file of articleFiles) {
  const date = extractDate(file);
  xml += `
    <url>
        <loc>${BASE_URL}/articles/${file}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
}

xml += `
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);

// Stats
const uniqueArticleCount = articleFiles.length;
const uniquePageCount = validPages.length;
console.log(`Sitemap rebuilt successfully!`);
console.log(`  Main pages: ${uniquePageCount}`);
console.log(`  Articles: ${uniqueArticleCount}`);
console.log(`  Total URLs: ${uniquePageCount + uniqueArticleCount}`);
