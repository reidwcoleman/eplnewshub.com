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

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT = __dirname;
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'scout-config.json'), 'utf-8'));
const ARTICLES_DIR = path.join(ROOT, 'articles');
const ARTICLES_JSON = path.join(ROOT, 'articles.json');
const DATA_ARTICLES_JS = path.join(ROOT, 'data', 'articles.js');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const SCOUT_LOG = path.join(ROOT, 'scout-log.json');

// Load .env manually (no dotenv dependency needed)
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
    const req = mod.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, json: () => JSON.parse(data), text: () => data });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ─── News Fetching ───────────────────────────────────────────────────────────

async function fetchNewsFromGoogleRSS(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-GB&gl=GB&ceid=GB:en`;
  try {
    const res = await fetch(url);
    const xml = res.text();
    // Parse RSS items from XML
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

  // Deduplicate by title similarity
  const seen = new Set();
  const unique = allItems.filter(item => {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Scout] Found ${unique.length} unique news items`);
  return unique.slice(0, 20); // Top 20 most recent
}

// ─── AI Article Generation ───────────────────────────────────────────────────

async function callGroq(prompt, systemPrompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in .env - add it to use the article scout');

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

  const systemPrompt = `You are an editorial assistant for EPL News Hub, a Premier League and football gaming news website. Pick the ${count} most interesting and timely stories to write full articles about. Return ONLY a JSON array of objects with "index" (1-based from the list), "category" (one of: News, Transfers, Analysis, Match Reports, Player Focus), "angle" (a unique angle/hook for the article), and "title" (a compelling article title). No other text.`;

  const result = await callGroq(`Here are today's top football headlines:\n\n${headlines}\n\nPick the best ${count} for full articles.`, systemPrompt);

  // Parse JSON from response
  const jsonMatch = result.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Failed to parse topic selection: ' + result);
  return JSON.parse(jsonMatch[0]);
}

async function generateArticle(topic, newsItem) {
  const systemPrompt = `You are a professional sports journalist writing for EPL News Hub (eplnewshub.com). Write engaging, well-researched articles about the Premier League and football gaming.

Your writing style:
- Professional but accessible, similar to The Athletic or BBC Sport
- Use data, stats, and quotes where relevant (you may fabricate realistic quotes attributed to managers/players for context)
- Include tactical analysis when relevant
- Break content into clear sections with subheadings
- 800-1200 words per article
- Write in a way that's SEO-friendly

Return your article in this exact JSON format (no other text):
{
  "title": "Article title",
  "metaDescription": "150 character SEO meta description",
  "keywords": "comma, separated, keywords",
  "category": "News|Transfers|Analysis|Match Reports|Player Focus",
  "badge": "SHORT BADGE TEXT",
  "readTime": "X min read",
  "heroCaption": "Short hero image caption",
  "heroSubcaption": "Longer hero image description",
  "leadParagraph": "The opening paragraph (compelling hook)",
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Full section HTML content with <p> tags, <strong>, etc."
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const prompt = `Write a full article about this topic:
Title: ${topic.title}
Angle: ${topic.angle}
Category: ${topic.category}
Source headline: ${newsItem.title}
Source description: ${newsItem.description}

Write a comprehensive, engaging article following the format specified.`;

  const result = await callGroq(prompt, systemPrompt);
  const jsonMatch = result.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse article JSON: ' + result.slice(0, 200));
  return JSON.parse(jsonMatch[0]);
}

// ─── HTML Article Template ───────────────────────────────────────────────────

function buildArticleHTML(article, filename, date) {
  const dateFormatted = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const isoDate = date + 'T00:00:00Z';
  const articleUrl = `https://eplnewshub.com/articles/${filename}`;
  const encodedTitle = article.title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const escapedTitle = article.title.replace(/"/g, '\\"');

  const sectionsHTML = article.sections.map((section, i) => {
    let html = `
                <div class="content-section">
                    <h2>${section.heading}</h2>
                    ${section.content}
                </div>`;
    // Insert ad every 2 sections
    if (i > 0 && i % 2 === 0) {
      html += `
                <div include="../article-ad.html"></div>`;
    }
    return html;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TVPLGM5QY9"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-TVPLGM5QY9');
    </script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta name="keywords" content="${article.keywords}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <link rel="canonical" href="${articleUrl}">

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="article">
    <meta property="og:title" content="${encodedTitle} | EPL News Hub">
    <meta property="og:description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:image" content="https://eplnewshub.com/eplnewshubnewlogo.png">
    <meta property="og:site_name" content="EPL News Hub">
    <meta property="article:published_time" content="${isoDate}">
    <meta property="article:author" content="EPL News Hub">
    <meta property="article:section" content="${article.category}">
    ${article.tags.map(t => `<meta property="article:tag" content="${t}">`).join('\n    ')}

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@coleman_re19092">
    <meta name="twitter:creator" content="@coleman_re19092">
    <meta name="twitter:title" content="${encodedTitle} | EPL News Hub">
    <meta name="twitter:description" content="${article.metaDescription.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="https://eplnewshub.com/eplnewshubnewlogo.png">
    <!-- Favicon and Apple Touch Icons -->
    <link rel="apple-touch-icon" sizes="180x180" href="/eplnewshubnewlogo.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/eplnewshubnewlogo.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/eplnewshubnewlogo.png">
    <link rel="shortcut icon" href="/eplnewshubnewlogo.png">
    <link rel="icon" href="/eplnewshubnewlogo.png" type="image/png">
    <title>${encodedTitle} | EPL News Hub</title>
    <link rel="stylesheet" href="../styles.css">

    <!-- AdSense Script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6480210605786899"
     crossorigin="anonymous"></script>

    <script src="../article-enhancer.js"></script>
    <script src="../adsense-lazy-load.js" defer></script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            position: relative;
            opacity: 1;
        }

        .header, .footer { min-height: 60px; transition: opacity 0.3s ease; }
        .header:empty, .footer:empty {
            background: linear-gradient(90deg, #2a2a2a 25%, #e0e0e0 50%, #2a2a2a 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }

        .adsbygoogle {
            min-height: 250px; display: block; background: #f8f9fa;
            border-radius: 8px; position: relative; margin: 30px auto;
        }
        .adsbygoogle:before {
            content: "Advertisement"; position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%); color: #6c757d; font-size: 14px;
        }
        .adsbygoogle[data-ad-status="filled"]:before { display: none; }

        body::before {
            content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%);
            z-index: -2;
        }
        body::after {
            content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background-image:
                radial-gradient(circle at 20% 80%, rgba(120, 40, 200, 0.13) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(40, 200, 120, 0.13) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(200, 40, 120, 0.13) 0%, transparent 50%);
            z-index: -1;
        }

        .modern-article {
            max-width: 900px; margin: 40px auto;
            background: rgba(255, 255, 255, 0.98); border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 100px rgba(120, 40, 200, 0.1);
            backdrop-filter: blur(10px);
            animation: slideUp 0.6s ease-out;
        }
        @keyframes slideUp {
            from { opacity: 1; transform: translateY(30px); }
            to { transform: translateY(0); }
        }

        .article-header {
            text-align: center; margin-bottom: 0; padding: 40px 30px;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border-radius: 12px; border-top: 3px solid #37003c; color: #1e293b;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
        }
        .article-title { font-size: 2.4rem; font-weight: 800; line-height: 1.2; margin-bottom: 24px; color: #0f172a; letter-spacing: -0.5px; }
        .breaking-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
            color: white; padding: 8px 18px; border-radius: 20px;
            font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
            margin-bottom: 20px; letter-spacing: 1px;
            box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }
        .article-meta {
            display: flex; justify-content: center; align-items: center; gap: 24px;
            margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;
        }
        .meta-item { display: flex; align-items: center; gap: 6px; color: #475569; font-size: 0.9rem; font-weight: 500; }
        .meta-item span:first-child { color: #37003c; font-size: 1rem; }

        .hero-section { position: relative; margin: 0; height: 500px; overflow: hidden; background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%); }
        .hero-image { width: 100%; height: 100%; object-fit: cover; }
        .hero-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px 30px 20px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); }
        .hero-caption { color: white; font-size: 1.2rem; font-weight: 700; }
        .hero-subcaption { color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-top: 4px; }

        .article-content { padding: 40px; }
        .content-section { margin-bottom: 32px; }
        .content-section h2 { font-size: 1.6rem; font-weight: 700; color: #1e293b; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #eef2ff; }
        .content-section p { font-size: 1.1rem; line-height: 1.8; color: #334155; margin-bottom: 16px; }
        .lead-paragraph { font-size: 1.25rem; line-height: 1.7; color: #1e293b; font-weight: 500; border-left: 4px solid #37003c; padding-left: 20px; margin-bottom: 32px; }

        .highlight-stat { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #4f46e5; }
        .highlight-stat strong { color: #37003c; }

        .social-share { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
        .share-button { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 0.85rem; color: #475569; background: #f1f5f9; transition: all 0.3s; }
        .share-button:hover { background: #37003c; color: white; transform: translateY(-2px); }

        @media (max-width: 768px) {
            .article-title { font-size: 1.6rem; }
            .article-content { padding: 20px; }
            .hero-section { height: 300px; }
            .article-meta { flex-direction: column; gap: 8px; }
        }
    </style>
</head>
<body>
    <div class="header" include="../header.html"></div>

    <main class="main-content">
        <article class="modern-article">
            <header class="article-header">
                <div class="breaking-badge">
                    <span>&#9899;</span>
                    <span>${article.badge || article.category.toUpperCase()}</span>
                </div>
                <h1 class="article-title">${encodedTitle}</h1>
                <div class="article-meta">
                    <div class="meta-item"><span>&#9997;&#65039;</span><span>EPL News Hub</span></div>
                    <div class="meta-item"><span>&#128197;</span><time datetime="${date}">${dateFormatted}</time></div>
                    <div class="meta-item"><span>&#9201;&#65039;</span><span>${article.readTime || '5 min read'}</span></div>
                </div>
            </header>

            <div class="hero-section">
                <img src="../eplnewshubnewlogo.png" alt="${encodedTitle}" class="hero-image">
                <div class="hero-overlay">
                    <div class="hero-caption">${article.heroCaption || article.title}</div>
                    <div class="hero-subcaption">${article.heroSubcaption || article.metaDescription}</div>
                </div>
            </div>

            <div class="article-content">
                <p class="lead-paragraph">${article.leadParagraph}</p>

                <div include="../article-ad.html"></div>
${sectionsHTML}

                <!-- Social Share -->
                <div class="social-share">
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}" class="share-button" target="_blank">
                        <span>&#128038;</span><span>Share on X</span>
                    </a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}" class="share-button" target="_blank">
                        <span>&#128216;</span><span>Share on Facebook</span>
                    </a>
                    <a href="whatsapp://send?text=${encodeURIComponent(article.title + ' ' + articleUrl)}" class="share-button">
                        <span>&#128172;</span><span>Share on WhatsApp</span>
                    </a>
                </div>
            </div>

            <div style="margin: 30px 0; padding: 0 40px;">
                <ins class="adsbygoogle" style="display:block"
                     data-ad-client="ca-pub-6480210605786899"
                     data-ad-slot="7891234570"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
            </div>
        </article>

        <div include="../article-ad.html"></div>
        <div include="../read-next.html"></div>

        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": "${escapedTitle}",
          "description": "${article.metaDescription.replace(/"/g, '\\"')}",
          "image": "https://eplnewshub.com/eplnewshubnewlogo.png",
          "author": { "@type": "Organization", "name": "EPL News Hub", "url": "https://eplnewshub.com" },
          "publisher": { "@type": "Organization", "name": "EPL News Hub", "logo": { "@type": "ImageObject", "url": "https://eplnewshub.com/eplnewshubnewlogo.png" } },
          "datePublished": "${isoDate}",
          "dateModified": "${isoDate}",
          "mainEntityOfPage": { "@type": "WebPage", "@id": "${articleUrl}" },
          "articleSection": "${article.category}",
          "keywords": "${article.keywords}"
        }
        </script>

    <div style="max-width: 900px; margin: 40px auto 60px auto; padding: 32px; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
        <h2 style="font-size: 1.8rem; font-weight: 800; color: #1a1a2e; margin-bottom: 24px; padding-bottom: 16px;">Join the Discussion</h2>
        <div style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">Comment Box</a> is loading comments...</div>
            <link rel="stylesheet" type="text/css" href="https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0" />
            <script type="text/javascript" id="hcb"> if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/['"]/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%24w8ot526O1NwJSxpfQ4Tqd0"+"&opts=16798&num=10&ts=1737000000000");if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); </script>
        </div>
    </div>
    </main>

    <div class="footer" include="../footer.html"></div>
    <script src="../index.js"></script>
    <script src="../read-next.js"></script>
    <script src="../suggested-articles.js"></script>
</body>
</html>`;
}

// ─── Homepage Headline Cascade ───────────────────────────────────────────────

function cascadeHeadlines(articleTitle, articleFilename, articleExcerpt, articleCategory, date) {
  console.log('[Scout] Cascading headlines on homepage...');

  const dateFormatted = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // Cascade headline12 <- headline11 <- ... <- headline1
  for (let i = 12; i > 1; i--) {
    const src = path.join(ROOT, `headline${i - 1}.html`);
    const dst = path.join(ROOT, `headline${i}.html`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
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

  const mainHeadlineHTML = `<a href="/articles/${articleFilename}" style="display: flex; flex-direction: column; height: 100%; text-decoration: none; color: inherit;" aria-label="Read full article: ${articleTitle.replace(/"/g, '&quot;')}">
    <img src="/eplnewshubnewlogo.png" alt="${articleTitle.replace(/"/g, '&quot;')}" style="width: 100%; aspect-ratio: 16 / 9; object-fit: cover; margin-bottom: 16px; flex-shrink: 0; border-radius: 12px;" loading="eager">
    <div style="display: flex; flex-direction: column;">
        <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: ${catColor}; margin-bottom: 10px; background: rgba(${catColor === '#e74c3c' ? '231, 76, 60' : catColor === '#3498db' ? '52, 152, 219' : catColor === '#f39c12' ? '243, 156, 18' : catColor === '#27ae60' ? '39, 174, 96' : '155, 89, 182'}, 0.15); padding: 5px 10px; border-radius: 4px; display: inline-block; width: fit-content;">${articleCategory.toUpperCase()}</span>
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

function updateArticlesJson(filename, title, description, date) {
  let articles = [];
  try {
    articles = JSON.parse(fs.readFileSync(ARTICLES_JSON, 'utf-8'));
  } catch (e) { /* start fresh */ }

  articles.unshift({
    file: filename,
    title: title,
    image: 'https://www.eplnewshub.com/eplnewshubnewlogo.png',
    date: date,
    description: description.slice(0, 200)
  });

  fs.writeFileSync(ARTICLES_JSON, JSON.stringify(articles, null, 2));
  console.log('[Scout] Updated articles.json');
}

// ─── Update data/articles.js ─────────────────────────────────────────────────

function updateDataArticlesJs(article, filename, date) {
  const id = filename.replace('.html', '');
  const existing = fs.readFileSync(DATA_ARTICLES_JS, 'utf-8');

  const newEntry = `  {
    id: '${id}',
    title: '${article.title.replace(/'/g, "\\'")}',
    excerpt: '${article.leadParagraph.replace(/'/g, "\\'").slice(0, 250)}',
    image: '/eplnewshubnewlogo.png',
    category: '${article.category}',
    date: '${date}',
    readTime: '${article.readTime || '5 min read'}',
    featured: true,
    tags: [${article.tags.map(t => `'${t.replace(/'/g, "\\'")}'`).join(', ')}]
  },`;

  // Insert after "export const articles = ["
  const updated = existing.replace(
    'export const articles = [',
    'export const articles = [\n' + newEntry
  );

  // Set previous first article to featured: false if there are many featured
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

  // Insert before closing </urlset>
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

  if (log.today !== today) {
    log.todayCount = 0;
    log.today = today;
  }

  log.todayCount++;
  log.lastRun = new Date().toISOString();
  log.articles.unshift({ ...articleInfo, createdAt: log.lastRun });
  // Keep last 100 entries
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

const { execSync } = require('child_process');

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
  if (news.length === 0) {
    console.log('[Scout] No news found. Aborting.');
    return;
  }

  // Step 2: Pick topics
  console.log('[Scout] Selecting best topics via AI...');
  let topics;
  try {
    topics = await pickTopics(news, count);
  } catch (e) {
    console.error('[Scout] Topic selection failed:', e.message);
    return;
  }

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

      // Step 4: Create HTML file
      const html = buildArticleHTML(article, filename, date);
      fs.writeFileSync(path.join(ARTICLES_DIR, filename), html);
      console.log(`[Scout] Created: articles/${filename}`);

      // Step 5: Cascade headlines
      cascadeHeadlines(article.title, filename, article.leadParagraph.slice(0, 200), article.category, date);

      // Step 6: Update articles.json
      updateArticlesJson(filename, article.title, article.metaDescription, date);

      // Step 7: Update data/articles.js
      updateDataArticlesJs(article, filename, date);

      // Step 8: Update sitemap
      updateSitemap(filename, date);

      // Step 9: Log
      updateScoutLog({ title: article.title, filename, category: article.category, date });
      publishedTitles.push(article.title);

      console.log(`[Scout] ✓ Published: ${article.title}\n`);
    } catch (e) {
      console.error(`[Scout] Failed to generate article for "${topic.title}":`, e.message);
    }
  }

  // Step 10: Push to GitHub
  if (publishedTitles.length > 0) {
    gitPush(publishedTitles);
  }

  console.log('[Scout] Run complete!');
}

// ─── Daemon Mode (Cron-like scheduler) ───────────────────────────────────────

function startDaemon() {
  console.log('[Scout Daemon] Starting automated article scout...');
  console.log('[Scout Daemon] Schedule: Runs every 6 hours (8am, 2pm, 8pm)');
  console.log('[Scout Daemon] Min articles/day:', CONFIG.minArticlesPerDay);
  console.log('[Scout Daemon] Max articles/day:', CONFIG.maxArticlesPerDay);
  console.log('[Scout Daemon] Press Ctrl+C to stop\n');

  // Run immediately on start
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
      // Last run of the day — make sure we hit minimum
      count = CONFIG.minArticlesPerDay - publishedToday;
    } else {
      // Spread articles across the day
      count = Math.max(1, Math.ceil((CONFIG.minArticlesPerDay - publishedToday) / Math.max(1, runsLeft)));
      count = Math.min(count, 2); // Max 2 per run to spread them out
    }

    await runScout(count);
  };

  runBatch();

  // Run every 6 hours
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
