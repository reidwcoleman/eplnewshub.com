const fs = require('fs');
const path = require('path');

const SITEMAP_URL = 'https://www.eplnewshub.com/sitemap.xml';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../google-service-account.json');

async function main() {
  console.log('[Sitemap] Daily sitemap submission starting...');

  // 1. Submit sitemap via Google Search Console API
  try {
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        keyFile: SERVICE_ACCOUNT_PATH,
        scopes: ['https://www.googleapis.com/auth/webmasters']
      });
      const client = await auth.getClient();
      const siteUrl = 'https://www.eplnewshub.com/';
      const res = await client.request({
        url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
        method: 'PUT'
      });
      console.log(`[Sitemap] Google Search Console API: submitted sitemap — status ${res.status}`);
    } else {
      console.log('[Sitemap] No service account key found, skipping Search Console API.');
    }
  } catch (e) {
    console.error(`[Sitemap] Google Search Console API failed: ${e.message}`);
  }

  // 2. Ping Google with sitemap
  try {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    console.log(`[Sitemap] Google ping: status ${res.status}`);
  } catch (e) {
    console.error(`[Sitemap] Google ping failed: ${e.message}`);
  }

  // 3. Ping Bing with sitemap
  try {
    const res = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`);
    console.log(`[Sitemap] Bing ping: status ${res.status}`);
  } catch (e) {
    console.error(`[Sitemap] Bing ping failed: ${e.message}`);
  }

  // 4. IndexNow batch submit recent URLs from sitemap
  try {
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      const sitemapPath = path.join(__dirname, '../../sitemap.xml');
      if (fs.existsSync(sitemapPath)) {
        const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
        // Extract all article URLs
        const urlMatches = [...sitemap.matchAll(/<loc>(https:\/\/www\.eplnewshub\.com\/articles\/[^<]+)<\/loc>/g)];
        // Get the last 10 URLs (most recently added)
        const recentUrls = urlMatches.slice(-10).map(m => m[1]);
        if (recentUrls.length > 0) {
          const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              host: 'www.eplnewshub.com',
              key: indexNowKey,
              urlList: recentUrls
            })
          });
          console.log(`[Sitemap] IndexNow batch: submitted ${recentUrls.length} recent URLs — status ${res.status}`);
        }
      }
    } else {
      console.log('[Sitemap] No INDEXNOW_KEY set, skipping IndexNow.');
    }
  } catch (e) {
    console.error(`[Sitemap] IndexNow batch failed: ${e.message}`);
  }

  console.log('[Sitemap] Daily submission complete.');
}

main().catch(e => {
  console.error('Sitemap submission failed:', e.message);
  process.exit(1);
});
