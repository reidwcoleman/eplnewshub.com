#!/usr/bin/env node

/**
 * Script to check and validate article filenames
 * Ensures all articles follow the naming convention: article-title-YYYY-MM-DD.html
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

// Regular expression for valid article filename
const VALID_FILENAME_REGEX = /^[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.html$/;
const DATE_REGEX = /\d{4}-\d{2}-\d{2}/;

function checkArticleNames() {
    const articlesDir = './articles';
    
    if (!fs.existsSync(articlesDir)) {
        console.error(`${colors.red}Articles directory not found!${colors.reset}`);
        return;
    }
    
    const files = fs.readdirSync(articlesDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    console.log(`\nChecking ${htmlFiles.length} article files...\n`);
    console.log('='.repeat(80));
    
    let validCount = 0;
    let invalidCount = 0;
    const issues = [];
    
    htmlFiles.forEach(file => {
        const isValid = VALID_FILENAME_REGEX.test(file);
        
        if (isValid) {
            validCount++;
            console.log(`${colors.green}✓${colors.reset} ${file}`);
        } else {
            invalidCount++;
            let issue = '';
            
            // Identify specific issues
            if (file !== file.toLowerCase()) {
                issue = 'Contains uppercase letters';
            } else if (!DATE_REGEX.test(file)) {
                issue = 'Missing or invalid date format (should be YYYY-MM-DD)';
            } else if (file.includes('_')) {
                issue = 'Contains underscores (use hyphens instead)';
            } else if (file.includes(' ')) {
                issue = 'Contains spaces (use hyphens instead)';
            } else {
                issue = 'Invalid format';
            }
            
            console.log(`${colors.red}✗${colors.reset} ${file}`);
            console.log(`  ${colors.yellow}Issue: ${issue}${colors.reset}`);
            
            // Suggest corrected filename
            const suggestion = suggestCorrection(file);
            if (suggestion !== file) {
                console.log(`  ${colors.green}Suggested: ${suggestion}${colors.reset}`);
            }
            
            issues.push({
                file,
                issue,
                suggestion
            });
        }
    });
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('\nSUMMARY:');
    console.log(`${colors.green}Valid files: ${validCount}${colors.reset}`);
    console.log(`${colors.red}Invalid files: ${invalidCount}${colors.reset}`);
    
    if (issues.length > 0) {
        console.log('\n' + colors.yellow + 'Files needing correction:' + colors.reset);
        issues.forEach(({file, issue}) => {
            console.log(`  - ${file}: ${issue}`);
        });
        
        console.log('\n' + colors.yellow + 'Run with --fix flag to automatically rename files' + colors.reset);
    }
    
    return issues;
}

function suggestCorrection(filename) {
    let corrected = filename
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/_/g, '-')
        .replace(/[^a-z0-9-.]/g, '')
        .replace(/-+/g, '-');
    
    // If no date found, append today's date
    if (!DATE_REGEX.test(corrected)) {
        const today = new Date().toISOString().split('T')[0];
        const nameWithoutExt = corrected.replace('.html', '');
        corrected = `${nameWithoutExt}-${today}.html`;
    }
    
    return corrected;
}

function fixArticleNames() {
    const issues = checkArticleNames();
    
    if (issues.length === 0) {
        console.log('\n' + colors.green + 'All files are properly named!' + colors.reset);
        return;
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\nFIXING FILES...\n');
    
    issues.forEach(({file, suggestion}) => {
        const oldPath = path.join('./articles', file);
        const newPath = path.join('./articles', suggestion);
        
        if (fs.existsSync(newPath)) {
            console.log(`${colors.red}Cannot rename ${file} to ${suggestion} - file already exists${colors.reset}`);
        } else {
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`${colors.green}Renamed: ${file} → ${suggestion}${colors.reset}`);
            } catch (error) {
                console.log(`${colors.red}Error renaming ${file}: ${error.message}${colors.reset}`);
            }
        }
    });
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--fix')) {
    console.log(colors.yellow + 'Running in FIX mode...' + colors.reset);
    fixArticleNames();
} else {
    checkArticleNames();
}