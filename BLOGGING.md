# Markdown Blog System

This project now publishes blog posts automatically from Markdown files.

## Where to add posts

Add each article as a `.md` file in:

```text
src/content/blog/
```

When you push the file to GitHub, Vercel will rebuild the Vite app and the article will appear on the Blog page automatically.

## File format

Use frontmatter at the top of each Markdown file:

```md
---
title: "Example article title"
slug: "example-article-title"
date: "2026-06-29"
author: "JOT Wellness"
category: "Parenting"
tags: ["parent coaching", "home routines"]
excerpt: "A short summary shown on cards and used as SEO description."
image: "https://example.com/image.jpg"
imageAlt: "Short accessible image description"
featured: false
draft: false
---

Write the article content here using Markdown.
```

## Supported fields

- `title` — required for best results.
- `slug` — URL/hash slug, e.g. `#/blog/example-article-title`. If omitted, the filename is used.
- `date` — `YYYY-MM-DD` format.
- `author` — shown in the card and article header.
- `category` — used for filtering.
- `tags` — array used for search and article metadata.
- `excerpt` — card text and meta description.
- `image` — remote URL or public asset path, e.g. `/blog/my-image.jpg` if placed in `public/blog/`.
- `imageAlt` — image alt text.
- `featured` — `true` pushes the post to the top.
- `draft` — `true` hides the post from production.

## Vercel notes

No CMS or database is required. The blog uses Vite's `import.meta.glob` at build time, so new Markdown files are bundled into the static site during each Vercel deployment.
