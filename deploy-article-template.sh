#!/bin/bash

# EPL News Hub - Deploy Modern Article Template

echo "🎨 EPL News Hub - Article Template Upgrade"
echo "=========================================="
echo ""

# Create backup
echo "💾 Creating backup of current template..."
cp article-template.html article-template-backup-$(date +%Y%m%d-%H%M%S).html

# Deploy new template
echo "🚀 Deploying modern article template..."
cp article-template-modern.html article-template.html

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 What's been upgraded:"
echo "  • White background with black text"
echo "  • Everything rounded (no sharp edges)"
echo "  • Professional typography"
echo "  • Rounded stat boxes"
echo "  • FPL tool promotional cards"
echo "  • 'You Should Read Next' section"
echo "  • FPL Premium banner"
echo "  • Automatic reading time calculator"
echo ""
echo "🎯 Next steps:"
echo "1. Test on a recent article"
echo "2. Verify all elements display correctly"
echo "3. Check mobile responsiveness"
echo "4. Update any custom modifications if needed"
echo ""
echo "To rollback: cp article-template-backup-*.html article-template.html"