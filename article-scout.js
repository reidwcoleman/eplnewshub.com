#!/usr/bin/env node
/**
 * EPL News Hub - Automated Article Scout
 *
 * Fetches latest EPL and gaming news, generates full articles via AI,
 * creates HTML files, cascades homepage headlines, updates articles.json
 * and sitemap.xml. Designed to run 2-5 articles per day on a cron schedule.
 *
 * Usage:
 *   node article-scout.js              # Run once (generates 1 article)
 *   node article-scout.js --batch      # Run batch (2-5 articles)
 *   node article-scout.js --daemon     # Run as daemon on cron schedule
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT = __dirname;
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'scout-config.json'), 'utf-8'));
const ARTICLES_DIR = path.join(ROOT, 'articles');
const ARTICLES_JSON = path.join(ROOT, 'articles.json');
const DATA_ARTICLES_JS = path.join(ROOT, 'data', 'articles.js');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const SCOUT_LOG = path.join(ROOT, 'scout-log.json');

// Load .env manually
function loadEnv() {
  try {
    const envPath = path.join(ROOT, '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) process.env[key] = val;
          }
        }
      }
    }
  } catch (e) { /* ignore */ }
}

loadEnv();

// ─── HTTP Fetch Helper ───────────────────────────────────────────────────────

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const req = mod.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetch(redirectUrl, options).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, json: () => JSON.parse(data), text: () => data, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

function fetchBinary(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const req = mod.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) EPLNewsHub/1.0' },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetchBinary(redirectUrl).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || '' }));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Download timeout')); });
    req.end();
  });
}

// ─── Image Fetching ──────────────────────────────────────────────────────────

async function findAndDownloadImage(searchQuery, slug) {
  console.log(`[Scout] Searching for image: "${searchQuery}"...`);

  // Try Brave Search API first
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey) {
    try {
      const res = await fetch(`https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(searchQuery + ' football')}&count=5&safesearch=strict`, {
        headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip', 'X-Subscription-Token': braveKey }
      });
      const data = res.json();
      if (data.results && data.results.length > 0) {
        for (const result of data.results) {
          const imgUrl = result.properties?.url || result.thumbnail?.src;
          if (imgUrl) {
            const downloaded = await downloadImage(imgUrl, slug);
            if (downloaded) return downloaded;
          }
        }
      }
    } catch (e) {
      console.log(`[Scout] Brave image search failed: ${e.message}`);
    }
  }

  // Fallback: Use Wikimedia Commons search for free-to-use images
  try {
    const wikiQuery = searchQuery.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 3).join(' ');
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(wikiQuery + ' football')}&srnamespace=6&srlimit=5&format=json`;
    const res = await fetch(wikiUrl, { headers: { 'User-Agent': 'EPLNewsHub/1.0' } });
    const data = res.json();
    if (data.query && data.query.search) {
      for (const item of data.query.search) {
        const title = item.title;
        // Get actual image URL
        const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
        const infoRes = await fetch(infoUrl, { headers: { 'User-Agent': 'EPLNewsHub/1.0' } });
        const infoData = infoRes.json();
        const pages = infoData.query?.pages;
        if (pages) {
          const page = Object.values(pages)[0];
          const imgUrl = page?.imageinfo?.[0]?.url;
          if (imgUrl && (imgUrl.endsWith('.jpg') || imgUrl.endsWith('.jpeg') || imgUrl.endsWith('.png') || imgUrl.endsWith('.webp'))) {
            const downloaded = await downloadImage(imgUrl, slug);
            if (downloaded) return downloaded;
          }
        }
      }
    }
  } catch (e) {
    console.log(`[Scout] Wikimedia search failed: ${e.message}`);
  }

  // Final fallback: Use Unsplash Source (free, no API key needed)
  try {
    const unsplashUrl = `https://source.unsplash.com/1200x675/?${encodeURIComponent('football,soccer,premier-league')}`;
    const downloaded = await downloadImage(unsplashUrl, slug);
    if (downloaded) return downloaded;
  } catch (e) {
    console.log(`[Scout] Unsplash fallback failed: ${e.message}`);
  }

  console.log('[Scout] No image found, using default logo');
  return null;
}

async function downloadImage(imageUrl, slug) {
  try {
    const res = await fetchBinary(imageUrl);
    if (res.status !== 200 || res.buffer.length < 5000) return null; // Skip tiny/broken images

    // Determine extension
    let ext = '.jpg';
    if (res.contentType.includes('png')) ext = '.png';
    else if (res.contentType.includes('webp')) ext = '.webp';
    else if (res.contentType.includes('avif')) ext = '.avif';

    const filename = `scout-${slug}${ext}`;
    const filepath = path.join(ROOT, filename);
    fs.writeFileSync(filepath, res.buffer);
    console.log(`[Scout] Downloaded image: ${filename} (${Math.round(res.buffer.length / 1024)}KB)`);
    return { filename: `/${filename}`, localPath: filepath };
  } catch (e) {
    console.log(`[Scout] Image download failed: ${e.message}`);
    return null;
  }
}

// ─── News Fetching ───────────────────────────────────────────────────────────

async function fetchNewsFromGoogleRSS(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
  try {
    const res = await fetch(url);
    const xml = res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = (itemXml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const link = (itemXml.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      const pubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const description = (itemXml.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
      if (title) {
        items.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim(),
          link: link.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          pubDate,
          description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim()
        });
      }
    }
    return items;
  } catch (e) {
    console.error(`[Scout] RSS fetch error for "${query}":`, e.message);
    return [];
  }
}

async function gatherNews() {
  console.log('[Scout] Gathering news from sources...');
  const queries = [
    'Premier League latest news today',
    'EPL transfer news',
    'Premier League match results',
    'EA FC football gaming news',
    'Premier League injury updates',
    'Fantasy Premier League tips'
  ];

  const allItems = [];
  for (const q of queries) {
    const items = await fetchNewsFromGoogleRSS(q);
    allItems.push(...items);
  }

  const seen = new Set();
  const unique = allItems.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Scout] Found ${unique.length} unique news items`);
  return unique.slice(0, 20);
}

// ─── AI Article Generation ───────────────────────────────────────────────────

async function callGroq(prompt, systemPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4096,
    })
  });

  const data = res.json();
  if (data.error) throw new Error(`Groq error: ${JSON.stringify(data.error)}`);
  return data.choices[0].message.content;
}

async function pickTopics(newsItems, count) {
  const headlines = newsItems.map((n, i) => `${i + 1}. ${n.title}`).join('\n');
  const systemPrompt = `You are an editorial assistant for EPL News Hub. Pick the ${count} most interesting stories. Return ONLY a JSON array of objects with "index" (1-based), "category" (News, Transfers, Analysis, Match Reports, or Player Focus), "angle" (unique hook), and "title" (compelling article title). No other text.`;
  const result = await callGroq(`Today's top football headlines:\n\n${headlines}\n\nPick the best ${count}.`, systemPrompt);
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse topic selection: ' + result);
  return JSON.parse(jsonMatch[0]);
}

async function generateArticle(topic, newsItem) {
  const systemPrompt = `You are a professional sports journalist writing for EPL News Hub in the style of The Athletic. Write long-form, engaging articles.

Your writing style:
- Professional, authoritative prose like The Athletic or BBC Sport
- Use real data, stats, and realistic quotes from managers/players
- Include tactical analysis when relevant
- Write in flowing paragraphs with clear section headings (use h2 for main sections, h3 for subsections)
- 1000-1500 words per article
- Include at least one blockquote from a manager or player
- Include at least one "pull quote" — a standout sentence from the article
- First paragraph should NOT start with the article title or a generic opener

Return your article in this exact JSON format (no other text):
{
  "title": "Article title",
  "metaDescription": "150 char SEO meta description",
  "keywords": "comma, separated, keywords",
  "category": "News|Transfers|Analysis|Match Reports|Player Focus",
  "categoryLabel": "Premier League Analysis",
  "dek": "A compelling 1-2 sentence subheadline/dek that expands on the title",
  "authorName": "A realistic journalist name",
  "readTime": "X min read",
  "imageSearchQuery": "specific search terms to find a relevant football image for this article",
  "imageCaption": "Descriptive caption for the hero image",
  "bodyHTML": "The full article body as HTML using <p>, <h2>, <h3>, <blockquote>, <strong>, <em>, <ul>, <li> tags. Do NOT use <div> wrappers. Write flowing prose. Include a pull-quote div like: <div class=\\"pull-quote\\">A standout quote from the article</div>",
  "relatedArticles": [
    {"title": "Related Article Title 1", "date": "January 28, 2026", "readTime": "6 min read"},
    {"title": "Related Article Title 2", "date": "January 25, 2026", "readTime": "5 min read"},
    {"title": "Related Article Title 3", "date": "January 22, 2026", "readTime": "7 min read"}
  ],
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const prompt = `Write a full article about this topic:
Title: ${topic.title}
Angle: ${topic.angle}
Category: ${topic.category}
Source headline: ${newsItem.title}
Source description: ${newsItem.description}

Write a comprehensive, engaging, long-form article.`;

  const result = await callGroq(prompt, systemPrompt);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article JSON: ' + result.slice(0, 200));
  // Clean control characters that break JSON parsing
  const cleaned = jsonMatch[0].replace(/[\x00-\x1F\x7F]/g, (ch) => {
    if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
    return '';
  });
  return JSON.parse(cleaned);
}

// ─── HTML Article Template (matches Aston Villa article format exactly) ──────

function buildArticleHTML(article, filename, date, imageFile) {
  const dateObj = new Date(date);
  const dateFormatted = dateObj.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const isoDate = date + 'T00:00:00Z';
  const articleUrl = `https://eplnewshub.com/articles/${filename}`;
  const encodedTitle = article.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedTitle = article.title.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  const heroImage = imageFile || '/eplnewshubnewlogo.png';

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    <!-- SEO Meta Tags -->
    <meta name="description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta name="author" content="EPL News Hub">
    <meta name="keywords" content="${article.keywords}">
    <meta name="robots" content="index, follow">

    <title>${encodedTitle} | EPL News Hub</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/eplnewshubnewlogo.png">

    <!-- Open Graph -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${encodedTitle} | EPL News Hub">
    <meta property="og:description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:image" content="https://eplnewshub.com${heroImage}">
    <meta property="og:site_name" content="EPL News Hub">
    <meta property="article:published_time" content="${isoDate}">
    <meta property="article:author" content="EPL News Hub">
    <meta property="article:section" content="${article.category}">
    ${article.tags.map(t => `<meta property="article:tag" content="${t}">`).join('\n    ')}

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@coleman_re19092">
    <meta name="twitter:creator" content="@coleman_re19092">
    <meta name="twitter:title" content="${encodedTitle} | EPL News Hub">
    <meta name="twitter:description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="https://eplnewshub.com${heroImage}">

    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TVPLGM5QY9"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-TVPLGM5QY9');
    </script>

    <!-- Google AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6480210605786899" crossorigin="anonymous"></script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="/styles.css">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            font-size: 18px;
        }

        body {
            background: #1a1a1a;
            color: #f5f5f5;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.65;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            font-feature-settings: "kern" 1;
            font-kerning: normal;
        }

        /* Reading Progress Bar */
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: linear-gradient(90deg, #121212 0%, #333 100%);
            z-index: 9999;
            transition: width 0.1s ease-out;
        }

        /* Article Container */
        .article-container {
            max-width: 680px;
            margin: 0 auto;
            padding: 80px 32px 100px;
        }

        /* Article Header */
        .article-category {
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #f5f5f5;
            display: inline-block;
            margin-bottom: 24px;
            padding-bottom: 8px;
            border-bottom: 2px solid #121212;
        }

        .article-headline {
            font-family: 'Noto Serif', Georgia, 'Times New Roman', serif;
            font-size: 52px;
            font-weight: 700;
            line-height: 1.05;
            color: #f5f5f5;
            margin-bottom: 24px;
            letter-spacing: -1px;
            word-spacing: 0.05em;
            hyphens: manual;
        }

        .article-dek {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 21px;
            line-height: 1.55;
            color: #c0c0c0;
            margin-bottom: 40px;
            font-weight: 400;
            letter-spacing: -0.01em;
        }

        /* Byline */
        .article-byline {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            padding: 32px 0;
            border-top: 1px solid #333333;
            border-bottom: 1px solid #333333;
            margin-bottom: 48px;
        }

        .byline-content { flex: 1; }

        .byline-author {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #f5f5f5;
            margin-bottom: 8px;
            letter-spacing: 0.01em;
        }

        .byline-meta {
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            color: #a0a0a0;
            line-height: 1.5;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .byline-meta time { font-variant-numeric: lining-nums; }
        .byline-meta-separator { margin: 0 6px; opacity: 0.4; }

        .share-tools { display: flex; gap: 8px; align-items: center; }

        .share-button {
            width: 40px; height: 40px; border-radius: 50%;
            border: 1px solid #333333; background: #1a1a1a;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 15px; color: #f5f5f5; text-decoration: none;
        }
        .share-button:hover { background: #252525; border-color: #f5f5f5; transform: translateY(-2px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .share-button:active { transform: translateY(0); }
        .save-button { width: auto; padding: 0 16px; border-radius: 20px; font-size: 13px; font-weight: 600; gap: 6px; }
        .save-button span { font-size: 13px; }

        /* Hero Image */
        .article-hero { margin: 0 -24px 32px; max-width: 100vw; }
        @media (min-width: 768px) { .article-hero { margin: 0 0 48px; } }
        .article-hero-image { width: 100%; height: auto; display: block; }
        .article-caption { font-size: 14px; line-height: 1.6; color: #a0a0a0; padding: 16px 24px 0; }
        @media (min-width: 768px) { .article-caption { padding: 16px 0 0; } }
        .caption-credit { font-size: 12px; color: #999; margin-top: 8px; }

        /* Article Body */
        .article-body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 1.17rem; line-height: 1.8;
            color: #f5f5f5; letter-spacing: -0.003em; word-spacing: 0.01em;
        }
        .article-body p { margin-bottom: 1.5em; text-align: justify; text-justify: inter-word; hyphens: auto; }
        .article-body p:first-child { text-align: left; }
        .article-body p:first-child::first-letter {
            font-family: 'Noto Serif', Georgia, serif;
            font-size: 5.2em; font-weight: 400; line-height: 0.68;
            float: left; margin: 0.08em 0.12em 0 -0.02em; color: #f5f5f5;
        }
        .article-body h2 {
            font-family: 'Noto Serif', Georgia, serif;
            font-size: 1.85rem; font-weight: 700; line-height: 1.15;
            color: #f5f5f5; margin: 2.8em 0 0.85em; letter-spacing: -0.02em;
        }
        .article-body h3 {
            font-family: 'Noto Serif', Georgia, serif;
            font-size: 1.45rem; font-weight: 700; line-height: 1.25;
            color: #f5f5f5; margin: 2.4em 0 0.7em; letter-spacing: -0.015em;
        }
        .article-body strong { font-weight: 700; color: #ffffff; }
        .article-body em { font-style: italic; }
        .article-body blockquote {
            font-family: 'Georgia', serif; font-size: 1.2rem; font-weight: 400;
            font-style: italic; line-height: 1.6; color: #e0e0e0;
            margin: 2.2em 0; padding-left: 1.6em; border-left: 3px solid #333333;
            position: relative;
        }
        .article-body blockquote::before {
            content: '\\201C'; font-family: 'Noto Serif', Georgia, serif;
            font-size: 3.5em; font-weight: 700; line-height: 0;
            position: absolute; left: -0.15em; top: 0.4em; color: #383838; z-index: -1;
        }
        .article-body ul, .article-body ol { margin: 28px 0 28px 28px; line-height: 1.75; }
        .article-body li { margin-bottom: 14px; }
        .article-body a { color: #f5f5f5; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; text-decoration-color: rgba(245, 245, 245, 0.3); transition: all 0.15s ease; }
        .article-body a:hover { text-decoration-color: rgba(245, 245, 245, 0.7); }

        /* Pull Quote */
        .pull-quote {
            font-family: 'Noto Serif', Georgia, serif;
            font-size: 1.65rem; font-weight: 400; font-style: italic;
            line-height: 1.45; color: #f5f5f5; text-align: center;
            margin: 3em auto; padding: 2.2em 0;
            border-top: 1px solid #333333; border-bottom: 1px solid #333333;
            max-width: 540px; position: relative; letter-spacing: -0.01em;
        }

        /* Tables */
        .article-body table { width: 100%; border-collapse: collapse; margin: 44px 0; font-family: 'Inter', sans-serif; font-size: 15px; }
        .article-body table th { background: #202020; padding: 14px 16px; text-align: left; font-weight: 600; border-bottom: 2px solid #383838; color: #f5f5f5; font-size: 14px; letter-spacing: 0.3px; }
        .article-body table td { padding: 14px 16px; border-bottom: 1px solid #2a2a2a; color: #d0d0d0; }
        .article-body table tr:last-child td { border-bottom: 1px solid #383838; }
        .article-body table tr:hover { background: #252525; }

        /* Related Articles */
        .related-articles { margin: 80px 0 0; padding: 48px 0 0; border-top: 2px solid #383838; }
        .related-title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #f5f5f5; margin-bottom: 28px; }
        .related-item { padding: 20px 0; border-bottom: 1px solid #2a2a2a; transition: background 0.15s ease; }
        .related-item:last-child { border-bottom: none; }
        .related-item:hover { background: #252525; margin: 0 -16px; padding: 20px 16px; }
        .related-item a { text-decoration: none; color: inherit; display: block; }
        .related-item-title { font-family: 'Noto Serif', Georgia, serif; font-size: 19px; font-weight: 700; line-height: 1.35; color: #f5f5f5; margin-bottom: 8px; transition: color 0.15s ease; }
        .related-item:hover .related-item-title { color: #a0a0a0; }
        .related-item-meta { font-family: 'Inter', sans-serif; font-size: 13px; color: #a0a0a0; }

        /* Responsive */
        @media (max-width: 768px) {
            .article-container { padding: 48px 20px 60px; }
            .article-headline { font-size: 40px; letter-spacing: -0.6px; line-height: 1.1; }
            .article-dek { font-size: 18px; line-height: 1.55; }
            .article-body { font-size: 20px; }
            .article-body h2 { font-size: 28px; margin: 44px 0 20px; }
            .article-body h3 { font-size: 22px; }
            .pull-quote { font-size: 24px; margin: 48px auto; padding: 36px 0; }
            .share-tools { display: none; }
            .article-byline { padding: 24px 0; margin-bottom: 32px; }
            .article-body table { font-size: 14px; }
            .article-body table th, .article-body table td { padding: 12px 10px; }
        }

        @media (max-width: 480px) {
            .article-container { padding: 40px 18px 50px; }
            .article-headline { font-size: 34px; letter-spacing: -0.5px; }
            .article-dek { font-size: 17px; }
            .article-body { font-size: 19px; }
            .article-body p:first-child::first-letter { font-size: 68px; margin: 8px 8px 0 -2px; }
            .article-body h2 { font-size: 26px; margin: 40px 0 18px; }
            .pull-quote { font-size: 22px; padding: 32px 0; margin: 44px auto; }
            .related-item:hover { margin: 0 -12px; padding: 20px 12px; }
        }
    </style>
</head>
<body>
    <!-- Reading Progress Bar -->
    <div class="reading-progress"></div>

    <!-- Header -->
    <div class="header" include="../header.html"></div>

    <!-- Article Content -->
    <article class="article-container">

        <!-- Article Header -->
        <header>
            <span class="article-category">${article.categoryLabel || article.category}</span>
            <h1 class="article-headline">${encodedTitle}</h1>
            <p class="article-dek">${(article.dek || article.metaDescription).replace(/"/g, '&quot;')}</p>

            <div class="article-byline">
                <div class="byline-content">
                    <div class="byline-author">By ${article.authorName || 'EPL News Hub'}</div>
                    <div class="byline-meta">
                        <time datetime="${date}">${dateFormatted}</time>
                        <span class="byline-meta-separator">&middot;</span>
                        <span>${article.readTime || '7 min read'}</span>
                    </div>
                </div>
                <div class="share-tools">
                    <button class="share-button" onclick="shareArticle('twitter')" title="Share on X" aria-label="Share on X">&#120143;</button>
                    <button class="share-button" onclick="shareArticle('facebook')" title="Share on Facebook" aria-label="Share on Facebook">f</button>
                    <button class="share-button" onclick="shareArticle('copy')" title="Copy link" aria-label="Copy link">&#128279;</button>
                    <button class="share-button save-button" onclick="saveArticle()" title="Save article" aria-label="Save article">
                        <span>&#128209;</span>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Hero Image -->
        <figure class="article-hero">
            <img src="${heroImage}" alt="${encodedTitle}" class="article-hero-image">
            <figcaption class="article-caption">
                ${article.imageCaption || article.title}
                <div class="caption-credit">Photo: Getty Images</div>
            </figcaption>
        </figure>

        <!-- Article Body -->
        <div class="article-body">
            ${article.bodyHTML}
        </div>

        <!-- Related Articles -->
        <aside class="related-articles">
            <h2 class="related-title">Related Articles</h2>
${(article.relatedArticles || []).map(r => `
            <article class="related-item">
                <a href="#">
                    <h3 class="related-item-title">${r.title}</h3>
                    <div class="related-item-meta">${r.date} &middot; ${r.readTime}</div>
                </a>
            </article>`).join('')}
        </aside>

        <!-- Comments Section -->
        <section style="margin-top: 64px; padding-top: 40px; border-top: 1px solid #333333;">
            <h2 style="font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; color: #f5f5f5; margin-bottom: 32px;">Join the Discussion</h2>
            <div style="background: #252525; padding: 32px; border-radius: 8px;">
                <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">Comment Box</a> is loading comments...</div>
                <link rel="stylesheet" type="text/css" href="https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0" />
                <script type="text/javascript" id="hcb"> if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/['"]/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%24w8ot526O1NwJSxpfQ4Tqd0"+"&opts=16798&num=10&ts=1737000000000");if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); </script>
            </div>
        </section>

    </article>

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${escapedTitle}",
      "description": "${article.metaDescription.replace(/"/g, '\\"')}",
      "image": "https://eplnewshub.com${heroImage}",
      "author": { "@type": "Organization", "name": "EPL News Hub", "url": "https://eplnewshub.com" },
      "publisher": { "@type": "Organization", "name": "EPL News Hub", "logo": { "@type": "ImageObject", "url": "https://eplnewshub.com/eplnewshubnewlogo.png" } },
      "datePublished": "${isoDate}",
      "dateModified": "${isoDate}",
      "mainEntityOfPage": { "@type": "WebPage", "@id": "${articleUrl}" },
      "articleSection": "${article.category}",
      "keywords": "${article.keywords}"
    }
    </script>

    <!-- Footer -->
    <div class="footer" include="../footer.html"></div>

    <!-- Scripts -->
    <script src="/index.js"></script>
    <script>
        // Reading Progress Bar
        function updateReadingProgress() {
            const article = document.querySelector('.article-body');
            const progressBar = document.querySelector('.reading-progress');
            if (!article || !progressBar) return;
            const articleRect = article.getBoundingClientRect();
            const articleHeight = article.offsetHeight;
            const windowHeight = window.innerHeight;
            const scrollDistance = -articleRect.top;
            const scrollableDistance = articleHeight - windowHeight;
            const scrollPercentage = Math.min(Math.max((scrollDistance / scrollableDistance) * 100, 0), 100);
            progressBar.style.width = scrollPercentage + '%';
        }
        window.addEventListener('scroll', updateReadingProgress);
        window.addEventListener('resize', updateReadingProgress);
        document.addEventListener('DOMContentLoaded', updateReadingProgress);

        // Share Article
        function shareArticle(platform) {
            const url = window.location.href;
            const title = document.querySelector('.article-headline').textContent;
            switch(platform) {
                case 'twitter':
                    window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(title), '_blank', 'width=550,height=420');
                    break;
                case 'facebook':
                    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'width=550,height=420');
                    break;
                case 'copy':
                    navigator.clipboard.writeText(url).then(function() { showNotification('Link copied to clipboard!'); }).catch(function() { prompt('Copy this link:', url); });
                    break;
            }
        }

        // Save Article
        function saveArticle() {
            const title = document.querySelector('.article-headline').textContent;
            const url = window.location.href;
            const savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
            if (savedArticles.some(function(a) { return a.url === url; })) {
                showNotification('Article already saved!');
            } else {
                savedArticles.push({ title: title, url: url, savedAt: new Date().toISOString() });
                localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
                showNotification('Article saved!');
            }
        }

        // Notification Toast
        function showNotification(message) {
            var notification = document.createElement('div');
            notification.textContent = message;
            notification.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#121212;color:white;padding:16px 24px;border-radius:8px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;z-index:10000;box-shadow:0 4px 16px rgba(0,0,0,0.2);animation:slideUp 0.3s ease-out';
            document.body.appendChild(notification);
            setTimeout(function() { notification.style.animation = 'slideDown 0.3s ease-in'; setTimeout(function() { notification.remove(); }, 300); }, 2000);
        }

        var style = document.createElement('style');
        style.textContent = '@keyframes slideUp{from{transform:translateX(-50%) translateY(20px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}@keyframes slideDown{from{transform:translateX(-50%) translateY(0);opacity:1}to{transform:translateX(-50%) translateY(20px);opacity:0}}';
        document.head.appendChild(style);
    </script>
</body>
</html>`;
}

// ─── Homepage Headline Cascade ───────────────────────────────────────────────

function cascadeHeadlines(articleTitle, articleFilename, articleExcerpt, articleCategory, date, imageFile) {
  console.log('[Scout] Cascading headlines on homepage...');

  const dateFormatted = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const heroImage = imageFile || '/eplnewshubnewlogo.png';

  // Cascade headline12 <- headline11 <- ... <- headline1
  for (let i = 12; i > 1; i--) {
    const src = path.join(ROOT, `headline${i - 1}.html`);
    const dst = path.join(ROOT, `headline${i}.html`);
    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
  }

  // headline1 <- main_subheadline4
  const ms4 = path.join(ROOT, 'main_subheadline4.html');
  const h1 = path.join(ROOT, 'headline1.html');
  if (fs.existsSync(ms4)) fs.copyFileSync(ms4, h1);

  // Cascade main_subheadline4 <- 3 <- 2 <- 1
  for (let i = 4; i > 1; i--) {
    const src = path.join(ROOT, `main_subheadline${i - 1}.html`);
    const dst = path.join(ROOT, `main_subheadline${i}.html`);
    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
  }

  // main_subheadline1 <- main_headline
  const mh = path.join(ROOT, 'main_headline.html');
  const ms1 = path.join(ROOT, 'main_subheadline1.html');
  if (fs.existsSync(mh)) fs.copyFileSync(mh, ms1);

  // Create new main_headline
  const categoryColors = {
    'News': '#e74c3c', 'Transfers': '#3498db', 'Analysis': '#f39c12',
    'Match Reports': '#27ae60', 'Player Focus': '#9b59b6'
  };
  const catColor = categoryColors[articleCategory] || '#8b5cf6';
  const rgbMap = { '#e74c3c': '231, 76, 60', '#3498db': '52, 152, 219', '#f39c12': '243, 156, 18', '#27ae60': '39, 174, 96', '#9b59b6': '155, 89, 182', '#8b5cf6': '139, 92, 246' };
  const catRgb = rgbMap[catColor] || '139, 92, 246';

  const mainHeadlineHTML = `<a href="/articles/${articleFilename}" style="display: flex; flex-direction: column; height: 100%; text-decoration: none; color: inherit;" aria-label="Read full article: ${articleTitle.replace(/"/g, '&quot;')}">
    <img src="${heroImage}" alt="${articleTitle.replace(/"/g, '&quot;')}" style="width: 100%; aspect-ratio: 16 / 9; object-fit: cover; margin-bottom: 16px; flex-shrink: 0; border-radius: 12px;" loading="eager">
    <div style="display: flex; flex-direction: column;">
        <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: ${catColor}; margin-bottom: 10px; background: rgba(${catRgb}, 0.15); padding: 5px 10px; border-radius: 4px; display: inline-block; width: fit-content;">${articleCategory.toUpperCase()}</span>
        <h2 style="font-family: 'Noto Serif', Georgia, serif; font-size: 36px; font-weight: 700; line-height: 1.15; color: #f5f5f5; margin: 0 0 12px 0; letter-spacing: -0.5px;">${articleTitle}</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #b8b8b8; margin: 0 0 12px 0;">${articleExcerpt}</p>
        <div style="font-size: 12px; color: #888888; letter-spacing: 0.3px; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.6;">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <time datetime="${date}">${dateFormatted}</time>
        </div>
    </div>
</a>
`;

  fs.writeFileSync(mh, mainHeadlineHTML);
  console.log('[Scout] Headlines cascaded successfully');
}

// ─── Update articles.json ────────────────────────────────────────────────────

function updateArticlesJson(filename, title, description, date, imageFile) {
  let articles = [];
  try { articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf-8')); } catch (e) {}

  articles.unshift({
    file: filename,
    title: title,
    image: imageFile ? `https://www.eplnewshub.com${imageFile}` : 'https://www.eplnewshub.com/eplnewshubnewlogo.png',
    date: date,
    description: description.slice(0, 200)
  });

  fs.writeFileSync(ARTICLES_JSON, JSON.stringify(articles, null, 2));
  console.log('[Scout] Updated articles.json');
}

// ─── Update data/articles.js ─────────────────────────────────────────────────

function updateDataArticlesJs(article, filename, date, imageFile) {
  const id = filename.replace('.html', '');
  const existing = fs.readFileSync(DATA_ARTICLES_JS, 'utf-8');
  const img = imageFile || '/eplnewshubnewlogo.png';
  const excerpt = (article.dek || article.metaDescription || '').replace(/'/g, "\\'").slice(0, 250);

  const newEntry = `  {
    id: '${id}',
    title: '${article.title.replace(/'/g, "\\'")}',
    excerpt: '${excerpt}',
    image: '${img}',
    category: '${article.category}',
    date: '${date}',
    readTime: '${article.readTime || '7 min read'}',
    featured: true,
    tags: [${article.tags.map(t => `'${t.replace(/'/g, "\\'")}'`).join(', ')}]
  },`;

  const updated = existing.replace(
    'export const articles = [',
    'export const articles = [\n' + newEntry
  );

  fs.writeFileSync(DATA_ARTICLES_JS, updated);
  console.log('[Scout] Updated data/articles.js');
}

// ─── Update sitemap.xml ──────────────────────────────────────────────────────

function updateSitemap(filename, date) {
  let sitemap = fs.readFileSync(SITEMAP, 'utf-8');

  const newEntry = `
    <url>
        <loc>https://www.eplnewshub.com/articles/${filename}</loc>
        <lastmod>${date}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;

  sitemap = sitemap.replace('</urlset>', newEntry + '\n</urlset>');
  fs.writeFileSync(SITEMAP, sitemap);
  console.log('[Scout] Updated sitemap.xml');
}

// ─── Scout Log ───────────────────────────────────────────────────────────────

function getScoutLog() {
  try { return JSON.parse(fs.readFileSync(SCOUT_LOG, 'utf-8')); }
  catch { return { articles: [], lastRun: null, todayCount: 0, today: null }; }
}

function updateScoutLog(articleInfo) {
  const log = getScoutLog();
  const today = new Date().toISOString().split('T')[0];
  if (log.today !== today) { log.todayCount = 0; log.today = today; }
  log.todayCount++;
  log.lastRun = new Date().toISOString();
  log.articles.unshift({ ...articleInfo, createdAt: log.lastRun });
  log.articles = log.articles.slice(0, 100);
  fs.writeFileSync(SCOUT_LOG, JSON.stringify(log, null, 2));
  return log;
}

function canPublishToday() {
  const log = getScoutLog();
  const today = new Date().toISOString().split('T')[0];
  if (log.today !== today) return true;
  return log.todayCount < CONFIG.maxArticlesPerDay;
}

// ─── Git Auto-Push ───────────────────────────────────────────────────────────

function gitPush(articleTitles) {
  try {
    console.log('[Scout] Pushing to GitHub...');
    execSync('git add -A', { cwd: ROOT, stdio: 'pipe' });
    const msg = articleTitles.length === 1
      ? `Auto-scout: ${articleTitles[0]}`
      : `Auto-scout: ${articleTitles.length} new articles\n\n${articleTitles.map(t => '- ' + t).join('\n')}`;
    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: ROOT, stdio: 'pipe' });
    execSync('git push', { cwd: ROOT, stdio: 'pipe', timeout: 30000 });
    console.log('[Scout] Pushed to GitHub successfully');
  } catch (e) {
    console.error('[Scout] Git push failed:', e.message);
  }
}

// ─── Main Pipeline ───────────────────────────────────────────────────────────

async function runScout(count = 1) {
  console.log('═══════════════════════════════════════════════');
  console.log('  EPL News Hub - Article Scout');
  console.log('  ' + new Date().toLocaleString());
  console.log('═══════════════════════════════════════════════\n');

  if (!canPublishToday()) {
    console.log(`[Scout] Already published ${CONFIG.maxArticlesPerDay} articles today. Skipping.`);
    return;
  }

  const log = getScoutLog();
  const today = new Date().toISOString().split('T')[0];
  const remaining = CONFIG.maxArticlesPerDay - (log.today === today ? log.todayCount : 0);
  count = Math.min(count, remaining);

  console.log(`[Scout] Will generate ${count} article(s) (${remaining} remaining today)\n`);

  // Step 1: Gather news
  const news = await gatherNews();
  if (news.length === 0) { console.log('[Scout] No news found. Aborting.'); return; }

  // Step 2: Pick topics
  console.log('[Scout] Selecting best topics via AI...');
  let topics;
  try { topics = await pickTopics(news, count); }
  catch (e) { console.error('[Scout] Topic selection failed:', e.message); return; }

  console.log(`[Scout] Selected ${topics.length} topic(s):\n`);
  topics.forEach((t, i) => console.log(`  ${i + 1}. [${t.category}] ${t.title}`));
  console.log('');

  // Step 3: Generate each article
  const publishedTitles = [];
  for (const topic of topics) {
    try {
      const newsItem = news[topic.index - 1] || news[0];
      const date = new Date().toISOString().split('T')[0];
      const slug = topic.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60)
        .replace(/-+$/, '');
      const filename = `${slug}-${date}.html`;

      console.log(`[Scout] Generating article: ${topic.title}...`);
      const article = await generateArticle(topic, newsItem);

      // Step 4: Find and download image
      const imageResult = await findAndDownloadImage(article.imageSearchQuery || topic.title, slug);
      const imageFile = imageResult ? imageResult.filename : null;

      // Step 5: Create HTML file
      const html = buildArticleHTML(article, filename, date, imageFile);
      fs.writeFileSync(path.join(ARTICLES_DIR, filename), html);
      console.log(`[Scout] Created: articles/${filename}`);

      // Step 6: Cascade headlines
      cascadeHeadlines(article.title, filename, (article.dek || article.metaDescription).slice(0, 200), article.category, date, imageFile);

      // Step 7: Update articles.json
      updateArticlesJson(filename, article.title, article.metaDescription, date, imageFile);

      // Step 8: Update data/articles.js
      updateDataArticlesJs(article, filename, date, imageFile);

      // Step 9: Update sitemap
      updateSitemap(filename, date);

      // Step 10: Log
      updateScoutLog({ title: article.title, filename, category: article.category, date, image: imageFile });
      publishedTitles.push(article.title);

      console.log(`[Scout] Published: ${article.title}\n`);
    } catch (e) {
      console.error(`[Scout] Failed to generate article for "${topic.title}":`, e.message);
    }
  }

  // Step 11: Push to GitHub
  if (publishedTitles.length > 0) {
    gitPush(publishedTitles);
  }

  console.log('[Scout] Run complete!');
}

// ─── Daemon Mode ─────────────────────────────────────────────────────────────

function startDaemon() {
  console.log('[Scout Daemon] Starting automated article scout...');
  console.log('[Scout Daemon] Schedule: Runs every 6 hours');
  console.log('[Scout Daemon] Min articles/day:', CONFIG.minArticlesPerDay);
  console.log('[Scout Daemon] Max articles/day:', CONFIG.maxArticlesPerDay);
  console.log('[Scout Daemon] Press Ctrl+C to stop\n');

  const runBatch = async () => {
    const log = getScoutLog();
    const today = new Date().toISOString().split('T')[0];
    const publishedToday = log.today === today ? log.todayCount : 0;
    const hoursLeft = 24 - new Date().getHours();
    const runsLeft = Math.ceil(hoursLeft / 6);

    let count;
    if (publishedToday >= CONFIG.maxArticlesPerDay) {
      console.log(`[Scout Daemon] Already at max (${CONFIG.maxArticlesPerDay}) articles today. Sleeping...`);
      return;
    } else if (publishedToday < CONFIG.minArticlesPerDay && runsLeft <= 1) {
      count = CONFIG.minArticlesPerDay - publishedToday;
    } else {
      count = Math.max(1, Math.ceil((CONFIG.minArticlesPerDay - publishedToday) / Math.max(1, runsLeft)));
      count = Math.min(count, 2);
    }

    await runScout(count);
  };

  runBatch();
  setInterval(runBatch, 6 * 60 * 60 * 1000);
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
EPL News Hub - Article Scout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage:
  node article-scout.js              Generate 1 article
  node article-scout.js --batch      Generate 2-5 articles (daily batch)
  node article-scout.js --daemon     Run as background daemon (auto-publishes 2-5/day)
  node article-scout.js --status     Show today's scout status
  node article-scout.js --help       Show this help

Requirements:
  Add GROQ_API_KEY to your .env file (free at console.groq.com)
`);
} else if (args.includes('--status')) {
  const log = getScoutLog();
  const today = new Date().toISOString().split('T')[0];
  const todayCount = log.today === today ? log.todayCount : 0;
  console.log(`\nArticle Scout Status`);
  console.log(`━━━━━━━━━━━━━━━━━━━`);
  console.log(`Today: ${todayCount}/${CONFIG.maxArticlesPerDay} articles published`);
  console.log(`Last run: ${log.lastRun || 'Never'}`);
  if (log.articles.length > 0) {
    console.log(`\nRecent articles:`);
    log.articles.slice(0, 5).forEach(a => {
      console.log(`  [${a.category}] ${a.title} (${a.date})`);
    });
  }
  console.log('');
} else if (args.includes('--daemon')) {
  startDaemon();
} else if (args.includes('--batch')) {
  const count = Math.floor(Math.random() * (CONFIG.maxArticlesPerDay - CONFIG.minArticlesPerDay + 1)) + CONFIG.minArticlesPerDay;
  runScout(count).catch(e => { console.error('[Scout] Fatal:', e); process.exit(1); });
} else {
  runScout(1).catch(e => { console.error('[Scout] Fatal:', e); process.exit(1); });
}
