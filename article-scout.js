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
  console.log(`[Scout] Searching Google Images for: "${searchQuery}"...`);

  // Google Image Search via scraping the results page
  const queries = [
    searchQuery,
    searchQuery.split(' ').slice(0, 3).join(' ') + ' Premier League',
    searchQuery.split(' ').slice(0, 2).join(' ') + ' football match'
  ];

  for (const query of queries) {
    try {
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=isz:l,itp:photo`;
      const res = await fetch(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      const html = res.text();

      // Extract image URLs from Google's response - they embed full-size URLs in the page
      const imageUrls = [];

      // Method 1: Extract from data attributes and JSON embedded in page
      const imgRegex = /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)",\s*(\d+),\s*(\d+)\]/g;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&');
        const width = parseInt(match[2]);
        const height = parseInt(match[3]);
        if (width >= 800 && height >= 400 && !url.includes('gstatic.com') && !url.includes('google.com')) {
          imageUrls.push(url);
        }
      }

      // Method 2: Extract from img src tags (thumbnail URLs that link to full images)
      const srcRegex = /\["(https?:\/\/(?:encrypted-tbn|[^"]+)\.(?:gstatic\.com|[^"]+)\/[^"]+)",\s*\d+,\s*\d+\]/g;
      // Skip gstatic thumbnails

      // Method 3: Look for image URLs in script data
      const dataRegex = /"ou":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/g;
      while ((match = dataRegex.exec(html)) !== null) {
        const url = match[1].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&');
        if (!url.includes('gstatic.com') && !url.includes('google.com')) {
          imageUrls.push(url);
        }
      }

      // Method 4: AF_initDataCallback contains image data
      const afRegex = /\["(https?:\/\/[^"]{20,}\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"[^[]*?\[(\d{3,5}),\s*(\d{3,5})\]/g;
      while ((match = afRegex.exec(html)) !== null) {
        const url = match[1].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&').replace(/\\\\u003d/g, '=').replace(/\\\\u0026/g, '&');
        const w = parseInt(match[2]);
        const h = parseInt(match[3]);
        if (w >= 800 && h >= 400 && !url.includes('gstatic.com') && !url.includes('google.com') && !url.includes('googleusercontent.com')) {
          imageUrls.push(url);
        }
      }

      // Deduplicate
      const uniqueUrls = [...new Set(imageUrls)];
      console.log(`[Scout] Found ${uniqueUrls.length} candidate images from Google`);

      // Try downloading the best ones
      for (const imgUrl of uniqueUrls.slice(0, 8)) {
        try {
          const downloaded = await downloadImage(imgUrl, slug);
          if (downloaded) {
            console.log(`[Scout] Google Image downloaded successfully`);
            return downloaded;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      console.log(`[Scout] Google search failed for "${query}": ${e.message}`);
    }
  }

  console.log('[Scout] No image found, using default logo');
  return null;
}

async function downloadImage(imageUrl, slug) {
  try {
    const res = await fetchBinary(imageUrl);
    if (res.status !== 200) return null;
    // Skip tiny images (< 20KB likely broken/icons), skip huge files (> 15MB)
    if (res.buffer.length < 20000 || res.buffer.length > 15000000) return null;

    // Determine extension from content-type
    let ext = '.jpg';
    const ct = res.contentType.toLowerCase();
    if (ct.includes('png')) ext = '.png';
    else if (ct.includes('webp')) ext = '.webp';
    else if (ct.includes('avif')) ext = '.avif';

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
    'Premier League match results highlights',
    'Premier League match preview this week',
    'Premier League tactical analysis',
    'Premier League player performance stats',
    'Premier League injury team news',
    'Fantasy Premier League tips gameweek',
    'Premier League weekend preview predictions',
    'Premier League season race title relegation'
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

// LLM providers — cycles through if one hits rate limits
// All have generous free tiers. Ordered by quality + free limits.
const LLM_PROVIDERS = [
  // Groq: ~14,400 req/day free, ultra-fast inference
  {
    name: 'Groq (Llama 3.3 70B)',
    envKey: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 4096,
  },
  {
    name: 'Groq (Mixtral 8x7B)',
    envKey: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'mixtral-8x7b-32768',
    maxTokens: 4096,
  },
  // Mistral: 1 billion tokens/month free
  {
    name: 'Mistral (Mistral Small)',
    envKey: 'MISTRAL_API_KEY',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
    maxTokens: 4096,
  },
  // Google Gemini: 1,000 req/day free via AI Studio
  {
    name: 'Google Gemini Flash',
    envKey: 'GEMINI_API_KEY',
    url: 'GEMINI', // special handling below
    model: 'gemini-2.0-flash',
    maxTokens: 4096,
  },
  // Together AI: $25 free credits on signup
  {
    name: 'Together AI (Llama 3.3 70B)',
    envKey: 'TOGETHER_API_KEY',
    url: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    maxTokens: 4096,
  },
  // Cerebras: free tier, blazing fast inference
  {
    name: 'Cerebras (Llama 3.3 70B)',
    envKey: 'CEREBRAS_API_KEY',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    model: 'llama-3.3-70b',
    maxTokens: 4096,
  },
  // OpenRouter: 50 req/day free (1,000 if you add $10 credit)
  {
    name: 'OpenRouter (Llama 3.3 70B free)',
    envKey: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    maxTokens: 4096,
  },
  // HuggingFace Inference: free tier, 300+ models
  {
    name: 'HuggingFace (Llama 3.3 70B)',
    envKey: 'HF_API_KEY',
    url: 'https://router.huggingface.co/novita/v3/openai/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    maxTokens: 4096,
  },
];

async function callLLM(prompt, systemPrompt) {
  const errors = [];

  for (const provider of LLM_PROVIDERS) {
    const apiKey = process.env[provider.envKey];
    if (!apiKey) continue;

    try {
      console.log(`[Scout] Trying ${provider.name}...`);

      let res, data;

      // Google Gemini uses a different API format
      if (provider.url === 'GEMINI') {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${apiKey}`;
        res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + prompt }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: provider.maxTokens },
          })
        });
        const gData = res.json();
        if (gData.error) throw new Error(JSON.stringify(gData.error));
        const text = gData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty Gemini response');
        console.log(`[Scout] ${provider.name} responded successfully`);
        return text;
      }

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      if (provider.url.includes('openrouter')) {
        headers['HTTP-Referer'] = 'https://www.eplnewshub.com';
        headers['X-Title'] = 'EPL News Hub';
      }

      res = await fetch(provider.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: provider.maxTokens,
        })
      });

      data = res.json();

      // Check for rate limit or error
      if (data.error) {
        const errMsg = JSON.stringify(data.error);
        console.log(`[Scout] ${provider.name} error: ${errMsg}`);
        errors.push(`${provider.name}: ${errMsg}`);
        // If rate limited, try next provider
        if (errMsg.includes('rate_limit') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('limit') || errMsg.includes('capacity')) {
          console.log(`[Scout] Rate limited on ${provider.name}, trying next...`);
          continue;
        }
        // Other errors — still try next
        continue;
      }

      if (!data.choices || !data.choices[0]?.message?.content) {
        console.log(`[Scout] ${provider.name} returned empty response`);
        continue;
      }

      console.log(`[Scout] ${provider.name} responded successfully`);
      return data.choices[0].message.content;
    } catch (e) {
      console.log(`[Scout] ${provider.name} failed: ${e.message}`);
      errors.push(`${provider.name}: ${e.message}`);
      continue;
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join('\n')}`);
}

function getRecentArticleTitles() {
  const log = getScoutLog();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return (log.articles || [])
    .filter(a => a.date >= oneWeekAgo)
    .map(a => a.title);
}

async function pickTopics(newsItems, count) {
  const headlines = newsItems.map((n, i) => `${i + 1}. ${n.title}`).join('\n');
  const recentTitles = getRecentArticleTitles();
  const recentList = recentTitles.length > 0
    ? `\n\nARTICLES ALREADY PUBLISHED THIS WEEK (DO NOT pick similar topics):\n${recentTitles.map(t => '- ' + t).join('\n')}`
    : '';

  const systemPrompt = `You are an editorial assistant for EPL News Hub. Pick the ${count} most interesting AND DIVERSE stories.

IMPORTANT RULES:
- VARIETY IS CRITICAL: Pick stories about DIFFERENT teams, players, and topics. Never pick 2+ stories about the same person or team.
- Mix article types: include match previews, match reviews/overviews, tactical analysis, transfer news, player spotlights, title/relegation race analysis — NOT just managerial news.
- Prioritise match content (previews, results, tactical breakdowns) and player performances over off-field stories.
- Each picked story MUST be about a different subject. If 2 headlines are about the same topic, only pick the best one.
${recentTitles.length > 0 ? '- NEVER pick a topic that is similar to any article already published this week (listed below). Pick something fresh.' : ''}

Return ONLY a JSON array of objects with "index" (1-based from the headlines list), "category" (News, Transfers, Analysis, Match Reports, or Player Focus), "angle" (unique hook), and "title" (compelling article title). No other text.`;

  const result = await callLLM(`Today's top football headlines:\n\n${headlines}${recentList}\n\nPick the best ${count} DIVERSE topics.`, systemPrompt);
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse topic selection: ' + result);
  return JSON.parse(jsonMatch[0]);
}

async function generateArticle(topic, newsItem) {
  const systemPrompt = `You are a senior sports journalist writing for EPL News Hub — a respected Premier League publication in the style of The Athletic. You write with authority, depth, and storytelling flair.

Your writing standards:
- Write like a seasoned journalist at The Athletic, The Guardian, or BBC Sport — confident, insightful, with a strong narrative voice
- NEVER start with generic AI openers like "In a move that..." or "The football world is..." — start with a concrete, specific, vivid detail or scene
- Every paragraph must ADD new information — no filler, no restating what was just said, no padding
- Use REAL stats, REAL match data, REAL transfer fees, REAL quotes (attribute them properly to the source)
- Include tactical depth: formations, pressing triggers, positional play, xG, progressive passes, etc. when relevant
- Write 1200-1800 words — this should feel like a premium long-read, not a summary
- Structure with clear h2 sections (3-4 per article) that each explore a different angle of the story
- Include 2-3 blockquotes from managers/players/pundits with proper attribution
- Include 1-2 pull quotes — the most striking lines from YOUR writing
- Add historical context and comparisons to past seasons/players where relevant
- End with a forward-looking conclusion that gives the reader something to think about
- Vary sentence length — mix punchy short sentences with longer analytical ones for rhythm
- NEVER use cliches like "only time will tell", "remains to be seen", "football is a funny game"

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
  "bodyHTML": "IMPORTANT: This must be a valid JSON string. Escape all quotes with backslash. Write the full article body using HTML tags: p, h2, h3, blockquote, strong, em, ul, li. Include pull quotes as: <div class=\\\"pull-quote\\\">Quote text here</div>. Example format: <p>First paragraph here.</p><h2>Section Title</h2><p>More content.</p>",
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

  const result = await callLLM(prompt, systemPrompt);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article JSON: ' + result.slice(0, 200));
  // Aggressively clean the JSON string:
  // 1. Replace literal newlines inside string values with \\n
  // 2. Remove all other control characters
  let cleaned = jsonMatch[0];
  // Fix unescaped newlines inside JSON string values by replacing them
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Try parsing, if it fails try a more aggressive cleanup
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Replace literal newlines in string values with escaped versions
    cleaned = cleaned.replace(/"((?:[^"\\]|\\.)*)"/g, (match) => {
      return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
    });
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      // Last resort: extract bodyHTML as raw content and manually fix
      console.log('[Scout] JSON parse failed, attempting aggressive recovery...');

      // Case 1: bodyHTML value is unquoted HTML (starts with <p> or similar)
      const rawHtmlMatch = cleaned.match(/"bodyHTML"\s*:\s*\n?\s*(<[\s\S]*?)(?=\n\s*"relatedArticles|\n\s*"tags|\n\s*\})/);
      if (rawHtmlMatch) {
        const rawBody = rawHtmlMatch[1].trim().replace(/,\s*$/, '');
        const escapedBody = rawBody.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '').replace(/\t/g, ' ');
        cleaned = cleaned.replace(rawHtmlMatch[0], `"bodyHTML": "${escapedBody}"`);
        try { return JSON.parse(cleaned); } catch (e3) { /* continue */ }
      }

      // Case 2: bodyHTML value is a JSON array of HTML strings
      const arrayMatch = cleaned.match(/"bodyHTML"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*")/);
      if (arrayMatch) {
        // Join array items into a single string
        try {
          const arr = JSON.parse('[' + arrayMatch[1] + ']');
          const joinedBody = arr.join('').replace(/"/g, '\\"');
          cleaned = cleaned.replace(arrayMatch[0], `"bodyHTML": "${joinedBody}"`);
          return JSON.parse(cleaned);
        } catch (e3) { /* continue */ }
      }

      throw e2;
    }
  }
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

  // headline1 <- main_subheadline3
  const ms3 = path.join(ROOT, 'main_subheadline3.html');
  const h1 = path.join(ROOT, 'headline1.html');
  if (fs.existsSync(ms3)) fs.copyFileSync(ms3, h1);

  // Cascade main_subheadline3 <- 2 <- 1
  for (let i = 3; i > 1; i--) {
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

      // Duplicate check — skip if too similar to a recent article
      const recentTitles = getRecentArticleTitles();
      const topicWords = topic.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
      const isDuplicate = recentTitles.some(recent => {
        const recentWords = recent.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
        const overlap = topicWords.filter(w => recentWords.includes(w)).length;
        return overlap >= 3; // 3+ significant words in common = too similar
      });
      if (isDuplicate) {
        console.log(`[Scout] Skipping "${topic.title}" — too similar to a recent article`);
        continue;
      }

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

  // Step 11: Generate match predictions
  try {
    await generateMatchPredictions();
  } catch (e) {
    console.error('[Scout] Match predictions failed:', e.message);
  }

  // Step 12: Push to GitHub
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

// ─── Match Predictions Generator ─────────────────────────────────────────

const PREDICTIONS_JSON = path.join(ROOT, 'data', 'match-predictions.json');

const EPL_TEAMS = [
  'Arsenal FC', 'Aston Villa FC', 'AFC Bournemouth', 'Brentford FC',
  'Brighton & Hove Albion FC', 'Chelsea FC', 'Crystal Palace FC', 'Everton FC',
  'Fulham FC', 'Ipswich Town FC', 'Leeds United FC', 'Leicester City FC',
  'Liverpool FC', 'Manchester City FC', 'Manchester United FC', 'Newcastle United FC',
  'Nottingham Forest FC', 'Southampton FC', 'Tottenham Hotspur FC', 'West Ham United FC'
];

async function fetchUpcomingFixtures() {
  // Use AI to get real upcoming EPL fixtures
  const today = new Date().toISOString().split('T')[0];
  console.log(`[Scout] Fetching upcoming Premier League fixtures for ${today}...`);
  const prompt = `Today is ${today}. List the next 10 upcoming Premier League 2025-26 season fixtures that have NOT yet been played. These must be REAL scheduled matches from the official EPL fixture list.

Return ONLY a JSON array of objects with:
- "homeTeam": official team name (e.g. "Arsenal FC", "Liverpool FC", "Manchester City FC")
- "awayTeam": official team name
- "matchDate": ISO date string (e.g. "2026-02-01T15:00:00Z")
- "matchday": gameweek number

Use these exact team names: Arsenal FC, Aston Villa FC, AFC Bournemouth, Brentford FC, Brighton & Hove Albion FC, Chelsea FC, Crystal Palace FC, Everton FC, Fulham FC, Ipswich Town FC, Leeds United FC, Leicester City FC, Liverpool FC, Manchester City FC, Manchester United FC, Newcastle United FC, Nottingham Forest FC, Southampton FC, Tottenham Hotspur FC, West Ham United FC, Wolverhampton Wanderers FC.

No other text, just the JSON array.`;

  const result = await callLLM(prompt, 'You are a football data assistant with knowledge of the 2025-26 Premier League fixture schedule. Return accurate fixture data in JSON format only. Only include matches that have not been played yet.');
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try { return JSON.parse(jsonMatch[0]); } catch { return []; }
}

async function generateMatchPredictions() {
  console.log('[Scout] Generating match predictions...');

  const fixtures = await fetchUpcomingFixtures();
  if (fixtures.length === 0) {
    console.log('[Scout] No fixtures found, skipping predictions.');
    return;
  }

  const gameweek = fixtures[0].matchday || null;
  const fixtureList = fixtures.map((f, i) => `${i + 1}. ${f.homeTeam} vs ${f.awayTeam}`).join('\n');

  const systemPrompt = `You are an expert football analyst providing match predictions for EPL News Hub. Give realistic, data-informed predictions.

Return ONLY a JSON array of objects, one per match, with these fields:
- "homeTeam": exact team name as given
- "awayTeam": exact team name as given
- "predictedScore": {"home": number, "away": number}
- "winner": "home", "away", or "draw"
- "confidence": number 50-95 (how confident in the prediction)
- "analysis": 2-3 sentences of tactical analysis explaining the prediction
- "formHome": last 5 results string e.g. "WWDLW" (most recent first)
- "formAway": last 5 results string e.g. "LDWWW" (most recent first)
- "keyPlayerHome": standout player name + short reason e.g. "Cole Palmer — 12 goals, lethal from set pieces"
- "keyPlayerAway": standout player name + short reason
- "h2hSummary": head-to-head recent record string e.g. "Home 3W-1D-1L in last 5 meetings"
- "homeGoalsPerGame": average goals scored per game this season (number, 1 decimal)
- "awayGoalsPerGame": average goals scored per game this season (number, 1 decimal)
- "homeConcededPerGame": average goals conceded per game this season (number, 1 decimal)
- "awayConcededPerGame": average goals conceded per game this season (number, 1 decimal)
- "tacticalMatchup": 2-3 sentences on how formations and styles interact
- "keyBattles": array of 2-3 strings, each a player-vs-player matchup e.g. "Salah vs Cucurella — pace against positioning"
- "verdict": punchy 1-sentence final call on the match

Be realistic with scores (most PL games are 0-0 to 4-2 range). Vary your predictions — don't predict all home wins. Consider current form, injuries, head-to-head records.`;

  const prompt = `Predict the outcomes for these upcoming Premier League matches:\n\n${fixtureList}\n\nProvide predictions for all matches listed.`;

  try {
    const result = await callLLM(prompt, systemPrompt);
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse predictions JSON');

    let predictions = JSON.parse(jsonMatch[0]);

    // Merge match dates from fixtures
    predictions = predictions.map((p, i) => ({
      ...p,
      matchDate: fixtures[i] ? fixtures[i].matchDate : null
    }));

    const output = {
      gameweek: gameweek,
      generatedAt: new Date().toISOString(),
      predictions: predictions
    };

    fs.writeFileSync(PREDICTIONS_JSON, JSON.stringify(output, null, 2));
    console.log(`[Scout] Match predictions saved (${predictions.length} matches)`);
  } catch (e) {
    console.error(`[Scout] Predictions generation failed: ${e.message}`);
  }
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
  const numArg = args.find(a => /^\d+$/.test(a));
  const count = numArg ? parseInt(numArg) : Math.floor(Math.random() * (CONFIG.maxArticlesPerDay - CONFIG.minArticlesPerDay + 1)) + CONFIG.minArticlesPerDay;
  runScout(count).catch(e => { console.error('[Scout] Fatal:', e); process.exit(1); });
} else {
  runScout(1).catch(e => { console.error('[Scout] Fatal:', e); process.exit(1); });
}
