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
│               world/, scroll/,    world/world.js (the one renderer and loop), scroll/lenis.js,
│               works/              works/planes.js (the project-grid image layer)
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

A good build ends with: `OK  130 files identical to source (84.6 MB) + index.html ... + 16 share-card pages + the modern layer (4 files, 802 KB)` (main.js plus the hero, lenis and planes chunks). The build stops with a list of problems if `content/works.js` is wrong (see below) or if a published copy differs from its source.

The smoke test prints one PASS/FAIL line per check (35 in total: 18 desktop, 17 phone) and ends with `SMOKE TEST PASSED` or `SMOKE TEST FAILED (n)`. It takes about 100 s (software rendering, no GPU) and uses fixed waits, so re-run once before blaming a change.

## Deployment

Push to `main`. GitHub Actions ("Deploy site", `.github/workflows/deploy.yml`) runs `npm ci`, `npm run build`, `npm run test:smoke`, uploads `dist/` and deploys it to Pages (about a minute). Pages source must be "GitHub Actions". Check the run in the repo's Actions tab: both jobs, build and deploy, must be green. The smoke step is a deploy gate: a failing smoke test fails the build job, so the deploy job does not run and the live site stays on the last good version.

## Add or edit a project

Edit `content/works.js` only. Each project has: `slug`, `title`, `category`, `year`, `thumb`, `images` (list), `videos` (list), `description`, `details`, `tools` (list), and optionally `breakdown: [width, height]` (the Wire / Clay / Final slider; 6 projects have it). File names are given without the extension.

| Field | File that must exist |
|---|---|
| `thumb` | `images/thumbs/<thumb>.webp` |
| each `images` entry | `images/<name>.webp` |
| each `videos` entry | `videos/<name>.mp4` |
| `breakdown` (if set) | `images/projects-breakdown/<slug>-image-wire.webp`, `-clay.webp`, `-final.webp` (all 3 required) |
| `slug` | `og/<slug>.jpg` (only a warning if missing: the share card has no preview image) |

`npm run build` stops with a readable list if a required field is empty, a list is missing, `images` is empty, a slug is duplicated, `breakdown` is malformed, or a file above is missing (`og/` excepted).
Not checked by the build: add each new image's `[width, height]` to the `IMAGE_SIZES` map in `js/script.js` so the gallery reserves space while loading.

## Asset conventions

- File names are lowercase and match the project slug; GitHub Pages is case sensitive.
- Published images are `.webp`; the `.jpg` masters stay in the repo but are not published.
- Breakdown images: `images/projects-breakdown/<slug>-image-wire.webp`, `-clay.webp`, `-final.webp` (present for 6 projects; `js/breakdown.js` reads them for projects that have a `breakdown` field).
- Do not delete files from `images/`, `videos/`, `fonts/`, `og/` or `vendor/`.

## Rebuild the hero model

`js/hero-3d-model.js` is generated from `source/portfolio.glb`:

```bash
pip install numpy
python3 tools/build-hero-model.py
```

Needs Python 3 and numpy. Run it only when the model changes; on the unchanged model it reproduces the committed file byte for byte.

## 3D layers and safety switches

One renderer and one loop (`src/world/world.js`) serve two layers: the hero, and the project-grid planes (`src/works/planes.js`, a lazy chunk). Planes draw each project card's image in WebGL for the scroll wave, the desktop hover blur pulse and pointer fisheye, and the touch press zoom. A tile shows its plane only after the plane has been drawn once; any failure (no WebGL 2, a texture error, context loss) returns that tile, or all tiles, silently to the plain DOM image. The loop runs only while something moves: at rest, with the grid off screen, with a project panel open and in a hidden tab it does (almost) nothing (numbers below). `window.__planes` = `{ state: 'on' | 'off' | 'lost', reason, tiles, ready, last }`.

Planes do not start with reduced motion at load, with Data Saver or a very slow link (the hero is skipped), without WebGL 2, or with `?planes=off`.

| Query | Remembered as | Effect |
|---|---|---|
| `?planes=off` / `?planes=on` | `pf_planes` | grid images stay plain DOM / back to planes |
| `?canvas=docked` / `?canvas=fixed` | `pf_canvas` | hero uses the old docked canvas / the fixed viewport canvas |
| `?motion=full` | `pf_motion` | keeps motion on although the OS asks for reduced motion |

Owner-tunable values live in one block at the top of each file; edit, rebuild, reload. In `src/works/planes.js` (`FEEL`): `WAVE_AMP` 0.10 (scroll wave strength; flip the sign to flip the direction), `BLUR_PX` 5 (hover blur), `LENS_STRENGTH` 0.25 (pointer fisheye), `PRESS_ZOOM` 1.04 (touch press), plus hover zoom, ramp times and wave smoothing. In `js/polish.js` (`T`): the layout, scroll-motion and swipe values and the close-transition values `VT_VISIBLE` 0.4, `VT_CLOSE_WAIT_MS` 400, `VT_FAILSAFE_MS` 1500.

Closing a project with the X button or Escape runs a reverse View Transition from the project's top image to its card (`initCloseTransition` in `js/polish.js`). It runs only when the browser has `document.startViewTransition`, motion is not reduced (read at load), the opening was not an instant one, the project's card exists and is not filtered out, and at least 40% of both the card and the top image are on screen. In every other case, and always for Back and swipe-down, the normal close runs untouched.

## Budgets

Measured in 6f against the end of Phase 5 (`6e914d5`, built in a second clone), same harness, headless Chromium with software GL (no GPU), medians of 3. Not a PageSpeed, device or GPU result; the harness is not in this repo. "Eager" = the files `index.html` loads (HTML, CSS, vendor scripts, `js/*.js`, `content/works.js`, `main.js`); "lazy" = the hero, lenis and planes chunks and `js/hero-3d-model.js`. Sizes are gzip -9 of the built files.

| Budget | End of Phase 5 | Now | Change |
|---|---|---|---|
| Eager gzip | 125,362 B | 125,949 B | +587 B |
| Lazy gzip | 272,634 B | 278,193 B | +5,559 B (planes chunk 5,338; hero chunk +221) |
| CLS, 1440x900 (load, scroll grid, open/close) | 0.211 | 0.212 | within noise; about 0.21 is all at load and pre-existing |
| CLS, 390x844 | 0.005 | 0.006 | within noise |
| World rAF calls per 3 s at rest, grid off screen, hidden tab (mocked) | 0 | 0 | none |
| World rAF calls per 3 s, panel open (desktop / phone) | 1 / 0 | 2 / 0 | +1 |
| Page-wide rAF calls per 3 s at rest (desktop / phone) | 372 / 192 | 372 / 192 | none (gsap and ScrollTrigger tickers) |
| Console errors, page errors, failed requests, HTTP 4xx/5xx over 27 scenarios | 0 | 0 | none |

Eager growth comes from `js/polish.js` (+1,006 B, the close transition; the file ships unminified), partly offset by `js/script.js` (-373 B).

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
