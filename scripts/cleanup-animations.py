#!/usr/bin/env python3

import re
import os
import glob

def clean_animation_fragments(file_path):
    """Clean up remaining animation fragments and broken CSS"""
    print(f"Cleaning: {os.path.basename(file_path)}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Remove animation properties
        content = re.sub(r'animation:\s*[^;]+;?\s*', 'transition: opacity 0.3s ease;', content)
        content = re.sub(r'animation-[^:]+:[^;]+;?\s*', '', content)
        
        # Remove all keyframe animations
        content = re.sub(r'@keyframes\s+\w+\s*\{[^}]*\}', '', content, flags=re.DOTALL)
        
        # Remove backdrop-filter completely
        content = re.sub(r'backdrop-filter:[^;]+;?\s*', '', content)
        content = re.sub(r'-webkit-backdrop-filter:[^;]+;?\s*', '', content)
        
        # Clean up orphaned CSS fragments like "to { opacity: 1; transform: translateY(0); }"
        content = re.sub(r'\s*to\s*\{\s*opacity:\s*1;\s*transform:\s*translate[^}]*\}\s*', '', content)
        content = re.sub(r'\s*from\s*\{\s*opacity:\s*0;\s*transform:\s*translate[^}]*\}\s*', '', content)
        
        # Remove complex transform animations
        content = re.sub(r'transform:\s*translate[^;]+;?\s*animation[^;]+;?\s*', 'transition: opacity 0.3s ease;', content)
        
        # Clean up loading animations but keep simple ones
        content = re.sub(r'animation:\s*loading[^;]+;?\s*', '', content)
        content = re.sub(r'animation:\s*rotate[^;]+;?\s*', '', content)
        content = re.sub(r'animation:\s*slideIn[^;]+;?\s*', 'transition: opacity 0.3s ease;', content)
        content = re.sub(r'animation:\s*fadeIn[^;]+;?\s*', 'transition: opacity 0.3s ease;', content)
        
        # Remove any remaining slideUp, slideInLeft, etc.
        content = re.sub(r'@keyframes\s+(slideUp|slideInLeft|slideInRight|fadeIn|loading)\s*\{[^}]*\}', '', content, flags=re.DOTALL)
        
        # Clean up empty CSS rules
        content = re.sub(r'\s*\{\s*\}', '', content)
        
        # Remove extra whitespace
        content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Cleaned animations in: {os.path.basename(file_path)}")
        else:
            print(f"  No changes needed: {os.path.basename(file_path)}")
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")

# Process all articles
articles_dir = "/home/reidwcoleman/articles/"
all_articles = glob.glob(os.path.join(articles_dir, "*.html"))
all_articles = [f for f in all_articles if not f.endswith('.backup.html')]

print("=== Cleaning Animation Fragments ===")
for article in all_articles:
    clean_animation_fragments(article)

print(f"\n✓ Cleanup complete! Processed {len(all_articles)} articles")