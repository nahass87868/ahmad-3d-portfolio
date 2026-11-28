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
│               works/, turntable/  works/planes.js (the project-grid image layer),
│                                   turntable/turntable.js (the project-panel 3D stage)
├── tests/      smoke.mjs
├── tools/      build-site.mjs, build-hero-model.py, build-turntable-models.py, graph-map.py
├── source/     portfolio.glb + 6 project .glb files (never published)
├── models/     nike-shoe, yerba-mate, youth-affairs, date-cookies .glb (lean turntable models, generated from source/)
├── images/     webp, jpg masters, 1 png master; thumbs/, projects-breakdown/
├── videos/     mp4
├── fonts/      archivo.woff2, space-mono.woff2
├── vendor/     gsap.min.js, ScrollTrigger.min.js
├── og/         <slug>.jpg share-card preview images
└── graphify-out/   code map (generated)
```

Published as-is: `images/`, `videos/`, `fonts/`, `vendor/`, `og/`, `models/`. Never published: `tools/`, `tests/`, `source/`, `.github/`, `graphify-out/`, the `.jpg` masters and the unused `.png` master in `images/`.

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

A good build ends with: `OK  134 files identical to source (85.7 MB) + index.html ... + 16 share-card pages + the modern layer (6 files, 811 KB)` (main.js plus the hero, three, lenis, planes and turntable chunks). The build stops with a list of problems if `content/works.js` is wrong (see below) or if a published copy differs from its source.

The smoke test prints one PASS/FAIL line per check (64 in total: 34 desktop, 30 phone) and ends with `SMOKE TEST PASSED` or `SMOKE TEST FAILED (n)`. It takes about 100 s (software rendering, no GPU) and uses fixed waits, so re-run once before blaming a change.

## Deployment

Push to `main`. GitHub Actions ("Deploy site", `.github/workflows/deploy.yml`) runs `npm ci`, `npm run build`, `npm run test:smoke`, uploads `dist/` and deploys it to Pages (about a minute). Pages source must be "GitHub Actions". Check the run in the repo's Actions tab: both jobs, build and deploy, must be green. The smoke step is a deploy gate: a failing smoke test fails the build job, so the deploy job does not run and the live site stays on the last good version.

## Add or edit a project

Edit `content/works.js` only. Each project has: `slug`, `title`, `category`, `year`, `thumb`, `images` (list), `videos` (list), `description`, `details`, `tools` (list), and optionally `breakdown: [width, height]` (the Wire / Clay / Final slider; 6 projects have it) and `model: '<name>'` (the 3D model for the project-panel turntable; 4 projects have it; see "Add a 3D model"). File names are given without the extension.

| Field | File that must exist |
|---|---|
| `thumb` | `images/thumbs/<thumb>.webp` |
| each `images` entry | `images/<name>.webp` |
| each `videos` entry | `videos/<name>.mp4` |
| `breakdown` (if set) | `images/projects-breakdown/<slug>-image-wire.webp`, `-clay.webp`, `-final.webp` (all 3 required) |
| `model` (if set) | `models/<model>.glb` (must be a GLB file; generated, see "Rebuild the turntable models") |
| `slug` | `og/<slug>.jpg` (only a warning if missing: the share card has no preview image) |

`npm run build` stops with a readable list if a required field is empty, a list is missing, `images` is empty, a slug is duplicated, `breakdown` is malformed, `model` is not a plain file name, or a file above is missing (`og/` excepted).
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

## Rebuild the turntable models

`models/<name>.glb` is generated from `source/<name>.glb` (nike-shoe, yerba-mate, youth-affairs, date-cookies). Each output is geometry only: one mesh with the node transforms applied, no textures, centred with a bounding sphere of radius 1, positions int16 and normals int8 (`KHR_mesh_quantization`), `COLOR_0` only if the model has real colours, and no normals for a model that is entirely flat-shaded (glTF reads that as flat shading: youth-affairs). The triangle count is unchanged and checked. They are 0.1 to 0.4 MB each, from 15 MB of sources.

```bash
pip install numpy
python3 tools/build-turntable-models.py          # all four, or name some: ... nike-shoe
```

Needs Python 3 and numpy. Run it only when a source model changes (to add one, see "Add a 3D model"). Rerunning it on unchanged sources gives identical files.

## Add a 3D model

No code change is needed: the turntable stage appears for any project that has a `model` field, and no model name is written anywhere in `src/` or `js/`.

1. Export the model as a GLB 2.0 and save it as `source/<name>.glb`. `<name>` is lowercase letters, digits and hyphens (the build rejects anything else). `source/` is never published.
2. Add `<name>` to `MODELS` in `tools/build-turntable-models.py` (so "rebuild all" includes it), then run `python3 tools/build-turntable-models.py <name>`. It prints the triangle count and the output size; the triangle count must equal the source's (the tool stops if it does not).
3. In `content/works.js`, set `model: '<name>'` on the project.
4. `npm run build`. It stops if `models/<name>.glb` is missing or not a GLB, and it publishes `models/` byte for byte (the file count in the OK line goes up by one).
5. `npm run preview`, open the project and look: the model is centred and not clipped, faces the viewer sensibly, and a drag turns it. This step is by eye: the smoke test only exercises the existing models.
6. `npm run test:smoke`, then `python3 tools/graph-map.py`, then commit `source/<name>.glb`, `models/<name>.glb`, `content/works.js`, the tool and `graphify-out/`.

What the source file must be:

- Uncompressed glTF 2.0 binary. Draco, meshopt or quantized sources are refused; sparse accessors are refused.
- Every mesh primitive is a triangle list with `POSITION` and `NORMAL` (the tool stops with a message otherwise, and also if a mesh is inside out). Textures, UVs, animation and skins are dropped; all meshes of the default scene are merged into one.
- Colours (material base colour times vertex colour) are kept in the output only if the model has any, but the stage does not read them: every model is drawn in the same clay grey.

Size: the tool does not decimate. On the four existing models the output is about 12 KB per 1,000 triangles (8,628 triangles: 102 KB; 31,346: 377 KB; 37,114 flat-shaded: 425 KB; 9,696: 114 KB). The Phase 7 limit was about 500 KB per model, so about 40,000 triangles; decimate bigger models in Blender before they go into `source/`. Nothing above 37,114 triangles has been tried on a phone. The ASUS model (208,956 triangles, about 2.5 MB by the same rate: an estimate) was left out for this reason.

There is no per-model setting: the start angle is chosen from the model's proportions (`YAW` for a model wider than deep, `YAW_LONG` for a longer-than-wide one such as a shoe), and the look is the `T` block in `src/turntable/turntable.js` for every model. If a model fails to load or parse, the stage removes itself silently and the project simply has no turntable; nothing else breaks.

## 3D turntable (project panel)

A project with a `model` field gets an orbit view of its model in the project panel, in a section just above the gallery (after the Breakdown when a project has both). It is a lazy chunk (`src/turntable/turntable.js`); `src/main.js` holds a small stub, `window.__turntable(body, work)`, that `openPanel` in `js/script.js` calls. The stub inserts the empty stage at its final size (aspect 4/3) so nothing shifts, then imports the chunk, which fetches `models/<name>.glb` (a document-relative URL, so it works under a sub-path), reads it with its own short GLB parser, and draws it with its own renderer and canvas (the home world is frozen while a panel is open). The model is drawn in clay grey with a hero-style light rig; nothing but the geometry is used.

- Controls: drag (yaw only, no pitch, zoom or pan), ArrowLeft / ArrowRight on the focused canvas, inertia after a flick, and a slow auto-rotate that stops on any input and returns after a short idle time. `touch-action: pan-y` lets a vertical swipe scroll the panel; the wheel is never captured.
- One rAF loop, only while the stage is on screen, `html.panel-open` is set, the tab is visible and something changes (a drag, inertia or auto-rotate). Otherwise nothing is pending and nothing is drawn. Touch devices draw at most 30 frames per second when not dragging.
- Close, a project swap, any failure, context loss and a 20 s timeout all abort the fetch, release geometry, material, renderer and the GL context, and remove the section. Failure is silent.
- Off for Data Saver, a very slow link, no WebGL 2 (the hero's skip rules), `html.vp-off` and `?turntable=off`. Reduced motion: no auto-rotate and no inertia; drag and keys still work.
- State for tests and the console: `window.__turntable.info` = `{ state: 'loading' | 'ready' | 'closed' | 'failed' | 'lost', reason, draws, ticks, yaw, auto, model }`.

| Query | Remembered as | Effect |
|---|---|---|
| `?turntable=off` / `?turntable=on` | `pf_turntable` | no turntable stage / back to the stage |

Owner-tunable values are the `T` block at the top of `src/turntable/turntable.js`: framing (`FOV`, `TILT`, `FIT`, `YAW`, `YAW_LONG`), the clay and light values, `DPR_MAX` 2, and the motion values `AUTO_SPEED` 0.3, `IDLE_MS` 2500, `INERTIA_TAU` 0.35, `DRAG_TURN` 5, `KEY_STEP` 0.15, `TOUCH_FPS` 30.

Not built, by owner decision (2026-11-28): Solid / Wire modes, a Pause control, and the ASUS model (it needs decimation). Known gap, accepted: auto-rotate runs for longer than 5 s with no Pause button (WCAG 2.2.2); reduced motion turns it off. Adding more models is the section above.

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

Phase 7 (turntable), measured at its close against the 7a base `a995a25` (built in a worktree, same method; the 7a base is itself +842 B eager over the Phase 5 end, mostly the Phase 6 close transition and the `model` fields in `content/works.js`):

| Budget | 7a base | Now | Change |
|---|---|---|---|
| Eager gzip | 126,204 B | 126,542 B | +338 B (budget was at most +400 B: met) |
| Lazy gzip | 277,608 B | 282,065 B | +4,457 B: turntable chunk 3,979 B; three.js is now its own shared chunk (hero and turntable both import it), so the hero chunk fell from 193,810 B to 10,630 B and the three chunk is 183,658 B |
| Models (4, published only when a project opens) | 1.0 MB | 1.0 MB | none |
| Turntable rAF ticks and GL draws at rest, off screen, hidden tab, panel closed | | 0 | measured in the smoke test (the stage's own counters; page-wide rAF not measured) |

Not measured for Phase 7: CLS inside the panel at 1440 and 390, errors over a scenario list, GL contexts alive on a real phone, PageSpeed, any GPU or device figure.

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
