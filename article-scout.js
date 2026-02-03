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
const SCOUT_PID = path.join(ROOT, '.scout-pid');
const SERVICE_ACCOUNT_PATH = path.join(ROOT, 'google-service-account.json');

// ─── PID Lock Helpers ───────────────────────────────────────────────────────

function writeScoutPid(mode) {
  fs.writeFileSync(SCOUT_PID, JSON.stringify({ pid: process.pid, mode, startedAt: new Date().toISOString() }));
}

function clearScoutPid() {
  try { fs.unlinkSync(SCOUT_PID); } catch (e) { /* ignore */ }
}

function getScoutPidInfo() {
  try {
    const info = JSON.parse(fs.readFileSync(SCOUT_PID, 'utf-8'));
    // Check if process is actually still running
    try { process.kill(info.pid, 0); return info; } catch (e) { /* process dead */ }
    // Stale PID file — clean up
    clearScoutPid();
    return null;
  } catch (e) { return null; }
}

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
    name: 'Groq (Llama 3.1 8B)',
    envKey: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.1-8b-instant',
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
        return stripMarkdownFences(text);
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
      return stripMarkdownFences(data.choices[0].message.content);
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
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return (log.articles || [])
    .filter(a => a.date >= twoWeeksAgo)
    .map(a => a.title);
}

async function pickTopics(newsItems, count) {
  const headlines = newsItems.map((n, i) => `${i + 1}. ${n.title}`).join('\n');
  const recentTitles = getRecentArticleTitles();
  const recentList = recentTitles.length > 0
    ? `\n\nARTICLES ALREADY PUBLISHED IN THE LAST 2 WEEKS (DO NOT pick similar topics):\n${recentTitles.map(t => '- ' + t).join('\n')}`
    : '';

  const systemPrompt = `You are an editorial assistant for EPL News Hub. Pick the ${count} most interesting AND DIVERSE stories.

IMPORTANT RULES:
- VARIETY IS CRITICAL: Pick stories about DIFFERENT teams, players, and topics. Never pick 2+ stories about the same person or team.
- Mix article types: include match previews, match reviews/overviews, tactical analysis, transfer news, player spotlights, title/relegation race analysis — NOT just managerial news.
- Prioritise match content (previews, results, tactical breakdowns) and player performances over off-field stories.
- Each picked story MUST be about a different subject. If 2 headlines are about the same topic, only pick the best one.
${recentTitles.length > 0 ? '- NEVER pick a topic that is similar to any article already published in the last 2 weeks (listed below). Pick something completely fresh and different.' : ''}

Return ONLY a JSON array of objects with "index" (1-based from the headlines list), "category" (News, Transfers, Analysis, Match Reports, or Player Focus), "angle" (unique hook), and "title" (compelling article title). No other text.`;

  const result = await callLLM(`Today's top football headlines:\n\n${headlines}${recentList}\n\nPick the best ${count} DIVERSE topics.`, systemPrompt);
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse topic selection: ' + result);
  return JSON.parse(jsonMatch[0]);
}

// ─── Web Search ──────────────────────────────────────────────────────────────

async function webSearch(query, maxResults = 5) {
  console.log(`[Scout]   🔍 Searching: "${query}"`);
  const results = [];

  // Try DuckDuckGo HTML (no API key needed, reliable)
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });
    const html = res.text();

    // Extract result snippets from DuckDuckGo HTML
    const resultBlocks = html.match(/<a class="result__a"[\s\S]*?<\/a>[\s\S]*?<a class="result__snippet"[\s\S]*?<\/a>/g) || [];
    for (const block of resultBlocks.slice(0, maxResults)) {
      const titleMatch = block.match(/<a class="result__a"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      const hrefMatch = block.match(/<a class="result__a" href="([^"]+)"/);
      if (titleMatch && snippetMatch) {
        results.push({
          title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
          snippet: snippetMatch[1].replace(/<[^>]+>/g, '').trim(),
          url: hrefMatch ? decodeURIComponent(hrefMatch[1].replace(/.*uddg=/, '').replace(/&.*/, '')) : ''
        });
      }
    }
  } catch (e) {
    console.log(`[Scout]   ⚠ DuckDuckGo search failed: ${e.message}`);
  }

  // Fallback: try Google News RSS for the query
  if (results.length === 0) {
    try {
      const newsItems = await fetchNewsFromGoogleRSS(query);
      for (const item of newsItems.slice(0, maxResults)) {
        results.push({
          title: item.title,
          snippet: item.description,
          url: item.link
        });
      }
    } catch (e) { /* ignore */ }
  }

  return results;
}

async function webSearchAndScrape(query, maxScrape = 3) {
  const searchResults = await webSearch(query);
  const content = [];

  // Add search snippets as quick facts
  for (const r of searchResults) {
    if (r.snippet) {
      content.push({ origin: `Search: ${r.title}`, text: r.snippet });
    }
  }

  // Scrape top results for full articles
  let scraped = 0;
  for (const r of searchResults) {
    if (scraped >= maxScrape) break;
    if (!r.url || r.url.includes('duckduckgo.com')) continue;
    const text = await scrapeSourceArticle(r.url);
    if (text && text.length > 200) {
      content.push({ origin: r.title, text: text.slice(0, 3000) });
      scraped++;
      console.log(`[Scout]   ✓ Scraped search result: ${r.title.slice(0, 50)}...`);
    }
  }

  return content;
}

// ─── Real Football Data (API-Football) ───────────────────────────────────────

async function fetchFootballData() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    console.log('[Scout] No API_FOOTBALL_KEY — skipping real data fetch');
    return null;
  }

  const data = { standings: null, recentResults: null, topScorers: null };

  async function apiCall(endpoint) {
    const res = await fetch(`https://v3.football.api-sports.io${endpoint}`, {
      headers: { 'x-apisports-key': apiKey }
    });
    if (res.status !== 200) throw new Error(`API-Football ${res.status}`);
    return res.json();
  }

  try {
    // Premier League 2025-26 season, league ID = 39
    const season = 2025;
    const league = 39;

    // Standings
    const standingsRes = await apiCall(`/standings?league=${league}&season=${season}`);
    if (standingsRes.response && standingsRes.response[0]) {
      data.standings = standingsRes.response[0].league.standings[0].map(t => ({
        rank: t.rank,
        team: t.team.name,
        points: t.points,
        played: t.all.played,
        won: t.all.win,
        drawn: t.all.draw,
        lost: t.all.lose,
        goalsFor: t.all.goals.for,
        goalsAgainst: t.all.goals.against,
        form: t.form
      }));
      console.log('[Scout] ✓ Fetched live Premier League standings');
    }

    // Recent results (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today - 7 * 86400000);
    const fromDate = weekAgo.toISOString().split('T')[0];
    const toDate = today.toISOString().split('T')[0];
    const resultsRes = await apiCall(`/fixtures?league=${league}&season=${season}&from=${fromDate}&to=${toDate}&status=FT`);
    if (resultsRes.response) {
      data.recentResults = resultsRes.response.map(m => ({
        home: m.teams.home.name,
        away: m.teams.away.name,
        homeGoals: m.goals.home,
        awayGoals: m.goals.away,
        date: m.fixture.date
      }));
      console.log(`[Scout] ✓ Fetched ${data.recentResults.length} recent match results`);
    }

    // Top scorers
    const scorersRes = await apiCall(`/players/topscorers?league=${league}&season=${season}`);
    if (scorersRes.response) {
      data.topScorers = scorersRes.response.slice(0, 15).map(p => ({
        name: p.player.name,
        team: p.statistics[0].team.name,
        goals: p.statistics[0].goals.total,
        assists: p.statistics[0].goals.assists || 0
      }));
      console.log(`[Scout] ✓ Fetched top ${data.topScorers.length} scorers`);
    }

    return data;
  } catch (e) {
    console.log(`[Scout] API-Football fetch failed: ${e.message}`);
    return null;
  }
}

function formatFootballDataForPrompt(data) {
  if (!data) return '';
  let text = '\n\nVERIFIED REAL-TIME DATA (from official API — trust these numbers over any other source):\n';

  if (data.standings) {
    text += '\n--- PREMIER LEAGUE TABLE ---\n';
    data.standings.forEach(t => {
      text += `${t.rank}. ${t.team} — ${t.points}pts (P${t.played} W${t.won} D${t.drawn} L${t.lost}, GF${t.goalsFor} GA${t.goalsAgainst}, Form: ${t.form})\n`;
    });
  }

  if (data.recentResults && data.recentResults.length > 0) {
    text += '\n--- RECENT RESULTS (last 7 days) ---\n';
    data.recentResults.forEach(m => {
      text += `${m.home} ${m.homeGoals}-${m.awayGoals} ${m.away} (${new Date(m.date).toLocaleDateString()})\n`;
    });
  }

  if (data.topScorers) {
    text += '\n--- TOP SCORERS ---\n';
    data.topScorers.forEach((p, i) => {
      text += `${i + 1}. ${p.name} (${p.team}) — ${p.goals} goals, ${p.assists} assists\n`;
    });
  }

  return text;
}

// ─── Source Scraping & Fact Research ─────────────────────────────────────────

async function scrapeSourceArticle(url) {
  try {
    // Google News links redirect — follow them
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    const html = res.text();

    // Extract text content from the HTML — strip tags, scripts, styles
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Limit to first ~5000 chars to get more source content
    return text.slice(0, 5000);
  } catch (e) {
    console.log(`[Scout] Failed to scrape source: ${e.message}`);
    return null;
  }
}

async function researchTopic(topic, newsItem) {
  console.log(`[Scout] Researching: ${topic.title}...`);
  const sources = [];

  // 0. Always include the Google News description as baseline source material
  if (newsItem.description && newsItem.description.length > 20) {
    sources.push({ origin: 'Google News summary', text: newsItem.description });
  }

  // 1. Scrape the original source article
  if (newsItem.link) {
    const sourceText = await scrapeSourceArticle(newsItem.link);
    if (sourceText && sourceText.length > 50) {
      sources.push({ origin: 'Original source article', text: sourceText });
      console.log(`[Scout]   ✓ Scraped original source (${sourceText.length} chars)`);
    } else {
      console.log(`[Scout]   ⚠ Original source too short or blocked (${sourceText ? sourceText.length : 0} chars)`);
    }
  }

  // 2. Search for additional sources on the same topic via Google News RSS
  const searchQuery = topic.title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 6).join(' ');
  try {
    const additionalItems = await fetchNewsFromGoogleRSS(searchQuery + ' Premier League');
    // Scrape top 3-4 additional sources for cross-referencing
    let scraped = 0;
    for (const item of additionalItems.slice(0, 6)) {
      if (scraped >= 4) break;
      if (item.link === newsItem.link) continue; // skip duplicate
      const text = await scrapeSourceArticle(item.link);
      if (text && text.length > 200) {
        sources.push({ origin: item.title, text: text.slice(0, 3000) });
        scraped++;
        console.log(`[Scout]   ✓ Scraped additional source: ${item.title.slice(0, 60)}...`);
      }
    }
  } catch (e) {
    console.log(`[Scout]   ⚠ Additional source search failed: ${e.message}`);
  }

  // 2.5. Web search for additional facts (especially useful when direct scraping is blocked)
  const scrapedContentSoFar = sources.filter(s => s.origin !== 'Google News summary').reduce((sum, s) => sum + s.text.length, 0);
  if (scrapedContentSoFar < 1000) {
    console.log(`[Scout]   Only ${scrapedContentSoFar} chars of scraped content — running web search for more...`);
    try {
      // Search for the specific topic
      const webResults = await webSearchAndScrape(topic.title + ' Premier League 2026', 3);
      for (const r of webResults) {
        sources.push(r);
      }
      // Also search for key entities in the topic (team names, player names)
      const entitySearch = topic.title.replace(/[^a-zA-Z ]/g, '').split(' ')
        .filter(w => w.length > 3 && w[0] === w[0].toUpperCase()).slice(0, 3).join(' ');
      if (entitySearch.length > 5) {
        const entityResults = await webSearchAndScrape(entitySearch + ' Premier League latest', 2);
        for (const r of entityResults) {
          sources.push(r);
        }
      }
    } catch (e) {
      console.log(`[Scout]   ⚠ Web search failed: ${e.message}`);
    }
  }

  // 3. Compile research summary using AI
  if (sources.length === 0) {
    console.log(`[Scout]   ⚠ No sources scraped — article will note limited sourcing`);
    return { sources: [], summary: `Topic: ${topic.title}\nSource headline: ${newsItem.title}\nSource description: ${newsItem.description}\n\nNo additional source material was available.` };
  }

  const sourceTexts = sources.map((s, i) => `--- SOURCE ${i + 1}: ${s.origin} ---\n${s.text}`).join('\n\n');

  const summaryPrompt = `You are a fact-checking research assistant. Extract ONLY verifiable facts from these source articles about "${topic.title}".

${sourceTexts}

Extract and return:
1. KEY FACTS: Verified scores, dates, stats, transfer fees, quotes (with who said them and to which outlet)
2. QUOTES: Exact quotes with proper attribution (who said it, where it was reported)
3. STATS: Any specific numbers — goals, assists, xG, league position, points, etc.
4. CONTEXT: Key background information that multiple sources agree on
5. WHAT TO AVOID: Any claims that appear in only one source and seem unverified or speculative

Format as a clear bullet-point summary. Only include facts that appear in the source material. If sources contradict each other, note the disagreement.`;

  try {
    const summary = await callLLM(summaryPrompt, 'You extract verified facts from news sources. Be precise and factual. Never invent information.');
    console.log(`[Scout]   ✓ Research summary compiled (${sources.length} sources)`);
    return { sources, summary };
  } catch (e) {
    console.log(`[Scout]   ⚠ Research summary failed: ${e.message}`);
    // Fall back to raw source text
    return { sources, summary: sourceTexts.slice(0, 4000) };
  }
}

// ─── Article Generation ─────────────────────────────────────────────────────

async function generateArticle(topic, newsItem, research) {
  const systemPrompt = `You are a senior sports journalist writing for EPL News Hub — a respected Premier League publication in the style of The Athletic. You write with authority, depth, and storytelling flair.

CRITICAL ACCURACY RULES — READ CAREFULLY:
- You have been given RESEARCHED SOURCE MATERIAL below. ONLY use facts, stats, quotes, and scores that appear in this source material.
- NEVER invent match scores, transfer fees, quotes, or statistics. If the source material doesn't contain a specific fact, DO NOT make it up.
- If you're unsure about a specific stat or detail, omit it rather than guess. Vague but correct is better than specific but wrong.
- Quotes MUST come from the source material. If a quote is attributed to someone in the sources, use it. Do NOT fabricate quotes.
- Match scores, league positions, and points totals MUST match the source material exactly.
- If writing about a future match (preview), clearly frame predictions as analysis, not fact.
- If VERIFIED REAL-TIME DATA is provided (standings, results, scorers), those numbers are from an official API — trust them above all other sources.

WRITING QUALITY — THIS IS CRITICAL:
- Write like the best journalists at The Athletic, The Guardian, or BBC Sport — confident, insightful, with a strong narrative voice that makes readers feel they're getting insider analysis
- Your article MUST be 1800-2500 words. This is a premium long-read, not a news brief. Every section should have depth.
- NEVER start with generic AI openers like "In a move that...", "The football world is...", "In the ever-evolving..." — start with a concrete, vivid scene, a striking stat, or a bold analytical statement
- NEVER write filler paragraphs that say "details are scarce" or "information is limited" or "it remains unclear" — if you don't have specific information about something, write about what you DO know: the team's season, the tactical context, the broader narrative
- Every single paragraph must ADD new information or analysis — zero filler, zero restating, zero padding
- Use specific football knowledge: discuss formations (4-3-3, 3-5-2), pressing systems, buildup play, defensive structures, transition play, set-piece routines
- Reference the Premier League table, recent form, and key players by name — use the VERIFIED DATA if provided
- Include tactical depth: how does this signing/result/development affect the team's system? What changes tactically?

STRUCTURE REQUIREMENTS:
- 5-6 h2 sections minimum, each exploring a genuinely different angle (not just rewording the same point)
- For MATCH REPORTS: The Match (key moments), Tactical Analysis (formations, pressing, buildup), Key Performers, The Manager's Perspective, What This Means for the Table, Looking Ahead
- For TRANSFERS: The Deal, Player Profile & Style of Play, Tactical Fit, What This Means for the Squad, The Financial Picture, How They Compare
- For ANALYSIS: include data tables where relevant using <table> tags
- Include 2-3 blockquotes from source material with proper attribution (manager quotes, player quotes)
- Include 2-3 pull quotes — the most striking analytical lines from YOUR writing
- Write 8-12 paragraphs per section, not 1-2

STYLE:
- Vary sentence length dramatically — mix punchy 5-word sentences with longer 30-word analytical ones
- Use strong verbs: "carved", "dismantled", "orchestrated" not "had", "got", "made"
- Paint pictures: describe the atmosphere, the reactions, the body language when relevant
- Reference historical context: previous meetings, past seasons, club history
- NEVER use cliches: "only time will tell", "remains to be seen", "football is a funny game", "a statement of intent", "the beautiful game"
- NEVER write "In conclusion" or have a section called "Conclusion" — end with a forward-looking analytical paragraph that feels natural

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

  const researchSection = research && research.summary
    ? `\n\nRESEARCHED SOURCE MATERIAL (use ONLY these facts):\n${research.summary}`
    : '';

  const prompt = `Write a full article about this topic:
Title: ${topic.title}
Angle: ${topic.angle}
Category: ${topic.category}
Source headline: ${newsItem.title}
Source description: ${newsItem.description}
${researchSection}

IMPORTANT INSTRUCTIONS:
- Write 1800-2500 words minimum. This must be a premium long-form article with real depth and analysis.
- Use ONLY facts, quotes, scores, and stats from the source material above. Do NOT invent anything.
- If you have verified standings/results data, weave it naturally into the article (e.g. "sitting 4th on 45 points" or "their third win in five matches").
- Include at least 5 h2 sections with substantial content in each.
- Every paragraph must contain specific information — NEVER write filler like "details are yet to emerge" or "it remains to be seen".
- Write with the confidence and insight of a journalist who has watched every minute of this team's season.`;

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

// ─── Post-Generation Fact Check ──────────────────────────────────────────────

async function factCheckArticle(article, footballData, research) {
  console.log('[Scout] Fact-checking article against verified data...');

  // Step 1: Extract key claims to verify via web search
  let webVerification = '';
  try {
    const claimsPrompt = `Extract the 3-5 most important factual claims from this article that should be verified. Focus on: match scores, transfer fees, league positions, player stats, and specific quotes.

ARTICLE: ${article.bodyHTML.slice(0, 3000)}

Return ONLY a JSON array of short search queries to verify each claim. Example: ["Liverpool 4-1 Newcastle result January 2026", "Mohamed Salah Premier League goals 2025-26"]`;

    const claimsResult = await callLLM(claimsPrompt, 'Extract key factual claims as search queries. Return only a JSON array.');
    const claimsMatch = claimsResult.match(/\[[\s\S]*\]/);
    if (claimsMatch) {
      const queries = JSON.parse(claimsMatch[0]);
      console.log(`[Scout]   Verifying ${queries.length} key claims via web search...`);
      for (const query of queries.slice(0, 4)) {
        const results = await webSearch(query, 3);
        for (const r of results) {
          if (r.snippet) {
            webVerification += `\nSearch "${query}": ${r.snippet}`;
          }
        }
      }
    }
  } catch (e) {
    console.log(`[Scout]   ⚠ Claim extraction failed: ${e.message}`);
  }

  // Step 2: Build verification data
  let verificationData = '';
  if (footballData) {
    verificationData += formatFootballDataForPrompt(footballData);
  }
  if (research && research.summary) {
    verificationData += '\n\nSOURCE MATERIAL:\n' + research.summary.slice(0, 3000);
  }
  if (webVerification) {
    verificationData += '\n\nWEB SEARCH VERIFICATION RESULTS:\n' + webVerification;
  }

  if (!verificationData) return article;

  // Step 3: Run fact-check
  const prompt = `You are a strict fact-checker for a Premier League news site. Review this article and fix ANY factual errors.

ARTICLE TITLE: ${article.title}

ARTICLE BODY:
${article.bodyHTML}

VERIFIED DATA TO CHECK AGAINST:
${verificationData}

INSTRUCTIONS:
1. Check ALL match scores mentioned — do they match the verified results and web search results?
2. Check ALL league positions and points — do they match the standings?
3. Check ALL goal scorer claims — are they verified by the data?
4. Check ALL quotes — are they from the source material? Remove any fabricated quotes.
5. Check ALL transfer fees, contract lengths, and specific numbers against web search results.
6. Remove or correct any stat, score, position, or quote that contradicts the verified data.
7. If a claim cannot be verified, rephrase it to be vaguer rather than leaving a specific but potentially wrong number.
8. Do NOT shorten the article. Maintain the same length and quality.

Return ONLY the corrected bodyHTML. If no changes needed, return the original bodyHTML unchanged. Return raw HTML only, no wrapping, no explanation.`;

  try {
    let corrected = await callLLM(prompt, 'You are a meticulous football fact-checker. Fix errors, preserve writing style and length. Return only HTML.');
    corrected = stripMarkdownFences(corrected);
    if (corrected && corrected.length > 200) {
      if (corrected.includes('<p>') && corrected.length > article.bodyHTML.length * 0.5) {
        console.log('[Scout] ✓ Fact-check complete — article verified/corrected');
        article.bodyHTML = corrected;
      } else {
        console.log('[Scout] ⚠ Fact-check returned unusual output — keeping original');
      }
    }
  } catch (e) {
    console.log(`[Scout] ⚠ Fact-check failed: ${e.message} — keeping original`);
  }

  return article;
}

// ─── Markdown Fence Stripping ────────────────────────────────────────────────

function stripMarkdownFences(text) {
  if (!text) return text;
  // Remove ```html, ```json, ```xml, ``` etc. wrapping from LLM output
  return text.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

// ─── Real Related Articles from articles.json ───────────────────────────────

function getRelatedArticles(currentTitle, currentCategory, currentTags, maxCount = 3) {
  try {
    const articlesPath = path.join(ROOT, 'articles.json');
    if (!fs.existsSync(articlesPath)) return [];
    const allArticles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

    // Score each article by relevance
    const scored = allArticles
      .filter(a => a.title !== currentTitle)
      .map(a => {
        let score = 0;
        const titleWords = (currentTitle || '').toLowerCase().split(/\s+/);
        const aTitleWords = (a.title || '').toLowerCase().split(/\s+/);
        // Same category boost
        if (currentCategory && a.title) {
          const catLower = currentCategory.toLowerCase();
          if (a.description && a.description.toLowerCase().includes(catLower)) score += 3;
        }
        // Shared title keywords (skip common words)
        const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','is','it','by','as','with','from','this','that','after','has','have','had','was','were','be','been','are','its','can','could','will','would','not','no','so','up','out','if','about','into','over','than','how','what','who','which','when','where','why','all','their','there','they','we','our','your','his','her','new','more','some','do','did','does','also','most','just','any','other','very','back','been','over']);
          titleWords.forEach(w => {
          if (w.length > 2 && !stopWords.has(w) && aTitleWords.includes(w)) score += 2;
        });
        // Tag match
        if (currentTags && currentTags.length) {
          currentTags.forEach(tag => {
            if (a.title && a.title.toLowerCase().includes(tag.toLowerCase())) score += 2;
          });
        }
        // Recency boost
        if (a.date) {
          const daysDiff = Math.abs((new Date() - new Date(a.date)) / 86400000);
          if (daysDiff < 3) score += 2;
          else if (daysDiff < 7) score += 1;
        }
        return { ...a, score };
      })
      .filter(a => a.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCount);

    return scored;
  } catch (e) {
    console.log('[Scout] Could not load related articles:', e.message);
    return [];
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
            body::before, body::after { display: none !important; }
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
            .article-ad-container:nth-of-type(even) { display: none !important; }
            .adsbygoogle { min-height: 100px !important; max-height: 280px !important; margin: 16px auto !important; }
            html, body { overflow-x: hidden; }
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
            ${stripMarkdownFences(article.bodyHTML)}
        </div>

        <!-- Inline Promo: Transfer Simulator -->
        <aside style="margin: 64px 0; padding: 32px; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%); border-radius: 16px; border: 1px solid #2a2a3e; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; right: 0; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 6px 16px; border-radius: 0 16px 0 12px; font-family: Inter, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Featured Tool</div>
            <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 28px; flex-shrink: 0; box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);">&#9917;</div>
                <div style="flex: 1; min-width: 200px;">
                    <h3 style="font-family: Inter, sans-serif; font-size: 18px; font-weight: 800; color: #f5f5f5; margin: 0 0 6px;">Transfer Simulator Pro</h3>
                    <p style="font-family: Inter, sans-serif; font-size: 14px; color: #a0a0b0; margin: 0; line-height: 1.5;">Build your perfect squad with AI-powered transfer recommendations and real-time price tracking.</p>
                </div>
                <a href="/transfer-simulator-pro.html" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 10px; font-family: Inter, sans-serif; font-size: 14px; font-weight: 700; white-space: nowrap; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(102,126,234,0.4)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 16px rgba(102,126,234,0.3)'">Try Free &#8594;</a>
            </div>
        </aside>

        <!-- Related Articles (Real) -->
        <aside class="related-articles">
            <h2 class="related-title">More from EPL News Hub</h2>
${(() => {
  const related = getRelatedArticles(article.title, article.category, article.tags || []);
  if (!related.length) return '';
  return related.map(r => {
    const rDate = r.date ? new Date(r.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const rImage = r.image || '/eplnewshubnewlogo.png';
    return `
            <article class="related-item" style="display: flex; gap: 16px; align-items: center;">
                <a href="/articles/${r.file}" style="display: flex; gap: 16px; align-items: center; text-decoration: none; color: inherit; width: 100%;">
                    <img src="${rImage}" alt="" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" loading="lazy">
                    <div>
                        <h3 class="related-item-title">${r.title}</h3>
                        <div class="related-item-meta">${rDate}</div>
                    </div>
                </a>
            </article>`;
  }).join('');
})()}
        </aside>

        <!-- Inline Promo: FPL AI Assistant -->
        <aside style="margin: 48px 0 0; padding: 28px 32px; background: linear-gradient(135deg, #37003c, #4a0e4e); border-radius: 16px; position: relative; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #00ff87, #60efaa); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">&#129302;</div>
                <div style="flex: 1; min-width: 180px;">
                    <h3 style="font-family: Inter, sans-serif; font-size: 16px; font-weight: 800; color: #ffffff; margin: 0 0 4px;">FPL AI Assistant</h3>
                    <p style="font-family: Inter, sans-serif; font-size: 13px; color: rgba(255,255,255,0.8); margin: 0; line-height: 1.4;">Get captain picks, transfer advice, and differential tips powered by AI.</p>
                </div>
                <a href="/fpl-ai-assistant.html" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #00ff87, #60efaa); color: #37003c; text-decoration: none; border-radius: 10px; font-family: Inter, sans-serif; font-size: 13px; font-weight: 700; white-space: nowrap; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">Try Free &#8594;</a>
            </div>
        </aside>

        <!-- Comments Section -->
        <section style="margin-top: 64px; padding-top: 48px; border-top: 2px solid #2a2a2a;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 32px;">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #333, #444); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">&#128172;</div>
                <div>
                    <h2 style="font-family: 'Inter', sans-serif; font-size: 22px; font-weight: 800; color: #f5f5f5; margin: 0;">Join the Discussion</h2>
                    <p style="font-family: 'Inter', sans-serif; font-size: 13px; color: #888; margin: 4px 0 0;">Share your thoughts on this article</p>
                </div>
            </div>
            <div style="background: linear-gradient(145deg, #1e1e1e, #252525); padding: 32px; border-radius: 12px; border: 1px solid #333;">
                <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">Comment Box</a> is loading comments...</div>
                <link rel="stylesheet" type="text/css" href="https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0" />
                <script type="text/javascript" id="hcb"> if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/['"]/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%24w8ot526O1NwJSxpfQ4Tqd0"+"&opts=16798&num=10&ts=1737000000000");if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); </script>
            </div>
            <style>
                #HCB_comment_box .hcb-comment-hdr, #HCB_comment_box textarea, #HCB_comment_box input { background: #2a2a2a !important; color: #f5f5f5 !important; border-color: #444 !important; border-radius: 8px !important; }
                #HCB_comment_box .hcb-comment { background: #222 !important; border-color: #333 !important; border-radius: 8px !important; margin-bottom: 12px !important; }
                #HCB_comment_box a { color: #a0a0ff !important; }
                #HCB_comment_box .hcb-submit { background: linear-gradient(135deg, #37003c, #4a0e4e) !important; color: white !important; border: none !important; border-radius: 8px !important; padding: 10px 24px !important; font-weight: 700 !important; cursor: pointer !important; }
                #HCB_comment_box .hcb-submit:hover { background: linear-gradient(135deg, #4a0e4e, #37003c) !important; }
            </style>
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
  writeScoutPid('batch');
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

  // Step 2: Pick topics (request extras as backups in case some fail research)
  console.log('[Scout] Selecting best topics via AI...');
  let topics;
  try { topics = await pickTopics(news, count + 5); }
  catch (e) { console.error('[Scout] Topic selection failed:', e.message); return; }

  console.log(`[Scout] Selected ${topics.length} topic(s) (need ${count}, extras are backups):\n`);
  topics.forEach((t, i) => console.log(`  ${i + 1}. [${t.category}] ${t.title}`));
  console.log('');

  // Step 2.5: Fetch real football data for fact verification
  console.log('[Scout] Fetching real-time football data...');
  const footballData = await fetchFootballData();

  // Step 3: Generate each article (stop once we've published enough)
  const publishedTitles = [];
  for (const topic of topics) {
    if (publishedTitles.length >= count) break; // already published enough

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

      // Duplicate check — skip if too similar to a recent article OR one published in this batch
      const recentTitles = [...getRecentArticleTitles(), ...publishedTitles];
      const topicWords = topic.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
      // Also extract key entities (team names, player names) for stricter matching
      const topicEntities = topic.title.replace(/[^a-zA-Z ]/g, '').split(' ')
        .filter(w => w.length > 3 && w[0] === w[0].toUpperCase()).map(w => w.toLowerCase());
      const isDuplicate = recentTitles.some(recent => {
        const recentWords = recent.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3);
        const recentEntities = recent.replace(/[^a-zA-Z ]/g, '').split(' ')
          .filter(w => w.length > 3 && w[0] === w[0].toUpperCase()).map(w => w.toLowerCase());
        const wordOverlap = topicWords.filter(w => recentWords.includes(w)).length;
        const entityOverlap = topicEntities.filter(e => recentEntities.includes(e)).length;
        // Similar if 2+ key entities match (e.g. same team + same player) OR 3+ general words match
        return entityOverlap >= 2 || wordOverlap >= 3;
      });
      if (isDuplicate) {
        console.log(`[Scout] Skipping "${topic.title}" — too similar to a recent article`);
        continue;
      }

      // Research: scrape sources and gather verified facts
      const research = await researchTopic(topic, newsItem);

      // Quality gate: skip topics with insufficient source material
      // Need at least one scraped source with real content (>200 chars), not just the Google News description
      const scrapedSources = research.sources ? research.sources.filter(s => s.origin !== 'Google News summary') : [];
      const hasRealContent = scrapedSources.some(s => s.text && s.text.length > 200);
      const totalSourceChars = research.sources ? research.sources.reduce((sum, s) => sum + (s.text ? s.text.length : 0), 0) : 0;
      if (!hasRealContent && totalSourceChars < 500) {
        console.log(`[Scout] Skipping "${topic.title}" — insufficient source material (${totalSourceChars} chars total), trying next topic`);
        continue;
      }

      // Append real football data to research
      const footballDataText = formatFootballDataForPrompt(footballData);
      if (footballDataText) {
        research.summary += footballDataText;
      }

      console.log(`[Scout] Generating article: ${topic.title}...`);
      let article = await generateArticle(topic, newsItem, research);

      // Fact-check: verify article against real data
      article = await factCheckArticle(article, footballData, research);

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

      // Step 11: Request Google indexing
      const articleUrl = `https://www.eplnewshub.com/articles/${filename}`;
      await requestIndexing(articleUrl);
    } catch (e) {
      console.error(`[Scout] Failed to generate article for "${topic.title}":`, e.message);
    }
  }

  // Step 12: Generate match predictions
  try {
    await generateMatchPredictions();
  } catch (e) {
    console.error('[Scout] Match predictions failed:', e.message);
  }

  // Step 12: Push to GitHub
  if (publishedTitles.length > 0) {
    gitPush(publishedTitles);
  }

  clearScoutPid();
  console.log('[Scout] Run complete!');
}

// ─── Daemon Mode ─────────────────────────────────────────────────────────────

function startDaemon() {
  writeScoutPid('daemon');
  process.on('exit', clearScoutPid);
  process.on('SIGINT', () => { clearScoutPid(); process.exit(0); });
  process.on('SIGTERM', () => { clearScoutPid(); process.exit(0); });
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

// ─── Google Indexing API ─────────────────────────────────────────────────────

async function requestIndexing(articleUrl) {
  try {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.log('[Scout] No service account key found, skipping indexing request.');
      return;
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
    console.log(`[Scout] Indexing requested for ${articleUrl} — status ${res.status}`);
  } catch (e) {
    console.error(`[Scout] Indexing request failed for ${articleUrl}: ${e.message}`);
  }
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

  const systemPrompt = `You are an elite football analyst and data scientist providing match predictions for EPL News Hub. Give realistic, data-informed predictions with detailed probabilistic analysis.

Return ONLY a JSON array of objects, one per match, with these fields:

CORE PREDICTION:
- "homeTeam": exact team name as given
- "awayTeam": exact team name as given
- "predictedScore": {"home": number, "away": number}
- "winner": "home", "away", or "draw"
- "confidence": number 50-95 (how confident in the prediction)
- "analysis": 2-3 sentences of tactical analysis explaining the prediction

PROBABILITIES (must add to 100):
- "homeWinPct": percentage chance of home win (integer)
- "drawPct": percentage chance of draw (integer)
- "awayWinPct": percentage chance of away win (integer)
- "bttsYesPct": percentage chance both teams score (integer 0-100)
- "over25Pct": percentage chance of over 2.5 goals (integer 0-100)

FORM & HISTORY:
- "formHome": last 5 results string e.g. "WWDLW" (most recent first)
- "formAway": last 5 results string e.g. "LDWWW" (most recent first)
- "h2hSummary": head-to-head recent record string e.g. "Home 3W-1D-1L in last 5 meetings"
- "homeLeaguePosition": current league position number
- "awayLeaguePosition": current league position number

TEAM STATS (per game this season, 1 decimal):
- "homeGoalsPerGame": average goals scored
- "awayGoalsPerGame": average goals scored
- "homeConcededPerGame": average goals conceded
- "awayConcededPerGame": average goals conceded
- "homeXGPerGame": expected goals per game
- "awayXGPerGame": expected goals per game
- "homePossessionPct": average possession percentage (integer)
- "awayPossessionPct": average possession percentage (integer)
- "homeShotsPerGame": average shots per game (1 decimal)
- "awayShotsPerGame": average shots per game (1 decimal)
- "homeCleanSheetPct": percentage of games with clean sheet (integer)
- "awayCleanSheetPct": percentage of games with clean sheet (integer)

PLAYERS:
- "keyPlayerHome": standout player name + short reason e.g. "Cole Palmer — 12 goals, lethal from set pieces"
- "keyPlayerAway": standout player name + short reason
- "injuriesHome": array of 1-3 strings with notable absentees e.g. ["Reece James (knee)", "Romeo Lavia (hamstring)"]
- "injuriesAway": array of 1-3 strings with notable absentees

TACTICAL ANALYSIS:
- "homeFormation": e.g. "4-2-3-1"
- "awayFormation": e.g. "4-3-3"
- "tacticalMatchup": 2-3 sentences on how formations and styles interact
- "keyBattles": array of 2-3 strings, each a player-vs-player matchup
- "strengthsHome": array of 2-3 short strings e.g. ["Set piece delivery", "Pressing intensity"]
- "strengthsAway": array of 2-3 short strings
- "weaknessesHome": array of 1-2 short strings e.g. ["Vulnerable on the counter"]
- "weaknessesAway": array of 1-2 short strings

SCORELINE PROBABILITIES:
- "likelyScorelines": array of 3 objects, each {"score": "2-1", "pct": 18} — the 3 most likely exact scorelines with percentage chance

MATCH FLOW:
- "halfTimePrediction": predicted half-time score string e.g. "1-0"
- "firstGoalTeam": "home", "away", or "either" — who scores first
- "matchTempoRating": number 1-10 (1=dull low-tempo, 10=frantic end-to-end)
- "dangerRating": number 1-5 (1=safe banker, 5=giant-killing potential/major upset risk)

ADDITIONAL MARKETS:
- "over15Pct": percentage chance of over 1.5 goals (integer 0-100)
- "over35Pct": percentage chance of over 3.5 goals (integer 0-100)
- "homeCleanSheetChance": percentage chance home keeps clean sheet (integer 0-100)
- "awayCleanSheetChance": percentage chance away keeps clean sheet (integer 0-100)
- "totalCornersEstimate": estimated total corners in the match (number e.g. 10.5)
- "totalCardsEstimate": estimated total cards in the match (number e.g. 3.5)

REASONING:
- "reasonsForPrediction": array of 3-4 sentences, each a distinct reason why you picked this result (reference stats, form, h2h, tactical factors)
- "verdict": punchy 1-sentence final call on the match

Be realistic with scores (most PL games are 0-0 to 4-2 range). Vary your predictions — don't predict all home wins. Consider current form, injuries, head-to-head records. Make probabilities realistic and nuanced — most matches aren't 80%+ for one side. Scoreline probabilities should be realistic — most individual scorelines are 8-20% likely.`;

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
  node article-scout.js --predictions Generate match predictions only (no articles)
  node article-scout.js --status     Show today's scout status
  node article-scout.js --help       Show this help

Requirements:
  Add GROQ_API_KEY to your .env file (free at console.groq.com)
`);
} else if (args.includes('--status')) {
  const log = getScoutLog();
  const today = new Date().toISOString().split('T')[0];
  const todayCount = log.today === today ? log.todayCount : 0;
  const pidInfo = getScoutPidInfo();

  // Check GitHub Actions workflow status (the real persistent scheduler)
  let ghWorkflowStatus = null;
  try {
    const ghOutput = execSync('gh workflow list --all 2>/dev/null || true', { encoding: 'utf-8', timeout: 10000 });
    const scoutLine = ghOutput.split('\n').find(l => l.includes('Article Scout'));
    if (scoutLine) {
      ghWorkflowStatus = scoutLine.includes('active') ? 'active' : 'disabled';
    }
  } catch (e) { /* gh CLI not available or not authed */ }

  console.log(`\nArticle Scout Status`);
  console.log(`━━━━━━━━━━━━━━━━━━━`);

  // Scheduled (GitHub Actions) — the persistent always-on scheduler
  if (ghWorkflowStatus === 'active') {
    console.log(`Scheduler: 🟢 ACTIVE (GitHub Actions — runs 4x daily at 8am/12pm/4pm/8pm UTC)`);
    console.log(`           Articles auto-publish even when your laptop is closed`);
  } else if (ghWorkflowStatus === 'disabled') {
    console.log(`Scheduler: 🔴 DISABLED (GitHub Actions workflow is disabled)`);
    console.log(`           Run: gh workflow enable "Article Scout" to re-enable`);
  } else {
    console.log(`Scheduler: ⚠️  UNKNOWN (install gh CLI and run 'gh auth login' to check)`);
    console.log(`           GitHub Actions should be running at github.com/reidwcoleman/eplnewshub.com/actions`);
  }

  // Local process — only relevant if running locally right now
  if (pidInfo) {
    const elapsed = Math.round((Date.now() - new Date(pidInfo.startedAt).getTime()) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    console.log(`Local:     🟢 Running locally too (${pidInfo.mode} mode, PID ${pidInfo.pid}, ${mins}m ${secs}s)`);
  }

  console.log(`\nToday:     ${todayCount}/${CONFIG.maxArticlesPerDay} articles published`);
  console.log(`Last run:  ${log.lastRun || 'Never'}`);

  // Next scheduled run estimate
  const now = new Date();
  const scheduleHours = [8, 12, 16, 20]; // UTC
  const currentHourUTC = now.getUTCHours();
  let nextHour = scheduleHours.find(h => h > currentHourUTC);
  const nextRun = new Date(now);
  if (nextHour !== undefined) {
    nextRun.setUTCHours(nextHour, 0, 0, 0);
  } else {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
    nextRun.setUTCHours(scheduleHours[0], 0, 0, 0);
  }
  const minsUntil = Math.round((nextRun - now) / 60000);
  const hoursUntil = Math.floor(minsUntil / 60);
  const minsRemainder = minsUntil % 60;
  console.log(`Next run:  ~${hoursUntil}h ${minsRemainder}m (${nextRun.toUTCString()})`);

  if (log.articles && log.articles.length > 0) {
    console.log(`\nRecent articles:`);
    log.articles.slice(0, 5).forEach(a => {
      console.log(`  [${a.category}] ${a.title} (${a.date})`);
    });
  }
  console.log('');
} else if (args.includes('--predictions')) {
  (async () => {
    writeScoutPid('predictions');
    try {
      loadEnv();
      console.log('═══════════════════════════════════════════════');
      console.log('  EPL News Hub - Match Predictions');
      console.log('  ' + new Date().toLocaleString());
      console.log('═══════════════════════════════════════════════\n');
      await generateMatchPredictions();
      gitPush(['Match predictions updated']);
      clearScoutPid();
      console.log('[Scout] Predictions run complete!');
    } catch (e) {
      clearScoutPid();
      console.error('[Scout] Predictions failed:', e.message);
      process.exit(1);
    }
  })();
} else if (args.includes('--daemon')) {
  startDaemon();
} else if (args.includes('--batch')) {
  const numArg = args.find(a => /^\d+$/.test(a));
  const count = numArg ? parseInt(numArg) : Math.floor(Math.random() * (CONFIG.maxArticlesPerDay - CONFIG.minArticlesPerDay + 1)) + CONFIG.minArticlesPerDay;
  runScout(count).catch(e => { console.error('[Scout] Fatal:', e); process.exit(1); });
} else {
  runScout(1).catch(e => { console.error('[Scout] Fatal:', e); process.exit(1); });
}
