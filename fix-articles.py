#!/usr/bin/env python3

import re
import os
import glob

def fix_critical_article(file_path):
    """Fix critical articles with global CSS resets and conflicts"""
    print(f"Fixing critical article: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Add featured-article-cards.css include if not present
    if 'featured-article-cards.css' not in content:
        content = re.sub(
            r'(<link rel="stylesheet" href="\.\./styles\.css">)\n(\s*<script src="\.\./article-enhancer\.js"></script>)',
            r'\1\n    <link rel="stylesheet" href="../featured-article-cards.css">',
            content
        )
    
    # 2. Remove article-enhancer.js
    content = re.sub(r'\s*<script src="\.\./article-enhancer\.js"></script>', '', content)
    
    # 3. Replace global CSS resets with scoped wrapper
    global_css_pattern = r'(<style>\s*)\*\s*\{\s*margin:\s*0;\s*padding:\s*0;\s*box-sizing:\s*border-box;\s*\}\s*body\s*\{[^}]*\}\s*body::before\s*\{[^}]*\}\s*body::after\s*\{[^}]*\}'
    
    replacement = r'\1/* Article container background for this specific article */\n        .main-content-wrapper {\n            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);\n            padding: 20px 0;\n            min-height: 60vh;\n        }'
    
    content = re.sub(global_css_pattern, replacement, content, flags=re.DOTALL)
    
    # 4. Fix animation and backdrop-filter issues
    content = re.sub(r'animation:\s*slideUp[^;]+;', 'transition: opacity 0.3s ease;', content)
    content = re.sub(r'backdrop-filter:\s*blur\([^)]+\);?\s*', '', content)
    
    # 5. Remove slideUp keyframes
    content = re.sub(r'@keyframes\s+slideUp\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    content = re.sub(r'@keyframes\s+slideInLeft\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    
    # 6. Simplify box-shadow
    content = re.sub(
        r'box-shadow:\s*0\s+20px\s+60px\s+rgba\(0,\s*0,\s*0,\s*0\.3\),\s*0\s+0\s+100px\s+rgba\([^)]+\);',
        'box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);',
        content
    )
    
    # 7. Fix HTML structure - add wrapper div
    content = re.sub(
        r'(<div class="header" include="\.\./header\.html"></div>\s*<!-- Main Content Area -->\s*<main class="main-content">)',
        r'<div class="header" include="../header.html"></div>\n    \n    <!-- Main Content Area -->\n    <div class="main-content-wrapper">\n        <main class="main-content">',
        content
    )
    
    # 8. Close wrapper div before footer
    content = re.sub(
        r'(\s*</main>\s*<!-- Footer -->\s*<div class="footer" include="\.\./footer\.html"></div>)',
        r'\n        </main>\n    </div>\n    \n    <!-- Footer -->\n    <div class="footer" include="../footer.html"></div>',
        content
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Fixed: {file_path}")

def fix_animation_article(file_path):
    """Fix articles with complex animations"""
    print(f"Fixing animation issues: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add featured-article-cards.css if missing
    if 'featured-article-cards.css' not in content and 'styles.css' in content:
        content = re.sub(
            r'(<link rel="stylesheet" href="\.\./styles\.css">)',
            r'\1\n    <link rel="stylesheet" href="../featured-article-cards.css">',
            content
        )
    
    # Remove complex animations
    content = re.sub(r'animation:\s*[^;]+;', 'transition: opacity 0.3s ease;', content)
    content = re.sub(r'backdrop-filter:\s*blur\([^)]+\);?\s*', '', content)
    
    # Remove animation keyframes
    content = re.sub(r'@keyframes\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Fixed animations: {file_path}")

def add_missing_css(file_path):
    """Add missing CSS includes to articles"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add featured-article-cards.css if missing
    if 'featured-article-cards.css' not in content and 'styles.css' in content:
        content = re.sub(
            r'(<link rel="stylesheet" href="\.\./styles\.css">)',
            r'\1\n    <link rel="stylesheet" href="../featured-article-cards.css">',
            content
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Added CSS: {os.path.basename(file_path)}")

# Critical articles with global resets
critical_articles = [
    "/home/reidwcoleman/articles/alexander-isak-transfer-liverpool-125m-2025-09-03.html",
    "/home/reidwcoleman/articles/pep-guardiola-downfall-worst-start-2025-09-01.html", 
    "/home/reidwcoleman/articles/man-utd-struggling-relegation-fears-2025-08-31.html"
]

print("=== Fixing Critical Articles ===")
for article in critical_articles:
    if os.path.exists(article):
        fix_critical_article(article)

print("\n=== Adding Missing CSS to All Articles ===")
articles_dir = "/home/reidwcoleman/articles/"
all_articles = glob.glob(os.path.join(articles_dir, "*.html"))
all_articles = [f for f in all_articles if not f.endswith('.backup.html')]

for article in all_articles:
    add_missing_css(article)

print(f"\n✓ Processing complete! Fixed {len(all_articles)} articles")