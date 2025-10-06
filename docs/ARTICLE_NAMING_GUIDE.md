# Article File Naming Convention Guide

## IMPORTANT: All article HTML files MUST include the date in the filename

### Correct Format:
`article-title-with-hyphens-YYYY-MM-DD.html`

### Examples of CORRECT naming:
- `arsenal-transfer-news-2025-02-15.html`
- `manchester-united-match-analysis-2025-02-14.html`
- `fpl-gameweek-25-tips-2025-02-13.html`
- `premier-league-title-race-update-2025-02-12.html`

### Date Format Rules:
1. **Always use YYYY-MM-DD format** (2025-02-15, not 02-15-2025)
2. **Always include leading zeros** for single-digit months/days (02 not 2, 05 not 5)
3. **Always separate with hyphens** (2025-02-15, not 2025_02_15 or 20250215)
4. **Date should be at the END** of the filename before .html

### Title Format Rules:
1. **Use lowercase** for all words
2. **Replace spaces with hyphens** (not underscores)
3. **Remove special characters** (apostrophes, quotes, etc.)
4. **Keep it descriptive but concise** (5-8 words ideal)

### SEO Benefits of Proper Naming:
- Search engines can identify content freshness
- Better organization in file system
- Avoids duplicate content issues
- Improves URL structure for sharing
- Helps with content archiving

### Examples to AVOID:
❌ `article-title.html` (missing date)
❌ `article-title-02-15-25.html` (wrong date format)
❌ `Article-Title-2025-02-15.html` (mixed case)
❌ `article_title_2025_02_15.html` (underscores)
❌ `2025-02-15-article-title.html` (date at beginning)

### Quick Checklist:
- [ ] Filename is all lowercase
- [ ] Words separated by hyphens
- [ ] Date included at end in YYYY-MM-DD format
- [ ] No special characters
- [ ] Descriptive title that includes main keywords
- [ ] File ends with .html extension

## Implementation in Code

When creating articles programmatically, always use this format:

```javascript
function generateArticleFilename(title, date) {
    const cleanTitle = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-')           // Remove multiple hyphens
        .trim();
    
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    return `${cleanTitle}-${formattedDate}.html`;
}
```

## For Existing Articles

If you have articles without dates, rename them following this pattern:
1. Identify the publication date from the article content
2. Rename the file to include the date
3. Update any internal links to the new filename
4. Set up redirects from old URLs if necessary