# Ahmad Nahass — 3D artist portfolio

Portfolio site with 16 projects, a dark/light theme, project panels with galleries and video, and a 3D hero (the letters PORT / FOLIO with physics).
Live: https://nahass87868.github.io/ahmad-3d-portfolio/

Stack: Vite 8.3.5 and three 0.186.1 (both pinned exactly) for the 3D layer; the rest of the site is plain scripts and CSS. GSAP and ScrollTrigger are vendored in `vendor/`. Hosted on GitHub Pages.

## Folder map

```txt
ahmad-3d-portfolio/
├── index.html
├── README.md, package.json, package-lock.json, vite.config.js
├── .gitignore, .nvmrc            Node version (22); GUIDE.md and APPLY.txt are git-ignored
├── .github/workflows/deploy.yml  build + smoke test + publish to GitHub Pages
├── css/        style.css, premium.css
├── js/         script.js, premium.js, polish.js, extras.js, fixes.js,
│               about-photo.js, breakdown.js, hero-3d-model.js (generated, base64)
├── content/    works.js            the project list (single source of truth)
├── src/        main.js, hero/,     the Vite layer: hero/ (hero-3d.js, hero-fallback.js),
│               world/, scroll/     world/world.js (the one renderer and loop), scroll/lenis.js
├── tests/      smoke.mjs
├── tools/      build-site.mjs, build-hero-model.py, graph-map.py
├── source/     portfolio.glb + 6 project .glb files (never published)
├── images/     webp, jpg masters, 1 png master; thumbs/, projects-breakdown/
├── videos/     mp4
├── fonts/      archivo.woff2, space-mono.woff2
├── vendor/     gsap.min.js, ScrollTrigger.min.js
├── og/         <slug>.jpg share-card preview images
└── graphify-out/   code map (generated)
```

Published as-is: `images/`, `videos/`, `fonts/`, `vendor/`, `og/`. Never published: `tools/`, `tests/`, `source/`, `.github/`, `graphify-out/`, the `.jpg` masters and the unused `.png` master in `images/`.

## Requirements

Node 22 (see `.nvmrc`; `package.json` allows >= 20.19). For the smoke test: Google Chrome installed, or set `PW_CHROMIUM=/path/to/chromium`.

## Commands

```bash
npm ci                 # install exact dependencies
npm run dev            # Vite dev server (http://localhost:5173). Not byte-identical to the published site
npm run build          # builds into dist/; must end with a line starting "OK"
npm run preview        # serves dist/ (the real published output)
npm run test:smoke     # run after npm run build; opens dist/ in Chrome at desktop and phone size
```

A good build ends with: `OK  129 files identical to source (84.6 MB) + index.html ... + 16 share-card pages + the modern layer (2 files, 766 KB)`. The build stops with a list of problems if `content/works.js` is wrong (see below) or if a published copy differs from its source.

The smoke test prints one PASS/FAIL line per check (25 in total: 12 desktop, 13 phone) and ends with `SMOKE TEST PASSED` or `SMOKE TEST FAILED (n)`. It takes about 35 s and uses fixed waits, so re-run once before blaming a change.

## Deployment

Push to `main`. GitHub Actions ("Deploy site", `.github/workflows/deploy.yml`) runs `npm ci`, `npm run build`, `npm run test:smoke`, uploads `dist/` and deploys it to Pages (about a minute). Pages source must be "GitHub Actions". Check the run in the repo's Actions tab: both jobs, build and deploy, must be green. The smoke step is a deploy gate: a failing smoke test fails the build job, so the deploy job does not run and the live site stays on the last good version.

## Add or edit a project

Edit `content/works.js` only. Each project has: `slug`, `title`, `category`, `year`, `thumb`, `images` (list), `videos` (list), `description`, `details`, `tools` (list). File names are given without the extension.

| Field | File that must exist |
|---|---|
| `thumb` | `images/thumbs/<thumb>.webp` |
| each `images` entry | `images/<name>.webp` |
| each `videos` entry | `videos/<name>.mp4` |
| `slug` | `og/<slug>.jpg` (only a warning if missing: the share card has no preview image) |

`npm run build` stops with a readable list if a required field is empty, a list is missing, `images` is empty, a slug is duplicated, or a file above is missing (`og/` excepted).
Not checked by the build: add each new image's `[width, height]` to the `IMAGE_SIZES` map in `js/script.js` so the gallery reserves space while loading.

## Asset conventions

- File names are lowercase and match the project slug; GitHub Pages is case sensitive.
- Published images are `.webp`; the `.jpg` masters stay in the repo but are not published.
- Breakdown images: `images/projects-breakdown/<slug>-image-wire.webp`, `-clay.webp`, `-final.webp` (present for 6 projects; no site code reads them yet).
- Do not delete files from `images/`, `videos/`, `fonts/`, `og/` or `vendor/`.

## Rebuild the hero model

`js/hero-3d-model.js` is generated from `source/portfolio.glb`:

```bash
pip install numpy
python3 tools/build-hero-model.py
```

Needs Python 3 and numpy. Run it only when the model changes; on the unchanged model it reproduces the committed file byte for byte.

## Code map

```bash
pip install graphifyy          # two y
python3 tools/graph-map.py
```

Regenerates `graphify-out/` (`PROJECT_MAP.md`, `graph.json`, `GRAPH_REPORT.md`, `graph.html`). `PROJECT_MAP.md` lists the script load order and the `window.*` globals shared between scripts: read it before touching either. Do not change the order or the `defer` attributes of the script tags in `index.html`.

## Recovery

- Undo a commit: GitHub Desktop, History, right-click the commit, Revert this commit, Push origin.
- Branch `legacy`: the site before the Vite layer.
- Branch `pre-tidy`: the repo exactly as it was before the folder tidy (`abbdbb2`).
