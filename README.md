# Kush Patel — Portfolio

Personal portfolio site for **Kush Patel**, focused on cybersecurity and identity & access management (IAM).

**Live site:** [kushptl1.github.io](https://kushptl1.github.io)

## Structure

```
.
├── index.html                  # Home (about, projects, blog, contact)
├── Certifications.html         # Certifications and training
├── 404.html                    # Not-found page served by GitHub Pages
├── robots.txt / sitemap.xml    # Search engine basics
├── assets/css/style.css        # Site styles
├── assets/js/site.js           # Theme toggle, mobile nav, footer year
├── assets/js/medium-feed.js    # Renders blog cards
├── assets/posts.json           # Medium posts, refreshed daily by CI
├── scripts/fetch_medium.py     # Writes assets/posts.json from the Medium RSS feed
└── images/                     # Profile photo, OG card, favicon, cert logos
```

## Local preview

Serve the folder rather than opening files directly, so `assets/posts.json` can load:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Blog posts

The home page reads `assets/posts.json`, regenerated daily by
`.github/workflows/medium.yml`. To refresh it by hand:

```bash
python3 scripts/fetch_medium.py
```

If that file is ever missing, the page falls back to fetching the feed through
rss2json at runtime, then to a plain link to Medium.

## Theming

The palette lives in CSS custom properties in `assets/css/style.css`. Dark is the
default `:root` block; the same tokens are redefined for light under both
`@media (prefers-color-scheme: light)` and `:root[data-theme="light"]`, so the
toggle wins in either direction.

Pages follow the operating system until a visitor picks a theme, which is saved
in `localStorage` under `theme`. An inline script in each `<head>` applies the
saved choice before first paint, so there is no flash of the wrong theme. When
adding colors, add a token rather than a literal, or it won't switch.

## Homepage rhythm

Every homepage section uses the same two-column `split`: a numbered mono label
on the left (`01 About`, `02 Experience`, …) and the content on the right.
Sections are separated by a hairline `border-bottom` rather than alternating
background fills, so the page reads as one continuous column.

To add a section, copy the pattern, give it an `id`, bump the `.sec-num`, and add
a nav link pointing at that `id` — the header highlight picks it up automatically.

## Certifications page

Two groups, both using `.cert-card`: `01 Certifications` (exams) and
`02 Training` (longer programs). It shares the homepage's numbered-label rhythm.

A logo that ships its own background, like CodePath's, takes
`class="logo-bleed"` so it fills the tile instead of sitting on a white square.

To add a verification link to a card, put an `<a class="more">` after the
description, pointing at the Credly badge or issuer verification URL. None are
linked yet because the badge URLs aren't in the repo, and an unlinked claim is
weaker than a linked one.

Credentials are also mirrored in JSON-LD (`EducationalOccupationalCredential`)
in the page head; add new ones there too.

## Deploy

This repo is published with **GitHub Pages** from the `main` branch (root).

1. Commit and push changes to `main`
2. GitHub Pages serves the update at https://kushptl1.github.io

## Editing tips

- Copy lives in `index.html` and `Certifications.html`
- Styles live in `assets/css/style.css`
- Give every `<img>` a `width` and `height` so the page doesn't shift as it loads
- Use the color tokens (`var(--text)`, `var(--card)`, `rgba(var(--accent-rgb), …)`)
  instead of hex literals, so both themes stay correct
- Header links are lowercased in CSS (`text-transform`), so the markup keeps
  normal capitalization for screen readers. `site.js` sets `aria-current` on the
  link for whichever section is in view, which draws the box around it
- The header nav collapses to a hamburger at 760px; the panel is JS-driven and
  degrades to a plain wrapped row when JS is unavailable
- Experience is grouped by employer: one `.tl-group` per organization, with a
  `.tl-role-item` for each role held there, so a promotion reads as one stint.
  Both carry `data-start="YYYY-MM"` and, for anything finished, `data-end`.
  The durations and bar widths in the HTML are correct as written, and
  `site.js` recomputes them on load so an open-ended role never goes stale.
  Mark the present role with `class="tl-role-item current"`
- The hero stats row derives what it can: years-in-IT from `data-since` on its
  `<dd>`, and the project count from the number of `.project-card` elements.
  Certifications and focus are written by hand
- Social links and email are in the footer of both HTML pages
- `images/og-card.jpg` (1200×630) is the link preview image referenced by the
  Open Graph tags in both pages. It's a rendered card, not a photo; the source
  markup is not kept in the repo, so redo it in any 1200×630 design tool if the
  wording changes
