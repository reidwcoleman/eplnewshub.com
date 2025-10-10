# EPL News Hub - Enhanced Codebase Structure

Last Updated: October 5, 2025

## 📋 Quick Navigation

- [Directory Overview](#directory-overview)
- [JavaScript Organization](#javascript-organization)
- [Pages Organization](#pages-organization)
- [Components Organization](#components-organization)
- [Images Organization](#images-organization)
- [CSS Organization](#css-organization)
- [File Reference Patterns](#file-reference-patterns)
- [Adding New Files](#adding-new-files)

---

## 📁 Directory Overview

```
eplnewshub.com/
│
├── 📂 articles/                    # News articles
│   └── *.html                      # Individual article files
│
├── 📂 components/                  # Reusable HTML components
│   ├── 📂 layout/                  # Header, footer, headlines
│   ├── 📂 ads/                     # Advertisement components
│   └── 📂 articles/                # Article-specific components
│
├── 📂 css/                         # Stylesheets
│   ├── styles.css                  # Main stylesheet
│   ├── mobile-responsive.css       # Mobile styles
│   ├── index.css                   # Homepage styles
│   ├── enhanced-homepage.css       # Enhanced homepage
│   ├── enhanced-homepage-v2.css    # Homepage v2
│   └── featured-article-cards.css  # Article cards
│
├── 📂 js/                          # JavaScript files
│   ├── 📂 core/                    # Core functionality
│   ├── 📂 fpl/                     # FPL-specific features
│   ├── 📂 features/                # Feature modules
│   ├── 📂 services/                # Service/API layers
│   └── 📂 utilities/               # Utility functions
│
├── 📂 pages/                       # Tool pages and features
│   ├── 📂 fpl-tools/               # FPL analysis tools
│   ├── 📂 admin/                   # Admin/account pages
│   └── 📂 news/                    # News-related pages
│
├── 📂 images/                      # Image assets
│   ├── 📂 logos/                   # Site logos & branding
│   ├── 📂 players/                 # Player images
│   ├── 📂 articles/                # Article featured images
│   └── 📂 misc/                    # Miscellaneous images
│
├── 📂 scripts/                     # Automation scripts
│   ├── *.sh                        # Shell scripts
│   └── *.py                        # Python scripts
│
├── 📂 docs/                        # Documentation
│   ├── CODEBASE_STRUCTURE.md       # This file
│   ├── CLAUDE.md                   # Claude Code guidance
│   ├── *.md                        # Other documentation
│   ├── *.json                      # Configuration files
│   └── ads.txt, CNAME, .htaccess   # Site config
│
├── 📂 config/                      # Environment configuration
│   └── .env.example                # Environment template
│
├── 📄 index.html                   # Main homepage
├── 📄 index.js                     # Component injection system
├── 📄 server.js                    # Node.js server (optional)
└── 📄 scripts.js                   # Core JavaScript

```

---

## 🔧 JavaScript Organization

### `/js/core/` - Core Functionality
**Purpose:** Essential scripts that power the site's basic functionality

```
js/core/
├── fast-loader.js              # Critical performance loader
├── index-fast.js               # Fast homepage loading
├── mobile-nav.js               # Mobile navigation
├── prevent-reload.js           # Prevent unwanted reloads
└── universal-fast-load.js      # Universal fast loading
```

**When to use:** Core functionality needed site-wide

---

### `/js/fpl/` - Fantasy Premier League
**Purpose:** All FPL-related features and tools

```
js/fpl/
├── fpl-api-optimized.js        # FPL API integration
├── fpl-data-service.js         # Data management
├── fpl-data-service-enhanced.js # Enhanced data service
├── fpl-live-data-service.js    # Live FPL data
├── fpl-auth-system.js          # FPL authentication
├── fpl-account-integration.js  # Account features
├── fpl-account-ui.js           # Account UI
├── fpl-predictions-system.js   # Predictions engine
├── fpl-predictions-real.js     # Real predictions
├── fpl-predictions-ui-ultra.js # Predictions UI
├── fpl-predictions-ultra.js    # Ultra predictions
├── fpl-ai-*.js                 # AI-powered features
├── fpl-player-analyzer-ultra.js # Player analysis
├── fpl-player-visualizations.js # Data visualization
├── fpl-realtime-data.js        # Real-time data
├── fpl-cache-service.js        # Caching service
└── fpl-analyzer-performance.js # Performance analytics
```

**When to use:** FPL tool pages and features

---

### `/js/features/` - Feature Modules
**Purpose:** Specific features and enhancements

```
js/features/
├── seo-meta-enhancer.js        # SEO optimization
├── viral-share-booster.js      # Social sharing
├── engagement-maximizer.js     # User engagement
├── performance-optimizer.js    # Performance features
├── content-discovery.js        # Content discovery
├── article-enhancer.js         # Article enhancements
├── article-freshness.js        # Keep articles fresh
├── article-metadata-extractor.js # Extract metadata
├── article-side-ads.js         # Article advertisements
├── article-sidebar-injector.js # Sidebar injection
├── read-next.js                # Related articles
└── suggested-articles.js       # Article suggestions
```

**When to use:** Feature-specific enhancements

---

### `/js/services/` - Service Layer
**Purpose:** API services, authentication, and backend communication

```
js/services/
├── auth-service.js             # Authentication service
├── data-server.js              # Data server
├── dev-server.js               # Development server
├── comments-server.js          # Comments system
├── fixture-difficulty-service.js # Fixture difficulty
└── *-service.js                # Other services
```

**When to use:** Backend integration and API calls

---

### `/js/utilities/` - Utility Functions
**Purpose:** Helper functions and utilities

```
js/utilities/
├── enhanced-homepage-v2.js     # Homepage utilities
├── premium-access-control.js   # Access control
├── ai-assistant-sidebar.js     # AI assistant
├── grok-article-generator.js   # Article generation
├── gameweek-planner.js         # Gameweek planning
├── budget-optimizer-enhanced.js # Budget optimization
└── *.js                        # Other utilities
```

**When to use:** Reusable helper functions

---

## 📄 Pages Organization

### `/pages/fpl-tools/` - FPL Analysis Tools
**Purpose:** Interactive FPL tools and analyzers

```
pages/fpl-tools/
├── fpl-player-analyzer.html          # Basic player analyzer
├── fpl-player-analyzer-ultra.html    # Advanced analyzer
├── fpl-ai-assistant.html             # AI assistant
├── fpl-premium-hub.html              # Premium features
├── player-predictor.html             # Player predictions
├── team-analyzer.html                # Team analysis
├── transfer-simulator-pro.html       # Transfer simulator
├── budget-optimizer.html             # Budget optimizer
├── fixture-tracker.html              # Fixture tracker
├── fixture-tracker-pro.html          # Advanced fixture tracker
├── fixture-analyzer-pro.html         # Fixture analyzer
└── player-data.html                  # Player data viewer
```

**Access pattern:** `/pages/fpl-tools/[tool-name].html`

---

### `/pages/admin/` - Admin & Account Pages
**Purpose:** User management and administrative functions

```
pages/admin/
├── account.html                # User account dashboard
├── admin.html                  # Admin panel
├── create-account.html         # Account creation
└── manage-subscription.html    # Subscription management
```

**Access pattern:** `/pages/admin/[page-name].html`

---

### `/pages/news/` - News & Content Pages
**Purpose:** News aggregation and content pages

```
pages/news/
├── articles.html               # Articles listing
├── transfer-hub.html           # Transfer news hub
├── epl-table.html              # Premier League standings
└── fantasy.html                # Fantasy game page
```

**Access pattern:** `/pages/news/[page-name].html`

---

## 🧩 Components Organization

### `/components/layout/` - Layout Components
**Purpose:** Core page structure elements

```
components/layout/
├── header.html                 # Site header with navigation
├── footer.html                 # Site footer
├── main_headline.html          # Featured article
├── main_subheadline1.html      # Secondary article 1
├── main_subheadline2.html      # Secondary article 2
├── main_subheadline3.html      # Secondary article 3
├── main_subheadline4.html      # Secondary article 4
├── main_subheadline5.html      # Secondary article 5
├── main_subheadline6.html      # Secondary article 6
├── main_subheadline7.html      # Secondary article 7
├── main_subheadline8.html      # Secondary article 8
└── main_subheadline9.html      # Secondary article 9
```

**Usage in HTML:**
```html
<div class="header" include="./components/layout/header.html"></div>
<div class="footer" include="./components/layout/footer.html"></div>
```

---

### `/components/ads/` - Advertisement Components
**Purpose:** Advertisement placements and promotional banners

```
components/ads/
├── article-ad.html             # Article page ads
├── article-sidebar-ads.html    # Article sidebar ads
├── homepage-ad.html            # Homepage advertisements
├── fpl-discount-banner.html    # FPL promotional banner
├── fpl-tools-compact-ad.html   # Compact FPL ad
├── fpl-tools-inline-ad.html    # Inline FPL ad
└── fpl-tools-premium-ad.html   # Premium FPL ad
```

**Usage in HTML:**
```html
<div include="./components/ads/fpl-discount-banner.html"></div>
```

---

## 🖼️ Images Organization

### `/images/logos/` - Branding & Logos
**Purpose:** Site logos, team badges, and branding assets

```
images/logos/
├── eplnewshub_logo.png         # Main site logo
├── eplnewshubnewlogo.png       # New site logo
├── eplnewshub.png              # Alternative logo
├── epl-news-hub-logo.png       # EPL News Hub logo
└── apple-touch-icon.png        # iOS app icon
```

---

### `/images/players/` - Player Images
**Purpose:** Professional player photographs

```
images/players/
├── Erling Haaland Man City 2025-26.jpg.webp
├── mainoo.webp
├── calafori.jpg
├── jack-grealish-everton.webp
└── [other player images]
```

---

### `/images/articles/` - Article Featured Images
**Purpose:** Hero images for news articles

```
images/articles/
├── DALL·E [various AI-generated images].webp
├── ChatGPT Image [dates].png
├── GettyImages-*.webp
└── [other article images]
```

---

### `/images/misc/` - Miscellaneous Images
**Purpose:** Other images not fitting specific categories

```
images/misc/
└── [various supporting images]
```

---

## 🎨 CSS Organization

```
css/
├── styles.css                  # Main stylesheet (NYT-inspired)
├── mobile-responsive.css       # Mobile-first responsive design
├── index.css                   # Homepage-specific styles
├── enhanced-homepage.css       # Enhanced homepage design
├── enhanced-homepage-v2.css    # Homepage v2 styles
└── featured-article-cards.css  # Article card components
```

**Import order in HTML:**
```html
<link rel="stylesheet" href="./css/styles.css">
<link rel="stylesheet" href="./css/mobile-responsive.css">
```

---

## 🔗 File Reference Patterns

### From `index.html` (root):
```html
<!-- CSS -->
<link rel="stylesheet" href="./css/styles.css">

<!-- Core JS -->
<script src="./js/core/fast-loader.js"></script>
<script src="./js/core/mobile-nav.js"></script>

<!-- Feature JS -->
<script src="./js/features/content-discovery.js"></script>

<!-- FPL JS -->
<script src="./js/fpl/fpl-data-service.js"></script>

<!-- Services -->
<script src="./js/services/auth-service.js"></script>

<!-- Utilities -->
<script src="./js/utilities/premium-access-control.js"></script>

<!-- Layout Components -->
<div include="./components/layout/header.html"></div>
<div include="./components/layout/footer.html"></div>

<!-- Ad Components -->
<div include="./components/ads/fpl-discount-banner.html"></div>

<!-- Images -->
<img src="./images/logos/eplnewshub_logo.png">
```

---

### From Tool Pages (`/pages/fpl-tools/*.html`):
```html
<!-- CSS (up two levels) -->
<link rel="stylesheet" href="../../css/styles.css">

<!-- JS (up two levels) -->
<script src="../../js/core/mobile-nav.js"></script>
<script src="../../js/fpl/fpl-data-service.js"></script>

<!-- Components (up two levels) -->
<div include="../../components/layout/header.html"></div>
<div include="../../components/layout/footer.html"></div>

<!-- Images (up two levels) -->
<img src="../../images/logos/eplnewshub_logo.png">
```

---

### From Admin Pages (`/pages/admin/*.html`):
```html
<!-- CSS (up two levels) -->
<link rel="stylesheet" href="../../css/styles.css">

<!-- JS (up two levels) -->
<script src="../../js/core/mobile-nav.js"></script>
<script src="../../js/services/auth-service.js"></script>

<!-- Components (up two levels) -->
<div include="../../components/layout/header.html"></div>
```

---

### From Articles (`/articles/*.html`):
```html
<!-- CSS (up one level) -->
<link rel="stylesheet" href="../css/styles.css">

<!-- JS (up one level) -->
<script src="../js/features/article-enhancer.js"></script>

<!-- Components (up one level) -->
<div include="../components/layout/header.html"></div>

<!-- Images (up one level) -->
<img src="../images/articles/featured-image.webp">
```

---

## ➕ Adding New Files

### Adding a New FPL Tool Page

1. **Create file in:** `/pages/fpl-tools/my-new-tool.html`
2. **Use references:**
   ```html
   <link rel="stylesheet" href="../../css/styles.css">
   <script src="../../js/fpl/fpl-data-service.js"></script>
   <div include="../../components/layout/header.html"></div>
   ```
3. **Access at:** `https://yoursite.com/pages/fpl-tools/my-new-tool.html`

---

### Adding a New JavaScript Feature

1. **Core functionality** → `/js/core/feature-name.js`
2. **FPL feature** → `/js/fpl/fpl-feature-name.js`
3. **General feature** → `/js/features/feature-name.js`
4. **Service/API** → `/js/services/service-name.js`
5. **Utility** → `/js/utilities/utility-name.js`

---

### Adding a New Component

1. **Layout component** → `/components/layout/component-name.html`
2. **Ad component** → `/components/ads/ad-name.html`
3. **Article component** → `/components/articles/component-name.html`

---

### Adding a New Image

1. **Logo/branding** → `/images/logos/logo-name.png`
2. **Player photo** → `/images/players/player-name.webp`
3. **Article image** → `/images/articles/article-image.webp`
4. **Other** → `/images/misc/image-name.jpg`

---

## 🎯 Quick Find Guide

### "Where do I find...?"

| What you're looking for | Location |
|------------------------|----------|
| Homepage file | `/index.html` |
| Site header | `/components/layout/header.html` |
| Site footer | `/components/layout/footer.html` |
| Main stylesheet | `/css/styles.css` |
| Mobile styles | `/css/mobile-responsive.css` |
| Core loading script | `/js/core/fast-loader.js` |
| FPL data service | `/js/fpl/fpl-data-service.js` |
| Player analyzer tool | `/pages/fpl-tools/fpl-player-analyzer.html` |
| Transfer hub | `/pages/news/transfer-hub.html` |
| Site logo | `/images/logos/eplnewshub_logo.png` |
| News articles | `/articles/` |
| Deployment scripts | `/scripts/` |
| Documentation | `/docs/` |

---

## 📚 Related Documentation

- **CLAUDE.md** - Project guidance for Claude Code
- **ARTICLE_NAMING_GUIDE.md** - Article naming conventions
- **DEVELOPMENT.md** - Development workflows
- **FIREBASE_SETUP.md** - Firebase integration guide

---

## 🔄 Maintenance

### Regular Tasks

1. **Organize new files** into appropriate directories
2. **Update this documentation** when structure changes
3. **Verify file references** after reorganization
4. **Remove deprecated files** regularly
5. **Optimize images** in `/images/` subdirectories

---

**Last Updated:** October 5, 2025
**Maintained By:** EPL News Hub Development Team
