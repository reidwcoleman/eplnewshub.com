# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EPL News Hub (eplnewshub.com) is a static website providing Premier League news, standings, transfers, and analysis. The site uses a modular HTML structure with JavaScript-based content injection and has no package.json - it's a pure HTML/CSS/JS website.

## Architecture

### Core Structure
- **Static HTML Site**: No build system or package manager
- **Modular Components**: Uses custom HTML injection system via `index.js`
- **Content Management**: Articles stored as individual HTML files in `/articles/`
- **Responsive Design**: Mobile-first CSS with media queries

### Key Files
- `index.html`: Main homepage with embedded CSS and Google Analytics
- `styles.css`: Primary stylesheet with NYT-inspired article styling
- `index.js`: HTML injection system for modular components
- `scripts.js`: Popup form functionality for subscriptions
- `server.js`: Optional Node.js server for subscription handling
- `/articles/`: Directory containing all news articles as HTML files

### Component System
The site uses a custom include system where HTML elements with `include` attributes automatically load external HTML files:
```html
<div class="header" include="./header.html"></div>
<div class="main_headline" include="./main_headline.html"></div>
```

### Styling Architecture
- Global styles in `styles.css`
- Embedded mobile-first responsive CSS in `index.html`
- NYT-inspired article typography (`.nyt-article` class)
- Color scheme: Black text (#000), white background (#fff), dark header/footer (#262627)

## Development Commands

Since this is a static site with no package.json, there are no build/lint/test commands. Development involves:
- Direct file editing
- Local server for testing (any HTTP server)
- Manual deployment to hosting platform

## Content Management

### "Create a New Article" Command

When the user says "create a new article", follow this workflow:

1. **Ask for article details:**
   - Article title
   - Full article content (introduction, body paragraphs, stats/tables if applicable)
   - Image filename (must already exist in root directory)

2. **Create article file:**
   - Create new HTML file: `/articles/[title-with-hyphens-YYYY-MM-DD].html`
   - Use NYT/Athletic article template structure
   - Include all content provided by user
   - Use semantic HTML (`<time>`, `<article>`, etc.)

3. **Update homepage (cascade articles):**
   - Read current `main_headline.html`
   - Read `main_subheadline1.html`, `main_subheadline2.html`, `main_subheadline3.html`, `main_subheadline4.html`
   - Create new `main_headline.html` with the new article
   - Move previous main headline → `main_subheadline1.html`
   - Move previous subheadline1 → `main_subheadline2.html`
   - Move previous subheadline2 → `main_subheadline3.html`
   - Move previous subheadline3 → `main_subheadline4.html`
   - Move previous subheadline4 → `headline1.html`
   - Cascade headline1 → headline2, headline2 → headline3, ..., headline11 → headline12
   - The previous headline12 gets removed (last article drops off)

4. **Update sitemap.xml:**
   - Add new `<url>` entry for the article
   - Use `<lastmod>` with today's date (YYYY-MM-DD format)
   - Set `<changefreq>monthly</changefreq>`
   - Set `<priority>0.6</priority>`

5. **Commit and push:**
   - Commit all changes with descriptive message
   - Push to GitHub

### Article Structure
Articles should use the established `.nyt-article` styling with:
- `h1` for main title (36px desktop, 28px mobile)
- `.byline` for author/date information
- `p` tags with Georgia serif font (18px desktop, 16px mobile)
- Responsive design built-in

## File Organization

```
/
├── index.html              # Homepage
├── styles.css              # Main stylesheet  
├── index.js               # HTML injection system
├── scripts.js             # Popup/form functionality
├── server.js              # Optional subscription server
├── /articles/             # All news articles
├── header.html            # Site header component
├── footer.html            # Site footer component
├── main_headline.html     # Featured article component
└── main_subheadline*.html # Secondary article components
```

## Deployment Notes

- Static site - can be deployed to any web hosting service
- No build process required
- Includes Google Analytics and AdSense integration
- CNAME file present for custom domain setup