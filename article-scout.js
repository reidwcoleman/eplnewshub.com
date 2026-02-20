#!/usr/bin/env node
/**
 * EPL News Hub - Automated Article Scout
 *
 * Fetches latest soccer/football news, generates full articles via AI,
 * creates HTML files, cascades homepage headlines, updates articles.json
 * and sitemap.xml. Designed to run 2-5 articles per day on a cron schedule.
 *
 * CONTENT POLICY: Only publishes articles about real-world soccer/football.
 * Articles must be backed by verified source material. If there is not
 * enough information to write a factually accurate article, it will not
 * be published.
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
      const html = await res.text();

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
    const xml = await res.text();
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
    'EPL transfer news football',
    'Premier League match results highlights',
    'Premier League match preview this week',
    'Premier League tactical analysis football',
    'Premier League player performance stats goals assists',
    'Premier League injury team news squad',
    'Champions League football latest news',
    'Premier League weekend preview predictions',
    'Premier League title race relegation battle football'
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

  // Filter out non-soccer content — only keep items clearly about football/soccer
  const soccerKeywords = [
    'premier league', 'epl', 'football', 'soccer', 'fc', 'united', 'city',
    'arsenal', 'chelsea', 'liverpool', 'tottenham', 'spurs', 'everton',
    'newcastle', 'aston villa', 'west ham', 'brighton', 'brentford',
    'fulham', 'crystal palace', 'bournemouth', 'wolves', 'nottingham forest',
    'ipswich', 'leicester', 'southampton', 'leeds', 'transfer', 'manager',
    'coach', 'goal', 'assist', 'match', 'fixture', 'league', 'cup',
    'champions league', 'europa league', 'fa cup', 'carabao', 'efl',
    'midfielder', 'striker', 'defender', 'goalkeeper', 'winger',
    'la liga', 'serie a', 'bundesliga', 'ligue 1', 'world cup', 'euros',
    'international', 'cap', 'squad', 'lineup', 'formation', 'tactics',
    'penalty', 'red card', 'yellow card', 'var', 'offside', 'referee',
    'relegation', 'promotion', 'clean sheet', 'hat trick', 'derby',
    'kickoff', 'kick-off', 'half-time', 'full-time', 'injury', 'fitness',
    'real madrid', 'barcelona', 'bayern', 'psg', 'juventus', 'inter milan',
    'dortmund', 'atletico', 'napoli', 'benfica', 'porto', 'ajax',
    'mls', 'world cup', 'fifa', 'uefa', 'conmebol'
  ];
  const nonSoccerKeywords = [
    'gaming', 'ea fc', 'ea sports fc', 'football manager', 'video game',
    'esports', 'e-sports', 'playstation', 'xbox', 'nintendo', 'steam',
    'console', 'nfl', 'nba', 'mlb', 'nhl', 'cricket', 'rugby',
    'tennis', 'golf', 'boxing', 'ufc', 'mma', 'f1', 'formula 1',
    'basketball', 'baseball', 'american football', 'super bowl',
    'fantasy football draft', 'fpl draft simulator'
  ];

  const soccerItems = unique.filter(item => {
    const text = (item.title + ' ' + item.description).toLowerCase();
    // Reject items that match non-soccer keywords
    if (nonSoccerKeywords.some(kw => text.includes(kw))) return false;
    // Keep items that match at least one soccer keyword
    return soccerKeywords.some(kw => text.includes(kw));
  });

  console.log(`[Scout] Found ${unique.length} unique news items, ${soccerItems.length} are soccer-related`);
  return soccerItems.slice(0, 20);
}

// ─── AI Article Generation ───────────────────────────────────────────────────

// LLM providers — cycles through if one hits rate limits
// All have generous free tiers. Ordered by quality + free limits.
const LLM_PROVIDERS = [
  // Mistral: 1 billion tokens/month free — primary provider
  {
    name: 'Mistral (Mistral Small)',
    envKey: 'MISTRAL_API_KEY',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
    maxTokens: 4096,
  },
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
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  // Combine scout-log AND articles.json for maximum coverage
  const titles = new Set();
  const log = getScoutLog();
  (log.articles || []).filter(a => a.date >= twoWeeksAgo).forEach(a => titles.add(a.title));
  try {
    const articlesJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'articles.json'), 'utf-8'));
    articlesJson.filter(a => a.date >= twoWeeksAgo).forEach(a => titles.add(a.title));
  } catch (e) { /* ignore */ }
  return [...titles];
}

// Normalise a title for comparison: lowercase, strip punctuation, remove filler words
function normaliseTitle(title) {
  const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','is','it','by','as','with','from','this','that','after','has','have','had','was','were','be','been','are','its','can','could','will','would','not','no','so','up','out','if','about','into','over','than','how','what','who','which','when','where','why','all','their','there','they','we','our','your','his','her','new','more','some','do','did','does','also','most','just','any','other','very','back','live','result','updates','latest','news','premier','league','vs']);
  return title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
}

// Extract proper-noun entities (capitalised words) from original title
// Excludes generic football terms that appear in almost every headline
function extractEntities(title) {
  const genericTerms = new Set(['premier','league','football','soccer','transfer','news','latest','update','updates','rumours','rumors','gossip','live','breaking','reports','analysis','preview','review','results','deals','match','cup','champions','europa','championship','english','scottish','wsl','women']);
  return title.replace(/[^a-zA-Z ]/g, '').split(/\s+/)
    .filter(w => w.length > 2 && w[0] === w[0].toUpperCase() && w !== w.toUpperCase())
    .map(w => w.toLowerCase())
    .filter(w => !genericTerms.has(w));
}

// Check if a candidate title is too similar to any title in a list
function isTooSimilar(candidateTitle, existingTitles) {
  const candidateWords = normaliseTitle(candidateTitle);
  const candidateEntities = extractEntities(candidateTitle);
  for (const existing of existingTitles) {
    const existWords = normaliseTitle(existing);
    const existEntities = extractEntities(existing);
    // Entity overlap: if 3+ proper nouns match (specific names, clubs, players)
    const entityOverlap = candidateEntities.filter(e => existEntities.includes(e)).length;
    if (entityOverlap >= 3) return true;
    // Word overlap: if >50% of meaningful words match AND at least 4 words overlap
    const wordOverlap = candidateWords.filter(w => existWords.includes(w)).length;
    const overlapRatio = candidateWords.length > 0 ? wordOverlap / candidateWords.length : 0;
    if (wordOverlap >= 4 && overlapRatio >= 0.5) return true;
  }
  return false;
}

async function pickTopics(newsItems, count) {
  const headlines = newsItems.map((n, i) => `${i + 1}. ${n.title}`).join('\n');
  const recentTitles = getRecentArticleTitles();
  const recentList = recentTitles.length > 0
    ? `\n\nARTICLES ALREADY PUBLISHED IN THE LAST 2 WEEKS (DO NOT pick similar topics):\n${recentTitles.map(t => '- ' + t).join('\n')}`
    : '';

  const systemPrompt = `You are an editorial assistant for EPL News Hub. Pick the ${count} most interesting AND DIVERSE stories.

CRITICAL RULE — SOCCER ONLY:
- Every story MUST be about real-world soccer/football (the sport played on a pitch with a ball and goals).
- NEVER pick stories about video games, gaming, esports, EA FC, Football Manager, fantasy draft simulators, or any non-soccer topic.
- NEVER pick stories about other sports (NFL, NBA, cricket, rugby, tennis, etc.).
- If a headline is ambiguous or could be about gaming/non-soccer, DO NOT pick it.

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
    const html = await res.text();

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
    if (text && text.length > 100) {
      content.push({ origin: r.title, text: text.slice(0, 3000) });
      scraped++;
      console.log(`[Scout]   ✓ Scraped search result: ${r.title.slice(0, 50)}... (${text.length} chars)`);
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);
    const html = await res.text();

    // Try to extract article body first (more relevant content)
    let articleText = '';
    const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
    const bodySource = articleMatch ? articleMatch[0] : (mainMatch ? mainMatch[0] : html);

    // Extract text content — strip non-content elements, then tags
    articleText = bodySource
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<figure[\s\S]*?<\/figure>/gi, '')
      .replace(/<form[\s\S]*?<\/form>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return articleText.slice(0, 6000);
  } catch (e) {
    console.log(`[Scout] Failed to scrape ${url.slice(0, 60)}...: ${e.message}`);
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
      if (text && text.length > 100) {
        sources.push({ origin: item.title, text: text.slice(0, 3000) });
        scraped++;
        console.log(`[Scout]   ✓ Scraped additional source: ${item.title.slice(0, 60)}... (${text.length} chars)`);
      }
    }
  } catch (e) {
    console.log(`[Scout]   ⚠ Additional source search failed: ${e.message}`);
  }

  // 2.5. Web search for additional facts (always run to supplement sources, especially when direct scraping is blocked)
  const scrapedContentSoFar = sources.filter(s => s.origin !== 'Google News summary').reduce((sum, s) => sum + s.text.length, 0);
  {
    console.log(`[Scout]   ${scrapedContentSoFar} chars of scraped content so far — running web search for more...`);
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
6. CONFIDENCE ASSESSMENT: At the end, rate the overall quality of available information on a scale of 1-10 (1 = no facts at all, 10 = comprehensive verified coverage). Only state "INSUFFICIENT_SOURCES" on the last line if the rating is 1 — meaning there are literally zero usable facts. If there are any real facts (scores, names, dates, quotes, stats), even from search snippets, rate at least 2 and do NOT flag insufficient sources.

Format as a clear bullet-point summary. Only include facts that appear in the source material. If sources contradict each other, note the disagreement.`;

  try {
    const summary = await callLLM(summaryPrompt, 'You extract verified facts from news sources. Be precise and factual. Never invent information.');
    console.log(`[Scout]   ✓ Research summary compiled (${sources.length} sources)`);
    // Check if the AI flagged insufficient sources
    if (summary.includes('INSUFFICIENT_SOURCES')) {
      console.log(`[Scout]   ⚠ Research AI flagged insufficient source quality`);
      return { sources, summary, insufficientSources: true };
    }
    return { sources, summary };
  } catch (e) {
    console.log(`[Scout]   ⚠ Research summary failed: ${e.message}`);
    // Fall back to raw source text
    return { sources, summary: sourceTexts.slice(0, 4000) };
  }
}

// ─── Article Generation ─────────────────────────────────────────────────────

async function generateArticle(topic, newsItem, research) {
  const systemPrompt = `You are a senior sports journalist writing for EPL News Hub — a respected Premier League publication in the style of The Athletic. You write with authority, depth, and storytelling flair. You sound like a confident insider who has watched every minute of every match this season.

ABSOLUTE REQUIREMENT — SOCCER ONLY:
- You write EXCLUSIVELY about real-world soccer/football (the sport played on a pitch).
- NEVER write about video games, gaming, esports, EA FC, Football Manager, fantasy draft tools, or any non-soccer topic.
- If the topic is not clearly about real soccer, DO NOT write the article.

CRITICAL ACCURACY RULES — READ CAREFULLY:
- You have been given RESEARCHED SOURCE MATERIAL below. ONLY use facts, stats, quotes, and scores that appear in this source material.
- NEVER invent match scores, transfer fees, quotes, or statistics. If the source material doesn't contain a specific fact, DO NOT make it up.
- If you're unsure about a specific stat or detail, omit it rather than guess. Vague but correct is better than specific but wrong.
- Quotes MUST come from the source material. If a quote is attributed to someone in the sources, use it. Do NOT fabricate quotes.
- Match scores, league positions, and points totals MUST match the source material exactly.
- If writing about a future match (preview), clearly frame predictions as analysis, not fact.
- If VERIFIED REAL-TIME DATA is provided (standings, results, scorers), those numbers are from an official API — trust them above all other sources.
- If the source material is insufficient to write an accurate, well-sourced article, return a JSON object with "insufficientData": true and "reason": "explanation" instead of generating a low-quality article.

═══════════════════════════════════════════════════════════
BANNED PHRASES — NEVER USE ANY OF THESE (instant quality failure):
═══════════════════════════════════════════════════════════
- "only time will tell"
- "remains to be seen"
- "a match for the ages"
- "the beautiful game"
- "the stakes are high"
- "at the top of their game"
- "promises to be"
- "the atmosphere will be electric"
- "it remains unclear"
- "details are scarce"
- "information is limited"
- "no data on this topic"
- "there is no information"
- "In a move that..."
- "In the ever-evolving..."
- "The football world..."
- "What does this mean for..."
- "Let's break it down"
- "needless to say"
- "it goes without saying"
- "a statement of intent"
- "football is a funny game"
- "the footballing world"
- "sent shockwaves"
- "a new chapter"
- "a new era"
- "this cannot be overstated"
- "a masterclass in"
- "proved their mettle"
- "weathered the storm"
- "in the grand scheme of things"
- "all eyes will be on"
- "a clash of titans"
- "a footballing feast"
- "the stage is set"
- "fans will be hoping"
- "a tantalizing prospect"
- "a resounding statement"
- "left no stone unturned"
- "a beacon of hope"
- "firing on all cylinders"
- "a must-win game"
- "In conclusion"

If you catch yourself about to write ANY of these, stop and rewrite the sentence with a specific, concrete observation instead.

═══════════════════════════════════════════════════════════
NARRATIVE VOICE — THIS DEFINES YOUR WRITING
═══════════════════════════════════════════════════════════
- You are a CONFIDENT INSIDER, not a neutral reporter. You have opinions and you back them with evidence.
- Every article MUST contain at least one bold opinion per section — take a stance, make a judgment, tell the reader what they should think and why.
- Your opening paragraph MUST hook with a SPECIFIC detail: a stat, a moment, a quote, a tactical observation. Never open with a generic scene-setter.
- Write in a way that makes the reader feel they're getting analysis they can't find elsewhere — not a recap they could get from any news wire.
- When you lack specific information on a subtopic, DO NOT write filler about how "details are emerging" or "we await confirmation." Instead, PIVOT to what you DO know: the team's form, the tactical context, historical patterns, league table implications, the manager's track record in similar situations.

═══════════════════════════════════════════════════════════
FEW-SHOT EXAMPLES — Model your writing after these openings:
═══════════════════════════════════════════════════════════

MATCH REPORT example opening:
"Sixty-three minutes in, Declan Rice stood over a free kick 25 yards out, glanced at the wall, and bent a shot into the top corner that silenced Anfield. It was the kind of goal that shifts a season's narrative — and for Arsenal, sitting two points off the top with a game in hand, it felt like a declaration that this title race has a third, very serious contender. Liverpool's 17-match unbeaten run ended not with a whimper but with a tactical dismantling that Mikel Arteta will study for years to come."

TRANSFER example opening:
"The fee tells you one story. Forty-five million pounds for a 23-year-old centre-back with 60 Ligue 1 appearances — steep by any measure, borderline reckless by the standards of a club that finished 14th last season. But watch Leny Yoro defend one-on-one, watch the way he reads a through ball two passes before it arrives, and the number starts to make a different kind of sense. Chelsea aren't buying what he is. They're buying what he'll become."

ANALYSIS/PREVIEW example opening:
"Here is a stat that should worry Ange Postecoglou: Tottenham have conceded the first goal in nine of their last twelve league matches. They've come back to win four of those, drawn two, lost three — which sounds resilient until you consider that no team in Premier League history has won a title while trailing in 75 percent of their games. The xG models love Spurs going forward. The xG models also think their defensive structure belongs in the bottom half."

TACTICAL ANALYSIS example opening:
"Manchester United's switch to a 3-4-2-1 against Aston Villa wasn't a tweak. It was a confession. After eight months of trying to make a 4-2-3-1 work without a reliable number six, Ruben Amorim finally abandoned the project and built a system around what he has rather than what he wishes he had. The result — a 2-0 win built on defensive solidity rather than creative ambition — was the most pragmatic performance of Amorim's tenure, and arguably his most effective."

Notice the pattern: every opening starts with something SPECIFIC (a stat, a moment, a fee, a formation change), takes a STANCE (this matters because...), and gives the reader a reason to keep reading.

═══════════════════════════════════════════════════════════
LOW-INFORMATION HANDLING — CRITICAL
═══════════════════════════════════════════════════════════
When source material is thin on a particular subtopic:
- NEVER write "details are scarce" or "we await more information" or "it remains to be seen"
- Instead, analyze what IS known: pull from the team's season arc, their tactical evolution, the manager's tendencies, historical parallels
- Write about the context and implications rather than the missing details
- Example: Instead of "The transfer fee has not been disclosed," write "Whatever the fee, the signing addresses Everton's most glaring weakness — they've conceded 38 set-piece goals this season, more than any other Premier League side, and Branthwaite's aerial dominance should transform their defensive record."
- If you genuinely have nothing meaningful to say about a subtopic, skip it and go deeper on sections where you DO have material

WRITING QUALITY:
- Your article MUST be 1800-2500 words. This is a premium long-read, not a news brief. Every section should have depth.
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
- End with a forward-looking analytical paragraph that feels natural — never use "In conclusion" or have a section called "Conclusion"

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

// ─── Post-Generation Style Polish ─────────────────────────────────────────────

const BANNED_PHRASES = [
  "only time will tell", "remains to be seen", "a match for the ages",
  "the beautiful game", "the stakes are high", "at the top of their game",
  "promises to be", "the atmosphere will be electric", "it remains unclear",
  "details are scarce", "information is limited", "no data on this topic",
  "there is no information", "In a move that", "In the ever-evolving",
  "The football world", "What does this mean for", "Let's break it down",
  "needless to say", "it goes without saying", "a statement of intent",
  "football is a funny game", "the footballing world", "sent shockwaves",
  "a new chapter", "a new era", "this cannot be overstated",
  "a masterclass in", "proved their mettle", "weathered the storm",
  "in the grand scheme of things", "all eyes will be on", "a clash of titans",
  "a footballing feast", "the stage is set", "fans will be hoping",
  "a tantalizing prospect", "a resounding statement", "left no stone unturned",
  "a beacon of hope", "firing on all cylinders", "a must-win game",
  "In conclusion"
];

async function polishArticleStyle(article) {
  console.log('[Scout] Polishing article style...');

  if (!article || !article.bodyHTML) return article;

  // Check for banned phrases before polishing
  const foundBanned = BANNED_PHRASES.filter(phrase =>
    article.bodyHTML.toLowerCase().includes(phrase.toLowerCase())
  );

  if (foundBanned.length > 0) {
    console.log(`[Scout]   Found ${foundBanned.length} banned phrase(s): ${foundBanned.join(', ')}`);
  }

  const polishPrompt = `You are a ruthless editor at The Athletic. Your job is to take this draft article and make it sharper, more confident, and more distinctive. Do NOT rewrite from scratch — edit what's there.

EDITING RULES:
1. REMOVE every instance of these banned phrases and replace with specific, concrete observations:
${BANNED_PHRASES.map(p => `   - "${p}"`).join('\n')}

2. CUT any paragraph that is pure filler — if a paragraph doesn't add new information, a new stat, a new opinion, or a new tactical observation, delete it entirely.

3. STRENGTHEN the opening — if the first paragraph is generic or scene-setting without a specific hook (a stat, a moment, a name), rewrite it to lead with something concrete.

4. ADD PERSONALITY — insert at least one bold opinion per section. The writer should sound like they've watched every match this season and have strong views.

5. TIGHTEN PROSE — remove unnecessary qualifiers ("perhaps", "arguably", "it could be said that"), hedge words, and redundant phrases. Be direct.

6. PRESERVE all factual content, quotes, stats, scores, and HTML structure exactly. Do not change any facts or add new ones.

Return ONLY the edited bodyHTML content (the HTML string). No JSON wrapper, no explanation — just the edited HTML.

ARTICLE TO EDIT:
${article.bodyHTML}`;

  try {
    const polished = await callLLM(polishPrompt, 'You are a senior sports editor. Return only the edited HTML content. No explanation, no JSON wrapper.');

    if (polished && polished.length > article.bodyHTML.length * 0.5) {
      // Strip any accidental markdown fences or JSON wrapping
      let cleanedHTML = polished.trim();
      if (cleanedHTML.startsWith('```')) {
        cleanedHTML = cleanedHTML.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanedHTML.startsWith('"') && cleanedHTML.endsWith('"')) {
        cleanedHTML = cleanedHTML.slice(1, -1);
      }

      // Verify no banned phrases remain
      const remaining = BANNED_PHRASES.filter(phrase =>
        cleanedHTML.toLowerCase().includes(phrase.toLowerCase())
      );
      if (remaining.length > 0) {
        console.log(`[Scout]   ⚠ ${remaining.length} banned phrase(s) still present after polish: ${remaining.join(', ')}`);
      }

      article.bodyHTML = cleanedHTML;
      console.log('[Scout]   Article polished successfully');
    } else {
      console.log('[Scout]   ⚠ Polish returned insufficient content, keeping original');
    }
  } catch (e) {
    console.error(`[Scout]   ⚠ Style polish failed: ${e.message} — keeping original`);
  }

  return article;
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
4. Check ALL quotes — are they from the source material? Remove any fabricated quotes entirely.
5. Check ALL transfer fees, contract lengths, and specific numbers against web search results.
6. REMOVE any stat, score, position, or quote that contradicts the verified data or cannot be verified. Do not rephrase to be vague — either it's verified and stays, or it gets removed.
7. If more than 50% of the key claims in the article cannot be verified, return ONLY the text "INSUFFICIENT_ACCURACY" instead of the article.
8. Do NOT shorten the article unnecessarily, but DO remove unverified claims completely rather than keeping them.

Return ONLY the corrected bodyHTML. If no changes needed, return the original bodyHTML unchanged. If too many claims are unverifiable, return "INSUFFICIENT_ACCURACY". Return raw HTML only, no wrapping, no explanation.`;

  try {
    let corrected = await callLLM(prompt, 'You are a meticulous football fact-checker. Fix errors, preserve writing style and length. Return only HTML. If too many facts are unverifiable, return INSUFFICIENT_ACCURACY.');
    corrected = stripMarkdownFences(corrected);
    if (corrected && corrected.trim() === 'INSUFFICIENT_ACCURACY') {
      console.log('[Scout] ✗ Fact-check determined article has too many unverifiable claims — marking for rejection');
      article._failedFactCheck = true;
      return article;
    }
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


// ─── HTML Article Template ───────────────────────────────────────────────────


// ─── HTML Article Template ───────────────────────────────────────────────────

function buildArticleHTML(article, filename, date, imageFile) {
  const dateObj = new Date(date);
  const dateFormatted = dateObj.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  const isoDate = date + 'T00:00:00Z';
  const articleUrl = `https://eplnewshub.com/articles/${filename}`;
  const encodedTitle = article.title.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedTitle = article.title.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  const heroImage = imageFile || '/eplnewshubnewlogo.png';

  const categoryAccents = {
    'News': '#c8553a',
    'Transfers': '#4a8fe7',
    'Analysis': '#c9a84c',
    'Match Reports': '#3eb489',
    'Player Focus': '#9b6dd7'
  };
  const accent = categoryAccents[article.category] || '#c8553a';

  // Build related articles HTML
  const relatedHTML = (() => {
    const related = getRelatedArticles(article.title, article.category, article.tags || []);
    if (!related.length) return '';
    return related.map(r => {
      const rDate = r.date ? new Date(r.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const rImage = r.image || '/eplnewshubnewlogo.png';
      return `
              <a href="/articles/${r.file}" class="related-card">
                <div class="related-img-wrap">
                  <img src="${rImage}" alt="" loading="lazy">
                </div>
                <div class="related-card-content">
                  <h3>${r.title}</h3>
                  <span class="related-date">${rDate}</span>
                </div>
              </a>`;
    }).join('');
  })();

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
    <link rel="apple-touch-icon" href="/eplnewshubnewlogo.png">
    <link rel="canonical" href="${articleUrl}">

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
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    <!-- Shared Stylesheet -->
    <link rel="stylesheet" href="/styles.css">

    <!-- PWA -->
    <meta name="theme-color" content="#0a0a0a">

    <style>
        /* ═══════════════════════════════════════════
           EPL NEWS HUB — ARTICLE PAGE
           Matches homepage editorial design system
           ═══════════════════════════════════════════ */

        :root {
            --ink: #0a0a0a;
            --paper: #f0ece4;
            --chalk: #e8e4dc;
            --smoke: #8a8578;
            --ash: #5a564e;
            --ember: ${accent};
            --gold: #c9a84c;
            --mint: #3eb489;
            --steel: #1a1918;
            --card: #111110;
            --card-border: rgba(240, 236, 228, 0.06);
            --card-hover: rgba(240, 236, 228, 0.1);
            --font-display: 'Playfair Display', Georgia, 'Times New Roman', serif;
            --font-body: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            --ease: cubic-bezier(0.4, 0, 0.2, 1);
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        html {
            scroll-behavior: smooth;
            -webkit-text-size-adjust: 100%;
        }

        body {
            background: var(--ink);
            color: var(--paper);
            font-family: var(--font-body);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            position: relative;
        }

        /* Subtle noise texture — matches homepage */
        body::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
            pointer-events: none;
            z-index: 0;
        }

        a { text-decoration: none; color: inherit; }

        .header { margin: 0 !important; padding: 0 !important; }
        .nyt-header { margin-bottom: 0 !important; }
        .nyt-nav { margin-bottom: 0 !important; }

        .footer {
            flex-shrink: 0;
            width: 100%;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
        }

        /* ── READING PROGRESS ── */
        .reading-progress {
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 2px;
            background: var(--ember);
            z-index: 9999;
            transition: width 80ms linear;
        }

        /* ── SITE CONTENT ── */
        .site-content {
            position: relative;
            z-index: 1;
            flex: 1 0 auto;
        }

        /* ── HERO IMAGE ── */
        .article-hero {
            margin-top: 0;
            margin-bottom: 24px;
        }

        .article-hero img {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 4px;
        }

        .article-hero-caption {
            display: block;
            font-family: var(--font-body);
            font-size: 11px;
            color: var(--ash);
            letter-spacing: 0.3px;
            padding: 8px 0 0;
        }

        /* ── ARTICLE CONTAINER ── */
        .article-container {
            max-width: 720px;
            margin: 0 auto;
            padding: 0 32px;
            position: relative;
        }

        /* ── ARTICLE HEADER ── */
        .article-header {
            margin-top: 0;
            position: relative;
            z-index: 3;
            padding-top: 32px;
            padding-bottom: 0;
        }

        .article-category-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            font-family: var(--font-body);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: var(--ember);
        }

        .article-category-badge::before {
            content: '';
            display: block;
            width: 20px;
            height: 2px;
            background: var(--ember);
        }

        .article-title {
            font-family: var(--font-display);
            font-size: clamp(32px, 5vw, 52px);
            font-weight: 800;
            line-height: 1.08;
            color: var(--paper);
            letter-spacing: -0.02em;
            margin-bottom: 20px;
        }

        .article-dek {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 19px;
            line-height: 1.55;
            color: var(--smoke);
            font-weight: 400;
            max-width: 95%;
            margin-bottom: 24px;
        }

        /* ── BYLINE BAR ── */
        .byline-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 16px 0;
            border-top: 1px solid var(--card-border);
            border-bottom: 1px solid var(--card-border);
            margin-bottom: 0;
        }

        .byline-left {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .byline-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--card);
            border: 1px solid rgba(240, 236, 228, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-display);
            font-size: 16px;
            font-weight: 700;
            color: var(--ember);
            flex-shrink: 0;
        }

        .byline-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .byline-author {
            font-family: var(--font-body);
            font-size: 14px;
            font-weight: 600;
            color: var(--paper);
        }

        .byline-meta {
            font-family: var(--font-body);
            font-size: 12px;
            color: var(--ash);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .byline-meta .dot { opacity: 0.4; }

        /* ── SHARE BUTTONS ── */
        .share-row {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .share-btn {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: 1px solid rgba(240, 236, 228, 0.12);
            background: transparent;
            color: var(--paper);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s var(--ease);
            padding: 0;
        }

        .share-btn:hover {
            background: rgba(240, 236, 228, 0.1);
            border-color: rgba(240, 236, 228, 0.25);
        }

        .share-btn svg {
            width: 15px;
            height: 15px;
            fill: currentColor;
        }

        .share-btn--save {
            width: auto;
            padding: 0 14px;
            border-radius: 20px;
            gap: 6px;
            font-family: var(--font-body);
            font-size: 12px;
            font-weight: 600;
            color: var(--paper);
        }

        /* ── ARTICLE BODY ── */
        .article-body {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 1.12rem;
            line-height: 1.85;
            color: var(--paper);
            letter-spacing: -0.003em;
        }

        .article-body > *:first-child { margin-top: 0; }

        .article-body p {
            margin-bottom: 1.6em;
        }

        /* Drop cap on first paragraph */
        .article-body > p:first-of-type::first-letter {
            font-family: var(--font-display);
            font-size: 4.2em;
            font-weight: 900;
            float: left;
            line-height: 0.72;
            margin: 0.06em 0.12em 0 -0.02em;
            color: var(--ember);
        }

        .article-body h2 {
            font-family: var(--font-display);
            font-size: 1.7rem;
            font-weight: 700;
            line-height: 1.15;
            color: var(--paper);
            margin: 2.8em 0 0.9em;
            letter-spacing: -0.02em;
            position: relative;
            padding-left: 18px;
        }

        .article-body h2::before {
            content: '';
            position: absolute;
            left: 0;
            top: 4px;
            bottom: 4px;
            width: 3px;
            background: var(--ember);
            border-radius: 2px;
        }

        .article-body h3 {
            font-family: var(--font-display);
            font-size: 1.3rem;
            font-weight: 700;
            line-height: 1.25;
            color: var(--paper);
            margin: 2.2em 0 0.7em;
            letter-spacing: -0.01em;
        }

        .article-body strong {
            font-weight: 700;
            color: #fff;
        }

        .article-body em {
            font-style: italic;
        }

        .article-body a {
            color: var(--ember);
            text-decoration: underline;
            text-decoration-color: rgba(200, 85, 58, 0.3);
            text-underline-offset: 3px;
            transition: text-decoration-color 0.2s;
        }

        .article-body a:hover {
            text-decoration-color: var(--ember);
        }

        .article-body ul, .article-body ol {
            margin: 28px 0 28px 24px;
            line-height: 1.8;
        }

        .article-body li {
            margin-bottom: 12px;
        }

        .article-body li::marker {
            color: var(--ember);
        }

        /* Blockquote */
        .article-body blockquote {
            font-family: Georgia, serif;
            font-size: 1.08rem;
            font-style: italic;
            line-height: 1.7;
            color: var(--chalk);
            margin: 2.2em 0;
            padding: 24px 24px 24px 28px;
            background: var(--card);
            border-left: 3px solid var(--ember);
            border-radius: 0 2px 2px 0;
        }

        /* Pull quote */
        .pull-quote {
            font-family: var(--font-display);
            font-size: 1.45rem;
            font-weight: 400;
            font-style: italic;
            line-height: 1.45;
            color: var(--paper);
            text-align: center;
            margin: 3em auto;
            padding: 2.5em 2em;
            max-width: 560px;
            position: relative;
        }

        .pull-quote::before,
        .pull-quote::after {
            content: '';
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            height: 1px;
            width: 80px;
            background: linear-gradient(90deg, transparent, var(--ember), transparent);
        }

        .pull-quote::before { top: 0; }
        .pull-quote::after { bottom: 0; }

        /* Tables */
        .article-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 40px 0;
            font-family: var(--font-body);
            font-size: 14px;
            border-radius: 2px;
            overflow: hidden;
            border: 1px solid rgba(240, 236, 228, 0.08);
        }

        .article-body table th {
            background: var(--card);
            padding: 14px 18px;
            text-align: left;
            font-weight: 600;
            color: var(--paper);
            font-size: 11px;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(240, 236, 228, 0.08);
        }

        .article-body table td {
            padding: 13px 18px;
            border-bottom: 1px solid var(--card-border);
            color: var(--smoke);
            font-variant-numeric: tabular-nums;
        }

        .article-body table tr:last-child td { border-bottom: none; }
        .article-body table tr:hover td { background: rgba(240, 236, 228, 0.03); color: var(--paper); }

        /* ── AD PLACEMENTS ── */
        .article-ad {
            margin: 40px 0;
            text-align: center;
            min-height: 90px;
        }

        /* ── TAGS ── */
        .tags-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 48px 0 0;
            padding-top: 28px;
            border-top: 1px solid var(--card-border);
        }

        .tag-chip {
            font-family: var(--font-body);
            font-size: 12px;
            font-weight: 500;
            color: var(--smoke);
            background: var(--card);
            border: 1px solid rgba(240, 236, 228, 0.08);
            padding: 6px 14px;
            border-radius: 2px;
            transition: all 0.2s var(--ease);
        }

        .tag-chip:hover {
            border-color: rgba(240, 236, 228, 0.15);
            color: var(--paper);
        }

        /* ── RELATED ARTICLES ── */
        .related-section {
            margin: 64px 0 0;
            padding-top: 40px;
            border-top: 1px solid var(--card-border);
        }

        .related-section-title {
            font-family: var(--font-body);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: var(--ash);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .related-section-title::before {
            content: '';
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: var(--ember);
        }

        .related-section-title::after {
            content: '';
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, rgba(240,236,228,0.08), transparent);
        }

        .related-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 2px;
            background: rgba(240, 236, 228, 0.04);
            border-radius: 2px;
            overflow: hidden;
        }

        .related-card {
            text-decoration: none;
            color: inherit;
            background: var(--card);
            display: flex;
            flex-direction: column;
            transition: background 0.3s var(--ease);
            position: relative;
        }

        .related-card::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: var(--ember);
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.4s var(--ease);
        }

        .related-card:hover { background: #161614; }
        .related-card:hover::after { transform: scaleX(1); }

        .related-img-wrap {
            overflow: hidden;
            aspect-ratio: 16 / 10;
        }

        .related-img-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.7s var(--ease);
        }

        .related-card:hover .related-img-wrap img {
            transform: scale(1.05);
        }

        .related-card-content {
            padding: 18px 20px 22px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .related-card-content h3 {
            font-family: var(--font-display);
            font-size: 16px;
            font-weight: 700;
            line-height: 1.3;
            color: var(--paper);
            margin-bottom: 10px;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            transition: color 0.2s var(--ease);
        }

        .related-card:hover .related-card-content h3 { color: #fff; }

        .related-date {
            font-family: var(--font-body);
            font-size: 11px;
            color: var(--ash);
            margin-top: auto;
            padding-top: 12px;
            border-top: 1px solid var(--card-border);
        }

        /* ── COMMENTS ── */
        .comments-section {
            margin-top: 56px;
            padding-top: 40px;
            border-top: 1px solid var(--card-border);
        }

        .comments-header {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 24px;
        }

        .comments-icon {
            width: 40px;
            height: 40px;
            background: var(--card);
            border: 1px solid rgba(240, 236, 228, 0.08);
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
        }

        .comments-header-text h2 {
            font-family: var(--font-display);
            font-size: 20px;
            font-weight: 700;
            color: var(--paper);
        }

        .comments-header-text p {
            font-family: var(--font-body);
            font-size: 13px;
            color: var(--ash);
            margin-top: 2px;
        }

        .comments-box {
            background: var(--card);
            padding: 24px;
            border-radius: 2px;
            border: 1px solid var(--card-border);
        }

        /* HTMLCommentBox dark theme overrides */
        #HCB_comment_box .hcb-comment-hdr,
        #HCB_comment_box textarea,
        #HCB_comment_box input {
            background: #1a1918 !important;
            color: var(--paper) !important;
            border-color: rgba(240, 236, 228, 0.1) !important;
            border-radius: 2px !important;
            font-family: var(--font-body) !important;
        }

        #HCB_comment_box .hcb-comment {
            background: var(--card) !important;
            border-color: var(--card-border) !important;
            border-radius: 2px !important;
            margin-bottom: 12px !important;
        }

        #HCB_comment_box a { color: var(--ember) !important; }

        #HCB_comment_box .hcb-submit {
            background: var(--ember) !important;
            color: #fff !important;
            border: none !important;
            border-radius: 2px !important;
            padding: 10px 24px !important;
            font-weight: 600 !important;
            font-family: var(--font-body) !important;
            cursor: pointer !important;
            transition: opacity 0.2s !important;
        }

        #HCB_comment_box .hcb-submit:hover { opacity: 0.85 !important; }

        /* ── REVEAL ANIMATION ── */
        .reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.5s var(--ease), transform 0.5s var(--ease);
        }

        .reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
            body::before { display: none; }

            .article-container { padding: 0 20px; }

            .article-header { margin-top: 0; padding-top: 24px; }
            .article-title { font-size: 30px; }
            .article-dek { font-size: 17px; max-width: 100%; }

            .byline-bar {
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
            }

            .share-row { width: 100%; }

            .article-body { font-size: 1.05rem; }
            .article-body h2 { font-size: 1.4rem; margin: 2em 0 0.7em; }
            .article-body h3 { font-size: 1.15rem; }
            .article-body blockquote { padding: 20px 20px 20px 24px; }

            .pull-quote { font-size: 1.2rem; padding: 2em 1em; }

            .related-grid { grid-template-columns: 1fr; }

            .article-hero-caption { font-size: 10px; }

            .related-card::after { display: none; }
            .related-card:hover .related-img-wrap img { transform: none; }

            .article-ad:nth-of-type(even) { display: none !important; }
        }

        @media (max-width: 480px) {
            .article-container { padding: 0 16px; }

            .article-header { margin-top: 0; padding-top: 20px; }
            .article-title { font-size: 26px; }
            .article-dek { font-size: 16px; }

            .article-body { font-size: 1rem; }
            .article-body > p:first-of-type::first-letter { font-size: 3.4em; }
            .article-body h2 { font-size: 1.25rem; padding-left: 14px; }

            .article-body table { font-size: 12px; }
            .article-body table th,
            .article-body table td { padding: 10px 12px; }
        }
    </style>
</head>
<body>
    <!-- Reading Progress Bar -->
    <div class="reading-progress"></div>

    <!-- Header -->
    <div class="header" include="../header.html"></div>

    <!-- Main Content -->
    <main class="site-content">

        <!-- Article -->
        <article class="article-container">

            <!-- Article Header -->
            <header class="article-header reveal">
                <div class="article-category-badge">${article.categoryLabel || article.category}</div>
                <h1 class="article-title">${encodedTitle}</h1>
                <p class="article-dek">${(article.dek || article.metaDescription).replace(/"/g, '&quot;')}</p>

                <div class="byline-bar">
                    <div class="byline-left">
                        <div class="byline-avatar">${(article.authorName || 'E')[0]}</div>
                        <div class="byline-info">
                            <div class="byline-author">${article.authorName || 'EPL News Hub'}</div>
                            <div class="byline-meta">
                                <time datetime="${date}">${dateFormatted}</time>
                                <span class="dot">&middot;</span>
                                <span>${article.readTime || '7 min read'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="share-row">
                        <button class="share-btn" onclick="shareArticle('twitter')" title="Share on X" aria-label="Share on X"><svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></button>
                        <button class="share-btn" onclick="shareArticle('facebook')" title="Share on Facebook" aria-label="Share on Facebook"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></button>
                        <button class="share-btn" onclick="shareArticle('copy')" title="Copy link" aria-label="Copy link"><svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
                        <button class="share-btn share-btn--save" onclick="saveArticle()" title="Save article" aria-label="Save article"><svg viewBox="0 0 24 24" style="width:14px;height:14px"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>Save</button>
                    </div>
                </div>
            </header>

            <!-- Hero Image -->
            <div class="article-hero reveal">
                <img src="${heroImage}" alt="${encodedTitle}">
                <span class="article-hero-caption">${article.imageCaption || ''}</span>
            </div>

            <!-- Article Body -->
            <div class="article-body reveal">
                ${stripMarkdownFences(article.bodyHTML)}
            </div>

            <!-- Ad Placement: After Body -->
            <div class="article-ad">
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-6480210605786899"
                     data-ad-slot="auto"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            </div>

            <!-- Tags -->
            <div class="tags-row reveal">
                ${article.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}
            </div>

            <!-- Related Articles -->
            <section class="related-section reveal">
                <h2 class="related-section-title">More from EPL News Hub</h2>
                <div class="related-grid">${relatedHTML}</div>
            </section>

            <!-- Ad Placement: Before Comments -->
            <div class="article-ad">
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="ca-pub-6480210605786899"
                     data-ad-slot="auto"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            </div>

            <!-- Comments Section -->
            <section class="comments-section reveal">
                <div class="comments-header">
                    <div class="comments-icon">&#128172;</div>
                    <div class="comments-header-text">
                        <h2>Join the Discussion</h2>
                        <p>Share your thoughts on this article</p>
                    </div>
                </div>
                <div class="comments-box">
                    <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">Comment Box</a> is loading comments...</div>
                    <link rel="stylesheet" type="text/css" href="https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0" />
                    <script type="text/javascript" id="hcb"> if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/['"]/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%24w8ot526O1NwJSxpfQ4Tqd0"+"&opts=16798&num=10&ts=1737000000000");if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); </script>
                </div>
            </section>

        </article>
    </main>

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
        // Reading progress bar
        (function(){
            var t = false;
            function u() {
                var b = document.querySelector('.article-body'),
                    r = document.querySelector('.reading-progress');
                if (!b || !r) return;
                var rc = b.getBoundingClientRect(),
                    h = b.offsetHeight,
                    w = window.innerHeight,
                    p = Math.min(Math.max(-rc.top / (h - w) * 100, 0), 100);
                r.style.width = p + '%';
                t = false;
            }
            window.addEventListener('scroll', function(){ if(!t){requestAnimationFrame(u);t=true} });
            window.addEventListener('resize', u);
            u();
        })();

        // Scroll reveal
        (function(){
            var els = document.querySelectorAll('.reveal');
            if (!('IntersectionObserver' in window)) {
                els.forEach(function(e){ e.classList.add('visible'); });
                return;
            }
            var obs = new IntersectionObserver(function(entries){
                entries.forEach(function(e){
                    if(e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target); }
                });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
            els.forEach(function(e){ obs.observe(e); });
        })();

        // Share functions
        function shareArticle(p) {
            var u = window.location.href,
                t = document.querySelector('.article-title').textContent;
            switch(p) {
                case 'twitter':
                    window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t), '_blank', 'width=550,height=420');
                    break;
                case 'facebook':
                    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u), '_blank', 'width=550,height=420');
                    break;
                case 'copy':
                    navigator.clipboard.writeText(u).then(function(){ showNotification('Link copied!'); });
                    break;
            }
        }

        // Save article
        function saveArticle() {
            var t = document.querySelector('.article-title').textContent,
                u = window.location.href,
                s = JSON.parse(localStorage.getItem('savedArticles') || '[]'),
                e = s.some(function(a){ return a.url === u; });
            if(e) {
                s = s.filter(function(a){ return a.url !== u; });
                localStorage.setItem('savedArticles', JSON.stringify(s));
                showNotification('Removed from saved');
            } else {
                s.push({ title: t, url: u, savedAt: new Date().toISOString() });
                localStorage.setItem('savedArticles', JSON.stringify(s));
                showNotification('Article saved');
            }
        }

        // Toast notification
        function showNotification(m) {
            var e = document.createElement('div');
            e.textContent = m;
            e.style.cssText = 'position:fixed;bottom:32px;left:50%;transform:translateX(-50%) translateY(20px);opacity:0;background:#111110;color:#f0ece4;padding:14px 28px;border-radius:2px;font-family:DM Sans,sans-serif;font-size:14px;font-weight:600;z-index:10000;box-shadow:0 8px 32px rgba(0,0,0,0.4);border:1px solid rgba(240,236,228,0.08);transition:all 0.3s cubic-bezier(0.16,1,0.3,1)';
            document.body.appendChild(e);
            requestAnimationFrame(function(){
                e.style.transform = 'translateX(-50%) translateY(0)';
                e.style.opacity = '1';
            });
            setTimeout(function(){
                e.style.transform = 'translateX(-50%) translateY(20px)';
                e.style.opacity = '0';
                setTimeout(function(){ e.remove(); }, 300);
            }, 2200);
        }
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

  // Create new main_headline — matches homepage editorial design system
  const categoryColors = {
    'News': '#c8553a', 'Transfers': '#4a8fe7', 'Analysis': '#c9a84c',
    'Match Reports': '#3eb489', 'Player Focus': '#9b6dd7'
  };
  const catColor = categoryColors[articleCategory] || '#c8553a';
  const catRgbMap = { '#c8553a': '200, 85, 58', '#4a8fe7': '74, 143, 231', '#c9a84c': '201, 168, 76', '#3eb489': '62, 180, 137', '#9b6dd7': '155, 109, 215' };
  const catRgb = catRgbMap[catColor] || '200, 85, 58';

  const mainHeadlineHTML = `<a href="/articles/${articleFilename}" style="display: flex; flex-direction: column; height: 100%; text-decoration: none; color: inherit;" aria-label="Read full article: ${articleTitle.replace(/"/g, '&quot;')}">
    <img src="${heroImage}" alt="${articleTitle.replace(/"/g, '&quot;')}" style="width: 100%; aspect-ratio: 16 / 9; object-fit: cover; flex-shrink: 0; border-radius: 0;" loading="eager">
    <div style="display: flex; flex-direction: column; padding: 28px 32px 32px;">
        <span style="font-size: 10px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: ${catColor}; margin-bottom: 12px; background: rgba(${catRgb}, 0.12); padding: 4px 10px; border-radius: 2px; display: inline-block; width: fit-content;">${articleCategory.toUpperCase()}</span>
        <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 38px; font-weight: 800; line-height: 1.1; color: #f0ece4; margin: 0 0 12px 0; letter-spacing: -0.5px;">${articleTitle}</h2>
        <p style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 15px; line-height: 1.6; color: #8a8578; margin: 0 0 12px 0;">${articleExcerpt}</p>
        <div style="font-family: 'DM Sans', -apple-system, sans-serif; font-size: 11px; color: #5a564e; letter-spacing: 0.3px; display: flex; align-items: center; gap: 6px; margin-top: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.4;">
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

  // Prevent duplicate entries
  if (sitemap.includes(`/articles/${filename}`)) {
    console.log('[Scout] Article already in sitemap.xml, skipping');
    return;
  }

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

// ─── Soccer Relevance & Accuracy Gates ──────────────────────────────────────

function isSoccerArticle(article) {
  if (!article || !article.bodyHTML || !article.title) return false;

  const text = (article.title + ' ' + article.bodyHTML + ' ' + (article.metaDescription || '') + ' ' + (article.tags || []).join(' ')).toLowerCase();

  // Must contain soccer/football keywords
  const soccerSignals = [
    'premier league', 'epl', 'football', 'soccer', ' fc', 'united',
    'match', 'goal', 'assist', 'transfer', 'manager', 'fixture',
    'league', 'cup', 'midfielder', 'striker', 'defender', 'goalkeeper',
    'penalty', 'offside', 'formation', 'tactics', 'clean sheet',
    'kickoff', 'kick-off', 'half-time', 'full-time', 'pitch',
    'champions league', 'europa league', 'fa cup', 'var',
    'relegation', 'promotion', 'hat trick', 'derby'
  ];

  // Must NOT be primarily about non-soccer topics
  const nonSoccerSignals = [
    'video game', 'gaming', 'ea fc', 'ea sports fc', 'football manager game',
    'esports', 'e-sports', 'playstation', 'xbox', 'console', 'steam',
    'nfl', 'nba', 'mlb', 'nhl', 'super bowl', 'touchdown', 'quarterback',
    'cricket', 'rugby', 'tennis', 'golf', 'boxing', 'ufc', 'mma',
    'formula 1', 'f1 racing', 'basketball', 'baseball', 'american football'
  ];

  const soccerCount = soccerSignals.filter(kw => text.includes(kw)).length;
  const nonSoccerCount = nonSoccerSignals.filter(kw => text.includes(kw)).length;

  // Require at least 3 soccer signals and no non-soccer signals dominating
  if (soccerCount < 3) {
    console.log(`[Scout] Soccer relevance check FAILED: only ${soccerCount} soccer signals found`);
    return false;
  }
  if (nonSoccerCount > 0 && nonSoccerCount >= soccerCount * 0.3) {
    console.log(`[Scout] Soccer relevance check FAILED: ${nonSoccerCount} non-soccer signals vs ${soccerCount} soccer signals`);
    return false;
  }

  return true;
}

async function verifyArticleAccuracy(article, research, footballData) {
  if (!article || !article.bodyHTML) {
    return { passed: false, reason: 'No article body to verify' };
  }

  const bodyText = article.bodyHTML.toLowerCase();
  const bodyLength = article.bodyHTML.replace(/<[^>]+>/g, '').length;

  // 1. Article must be substantial (at least 1500 chars of actual text content)
  if (bodyLength < 1500) {
    return { passed: false, reason: `Article too short (${bodyLength} chars, need 1500+)` };
  }

  // 2. Check that we have source material backing the article
  if (!research || !research.sources || research.sources.length === 0) {
    return { passed: false, reason: 'No source material to verify claims against' };
  }

  // 3. Check for signs of fabricated/hallucinated content — generic filler that indicates
  //    the AI didn't have enough real information
  const fabricationSignals = [
    'details are yet to emerge',
    'details are still emerging',
    'we await confirmation',
    'we await more information',
    'reports are unconfirmed',
    'no official statement',
    'yet to be confirmed',
    'according to unverified reports',
    'rumours suggest',
    'speculation mounts',
    'it is believed that',
    'sources close to the situation',
    'according to sources familiar',
    'it is understood that'
  ];

  const fabricationCount = fabricationSignals.filter(phrase => bodyText.includes(phrase)).length;
  if (fabricationCount >= 3) {
    return { passed: false, reason: `Too many unverified/speculative phrases (${fabricationCount} found) — not enough confirmed information` };
  }

  // 4. Verify key facts against source material using AI
  try {
    const sourceText = research.summary ? research.summary.slice(0, 2000) : '';
    const footballDataText = footballData ? formatFootballDataForPrompt(footballData).slice(0, 2000) : '';

    const verifyPrompt = `You are a strict editorial fact-checker. Compare this article against the source material and verified data below.

ARTICLE TITLE: ${article.title}
ARTICLE (first 2000 chars): ${article.bodyHTML.slice(0, 2000)}

SOURCE MATERIAL:
${sourceText}

${footballDataText ? 'VERIFIED API DATA:\n' + footballDataText : ''}

Check for:
1. Are the key claims (scores, stats, positions, transfers, quotes) supported by the source material or verified data?
2. Are there any fabricated quotes (quotes not found in source material)?
3. Are there obviously invented statistics or match scores?
4. Is the core story factually grounded in the sources?

Return ONLY a JSON object:
{
  "accurate": true/false,
  "confidence": 1-10 (how confident you are in accuracy),
  "issues": ["list of specific factual issues found, if any"],
  "verdict": "one sentence summary"
}`;

    const result = await callLLM(verifyPrompt, 'You are a fact-checker. Return only JSON. Be strict — if key facts cannot be verified, mark as inaccurate.');
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const verification = JSON.parse(jsonMatch[0]);
      console.log(`[Scout] Accuracy verification: confidence=${verification.confidence}/10, accurate=${verification.accurate}`);
      if (verification.issues && verification.issues.length > 0) {
        console.log(`[Scout]   Issues: ${verification.issues.join('; ')}`);
      }

      // Fail if confidence is very low or marked inaccurate with serious issues
      if (!verification.accurate && verification.confidence <= 4) {
        return { passed: false, reason: `Low accuracy confidence (${verification.confidence}/10): ${verification.verdict}` };
      }
      if (verification.issues && verification.issues.length >= 3 && verification.confidence <= 5) {
        return { passed: false, reason: `Too many factual issues (${verification.issues.length}): ${verification.issues.slice(0, 2).join('; ')}` };
      }
    }
  } catch (e) {
    console.log(`[Scout] Accuracy verification LLM call failed: ${e.message} — allowing article (source gate already passed)`);
  }

  return { passed: true, reason: 'Article passed accuracy verification' };
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
  try { topics = await pickTopics(news, count + 10); }
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

      // Duplicate check — skip if too similar to anything published in last 14 days or this batch
      const allRecentTitles = [...getRecentArticleTitles(), ...publishedTitles];
      if (isTooSimilar(topic.title, allRecentTitles)) {
        console.log(`[Scout] Skipping "${topic.title}" — too similar to a recent article`);
        continue;
      }

      // Research: scrape sources and gather verified facts
      const research = await researchTopic(topic, newsItem);

      // Research quality gate: skip if AI flagged sources as insufficient
      if (research.insufficientSources) {
        console.log(`[Scout] Skipping "${topic.title}" — research AI determined insufficient verified facts for an accurate article`);
        continue;
      }

      // Quality gate: skip topics with insufficient source material
      // Need at least 1 source with real content and 500+ total chars (including search snippets)
      const allSources = research.sources || [];
      const realSources = allSources.filter(s => s.text && s.text.length > 50);
      const totalSourceChars = allSources.reduce((sum, s) => sum + (s.text ? s.text.length : 0), 0);
      if (realSources.length < 1 || totalSourceChars < 500) {
        console.log(`[Scout] Skipping "${topic.title}" — insufficient source material for accurate article (${realSources.length} sources, ${totalSourceChars} chars total — need 1+ sources and 500+ chars), trying next topic`);
        continue;
      }

      // Append real football data to research
      const footballDataText = formatFootballDataForPrompt(footballData);
      if (footballDataText) {
        research.summary += footballDataText;
      }

      console.log(`[Scout] Generating article: ${topic.title}...`);
      let article = await generateArticle(topic, newsItem, research);

      // Check if the AI flagged insufficient data
      if (article.insufficientData) {
        console.log(`[Scout] Skipping "${topic.title}" — AI flagged insufficient data: ${article.reason || 'not enough verified information'}`);
        continue;
      }

      // Soccer relevance gate: verify the generated article is actually about soccer
      if (!isSoccerArticle(article)) {
        console.log(`[Scout] Skipping "${topic.title}" — generated article is not about soccer, trying next topic`);
        continue;
      }

      // Style polish: remove banned phrases, tighten prose, add personality
      article = await polishArticleStyle(article);

      // Fact-check: verify article against real data
      article = await factCheckArticle(article, footballData, research);

      // Check if fact-checker flagged the article as having too many unverifiable claims
      if (article._failedFactCheck) {
        console.log(`[Scout] Skipping "${topic.title}" — fact-checker determined too many claims could not be verified`);
        continue;
      }

      // Accuracy gate: verify the article passed fact-checking with sufficient verified content
      const accuracyCheck = await verifyArticleAccuracy(article, research, footballData);
      if (!accuracyCheck.passed) {
        console.log(`[Scout] Skipping "${topic.title}" — failed accuracy verification: ${accuracyCheck.reason}`);
        continue;
      }

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
  // 1. Google Indexing API (primary)
  try {
    if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
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
      console.log(`[Scout] Google Indexing API: ${articleUrl} — status ${res.status}`);
    } else {
      console.log('[Scout] No service account key found, skipping Google Indexing API.');
    }
  } catch (e) {
    console.error(`[Scout] Google Indexing API failed: ${e.message}`);
  }

  // 2. IndexNow (Bing, Yandex, etc.)
  try {
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      const res = await fetch(`https://api.indexnow.org/indexnow?url=${encodeURIComponent(articleUrl)}&key=${indexNowKey}`);
      console.log(`[Scout] IndexNow: ${articleUrl} — status ${res.status}`);
    }
  } catch (e) {
    console.log(`[Scout] IndexNow failed: ${e.message}`);
  }

  // 3. Ping sitemap to Google and Bing
  try {
    const sitemapUrl = 'https://www.eplnewshub.com/sitemap.xml';
    const [googleRes, bingRes] = await Promise.allSettled([
      fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
      fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`)
    ]);
    console.log(`[Scout] Sitemap ping: Google=${googleRes.status === 'fulfilled' ? googleRes.value.status : 'failed'}, Bing=${bingRes.status === 'fulfilled' ? bingRes.value.status : 'failed'}`);
  } catch (e) {
    console.log(`[Scout] Sitemap ping failed: ${e.message}`);
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
