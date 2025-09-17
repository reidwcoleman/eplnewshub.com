#!/bin/bash

# EPL News Hub - Performance Optimization Deployment Script

echo "🚀 EPL News Hub Performance Upgrade Deployment"
echo "=============================================="
echo ""

# Create backup directory
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
echo "📁 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup critical files
echo "💾 Backing up current files..."
cp index.html "$BACKUP_DIR/index.html" 2>/dev/null
cp styles.css "$BACKUP_DIR/styles.css" 2>/dev/null
cp index.js "$BACKUP_DIR/index.js" 2>/dev/null
cp sw.js "$BACKUP_DIR/sw.js" 2>/dev/null

echo "✅ Backup complete"
echo ""

# Ask user which optimization level
echo "Choose optimization level:"
echo "1) Quick Test - Use optimized HTML only"
echo "2) Performance Mode - Optimized HTML + minified CSS"
echo "3) Full Polish - All optimizations + modern design"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🔧 Deploying Quick Test mode..."
        cp index-optimized.html index.html
        echo "✅ Quick Test deployed"
        ;;
    2)
        echo "⚡ Deploying Performance Mode..."
        cp index-optimized.html index.html
        cp optimized-styles.css styles.css
        cp optimized-loader.js index.js
        echo "✅ Performance Mode deployed"
        ;;
    3)
        echo "🎨 Deploying Full Polish mode..."
        cp index-optimized.html index.html
        cp polished-styles.css styles.css
        cp optimized-loader.js index.js
        cp sw-optimized.js sw.js
        echo "✅ Full Polish deployed"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "📊 Deployment Summary:"
echo "----------------------"
echo "Backup stored in: $BACKUP_DIR"
echo "Optimization level: $choice"
echo ""
echo "🔄 To rollback, run:"
echo "cp $BACKUP_DIR/* ."
echo ""
echo "🎯 Next steps:"
echo "1. Clear browser cache"
echo "2. Test site functionality"
echo "3. Run Lighthouse audit"
echo "4. Monitor performance metrics"
echo ""
echo "✨ Deployment complete! Your site should now be much faster."