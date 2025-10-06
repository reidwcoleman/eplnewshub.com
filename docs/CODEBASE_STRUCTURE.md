# EPL News Hub - Codebase Structure

Last Updated: October 5, 2025

## Overview

This document describes the organized file structure of the EPL News Hub codebase. The codebase has been reorganized for better maintainability, scalability, and developer experience.

## Directory Structure

```
eplnewshub.com/
├── articles/              # All news articles
├── components/            # Reusable HTML components
├── css/                   # Stylesheets
├── docs/                  # Documentation files
├── config/                # Configuration files
├── images/                # Image assets
├── js/                    # JavaScript files
├── pages/                 # Tool pages and features
├── scripts/               # Shell/Python scripts for automation
├── public/                # Public assets
├── dist/                  # Distribution/build files
├── src/                   # Source files (if applicable)
├── node_modules/          # npm dependencies
├── index.html             # Main homepage
├── index.js               # HTML component injection system
├── server.js              # Node.js server (optional)
└── scripts.js             # Core JavaScript functionality
```

## Detailed Directory Breakdown

### `/articles/`
Contains all news article HTML files.

**Naming Convention:** `title-with-hyphens-YYYY-MM-DD.html`

**Examples:**
- `ballon-dor-2025-final-odds-power-rankings-ceremony-looms-2025-09-22.html`
- `fpl-gameweek-4-preview-2025-26-september-13.html`

### `/components/`
Reusable HTML components loaded via the include system.

**Key Files:**
- `header.html` - Site header with navigation
- `footer.html` - Site footer
- `main_headline.html` - Featured article component
- `main_subheadline*.html` - Secondary article components
- `fpl-discount-banner.html` - Promotional banner
- `fpl-tools-*.html` - FPL tool advertisement components
- `article-ad.html` - Article page advertisements
- `homepage-ad.html` - Homepage advertisements
- `article-sidebar-ads.html` - Sidebar advertisement components

### `/css/`
All stylesheet files.

**Key Files:**
- `styles.css` - Main stylesheet (NYT-inspired article typography)
- `mobile-responsive.css` - Mobile-first responsive design
- `index.css` - Homepage-specific styles
- `enhanced-homepage.css` - Enhanced homepage design
- `enhanced-homepage-v2.css` - Homepage v2 styles
- `featured-article-cards.css` - Article card components

### `/js/`
All JavaScript files.

**Core Files:**
- `fast-loader.js` - Critical performance loader
- `mobile-nav.js` - Mobile navigation functionality
- `content-discovery.js` - Content discovery features
- `engagement-maximizer.js` - User engagement optimization
- `seo-meta-enhancer.js` - SEO enhancements
- `viral-share-booster.js` - Social sharing features
- `performance-optimizer.js` - Performance optimization
- `prevent-reload.js` - Prevent unwanted page reloads
- `index-fast.js` - Fast homepage loading
- `enhanced-homepage-v2.js` - Homepage functionality
- `read-next.js` - Related articles feature
- `premium-access-control.js` - Premium feature access
- `ai-assistant-sidebar.js` - AI assistant functionality

**FPL-Specific:**
- `fpl-api-optimized.js` - FPL API integration
- `fpl-data-service.js` - FPL data management
- `fpl-data-service-enhanced.js` - Enhanced data service
- `fpl-live-data-service.js` - Live FPL data
- `fpl-auth-system.js` - FPL authentication
- `fpl-account-integration.js` - Account integration
- `fpl-predictions-system.js` - Predictions engine
- `fpl-ai-*.js` - AI-powered FPL features

**Utilities:**
- `article-metadata-extractor.js` - Extract article metadata
- `article-enhancer.js` - Article enhancement features
- `article-freshness.js` - Keep articles fresh
- `grok-article-generator.js` - Article generation with Grok AI

### `/pages/`
Standalone tool pages and features.

**Key Pages:**
- `fpl-player-analyzer.html` - Player analysis tool
- `fpl-player-analyzer-ultra.html` - Advanced player analyzer
- `fpl-ai-assistant.html` - AI assistant for FPL
- `fpl-premium-hub.html` - Premium FPL features hub
- `player-predictor.html` - Player performance predictor
- `team-analyzer.html` - Team analysis tool
- `transfer-simulator-pro.html` - Transfer simulation tool
- `budget-optimizer.html` - FPL budget optimizer
- `fixture-tracker.html` - Fixture difficulty tracker
- `fixture-tracker-pro.html` - Advanced fixture tracker
- `fixture-analyzer-pro.html` - Fixture analysis tool
- `player-data.html` - Player data viewer
- `fantasy.html` - Fantasy game page
- `transfer-hub.html` - Transfer news hub
- `articles.html` - Articles listing page
- `epl-table.html` - Premier League standings

### `/images/`
All image assets (PNG, JPG, JPEG, WEBP, AVIF, JFIF).

**Organization:**
- Player images
- Match images
- Logo/branding assets
- Article featured images
- Background images

### `/scripts/`
Shell and Python scripts for automation and deployment.

**Key Scripts:**
- `add-ads-to-articles.sh` - Add advertisements to articles
- `add-auth-to-premium-tools.sh` - Add authentication
- `add-read-next.sh` - Add related articles feature
- `deploy-article-template.sh` - Deploy article templates
- `deploy-fast-homepage.sh` - Deploy optimized homepage
- `deploy-optimized.sh` - General deployment
- `fix-*.sh` - Various fix scripts
- `generate-article.sh` - Generate new articles
- `cleanup-animations.py` - Clean up animations
- `final-cleanup.py` - Final cleanup tasks

### `/docs/`
Documentation and configuration files.

**Key Files:**
- `CODEBASE_STRUCTURE.md` - This file
- `CLAUDE.md` - Project guidance for Claude Code
- `ARTICLE_NAMING_GUIDE.md` - Article naming conventions
- `ARTICLE_TEMPLATE_UPGRADE.md` - Template upgrade guide
- `DEVELOPMENT.md` - Development guidelines
- `FIREBASE_SETUP.md` - Firebase integration
- `GOOGLE_SETUP.md` - Google services setup
- `GROK-INTEGRATION.md` - Grok AI integration
- `HF_TOKEN_SETUP.md` - Hugging Face token setup
- `EPL_NEWS_HUB_MOBILE_APP_PLAN.md` - Mobile app plan
- `ads.txt` - AdSense ads configuration
- `CNAME` - Custom domain configuration
- `.htaccess` - Apache server configuration
- `capacitor.config.json` - Capacitor mobile app config

### `/config/`
Configuration files.

**Key Files:**
- `.env.example` - Environment variables template
- Various JSON configuration files

## Core Files (Root Directory)

### Essential Files
- `index.html` - Main homepage (DO NOT MOVE)
- `index.js` - HTML component injection system (DO NOT MOVE)
- `server.js` - Optional Node.js server (DO NOT MOVE)
- `scripts.js` - Core JavaScript functionality (DO NOT MOVE)

### Configuration
- `.gitignore` - Git ignore rules
- `package.json` - npm dependencies (if exists)
- `.env` - Environment variables (not in version control)

## File Reference Patterns

### In `index.html`:
```html
<!-- CSS -->
<link rel="stylesheet" href="./css/styles.css">
<link rel="stylesheet" href="./css/mobile-responsive.css">

<!-- JavaScript -->
<script src="./js/mobile-nav.js"></script>
<script src="./js/fast-loader.js"></script>

<!-- Components -->
<div class="header" include="./components/header.html"></div>
<div class="footer" include="./components/footer.html"></div>
```

### In Tool Pages (`/pages/*.html`):
```html
<!-- CSS (relative to root) -->
<link rel="stylesheet" href="../css/styles.css">

<!-- JavaScript (relative to root) -->
<script src="../js/mobile-nav.js"></script>

<!-- Components (relative to root) -->
<div include="../components/header.html"></div>
<div include="../components/footer.html"></div>
```

### In Articles (`/articles/*.html`):
```html
<!-- CSS -->
<link rel="stylesheet" href="../css/styles.css">

<!-- Components -->
<div include="../components/header.html"></div>
```

## Component Include System

The site uses a custom HTML injection system (`index.js`) that loads external HTML files into elements with the `include` attribute.

**Example:**
```html
<div class="header" include="./components/header.html"></div>
```

This system:
1. Finds all elements with `include` attribute
2. Fetches the specified HTML file
3. Injects the content into the element
4. Re-executes any `<script>` tags in the injected content

## Best Practices

### Adding New Files

1. **Articles** → `/articles/`
   - Follow naming convention: `title-with-hyphens-YYYY-MM-DD.html`

2. **Reusable Components** → `/components/`
   - Name descriptively: `feature-name.html`

3. **Stylesheets** → `/css/`
   - Use semantic naming: `feature-name.css`

4. **JavaScript** → `/js/`
   - Use semantic naming: `feature-name.js`

5. **Tool Pages** → `/pages/`
   - Use descriptive names: `tool-name.html`

6. **Images** → `/images/`
   - Use descriptive names with proper extensions

7. **Scripts** → `/scripts/`
   - Shell scripts: `.sh`
   - Python scripts: `.py`
   - Make executable: `chmod +x script-name.sh`

### File References

- Always use relative paths
- From root: `./directory/file.ext`
- From subdirectory: `../directory/file.ext`
- Keep paths consistent across similar file types

### Documentation

- Update this file when adding new directories
- Document new patterns or conventions
- Keep examples up-to-date

## Migration Notes

Files have been reorganized from a flat structure to this organized hierarchy. All path references have been updated in:

- ✅ `index.html`
- ✅ Tool pages in `/pages/`
- ✅ Component files
- ✅ CSS references
- ✅ JavaScript references

## Maintenance

### Regular Tasks

1. **Clean up unused files** - Remove deprecated files
2. **Update documentation** - Keep this file current
3. **Review file organization** - Ensure files are in correct directories
4. **Check broken links** - Verify all file references work
5. **Optimize images** - Compress images in `/images/`

### Before Deployment

1. Test all pages load correctly
2. Verify all components render
3. Check all tool pages function
4. Validate all file paths
5. Run linting/formatting tools

## Support

For questions about file organization or to suggest improvements to this structure, consult:
- `CLAUDE.md` for development guidance
- `DEVELOPMENT.md` for development workflows

---

**Last Updated:** October 5, 2025
**Maintained By:** EPL News Hub Development Team
