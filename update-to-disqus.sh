#!/bin/bash

# Update all articles to use Disqus comments
echo "Updating all articles to use Disqus comments..."
echo ""

# Counter for modified files
count=0
failed=0

# Process each HTML file in articles directory
for file in articles/*.html; do
    # Check if file exists
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Remove old comments script reference
    sed -i '/<script src="\.\.\/comments-system-api\.js"><\/script>/d' "$file"
    sed -i '/<script src="\.\.\/comments-system\.js"><\/script>/d' "$file"
    
    # Add Disqus thread div before closing body tag (if not already present)
    if ! grep -q "disqus_thread" "$file"; then
        # Add Disqus comments section before the closing body tag
        sed -i '/<\/body>/i\
\
    <!-- Disqus Comments Section -->\
    <div style="max-width: 800px; margin: 40px auto; padding: 20px;">\
        <div id="disqus_thread"></div>\
        <script>\
            var disqus_config = function () {\
                this.page.url = window.location.href;\
                this.page.identifier = window.location.pathname;\
            };\
            (function() {\
                var d = document, s = d.createElement('\''script'\'');\
                s.src = '\''https://eplnewshub-com.disqus.com/embed.js'\'';\
                s.setAttribute('\''data-timestamp'\'', +new Date());\
                (d.head || d.body).appendChild(s);\
            })();\
        </script>\
        <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>\
    </div>\
    \
    <!-- Disqus Comment Count Script -->\
    <script id="dsq-count-scr" src="//eplnewshub-com.disqus.com/count.js" async></script>' "$file"
        
        echo "✅ Updated: $(basename "$file")"
        ((count++))
    else
        echo "⏭️  Skipped (already has Disqus): $(basename "$file")"
    fi
done

echo ""
echo "========================================"
echo "✅ Successfully updated $count article pages with Disqus comments"
echo ""
echo "Your articles now have:"
echo "  • Disqus comment system"
echo "  • Automatic comment counting"
echo "  • Social login support"
echo "  • Spam protection"
echo "  • Mobile responsive design"
echo ""
echo "Comments are now hosted by Disqus and will work immediately!"
echo "========================================"