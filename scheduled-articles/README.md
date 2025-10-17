# Scheduled Articles

This directory contains articles scheduled for future publication.

## How It Works

When Claude creates an article for you with a future date:
1. The article and metadata files are placed in this directory
2. They are committed and pushed to GitHub
3. Every time files in this directory change (via push), GitHub Actions checks if any articles should be published
4. If an article's date has arrived (today >= publishDate), it automatically publishes

## What Claude Does When You Say "Create a New Article for [DATE]"

1. Creates the article HTML file
2. Creates the metadata JSON file with your specified date
3. Commits both files to this directory
4. Pushes to GitHub
5. The workflow automatically checks and publishes if the date matches

## Date Format

- Articles publish when: `today >= publishDate`
- An article dated 2025-10-20 will publish on October 20, 2025 when pushed
