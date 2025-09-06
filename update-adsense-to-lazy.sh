#!/bin/bash

# Update articles with direct AdSense to use lazy loading

articles=(
    "transfer-hub-ultimate-guide-august-2025.html"
    "who-will-replace-rodri-at-man-city-09-28-2024.html"
    "west-ham-united's-kick-off-tactics-10-08-2024.html"
    "victor-gyokeres-premier-league-giants-in-hot-pursuit-05-25-25.html"
    "uefa-champions-league-latest-news-09-18-2024.html"
    "the-rise-of-egypts-new-mohamed-salah-10-13-2024.html"
    "soccer-summer-series-preseason-2025-08-12-2025.html"
    "soccer-barclays-premier-league-seo-guide-2025.html"
    "september-2024-soccer-news-and-epl-standings-2024-09-06.html"
    "real-madrids-new-galacticos-09-29-2024.html"
    "premier-league-transfer-window-latest-rumors-07-20-2025.html"
    "premier-league-transfer-window-2025-record-breaking-3-billion.html"
    "premier-league-rising-stars-2024-09-15.html"
    "premier-league-new-summer-transfer-rumours-05-20-25.html"
    "premier-league-matchweek-1-highlights-2024-8-22.html"
    "premier-league-injuries-october-10-13-2024.html"
    "Premier-league-gameweek-5-preview-09-19-2024.html"
    "Premier-League-Final-Day-Drama-05-24-25.html"
    "premier-league-2025-26-season-preview-predictions-analysis.html"
    "premier-league-2025-26-season-preview-07-23-2025.html"
    "premier-league-2025-26-season-preview-05-22-25.html"
    "paul-pogbas-ban-reduced-10-05-2024.html"
    "nottingham-forest-rises-to-an-incredible-third-in-the-epl-standings-01-06-2025.html"
    "new-premier-league-christmas-and-holiday-fixtures-10-19-2024.html"
    "new-champions-league-pot-format-09-29-2024.html"
    "michal-oliver-banned-from-reffing-arsenal-games-01-27-2025.html"
    "martin-dubravka-8-second-rule-penalty-2025-08-16.html"
    "marcus-rashford-barcelona-transfer-and-premier-league-updates-07-26-2025.html"
    "man-utd-struggling-relegation-fears-2025-08-31.html"
)

for article in "${articles[@]}"; do
    file="articles/$article"
    if [ -f "$file" ]; then
        echo "Processing $article..."
        
        # First, add adsense-lazy-load.js script if not present
        if ! grep -q "adsense-lazy-load.js" "$file"; then
            # Add the script after existing scripts or before </head>
            sed -i '/<\/head>/i\    <script src="../adsense-lazy-load.js" defer></script>' "$file"
        fi
        
        # Replace the direct AdSense implementation with lazy loading placeholder
        # This handles various formats of the AdSense code
        sed -i '/<div.*>.*<ins class="adsbygoogle"/,/<\/script>.*<\/div>/c\    <!-- In-article AdSense Ad (Lazy Loaded) -->\n    <div class="adsense-lazy-load" data-ad-slot="2656767439" style="min-height: 280px; margin: 20px 0; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center;">\n        <span style="color: #999; font-size: 14px;">Advertisement</span>\n    </div>' "$file"
        
        # Also handle single-line AdSense implementations
        sed -i '/<ins class="adsbygoogle".*data-ad-slot="2656767439".*<\/ins>.*<script>.*adsbygoogle.*push.*<\/script>/c\    <!-- In-article AdSense Ad (Lazy Loaded) -->\n    <div class="adsense-lazy-load" data-ad-slot="2656767439" style="min-height: 280px; margin: 20px 0; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center;">\n        <span style="color: #999; font-size: 14px;">Advertisement</span>\n    </div>' "$file"
        
        echo "✓ Updated $article"
    else
        echo "⚠ File not found: $file"
    fi
done

echo "Done! Updated ${#articles[@]} articles to use lazy loading AdSense."