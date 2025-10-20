#!/usr/bin/env node

/**
 * SEO Enhancement Script for EPL News Hub Articles
 *
 * This script automatically adds comprehensive SEO meta tags, structured data,
 * and breadcrumb navigation to all article HTML files.
 *
 * Features:
 * - Open Graph and Twitter Card meta tags
 * - Canonical URLs
 * - JSON-LD structured data (NewsArticle + BreadcrumbList)
 * - Breadcrumb navigation
 * - Enhanced image alt text extraction
 *
 * Usage: node apply-seo-to-articles.js
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, 'articles');
const SITE_URL = 'https://www.eplnewshub.com';
const TWITTER_HANDLE = '@coleman_re19092';

// Extract meta information from existing HTML
function extractMetaInfo(html, filename) {
  const info = {
    title: '',
    description: '',
    image: '',
    imageAlt: '',
    publishDate: '',
    category: 'Premier League News',
    keywords: []
  };

  // Extract existing title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    info.title = titleMatch[1].replace(' | EPL News Hub', '').trim();
  } else {
    // Try h1
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
    if (h1Match) {
      info.title = h1Match[1].replace(/<[^>]*>/g, '').trim();
    }
  }

  // Extract existing meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  if (descMatch) {
    info.description = descMatch[1];
  } else {
    // Try to extract from first paragraph
    const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/);
    if (pMatch) {
      const text = pMatch[1].replace(/<[^>]*>/g, '').trim();
      info.description = text.substring(0, 160) + (text.length > 160 ? '...' : '');
    }
  }

  // Extract image from article
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
  if (imgMatch) {
    info.image = imgMatch[1];

    // Extract alt text
    const altMatch = imgMatch[0].match(/alt=["']([^"']+)["']/);
    if (altMatch) {
      info.imageAlt = altMatch[1];
    } else {
      info.imageAlt = info.title;
    }
  }

  // Try to extract date from filename
  const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    info.publishDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  } else {
    // Use current date
    const now = new Date();
    info.publishDate = now.toISOString().split('T')[0];
  }

  // Extract category if present
  const categoryMatch = html.match(/<span[^>]*class=["']article-category["'][^>]*>(.*?)<\/span>/);
  if (categoryMatch) {
    info.category = categoryMatch[1].trim();
  }

  // Generate keywords from title
  const titleWords = info.title.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);

  info.keywords = [
    'Premier League',
    'EPL',
    'Football News',
    ...titleWords.slice(0, 5)
  ];

  return info;
}

// Check if article already has SEO enhancements
function hasEnhancements(html) {
  return html.includes('<!-- Open Graph Meta Tags -->') ||
         html.includes('og:type') ||
         html.includes('application/ld+json');
}

// Generate Open Graph and Twitter Card tags
function generateSocialMetaTags(info, articleUrl) {
  return `
    <!-- Canonical URL -->
    <link rel="canonical" href="${articleUrl}">

    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="EPL News Hub">
    <meta property="og:title" content="${info.title}">
    <meta property="og:description" content="${info.description}">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:image" content="${SITE_URL}${info.image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${info.imageAlt}">
    <meta property="og:locale" content="en_US">
    <meta property="article:published_time" content="${info.publishDate}T10:00:00+00:00">
    <meta property="article:modified_time" content="${info.publishDate}T10:00:00+00:00">
    <meta property="article:author" content="EPL News Hub">
    <meta property="article:section" content="${info.category}">
${info.keywords.map(kw => `    <meta property="article:tag" content="${kw}">`).join('\n')}

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="${TWITTER_HANDLE}">
    <meta name="twitter:creator" content="${TWITTER_HANDLE}">
    <meta name="twitter:title" content="${info.title}">
    <meta name="twitter:description" content="${info.description}">
    <meta name="twitter:image" content="${SITE_URL}${info.image}">
    <meta name="twitter:image:alt" content="${info.imageAlt}">
`;
}

// Generate JSON-LD structured data
function generateStructuredData(info, articleUrl) {
  return `
    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "${info.title.replace(/"/g, '\\"')}",
      "description": "${info.description.replace(/"/g, '\\"')}",
      "image": {
        "@type": "ImageObject",
        "url": "${SITE_URL}${info.image}",
        "width": 1200,
        "height": 630
      },
      "datePublished": "${info.publishDate}T10:00:00+00:00",
      "dateModified": "${info.publishDate}T10:00:00+00:00",
      "author": {
        "@type": "Organization",
        "name": "EPL News Hub",
        "url": "${SITE_URL}"
      },
      "publisher": {
        "@type": "Organization",
        "name": "EPL News Hub",
        "url": "${SITE_URL}",
        "logo": {
          "@type": "ImageObject",
          "url": "${SITE_URL}/eplnewshubnewlogo.png",
          "width": 600,
          "height": 60
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "${articleUrl}"
      },
      "articleSection": "${info.category}",
      "keywords": "${info.keywords.join(', ')}"
    }
    </script>

    <!-- Breadcrumb Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "${SITE_URL}/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Articles",
          "item": "${SITE_URL}/articles.html"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "${info.title.replace(/"/g, '\\"')}",
          "item": "${articleUrl}"
        }
      ]
    }
    </script>
`;
}

// Generate breadcrumb navigation HTML
function generateBreadcrumbNav(info) {
  const shortTitle = info.title.length > 50 ? info.title.substring(0, 50) + '...' : info.title;

  return `
    <!-- Breadcrumb Navigation -->
    <nav aria-label="Breadcrumb" style="max-width: 680px; margin: 24px auto 0; padding: 0 32px; font-size: 13px; color: #767676;">
        <ol style="list-style: none; padding: 0; display: flex; gap: 8px; flex-wrap: wrap;">
            <li><a href="/" style="color: #767676; text-decoration: none;">Home</a></li>
            <li aria-hidden="true">/</li>
            <li><a href="/articles.html" style="color: #767676; text-decoration: none;">Articles</a></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" style="color: #121212;">${shortTitle}</li>
        </ol>
    </nav>
`;
}

// Process a single article file
function processArticle(filename) {
  const filePath = path.join(ARTICLES_DIR, filename);

  console.log(`\nProcessing: ${filename}`);

  // Read file
  let html = fs.readFileSync(filePath, 'utf8');

  // Check if already enhanced
  if (hasEnhancements(html)) {
    console.log(`  ⏭️  Skipped (already has SEO enhancements)`);
    return { status: 'skipped', filename };
  }

  // Extract meta info
  const info = extractMetaInfo(html, filename);
  const articleUrl = `${SITE_URL}/articles/${filename}`;

  console.log(`  📄 Title: ${info.title}`);
  console.log(`  📅 Date: ${info.publishDate}`);
  console.log(`  🏷️  Category: ${info.category}`);

  // Generate enhancements
  const socialMeta = generateSocialMetaTags(info, articleUrl);
  const structuredData = generateStructuredData(info, articleUrl);
  const breadcrumbNav = generateBreadcrumbNav(info);

  // Insert meta tags after existing meta tags but before favicon/scripts
  // Find a good insertion point (after description meta tag or after title)
  let insertPoint;
  const descMetaMatch = html.match(/(<meta\s+name=["']description["'][^>]*>)/);
  const titleMatch = html.match(/(<title>.*?<\/title>)/);

  if (descMetaMatch) {
    insertPoint = descMetaMatch.index + descMetaMatch[1].length;
  } else if (titleMatch) {
    insertPoint = titleMatch.index + titleMatch[1].length;
  } else {
    console.log(`  ⚠️  Warning: Could not find insertion point for meta tags`);
    return { status: 'failed', filename, reason: 'No insertion point' };
  }

  // Insert social meta tags
  html = html.slice(0, insertPoint) + '\n' + socialMeta + html.slice(insertPoint);

  // Insert structured data after <body> tag
  const bodyMatch = html.match(/<body[^>]*>/);
  if (bodyMatch) {
    const bodyInsertPoint = bodyMatch.index + bodyMatch[0].length;
    html = html.slice(0, bodyInsertPoint) + structuredData + html.slice(bodyInsertPoint);
  } else {
    console.log(`  ⚠️  Warning: Could not find <body> tag`);
  }

  // Insert breadcrumb navigation after header include
  const headerMatch = html.match(/<div[^>]+include=["'][^"']*header\.html["'][^>]*><\/div>/);
  if (headerMatch) {
    const headerInsertPoint = headerMatch.index + headerMatch[0].length;
    html = html.slice(0, headerInsertPoint) + breadcrumbNav + html.slice(headerInsertPoint);
  } else {
    console.log(`  ⚠️  Warning: Could not find header include for breadcrumb`);
  }

  // Write back to file
  fs.writeFileSync(filePath, html, 'utf8');

  console.log(`  ✅ Successfully enhanced`);
  return { status: 'success', filename };
}

// Main execution
function main() {
  console.log('🚀 Starting SEO Enhancement Script for EPL News Hub Articles\n');
  console.log('='.repeat(70));

  // Get all HTML files in articles directory
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html'));

  console.log(`\n📁 Found ${files.length} article files to process\n`);

  const results = {
    success: [],
    skipped: [],
    failed: []
  };

  // Process each file
  files.forEach(filename => {
    try {
      const result = processArticle(filename);
      results[result.status].push(result);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.failed.push({ status: 'failed', filename, reason: error.message });
    }
  });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SUMMARY:');
  console.log(`  ✅ Successfully enhanced: ${results.success.length}`);
  console.log(`  ⏭️  Skipped (already enhanced): ${results.skipped.length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed files:');
    results.failed.forEach(r => {
      console.log(`  - ${r.filename}: ${r.reason}`);
    });
  }

  console.log('\n✨ SEO enhancement complete!');
  console.log('\nNext steps:');
  console.log('  1. Review the changes in a few article files');
  console.log('  2. Test the structured data with Google Rich Results Test');
  console.log('  3. Commit the changes to git');
  console.log('  4. Deploy to production');
  console.log('\n' + '='.repeat(70) + '\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processArticle, extractMetaInfo };
