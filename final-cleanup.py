#!/usr/bin/env python3

import re
import os
import glob

def fix_broken_css_fragments(file_path):
    """Fix broken CSS fragments and malformed rules"""
    print(f"Final cleanup: {os.path.basename(file_path)}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Fix double closing braces '}}'
        content = re.sub(r'\}\}', '}', content)
        
        # Remove orphaned CSS fragments like "to { opacity: 1; transform: translateY(0); }"
        content = re.sub(r'\s*(to|from)\s*\{\s*[^}]*\}\s*', '', content)
        
        # Remove incomplete animation rules
        content = re.sub(r'transition: opacity 0\.3s ease;\}\s*100%[^}]*\}', 'transition: opacity 0.3s ease;', content)
        
        # Remove orphaned percentages with CSS rules
        content = re.sub(r'\s*100%\s*\{\s*[^}]*\}\s*', '', content)
        content = re.sub(r'\s*0%\s*\{\s*[^}]*\}\s*', '', content)
        
        # Fix broken comment box JS
        content = re.sub(r'hcb_user=\{\};', 'hcb_user={};', content)
        
        # Remove empty CSS rules
        content = re.sub(r'\s*\.\w+\s*\{\s*\}\s*', '', content)
        
        # Clean up multiple newlines
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Final cleanup applied: {os.path.basename(file_path)}")
        else:
            print(f"  No cleanup needed: {os.path.basename(file_path)}")
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")

# Process all articles
articles_dir = "/home/reidwcoleman/articles/"
all_articles = glob.glob(os.path.join(articles_dir, "*.html"))
all_articles = [f for f in all_articles if not f.endswith('.backup.html')]

print("=== Final CSS Cleanup ===")
for article in all_articles:
    fix_broken_css_fragments(article)

print(f"\n✓ Final cleanup complete! Processed {len(all_articles)} articles")