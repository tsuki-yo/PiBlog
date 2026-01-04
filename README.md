# PiBlog

A personal blog built with [Hugo](https://gohugo.io/) static site generator and the [Geekblog](https://github.com/thegeeklab/hugo-geekblog) theme, deployed to GitHub Pages.

🌐 **Live Site:** [https://tsuki-yo.github.io/PiBlog/](https://tsuki-yo.github.io/PiBlog/)

## Features

- 📱 Responsive design with mobile-optimized layout
- 🌓 Dark/light/auto theme toggle
- 🏷️ Tag-based navigation
- ⭐ Custom star effect animation
- 🎨 Raspberry Pi themed color scheme
- 📊 Plausible Analytics integration

## Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) (v0.112.0 or later)
- [Node.js](https://nodejs.org/) and npm (for building theme assets)
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/tsuki-yo/PiBlog.git
cd PiBlog
git submodule update --init --recursive
```

### 2. Build theme assets

The Geekblog theme requires building its assets before use:

```bash
cd themes/geekblog
npm install
npm run build
cd ../..
```

### 3. Run local development server

```bash
hugo server -D
```

Visit `http://localhost:1313/PiBlog/` to view your site locally.

## Creating Content

### Create a new post

```bash
hugo new posts/my-new-post.md
```

This creates a new markdown file in `content/posts/` with front matter pre-filled.

### Post front matter example

```yaml
---
title: "My New Post"
date: 2024-01-04T10:00:00Z
draft: false
tags: ["tag1", "tag2"]
---

Your content here...
```

## Building for Production

```bash
hugo --minify
```

This generates the static site in the `public/` directory.

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch via GitHub Actions (`.github/workflows/pages.yml`).

The workflow:
1. Checks out the repository with submodules
2. Sets up Hugo Extended
3. Builds the Geekblog theme assets
4. Builds the Hugo site with minification
5. Deploys to GitHub Pages

## Project Structure

```
PiBlog/
├── content/
│   └── posts/           # Blog posts
├── layouts/
│   └── partials/        # Custom layout overrides
│       ├── site-header.html
│       ├── site-footer.html
│       └── head/
│           └── custom.html
├── static/
│   ├── css/
│   │   └── custom.css   # Custom styles
│   └── js/
│       └── star-effect.js
├── themes/
│   └── geekblog/        # Git submodule
├── public/              # Generated site (git ignored)
├── hugo.toml            # Hugo configuration
└── README.md
```

## Customization

### Colors

The site uses a custom Raspberry Pi color scheme defined in `static/css/custom.css`:
- Header: `#C51A4A` (Raspberry Pi red)
- Navbar: `#96d0e0` (Light blue)

### Social Links

Configure social media links in `data/menu/extra.yml`:

```yaml
header:
  - name: Dev.to
    ref: https://dev.to/username
    icon: gblog_devto
    external: true
```

### Analytics

Plausible Analytics is configured in `layouts/partials/head/custom.html`. Update the `data-domain` attribute to match your domain.

## Theme Documentation

For more information about theme features and customization options, visit the [Geekblog documentation](https://geekblog.de/).

## License

This blog is powered by Hugo and uses the Geekblog theme. Please refer to their respective licenses for usage terms.

## Contributing

This is a personal blog, but feel free to open issues for bugs or suggestions!
