# CONTEXT: ahmad-3d-portfolio (source of truth for coding AIs)

Audience: AI coders (Claude, GPT). Terse on purpose. Facts only. Each fact lives in ONE place.
Companions: `docs/ai/LOG.md` (read the top 3 entries), `graphify-out/PROJECT_MAP.md` (generated code map), `docs/ai/BACKLOG.md` (only on demand).
Last updated: 2026-11-28, task DOCS-MIGRATION, base `e5bed98`. Notion is retired (an archive the owner will delete): never read it, never update it.

## 1. Protocol (every task, no exceptions)

START
1. Read this file whole. Read the top 3 entries of `docs/ai/LOG.md`. Read `graphify-out/PROJECT_MAP.md` whole (about 7 KB).
2. Fresh clone, `git log -10`. Compare HEAD with section 6. HEAD newer than section 6 = the repo is the truth: reconcile the docs first (flip LOG statuses, fix section 6) and say so. Anything that contradicts instead of merely lagging = STOP and ask.
3. Find the files and callers the task touches by querying `graphify-out/graph.json` (nodes carry file + line). Read those line ranges, not whole files. NEVER read `graph.json` whole (260 KB). NEVER open `graph.html` (320 KB, for humans). Read `GRAPH_REPORT.md` only for structure questions (god nodes, communities).
4. Do not read `BACKLOG.md` unless the task names a backlog item. Read only the README section the task needs (map in section 3).
5. Say in 3 lines: what exists, what changes, what stays identical.

END
1. Prepend a LOG entry (template in `LOG.md`). Keep 15 entries max; when one falls off, its lasting facts must already be here.
2. Edit this file only where a fact changed: rules (4), architecture (5), state (6), open items (7), plan (8). State lives ONLY in section 6; never copy it into LOG.
3. Regenerate the graph LAST (section 9). Never hand-edit `graphify-out/`.
4. Deliver ONE zip outside the clone: the changed files + `docs/ai/LOG.md` (always) + `docs/ai/CONTEXT.md` (if changed) + `graphify-out/` + `GUIDE.md` (the delivery note; git-ignored, never committed; add it AFTER graph-map, because graph-map scans it).
5. A commit cannot contain its own hash. Write DELIVERED + base SHA. The next task flips it to PUSHED <sha7> after seeing it in `git log`.

Status words (fixed): DELIVERED = in the zip. PUSHED = seen in `git log`. OWNER-REPORTED = the owner said so (not verified). VERIFIED = a tool or command checked it, named in the entry. UNVERIFIED = not checked. Never write device, GPU or Actions results that were not seen.

## 2. Truth hierarchy

- What exists: code > graph (generated; if it disagrees with code, regenerate) > docs. Rules, intent and decisions: docs > code. Commit state: GitHub only. Docs never prove a push.
- Docs, code and the task disagree, or the task is risky: STOP and ask.
- `docs/ai/` is public (the repo is public). No secrets, keys, private data.

## 3. Project facts

- Repo `github.com/nahass87868/ahmad-3d-portfolio`; live `https://nahass87868.github.io/ahmad-3d-portfolio/`; GitHub Pages via Actions; no custom domain; every path relative (works under the sub-path).
- Site: Ahmad Nahass, 3D artist. 16 projects, dark/light theme, project panels with gallery and video, 3D hero (letters PORT / FOLIO with physics), works grid drawn as WebGL planes, Breakdown slider, project-panel turntable.
- Stack: Vite 8.3.5 and three 0.186.1 (modern layer, `src/`); everything else plain scripts and CSS; GSAP + ScrollTrigger vendored in `vendor/`; Lenis 1.3.27 (desktop only); playwright-core 1.65.1 (smoke). Node 22 (`.nvmrc`; package.json allows >= 20.19). No framework.
- Branches: `main`; `legacy` (before Vite); `pre-tidy` (before the folder tidy, `abbdbb2`); old `fix/phase-3-*` branches.
- Commands: `npm ci`; `npm run build` (must end with a line starting `OK`); `npm run test:smoke` (64 checks: 34 desktop + 30 phone; software GL; fixed waits); `npm run preview`.
- Deploy: push to `main` runs Actions "Deploy site": npm ci, build, smoke (a deploy gate: failure = no deploy), upload `dist/`, deploy. The Pages source must be "GitHub Actions" (not verifiable from the repo).
- Published = a whitelist in `tools/build-site.mjs` (copied byte for byte and checked identical) + the Vite layer. `docs/`, `tools/`, `tests/`, `source/`, `.github/`, `graphify-out/` are never published.
- Owner workflow: free chat apps only (no API, no Claude Code). Coders never push. The owner applies the zip on Windows (Git Bash / GitHub Desktop), tests on his devices (desktop, iPad Pro Safari, Galaxy A10, iPhone), commits and pushes himself, and reports back. Owner priorities: desktop appearance first, then Galaxy A10 smoothness, then PageSpeed (mobile score may drop at most 3 points).
- README.md is the operating manual; do not duplicate it here. Read only the section you need: Folder map; Commands; Deployment; Add or edit a project (`content/works.js` fields and the files each needs); Asset conventions; Rebuild the hero model; Rebuild the turntable models; Add a 3D model; 3D layers and safety switches (planes, `?planes ?canvas ?motion`, tunable FEEL/T blocks, close-transition gate); 3D turntable; Budgets; Code map; Recovery.

## 4. Rules

Process
- One task per chat, one zip, one commit. State and check the base SHA first.
- Smallest complete change: no new dependency, abstraction or class unless the task requires it; no extras; surgical diffs; every changed line traces to the task. Mention unrelated problems, do not fix them.
- Always: build and `test:smoke`. Prove behaviour against a control build of the previous commit (compare `dist/` or script a check). Replay the zip on a second fresh clone. State what was verified and what was not.
- The sandbox has no GPU, no real device, no Safari/iOS: those results are UNVERIFIED unless the owner reports them.
- Backlog items and future phases are not approved scope until the owner selects them.

Protected unless the task names them: hero letters, physics, shaders, ring, ghost text, curtain, Lenis feel, QUALITY values, panel logic, Breakdown slider, `index.html` (script order and `defer` attributes), package files.

Runtime
- One world RAF loop (`src/world/world.js`). Exceptions, owner-approved: the turntable has its own loop; the Breakdown slider has its own. Each runs only while needed.
- Idle at rest. Nothing drawn off screen or in a hidden tab. No per-frame allocation. Dispose what you own (geometry, material, texture, renderer, GL context). One batched rect read per active frame.
- Motion uses transform, opacity or shader uniforms only. Frame-rate-independent smoothing. Site `--ease-out`. Hover about 350 ms max. Interruptible and reversible from the current value.
- Every 3D feature has an off switch (`?x=off`, remembered in localStorage `pf_x`) and is disabled by Data Saver or a very slow link, no WebGL 2, and `html.vp-off`. Reduced motion: no looping or eased motion (planes do not start; the turntable has no auto-rotate or inertia, drag and keys still work). Any failure falls back silently to plain DOM, or removes the feature.
- Hover only behind `(hover: hover)` and `(pointer: fine)`; no sticky hover after touch; passive listeners; no `100vh` (use `svh`); feature-detect newer APIs.
- No layout shift: reserve the final size before async content arrives.
- Never delete files from `images/`, `videos/`, `fonts/`, `og/`, `vendor/`. File names lowercase and equal to the project slug (Pages is case sensitive).

## 5. Architecture notes (gotchas the graph cannot show; file lists and `window.*` globals are in PROJECT_MAP.md)

- `index.html`: the script order and `defer` attributes are deliberate (PROJECT_MAP "Load order"). The build changes only its module tag and the no-JS project list.
- Build (`tools/build-site.mjs`): Vite bundles only `src/main.js` and its chunks; the older files are copied unchanged. Validates `content/works.js`; generates 16 share-card pages (`dist/work/<slug>/`). OK line today: 134 files identical to source (85.7 MB) + the modern layer (6 files, 811 KB).
- `content/works.js`: the single source of truth for the 16 projects. Optional fields: `breakdown: [w, h]` (6 projects) and `model: '<name>'` (4 projects: nike-shoe, yerba-mate, youth-affairs, date-cookies). Add each new image's `[w, h]` to `IMAGE_SIZES` in `js/script.js` (not checked by the build).
- `src/main.js`: capability checks (`skipReason` = Data Saver, a very slow link, or no WebGL 2; RAM and CPU core count never skip the 3D: owner decision, Fix 07), lazy hero load, and the `window.__turntable` stub. `html.vp-off` is set by the viewport-shading pie menu (hold Z, `js/script.js`) when its mode is not "Rendered" or it is paused; it switches page motion off.
- `src/world/world.js`: the shared WebGLRenderer and the only RAF loop; hosts layers; QUALITY presets; pause rules; context-loss handling. It clears the shared canvas once per pass, tracks which layer drew, and redraws in-view layers that did not draw (current state, no simulation step), so a redrawn layer appears above the others on overlap. In fixed mode the world owns canvas visibility. Touch uses one fixed viewport canvas; `?canvas=docked` is the safety switch back to the docked canvas.
- `src/hero/hero-3d.js` (scene, simulation, pointer; passes the world and THREE to planes), `hero-fallback.js` (plain DOM fallback), `js/hero-3d-model.js` (generated base64 from `source/portfolio.glb` by `tools/build-hero-model.py`; rebuild is byte-identical). The hero reads only POSITION, NORMAL and indices with its own `parseGLB`. Nothing imports GLTFLoader, DRACO or OrbitControls. three is its own lazy chunk shared by the hero and the turntable.
- `src/works/planes.js` (lazy chunk, no imports): one plane per grid card on the shared canvas; DOM cards stay the click, focus and accessibility layer; planes cover the grid only (Index view stays DOM). A tile gets `.x-pl` only after its plane was drawn once; `html.x-planes` raises tiles above the canvas; plane and DOM card align within 1 px (measured <= 0.49 px). Effects, all in the `FEEL` block: scroll wave (in-plane vertical shift with pinned edges, `uWave*sin(PI*uv.y)`, SEGMENTS 24, lighter on touch), desktop hover blur pulse (9-tap, fragment shader) plus pointer fisheye (mouse/pen only), touch press zoom 1.04. The clicked tile reverts to its DOM image synchronously for the View Transition and is held until the panel has opened and closed. `vtHold` keeps one card a DOM image during the reverse close transition (`data-x-hold`, `html.x-vt-close`, resolved once in the root MutationObserver, never per frame). Exposes `window.__planes`. Off: `?planes=off`.
- `js/polish.js`: card presentation, the opening View Transition, and `initCloseTransition` (reverse on close by X or Escape). It runs only if: `startViewTransition` exists, motion not reduced (read at load), panel open, no running opening (`.instant`), no inline panel transform (swipe-close), a `#work/` hash, Index view off, the card exists and is not hidden, and at least 40% of both the card and the top image are on screen. Any doubt = the normal close. Back and swipe always use the normal close. A second X or Escape during the transition is swallowed; Escape is left alone while the pie menu `#vpie` is open. Tunables: `T` block (`VT_VISIBLE` 0.4, `VT_CLOSE_WAIT_MS` 400, `VT_FAILSAFE_MS` 1500).
- `js/premium.js` + `css/premium.css`: loading curtain (`PREMIUM_INTRO`, called by `runIntro` in script.js; GSAP path only; `T` block timings), Grid/Index view, gallery. Curtain label: a `| / - \` spinner (`SPIN_MS` 100, inside the existing `tick()`); reduced motion and the no-GSAP path keep "...".
- `js/script.js`: grid and cards, filters, project panel, navigation. `openPanel` calls `window.__breakdown(body, work)` then `window.__turntable(body, work)` and keeps the returned cleanups in `panelState.cleanups` (internal to script.js).
- `js/breakdown.js`: Wire / Clay / Final slider, scroll-driven; reads `images/projects-breakdown/<slug>-image-{wire,clay,final}.webp` (all 3 required); validated by the build. Complete and protected.
- Turntable (`src/turntable/turntable.js`, lazy chunk): the stub inserts `<section class="x-turn">` (aspect 4/3, no shift) above `.gallery`, after the Breakdown. The chunk fetches `models/<name>.glb` (document-relative), parses it with its own GLB reader, and draws with its own renderer and canvas (the home world is frozen while a panel is open, so a world layer could not show there). Clay grey, hero-style light rig, yaw-only orbit: drag, arrow keys, inertia, slow auto-rotate. One rAF, only while the stage is on screen AND `html.panel-open` AND the tab is visible AND something changes. Touch draws at most 30 fps when not dragging; DPR <= 2; 20 s load timeout. Close, project swap, failure, context loss and timeout all abort the fetch, dispose, release the GL context and remove the section; failure is silent. `window.__turntable.info`. Off: `?turntable=off`. Model-per-project is data only (`model` field); no model name appears in `src/` or `js/`. Tunables: `T` block.
- Models: `models/<name>.glb` built from `source/<name>.glb` by `tools/build-turntable-models.py` (Python 3 + numpy): geometry only, one mesh, node transforms baked, bounding sphere radius 1 centred on the origin, Y up, glTF with KHR_mesh_quantization (POSITION int16, NORMAL int8, optional COLOR_0 ubyte, indices u16/u32), triangle count equal to the source. About 12 KB per 1,000 triangles; the limit is about 500 KB (about 40,000 triangles). Adding a model: README "Add a 3D model".
- `tests/smoke.mjs`: desktop and phone checks against `dist/`.

## 6. Current state (the only place state lives)

- main HEAD at migration: `e5bed98` (2026-11-28) "Phase 7f: README and code map refresh, Add a 3D model guide; Phase 7 closed (7d, 7e dropped)". Chain: `a995a25` 7a, `836da41` 7b, `8d0bc25` 7c, `e5bed98` 7f.
- DOCS-MIGRATION (this docs structure) is DELIVERED, base `e5bed98`; not yet PUSHED.
- Active phase: none. Phases 0 to 7 are closed. Next: the owner picks a backlog item or Phase 8.
- Budgets at `e5bed98` (README "Budgets"): eager gzip 126,542 B, lazy 282,065 B. Smoke 64 checks.
- Actions: "Deploy site" runs 43 to 54 (Phase 5f to 7f) all completed successfully, read from the Actions page at migration (run 52 = 7b, 53 = 7c, 54 = 7f). The workflow runs smoke before deploy, so smoke passed on GitHub's runner for them. Owner reports for Phase 7 (OWNER-REPORTED, devices and browsers not itemised): after 7b the live site tested, "great"; after 7c Actions green and the live site checked, everything working; 7f pushed and the phase closed by the owner. The Galaxy A10 test is pending (the owner will do it later).

## 7. Open and unverified (one list; delete an item when it is verified or decided)

Device and GPU (never verified; the sandbox has neither)
- Planes (6b to 6e): GPU frame cost of the 9-tap blur and the lens; real phone smoothness; iOS Safari View Transition; real-finger touch and scroll cancel; real trackpad with Lenis. The owner reported the whole Phase 6 device gate done on iPad Pro Safari ("excellent, native"); the per-device matrix (A10, iPhone, desktop) was never itemised.
- Turntable (7b, 7c): a second GL context on low-end phones (the D1 risk); drag/inertia/auto-rotate feel; vertical swipe vs orbit on a phone; sharpness. The owner reported the live site checked and working after 7b and 7c (devices not itemised); the Galaxy A10 check is pending.

Budgets and measurements
- Eager gzip is +1,180 B over the end of Phase 5 (125,362 to 126,542). The stage rule "initial-load bytes must not exceed the baseline" was already broken at 6f (+587 B) and never decided (proposal, not applied: minify `js/polish.js` or accept). The Phase 7 limit (+400 B over 7a) was met (+338 B).
- CLS about 0.21 at 1440x900 comes at load and is pre-existing, unfixed (390x844: 0.006).
- Not measured: PageSpeed / Lighthouse (the 2026-11-20 report is contaminated by browser extensions: not a baseline); CLS inside the panel with the stage; errors over a scenario list for Phase 7; GL contexts alive on a real phone.

Accepted gap
- Turntable auto-rotate runs longer than 5 s with no Pause control (WCAG 2.2.2); reduced motion turns it off. Owner decision 2026-11-28 (Solid/Wire modes, Pause and the ASUS model were dropped).

Review notes from 6f (read-only, not fixed)
- Escape-close runs a transition of about 600 ms (over the 300 ms bar; same as the opening: owner's call).
- Planes hover zoom (700 ms) is not gated by runtime reduced motion; `polish.js` reads reduced motion once at load.
- `grid.getAnimations({subtree:true})` in the planes idle check allocates once on the would-be-idle frame.
- Closure `sn` is created per tile per frame (negligible).
- Desktop keeps 16 textures resident; GPU memory unmeasured.
- `html.vp-off` while hero and tiles are both on screen may leave stale plane pixels. Hover tween vs CSS mid-reversal. Keyboard-focus lift of a card during the close transition. One cold run showed 0 handed-over tiles at first scroll (not reproduced in 6 retries).

Choices made, never formally confirmed by the owner
- Hover zoom 700 ms (a copy of the CSS) vs the 350 ms charter; tiles raised above the canvas for the whole planes session; wave direction (middle lags the scroll; flip the sign of `WAVE_AMP`); the 40% on-screen rule; X on touch uses the close transition but swipe-close does not; a deep link closed at scroll 0 never uses the transition; DOM `.tile > a:active` 0.985 stacks with the plane press zoom 1.04; touch-only devices never get the blur.
- 7a: the per-alias yes/no for the 4 models was not itemised; the owner pushed after checking, so the aliases are treated as accepted.

Test harness
- Slow-sandbox failures (1 CPU, software GL, no GPU): the desktop check "works planes hover" (fixed 1.5 s wait) failed on the control builds of 49b7f19 and a995a25. At migration the 7c check "stage: a flick keeps turning after release, decays to exactly 0 and the loop stops, then auto-rotate returns" failed (63/64, yaw did not advance after the flick) on the unchanged `e5bed98` and on the docs build alike, while Actions passed smoke for `e5bed98` (run 54). So both are read as sandbox-speed artefacts (inferred, not proven). Rule: re-run once and compare with a control build of the previous commit before blaming a change; a real-hardware failure of the flick check would be a real finding.

## 8. Plan

Closed (never reopen; a later issue is a separate fix)

| Phase | What | Commits |
|---|---|---|
| 0 to 3 | foundation, Vite migration, three.js upgrade, asset pipeline, fixes | closed by the owner Nov 2026; no SHAs kept (see git history) |
| Code-org Stages 0 to 9 | `js/`, `css/`, `source/`, README, smoke as deploy gate (own numbering, not the roadmap's) | done 2026-11-16, Stage 9 `077b95e` |
| 4 | Breakdown slider | 4a `3cb13aa`, 4b `1d64bcf`, 4c `d25b5b9` |
| 5 | persistent WebGL world | 5a `de27e80` Lenis, 5b `4e85256` shell, 5c `c1e6c65` fixed canvas, 5d `fd3b511` quality + lifecycle, 5e `8bb718a` budgets, 5f `6e914d5` touch; closed 2026-11-21 |
| 6 | works as live planes | 6a `dc2dd7c`, 6b `d8ad659`, 6c `1660197`, 6d `84a9cfe`, 6e `fb325ed`, 6f `4ecd0ef`; closed 2026-11-24 |
| side | loading-curtain spinner (not a phase) | `49b7f19` |
| 7 | project-panel turntable | 7a `a995a25`, 7b `836da41`, 7c `8d0bc25`, 7f `e5bed98`; 7d (Solid/Wire/Pause) and 7e (ASUS decimation) dropped by the owner; closed 2026-11-28 |

Future (none approved or scheduled)
- Phase 8: transient shader reveal into a card-sized canvas; kinetic type only on the Contact line; closing CTA; per-project accent colour while the visitor's theme and accent choices stay authoritative.
- Phase 9 (mostly dropped): dropped = reel, fullscreen 2K/4K image viewer, sound. Optional: cursor labels, desktop only.
- Phase 10: Lighthouse on the deployed site, real-device runs, a capture script.
- More models (owner's candidates, not exported yet): Blue Mall logo animation, Folder.exe folder inflation, realistic glass water render, aloe vera soap animation, realistic ice render. Data-driven: README "Add a 3D model", no viewer change. Validate each GLB when it exists. The ASUS model (208,956 triangles) needs decimation first.
- Backlog (parked ideas, owner-approved only): `docs/ai/BACKLOG.md`.

Global decisions
- GitHub Pages; no custom domain; deploy through Actions. three.js, GSAP/ScrollTrigger, Lenis (desktop only). No framework.
- Rejected: globe, pinned scroll, 3D gallery room, chat widgets, React Three Fiber, Theatre.js, physics engine, sound, reel, fullscreen viewer, hero parallax.

Task loop for any new phase or stage
1. Analyse: these docs, fresh clone, base SHA, code map.
2. Diagnose: read only the touched lines; measure the current state.
3. Options: two or three, with cost and risk. Conflict or risk = STOP and ask.
4. Smallest change: file list, what stays identical.
5. Code.
6. Test: build, smoke, control build, second-clone replay; verified vs unverified.
7. Deliver: zip, Git Bash steps, owner preview, commit message, push, Actions, revert. Update LOG (and CONTEXT if needed), regenerate the graph.

## 9. Graph and sandbox

- Graph: `python3 tools/graph-map.py` writes `graphify-out/` (`PROJECT_MAP.md`, `GRAPH_REPORT.md`, `graph.json`, `graph.html`). Install: `pip install graphifyy` (two y; the sandbox needs `--break-system-packages`). Run it LAST, in a clone folder named `ahmad-3d-portfolio` (the report title and graph.json carry the folder name), with `GUIDE.md` absent (it scans it), then delete `graphify-out/cache`. Files under `docs/ai/` appear in it as rows and nodes: expected.
- Sandbox: `npm ci`. Smoke needs a Chromium: in a separate folder `npm i @sparticuz/chromium`, then `(await import('@sparticuz/chromium')).default.executablePath()` with NO argument (it extracts to `/tmp/chromium`), then `export PW_CHROMIUM=/tmp/chromium`. Smoke takes minutes in software GL: start it fully detached (`setsid nohup ... &`) and poll its log, because a plain background job dies when the tool call returns. The unauthenticated GitHub API is rate-limited; Actions status can still be read without it: `curl -sL https://github.com/nahass87868/ahmad-3d-portfolio/actions/workflows/deploy.yml` and grep the `aria-label="completed successfully: Run N of Deploy site. ..."` lines. If that fails too, say UNVERIFIED.
- Windows (owner): Git Bash for the steps; GitHub Desktop for revert (README "Recovery").
