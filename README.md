# Waseem Mohammed — Portfolio Site

A static single-page portfolio. **All content lives in `content.yaml`** —
no HTML or JS edits needed for routine updates.

## What's here

| File | Purpose |
|---|---|
| `index.html` | Page shell — meta tags, fonts, root container, script tags |
| `styles.css` | Source styles — edit this |
| `styles.min.css` | Minified styles — served by the page |
| `app.js` | Source JS — edit this |
| `app.min.js` | Minified JS — served by the page |
| `content.yaml` | **Edit this for all content changes** |
| `avatar.webp` | Headshot — primary (WebP, 640 × 640) |
| `avatar_400.webp` | Headshot — small (WebP, 400 × 400, served on mobile) |
| `avatar.jpg` | Headshot — JPEG fallback (640 × 640) |
| `avatar_400.jpg` | Headshot — JPEG fallback small (400 × 400) |
| `robots.txt` | Allows all crawlers |

No framework. No build step for content. Three static assets + one YAML file = the whole site.

## Editing content

Open `content.yaml` and change values. Save, refresh the browser.

Sections: `profile`, `hero`, `about`, `skills`, `experience`, `projects`,
`education`, `certifications`, `testimonials`, `contact`.

### Auto-computed tokens

These placeholders in `content.yaml` are replaced at render time — no manual editing needed:

| Token | Value |
|---|---|
| `{years}` | `new Date().getFullYear() - profile.career_start_year` — increments every Jan 1 |
| `{projects}` | Count of items in `projects.items` |
| `{ai_agents}` | Count of cards in `ai_mind.proof` |

### YAML quick reference

- Indentation is **2 spaces** (never tabs).
- `# …` lines are comments.
- Multi-line text: `|` keeps line breaks, `>` folds into one paragraph.
- Inside any **headline**, italicize with:
  - `*word*` → italic emerald (accent)
  - `**word**` → italic rose (pop)

## Running locally

The site uses `fetch()` to load `content.yaml` — won't work from a `file://` URL.
Run any static server from the project root:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

## After editing `app.js` or `styles.css`

The page loads the minified files. Rebuild them before testing performance:

```bash
cleancss styles.css -o styles.min.css
terser app.js --compress --mangle -o app.min.js
```

Install once if needed: `npm install -g clean-css-cli terser`

Content changes in `content.yaml` need no rebuild.

## Deploying

Pure static — drop all files onto any static host.

| Host | How |
|---|---|
| **Vercel / Netlify** | Drag the folder, or connect the repo. No build command needed. |
| **Cloudflare Pages** | Connect repo → no build command → publish directory `.` |
| **GitHub Pages** | Push to `gh-pages` or set Pages to `/` of `main` |
| **S3 + CloudFront** | `aws s3 sync . s3://your-bucket` |

## Contact form

The form POSTs to `contact.form_endpoint` in `content.yaml`.
Currently wired to Formspree. To change provider, swap the URL — any service
that accepts `multipart/form-data` POST and returns `2xx` on success works.

Spam protection: client-side honeypot field + Formspree's server-side filter.

## Replacing the avatar

1. Drop your image in the project root (e.g. `headshot.webp`).
2. Create a 400 px version for mobile: `sips -Z 400 headshot.webp --out headshot_400.webp`
3. Create JPEG fallbacks: `sips -s format jpeg headshot.webp --out headshot.jpg`
4. In `content.yaml` set `profile.avatar: headshot.webp`.

The `<picture>` element in `app.js` automatically derives the `_400` and `.jpg` variants
from the base filename.

## Design tokens

All colors are CSS variables in `:root` at the top of `styles.css`:

| Token | Value | Role |
|---|---|---|
| `--bg` | `#FAFAF7` | Page background |
| `--paper` | `#EFEEE8` | Pills, stat tile #3 |
| `--ink` | `#14110E` | Body text, dark bands |
| `--inkSoft` | `#5A554C` | Muted text |
| `--accent` | `#156B4F` | Emerald — italic #1, links, contact band |
| `--pop` | `#C9325C` | Rose — italic #2, badges |
| `--line` | `#E2E0D8` | Borders, hairlines |

## Accessibility

- All interactive elements keyboard-reachable (Tab / Enter / Space).
- ESC closes any open modal.
- `prefers-reduced-motion` disables marquee, orbit, and entrance animations.
- `<main>` landmark wraps all page content.
- Heading hierarchy: h1 (hero) → h2 (sections) → h3 (sub-items).
