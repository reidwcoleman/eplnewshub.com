# Grok AI Article Generator for EPL News Hub

## Overview
This system integrates with Grok AI (X.AI) to automatically generate, refine, and publish Premier League news articles to your EPL News Hub website.

## Features
- **3-Step Article Generation Process:**
  1. Initial article generation based on your topic
  2. Accuracy improvement and fact-checking
  3. SEO optimization for better search visibility

- **Automatic Content Management:**
  - Formats articles using your existing article-template.html
  - Automatically rotates articles (moves main headline to subheadline slot 1, etc.)
  - Preserves your site's styling and structure

## Setup

### 1. Get Your Grok API Key
- Sign up for X.AI's Grok API access at https://x.ai
- Get your API key from the dashboard
- Note: As of 2025, Grok API may require special access

### 2. Set Environment Variable
```bash
# Linux/Mac
export GROK_API_KEY="your-api-key-here"

# Windows (Command Prompt)
set GROK_API_KEY=your-api-key-here

# Windows (PowerShell)
$env:GROK_API_KEY="your-api-key-here"
```

### 3. Install Node.js
Make sure Node.js is installed on your system. You can check with:
```bash
node --version
```

## Usage

### Method 1: Using the Shell Script (Recommended)
```bash
./generate-article.sh
```

### Method 2: Direct Node.js Command
```bash
node grok-article-generator.js
```

### Method 3: Quick Command with Topic
```bash
echo "Manchester United signs new striker for £80m" | node grok-article-generator.js
```

## How It Works

1. **You provide a topic**: "Write an article about Manchester City's latest victory"

2. **Grok generates the initial article**: Creates comprehensive content with headlines, sections, quotes, and statistics

3. **Automatic refinement**: 
   - Improves accuracy of facts and figures
   - Ensures realistic transfer fees and statistics
   - Verifies team and player names

4. **SEO optimization**:
   - Adds relevant keywords naturally
   - Optimizes headlines for search engines
   - Structures content for better readability

5. **Article formatting**:
   - Uses your article-template.html
   - Generates SEO-friendly filename
   - Includes all meta tags and structured data

6. **Content rotation**:
   - New article becomes main headline
   - Previous main headline moves to subheadline 1
   - All other articles shift down one position

## Example Workflow

```bash
$ ./generate-article.sh

🚀 EPL News Hub - Grok Article Generator
=========================================

What should the article be about? Liverpool's Champions League qualification chances

📝 Step 1: Generating initial article...
✅ Initial article generated

🔍 Step 2: Improving accuracy...
✅ Accuracy improved

🎯 Step 3: Optimizing for SEO...
✅ SEO optimization complete

📄 Formatting article with template...
✅ Article saved to: articles/liverpool-champions-league-qualification-2025-09-06.html

🔄 Rotating articles...
✅ Updated main headline
✅ Rotated subheadline 1
✅ Rotated subheadline 2

🎉 Success! Article has been generated and published.
```

## Testing Without API Key

The system includes a mock mode for testing without an API key:
1. Run the generator without setting GROK_API_KEY
2. Press Enter when prompted for API key
3. The system will use mock data to demonstrate the workflow

## File Structure

```
/home/reidwcoleman/
├── grok-article-generator.js    # Main generator script
├── generate-article.sh           # Convenience shell script
├── article-template.html         # Your article template
├── main_headline.html           # Main featured article
├── main_subheadline1-6.html     # Secondary articles
└── articles/                     # Generated articles directory
```

## Customization

### Modify Article Structure
Edit the prompts in `grok-article-generator.js` to change:
- Article tone and style
- Section structure
- Content length
- Statistical focus

### Change API Settings
In `grok-article-generator.js`, modify:
```javascript
const CONFIG = {
    GROK_API_KEY: process.env.GROK_API_KEY,
    GROK_API_URL: 'https://api.x.ai/v1/chat/completions',
    // ... other settings
};
```

### Adjust Article Rotation
To change how many subheadlines are maintained, modify:
```javascript
SUBHEADLINES: [
    './main_subheadline1.html',
    './main_subheadline2.html',
    // Add or remove as needed
]
```

## Troubleshooting

### "GROK_API_KEY not set"
- Make sure you've exported the environment variable
- Check it's set correctly: `echo $GROK_API_KEY`

### "Grok API error: 401"
- Your API key may be invalid
- Check your X.AI account for the correct key

### "Cannot find module 'fs'"
- Make sure you're using Node.js, not a browser
- Run: `node --version` to verify Node.js is installed

### Articles not showing on website
- Check that article files are created in `/articles/` directory
- Verify main_headline.html was updated
- Clear browser cache and refresh

## Important Notes

1. **API Costs**: Grok API calls may incur costs based on your X.AI plan
2. **Content Review**: Always review generated articles before publishing
3. **Image Handling**: Currently uses default image; you can enhance this
4. **Rate Limits**: Be aware of API rate limits on your Grok account

## Future Enhancements

Potential improvements you could add:
- Automatic image generation/selection
- Multiple article generation in batch
- Scheduled article generation
- Integration with social media posting
- Analytics tracking for generated articles
- Custom templates for different article types

## Support

For issues with:
- The generator script: Check this documentation
- Grok API: Contact X.AI support
- EPL News Hub: Refer to your site documentation