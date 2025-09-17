#!/bin/bash

# EPL News Hub - Fast Homepage Deployment

echo "⚡ EPL News Hub - Homepage Speed Optimization"
echo "============================================"
echo ""

# Create backup
echo "💾 Backing up current index.html..."
cp index.html index-backup-$(date +%Y%m%d-%H%M%S).html

# Deploy optimized version
echo "🚀 Deploying optimized homepage..."
cp index-fast.html index.html

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 What's been optimized:"
echo "  • Inline critical CSS for instant rendering"
echo "  • Lazy loading for below-fold content"
echo "  • Deferred analytics & ads (3 second delay)"
echo "  • Smart caching with content preloading"
echo "  • Breaking news ticker animation"
echo "  • Skeleton loading placeholders"
echo ""
echo "🎯 Expected improvements:"
echo "  • 60-70% faster initial load"
echo "  • Better Core Web Vitals scores"
echo "  • Smoother user experience"
echo ""
echo "To rollback: cp index-backup-*.html index.html"