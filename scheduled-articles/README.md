# Scheduled Articles

This directory contains articles scheduled for future publication.

## How to Schedule an Article

1. **Create your article** in this directory with the full HTML content
   - Example: `my-new-article-2025-10-20.html`

2. **Create a metadata file** named `YYYY-MM-DD-article-name.json` with:

```json
{
  "publishDate": "2025-10-20",
  "articleFile": "articles/my-new-article-2025-10-20.html",
  "headlineHtml": "<a href=\"/articles/my-new-article-2025-10-20.html\">\n    <img src=\"/image.jpg\" alt=\"Article\" style=\"width: 100%; aspect-ratio: 16/10; object-fit: cover; margin-bottom: 24px;\">\n    <div>\n        <h2 style=\"font-family: 'Noto Serif', Georgia, serif; font-size: 48px; font-weight: 700; line-height: 1.1; color: #121212; margin: 0 0 24px 0;\">Article Title</h2>\n        <p style=\"font-size: 18px; line-height: 1.6; color: #555; margin: 0;\">Article summary here.</p>\n        <div style=\"font-size: 13px; color: #767676; margin-top: 16px;\">October 20, 2025</div>\n    </div>\n</a>"
}
```

3. **Commit and push both files** to GitHub

4. **The article will auto-publish** when the date arrives (checked daily at 9:00 AM UTC)

## Manual Trigger

You can manually trigger publishing from GitHub:
1. Go to the "Actions" tab
2. Select "Publish Scheduled Articles"
3. Click "Run workflow"

## Date Format

- Metadata filename: `YYYY-MM-DD-article-name.json`
- Articles publish when: `today >= publishDate`
- This means an article dated 2025-10-20 will publish on October 20, 2025 at 9:00 AM UTC
