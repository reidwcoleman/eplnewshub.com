#!/usr/bin/env node

/**
 * Remove Breadcrumb Navigation from Articles
 * Removes both the HTML breadcrumb nav and BreadcrumbList schema
 */

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, 'articles');

function removeBreadcrumbs(filePath) {
    const filename = path.basename(filePath);
    console.log(`Processing: ${filename}`);

    let html = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove Breadcrumb HTML navigation
    const breadcrumbNavRegex = /<!-- Breadcrumb Navigation -->[\s\S]*?<\/nav>\s*/g;
    if (breadcrumbNavRegex.test(html)) {
        html = html.replace(breadcrumbNavRegex, '');
        modified = true;
        console.log(`  ✓ Removed breadcrumb HTML`);
    }

    // Remove Breadcrumb structured data
    const breadcrumbSchemaRegex = /<!-- Breadcrumb Structured Data -->[\s\S]*?<\/script>\s*/g;
    if (breadcrumbSchemaRegex.test(html)) {
        html = html.replace(breadcrumbSchemaRegex, '');
        modified = true;
        console.log(`  ✓ Removed breadcrumb schema`);
    }

    if (modified) {
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`  ✅ Updated successfully\n`);
        return true;
    } else {
        console.log(`  ⏭️  No breadcrumbs found\n`);
        return false;
    }
}

// Main execution
console.log('🗑️  Removing breadcrumb navigation from all articles\n');
console.log('='.repeat(60) + '\n');

const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.html'));

let removed = 0;
let skipped = 0;

files.forEach(filename => {
    const filePath = path.join(ARTICLES_DIR, filename);
    const wasModified = removeBreadcrumbs(filePath);

    if (wasModified) {
        removed++;
    } else {
        skipped++;
    }
});

console.log('='.repeat(60));
console.log('\n📊 Summary:');
console.log(`  ✅ Breadcrumbs removed from: ${removed} files`);
console.log(`  ⏭️  Already clean: ${skipped} files`);
console.log(`  📁 Total processed: ${files.length} files\n`);
console.log('✨ Breadcrumb removal complete!\n');
