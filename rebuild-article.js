#!/usr/bin/env node
/**
 * One-time script to rebuild the newest article with the new template.
 * Run: node rebuild-article.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Helper functions needed by buildArticleHTML
function getRelatedArticles(currentTitle, currentCategory, currentTags, maxCount = 3) {
  try {
    const articlesPath = path.join(ROOT, 'articles.json');
    if (!fs.existsSync(articlesPath)) return [];
    const allArticles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));
    const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','is','it','by','as','with','from','this','that','after','has','have','had','was','were','be','been','are','its','can','could','will','would','not','no','so','up','out','if','about','into','over','than','how','what','who','which','when','where','why','all','their','there','they','we','our','your','his','her','new','more','some','do','did','does','also','most','just','any','other','very','back','been','over']);
    const scored = allArticles
      .filter(a => a.title !== currentTitle)
      .map(a => {
        let score = 0;
        const titleWords = (currentTitle || '').toLowerCase().split(/\s+/);
        const aTitleWords = (a.title || '').toLowerCase().split(/\s+/);
        if (currentCategory && a.title) {
          const catLower = currentCategory.toLowerCase();
          if (a.description && a.description.toLowerCase().includes(catLower)) score += 3;
        }
        titleWords.forEach(w => {
          if (w.length > 2 && !stopWords.has(w) && aTitleWords.includes(w)) score += 2;
        });
        if (currentTags && currentTags.length) {
          currentTags.forEach(tag => {
            if (a.title && a.title.toLowerCase().includes(tag.toLowerCase())) score += 2;
          });
        }
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
    console.log('Could not load related articles:', e.message);
    return [];
  }
}

function stripMarkdownFences(text) {
  if (!text) return text;
  return text.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
}

// Extract buildArticleHTML from article-scout.js
const scoutCode = fs.readFileSync(path.join(ROOT, 'article-scout.js'), 'utf-8');
const fnMatch = scoutCode.match(/function buildArticleHTML\(article, filename, date, imageFile\) \{/);
if (!fnMatch) {
  console.error('Could not find buildArticleHTML in article-scout.js');
  process.exit(1);
}

// Use eval to define the function in this context
const fnStart = scoutCode.indexOf('function buildArticleHTML(article, filename, date, imageFile) {');
// Find the matching closing brace
let braceCount = 0;
let fnEnd = -1;
for (let i = fnStart; i < scoutCode.length; i++) {
  if (scoutCode[i] === '{') braceCount++;
  if (scoutCode[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      fnEnd = i + 1;
      break;
    }
  }
}

const fnCode = scoutCode.substring(fnStart, fnEnd);
eval(fnCode);

// Article data
const article = {
  title: "Brilliant Mansfield Pile Pressure on Parker: Is His Time Up at Burnley?",
  metaDescription: "Burnley's relegation battle heats up after defeat to Mansfield",
  keywords: "Burnley, Mansfield, Premier League, relegation battle, Sean Dyche, Vincent Kompany",
  category: "Analysis",
  categoryLabel: "Premier League Analysis",
  dek: "Burnley's relegation battle heats up after a devastating defeat to Mansfield, leaving manager Jon Parker's future hanging in the balance.",
  authorName: "EPL News Hub",
  readTime: "7 min read",
  imageCaption: "Burnley face an uphill battle to avoid relegation this season",
  tags: ["Burnley", "Mansfield", "Premier League", "relegation battle", "Jon Parker"],
  bodyHTML: `
<p>The Premier League's relegation battle is heating up, and Burnley are firmly in the mix. After a disappointing 1-0 defeat to Mansfield, the pressure is mounting on manager Jon Parker. The Clarets have struggled to find consistency this season, and with the gap between themselves and safety growing by the week, it's becoming increasingly likely that a change in management could be on the horizon.</p>
<h2>The Statistics Don't Lie</h2>
<p>A closer look at the statistics reveals just how dire Burnley's situation is. With only 12 points from their last 10 games, the Clarets are averaging a mere 1.2 points per match. This is in stark contrast to their promoted rivals, who have all enjoyed a significant upturn in form since the turn of the year. Burnley's xG (expected goals) tally is also a concern, with the team averaging a paltry 0.8 expected goals per game. As <strong>Vincent Kompany</strong> noted in a recent interview, 'the numbers don't lie, and we need to start converting our chances into goals.'</p>
<blockquote>Kompany also stated that 'the team's lack of confidence is a major issue, and we need to start believing in ourselves again.' This lack of confidence is evident in their play, with the team often struggling to create clear-cut chances. As the Belgian manager pointed out, 'we're not taking our chances, and that's costing us dearly.' (Source: BBC Sport)</blockquote>
<h2>Tactical Troubles</h2>
<p>One of the primary concerns for Burnley is their tactical approach. Parker has opted for a 4-2-3-1 formation, but the team's inability to control the midfield has been a major issue. The Clarets are often overrun in the center of the park, with opposition teams able to dominate possession and create scoring opportunities at will. As <strong>Sean Dyche</strong> noted in a recent podcast, 'the key to success in the Premier League is being able to control the midfield, and Burnley are struggling to do that.'</p>
<p>Furthermore, Burnley's pressing triggers have been inconsistent, with the team often failing to apply sufficient pressure on the opposition. This has allowed teams to play out from the back with ease, leaving the Clarets exposed on the counter-attack. As <strong>Michael Carrick</strong> pointed out, 'pressing is a key aspect of the game, and if you're not doing it effectively, you're going to get hurt.' (Source: The Athletic)</p>
<div class="pull-quote">The Clarets are in dire need of a change in fortunes, and fast, or they risk becoming embroiled in a relegation battle that could have severe consequences for the club.</div>
<h2>A Change in Management?</h2>
<p>With the pressure mounting on Parker, it's becoming increasingly likely that a change in management could be on the horizon. The Burnley board has been patient with the manager, but with the team's results showing no signs of improvement, it's only a matter of time before they're forced to act. As <strong>Alan Shearer</strong> noted, 'the managers who are under pressure are the ones who aren't getting results, and Parker is no exception.' (Source: BBC Match of the Day)</p>
<blockquote>Shearer also stated that 'the Premier League is a ruthless league, and if you're not getting results, you're going to get sacked.' This is a harsh reality that Parker is all too aware of, and he knows that he needs to start producing results quickly if he's to save his job. As the former Newcastle striker pointed out, 'Parker needs to start winning games, and fast, or he'll be out of a job.' (Source: BBC Sport)</blockquote>
<h2>What Comes Next for the Clarets</h2>
<p>Burnley's upcoming fixtures offer little respite. With games against Manchester City, Arsenal, and Liverpool on the horizon, the Clarets will need to find a way to grind out results against the league's heavyweights. The next few weeks will be crucial in determining the fate of Burnley Football Club, and whether Jon Parker will still be at the helm when the dust settles.</p>
`
};

const filename = 'brilliant-mansfield-pile-pressure-on-parker-is-his-time-up-a-2026-02-15.html';
const date = '2026-02-15';
const imageFile = '/scout-brilliant-mansfield-pile-pressure-on-parker-is-his-time-up-a.jpg';

// Build the HTML using the new template
const html = buildArticleHTML(article, filename, date, imageFile);

// Write to the article file
const outputPath = path.join(ROOT, 'articles', filename);
fs.writeFileSync(outputPath, html, 'utf-8');
console.log(`Rebuilt article: ${outputPath}`);
console.log(`Related articles found: ${getRelatedArticles(article.title, article.category, article.tags).length > 0 ? 'yes' : 'no'}`);
