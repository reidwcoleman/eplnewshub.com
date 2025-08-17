#!/bin/bash

# Replace Disqus with HTML Comment Box (no sign-in required!)
echo "Switching to HTML Comment Box - No sign-in required!"
echo ""

count=0

for file in articles/*.html; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Remove Disqus comments section
    sed -i '/<!-- Disqus Comments Section -->/,/noscript>/d' "$file"
    
    # Add HTML Comment Box BEFORE the footer/end of main content
    if grep -q "</main>" "$file"; then
        sed -i '/<\/main>/i\
\
    <!-- HTML Comment Box - No Sign-in Required! -->\
    <div style="max-width: 800px; margin: 40px auto 60px auto; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">\
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">Comments</h2>\
        <div style="background: white; padding: 20px; border-radius: 8px;">\
            <!-- begin wwww.htmlcommentbox.com -->\
            <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">Comment Box</a> is loading comments...</div>\
            <link rel="stylesheet" type="text/css" href="https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0" />\
            <script type="text/javascript" id="hcb"> /*<!--*/ if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/'\''"/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%24w8ot526O1NwJSxpfQ4Tqd0"+"&opts=16798&num=10&ts=1737000000000");if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); /*-->*/ </script>\
            <!-- end www.htmlcommentbox.com -->\
        </div>\
    </div>' "$file"
    
    elif grep -q "</article>" "$file"; then
        sed -i '/<\/article>/i\
\
    <!-- HTML Comment Box - No Sign-in Required! -->\
    <div style="max-width: 800px; margin: 40px auto 60px auto; padding: 20px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb;">\
        <h2 style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">Comments</h2>\
        <div style="background: white; padding: 20px; border-radius: 8px;">\
            <!-- begin wwww.htmlcommentbox.com -->\
            <div id="HCB_comment_box"><a href="http://www.htmlcommentbox.com">Comment Box</a> is loading comments...</div>\
            <link rel="stylesheet" type="text/css" href="https://www.htmlcommentbox.com/static/skins/bootstrap/twitter-bootstrap.css?v=0" />\
            <script type="text/javascript" id="hcb"> /*<!--*/ if(!window.hcb_user){hcb_user={};} (function(){var s=document.createElement("script"), l=hcb_user.PAGE || (""+window.location).replace(/'\''"/g,"%27"), h="https://www.htmlcommentbox.com";s.setAttribute("type","text/javascript");s.setAttribute("src", h+"/jread?page="+encodeURIComponent(l).replace("+","%2B")+"&mod=%241%24wq1rdBcg%24w8ot526O1NwJSxpfQ4Tqd0"+"&opts=16798&num=10&ts=1737000000000");if (typeof s!="undefined") document.getElementsByTagName("head")[0].appendChild(s);})(); /*-->*/ </script>\
            <!-- end www.htmlcommentbox.com -->\
        </div>\
    </div>' "$file"
    fi
    
    echo "✅ Updated: $(basename "$file")"
    ((count++))
done

# Also remove the Disqus count script
for file in articles/*.html; do
    sed -i '/<script id="dsq-count-scr"/d' "$file"
done

echo ""
echo "========================================"
echo "✅ Switched $count articles to HTML Comment Box!"
echo ""
echo "Benefits of HTML Comment Box:"
echo "  ✅ NO SIGN-IN REQUIRED - Guests can comment immediately"
echo "  ✅ Simple name + comment interface"
echo "  ✅ Auto-saves comments across all users"
echo "  ✅ Built-in spam protection"
echo "  ✅ Mobile friendly"
echo "  ✅ Completely FREE"
echo ""
echo "Your visitors can now comment without any login!"
echo "========================================"