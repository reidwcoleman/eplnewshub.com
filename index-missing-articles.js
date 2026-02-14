#!/usr/bin/env node
/**
 * One-time script: Add missing articles to sitemap.xml and request Google indexing.
 * Run: node index-missing-articles.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const ARTICLES_DIR = path.join(ROOT, 'articles');
const SERVICE_ACCOUNT_PATH = path.join(ROOT, 'google-service-account.json');
const BASE_URL = 'https://www.eplnewshub.com';

// Find articles missing from sitemap
function getMissingArticles() {
  const sitemap = fs.readFileSync(SITEMAP, 'utf-8');
  const allFiles = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html'));
  return allFiles.filter(f => !sitemap.includes(`/articles/${f}`));
}

// Add missing articles to sitemap
function addToSitemap(filenames) {
  let sitemap = fs.readFileSync(SITEMAP, 'utf-8');
  let added = 0;

  for (const filename of filenames) {
    // Try to extract date from filename (YYYY-MM-DD pattern at end)
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})\.html$/);
    // For files with non-standard date formats, try other patterns
    const altDateMatch = filename.match(/(\d{2}-\d{2}-\d{4})\.html$/) ||
                         filename.match(/(\d{2}-\d{2}-\d{2}-\d{4})$/);

    let date;
    if (dateMatch) {
      date = dateMatch[1];
    } else if (altDateMatch) {
      // Try to parse MM-DD-YYYY format
      const parts = altDateMatch[1].split('-');
      if (parts.length === 3 && parts[2].length === 4) {
        date = `${parts[2]}-${parts[0]}-${parts[1]}`;
      } else {
        date = new Date().toISOString().split('T')[0];
      }
    } else {
      // Use file modification date
      const stat = fs.statSync(path.join(ARTICLES_DIR, filename));
      date = stat.mtime.toISOString().split('T')[0];
    }

    const entry = `
    <url>
        <loc>${BASE_URL}/articles/${filename}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;

    sitemap = sitemap.replace('</urlset>', entry + '\n</urlset>');
    added++;
    console.log(`  + sitemap: ${filename} (${date})`);
  }

  fs.writeFileSync(SITEMAP, sitemap);
  console.log(`\nAdded ${added} articles to sitemap.xml`);
}

// Request Google indexing for a URL
async function requestIndexing(articleUrl) {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.log('  No service account key found, skipping indexing.');
    return false;
  }

  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/indexing']
  });

  const client = await auth.getClient();
  const res = await client.request({
    url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
    method: 'POST',
    data: { url: articleUrl, type: 'URL_UPDATED' }
  });

  return res.status === 200;
}

async function main() {
  console.log('=== Index Missing Articles ===\n');

  const missing = getMissingArticles();
  if (missing.length === 0) {
    console.log('All articles are already in the sitemap!');
    return;
  }

  console.log(`Found ${missing.length} articles missing from sitemap.\n`);

  // Step 1: Add all to sitemap
  console.log('--- Adding to sitemap.xml ---');
  addToSitemap(missing);

  // Step 2: Request indexing for each
  console.log('\n--- Requesting Google indexing ---');
  let indexed = 0;
  let failed = 0;

  for (const filename of missing) {
    const url = `${BASE_URL}/articles/${filename}`;
    try {
      const ok = await requestIndexing(url);
      if (ok) {
        console.log(`  ✓ ${filename}`);
        indexed++;
      } else {
        console.log(`  ✗ ${filename} (no service account)`);
        failed++;
      }
      // Small delay to avoid rate limiting (Google allows 200 requests/day)
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`  ✗ ${filename}: ${e.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Indexed: ${indexed}, Failed: ${failed}`);
  console.log('Remember to commit and push the updated sitemap.xml');
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
