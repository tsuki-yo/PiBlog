# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hugo static site generator blog using the Geekblog theme, deployed to GitHub Pages. The site is configured to be hosted at https://tsuki-yo.github.io/PiBlog/.

## Essential Commands

### Local Development
```bash
# Build theme assets (required after clone or theme updates)
cd themes/geekblog && npm install && npm run build && cd ../..

# Run local development server
hugo server -D

# Build the site for production
hugo --minify
```

### Content Management
```bash
# Create a new post
hugo new posts/my-new-post.md

# Build and preview
hugo server -D
```

## Project Structure

- **content/posts/**: Blog posts in Markdown format
- **public/**: Generated static site (auto-generated, do not edit directly)
- **themes/geekblog/**: Git submodule containing the Geekblog theme
- **static/**: Custom CSS and JS files
- **hugo.toml**: Main Hugo configuration

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the main branch via the `.github/workflows/pages.yml` workflow. The workflow:
1. Checks out the repository with submodules
2. Builds the Geekblog theme assets (npm install && npm run build)
3. Builds the Hugo site with minification
4. Deploys to GitHub Pages

## Theme Development

The Geekblog theme requires Node.js to build its assets. Key theme commands:
- `cd themes/geekblog && npm run build`: Build production theme assets
- `cd themes/geekblog && npm run lint`: Lint theme JavaScript

## Important Configuration

- Base URL is set to `https://tsuki-yo.github.io/PiBlog/` in hugo.toml
- Theme is loaded as a Git submodule from https://github.com/thegeeklab/hugo-geekblog.git
- Theme assets must be built before the Hugo site can be generated