#!/bin/bash

# Fix Disqus placement - put it BEFORE the footer
echo "Fixing Disqus comments placement..."
echo ""

count=0

for file in articles/*.html; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Remove existing Disqus sections (they're after the footer)
    sed -i '/<!-- Disqus Comments Section -->/,/<!-- Disqus Comment Count Script -->/d' "$file"
    sed -i '/<script id="dsq-count-scr"/d' "$file"
    
    # Add Disqus BEFORE the footer, inside the main content area
    # Look for common patterns where articles end
    
    # Pattern 1: Before </main> tag
    if grep -q "</main>" "$file"; then
        sed -i '/<\/main>/i\
\
    <!-- Disqus Comments Section -->\
    <div style="max-width: 800px; margin: 40px auto 60px auto; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">\
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">Comments</h2>\
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
    </div>' "$file"
    
    # Pattern 2: Before </article> tag if no </main>
    elif grep -q "</article>" "$file"; then
        sed -i '/<\/article>/i\
\
    <!-- Disqus Comments Section -->\
    <div style="max-width: 800px; margin: 40px auto 60px auto; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">\
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">Comments</h2>\
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
    </div>' "$file"
    
    # Pattern 3: Before the footer div
    elif grep -q '<div class="footer"' "$file"; then
        sed -i '/<div class="footer"/i\
\
    <!-- Disqus Comments Section -->\
    <div style="max-width: 800px; margin: 40px auto 60px auto; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">\
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">Comments</h2>\
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
    </div>' "$file"
    fi
    
    # Add the count script before </body>
    sed -i '/<\/body>/i\
    <script id="dsq-count-scr" src="//eplnewshub-com.disqus.com/count.js" async></script>' "$file"
    
    echo "✅ Fixed: $(basename "$file")"
    ((count++))
done

echo ""
echo "========================================"
echo "✅ Fixed Disqus placement in $count articles"
echo ""
echo "Changes made:"
echo "  • Moved comments ABOVE the footer"
echo "  • Added styled comment section container"
echo "  • Improved visual presentation"
echo "  • Added 'Comments' heading"
echo ""
echo "The comments should now load properly!"
echo "========================================"