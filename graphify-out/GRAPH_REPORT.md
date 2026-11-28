# Graph Report - ahmad-3d-portfolio  (2026-11-28)

## Corpus Check
- 26 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 487 nodes · 700 edges · 26 communities (18 shown, 8 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- smoke.mjs + build-site.mjs
-  + graph-map.py
- package.json + world.js
- breakdown.js + fixes.js
- deploy.yml
- hero-3d.js + main.js
- polish.js
- planes.js
- premium.js
- turntable.js
- extras.js
- hero-3d.js
- script.js
- script.js + build-site.mjs
- hero-fallback.js
- script.js
- script.js
- script.js
- script.js
- script.js

## God Nodes (most connected - your core abstractions)
1. `start()` - 28 edges
2. `run()` - 20 edges
3. `wake()` - 13 edges
4. `startPlanes()` - 13 edges
5. `tick()` - 12 edges
6. `start()` - 9 edges
7. `route()` - 9 edges
8. `tick()` - 8 edges
9. `main()` - 8 edges
10. `initHeadings()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `typeTagline()` --indirect_call--> `step()`  [INFERRED]
  js/script.js → src/hero/hero-3d.js
- `renderProject()` --indirect_call--> `esc()`  [INFERRED]
  js/script.js → tools/build-site.mjs
- `run()` --calls--> `createWorld()`  [EXTRACTED]
  src/hero/hero-3d.js → src/world/world.js

## Import Cycles
- None detected.

## Communities (26 total, 8 thin omitted)

### Community 0 - "smoke.mjs + build-site.mjs"
Cohesion: 0.04
Nodes (18): DIST, server, TYPES, ctx, DIRS, DIST, FILES, html (+10 more)

### Community 2 - " + graph-map.py"
Cohesion: 0.09
Nodes (15): accessor(), main(), pad4(), read_glb(), accessor(), convert(), instances(), local_matrix() (+7 more)

### Community 3 - "package.json + world.js"
Cohesion: 0.06
Nodes (26): dependencies, lenis@1.3.27, three@0.186.1, description, devDependencies, playwright-core@1.65.1, vite@8.3.5, engines (+18 more)

### Community 5 - "deploy.yml"
Cohesion: 0.06
Nodes (31): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+23 more)

### Community 6 - "hero-3d.js + main.js"
Cohesion: 0.08
Nodes (10): fitName(), watchName(), motionParam, ttQ, window.__BUILD__, window.__hero3d, window.__HERO3D_GLB__, window.__hero3dReady (+2 more)

### Community 8 - "planes.js"
Cohesion: 0.14
Nodes (17): bezier(), FEEL, ramp(), smooth(), startPlanes(), build(), clearFx(), draw() (+9 more)

### Community 9 - "premium.js"
Cohesion: 0.09
Nodes (4): initIndex(), initPortrait(), initProject(), whenReady()

### Community 10 - "turntable.js"
Cohesion: 0.09
Nodes (5): mountTurntable(), tick(), wake(), parseGLB(), T

### Community 11 - "extras.js"
Cohesion: 0.13
Nodes (9): initAvailability(), initBackToTop(), initCopyLabel(), initCursorIdle(), initFilterTransition(), initNavActive(), initScrollProgress(), initToolbarTips() (+1 more)

### Community 12 - "hero-3d.js"
Cohesion: 0.23
Nodes (16): run(), collide(), derivePointer(), frame(), measure(), onScroll(), place(), readTheme() (+8 more)

### Community 13 - "script.js"
Cohesion: 0.21
Nodes (14): closeFromUi(), go(), initGlobalUi(), initPanel(), initTheme(), initWorks(), layoutBento(), parseHash() (+6 more)

### Community 14 - "script.js + build-site.mjs"
Cohesion: 0.18
Nodes (13): bindMagnetRefresh(), closePanel(), disposeHeadings(), initMedia(), initProjectVideos(), initScrollMotion(), mountPanelContent(), openPanel() (+5 more)

### Community 15 - "hero-fallback.js"
Cohesion: 0.35
Nodes (9): ensureFallbackStyle(), fitName(), mountHeroFallback(), mountIntoHero(), observeHero(), queueSizeFallback(), sizeFallback(), sizeGhost() (+1 more)

### Community 16 - "script.js"
Cohesion: 0.18
Nodes (11): bindHeadingMeasure(), buildWidthTable(), enableEngineB(), initHeadings(), layoutLines(), measureHeadings(), splitHeading(), stepEngineA() (+3 more)

### Community 17 - "script.js"
Cohesion: 0.24
Nodes (10): frame(), initCards(), initCursor(), initPointer(), initViewport(), apply(), releaseCard(), stepCards() (+2 more)

### Community 18 - "script.js"
Cohesion: 0.22
Nodes (9): boot(), categories(), render(), renderHome(), renderShellBottom(), renderShellTop(), runIntro(), tile() (+1 more)

### Community 19 - "script.js"
Cohesion: 0.67
Nodes (4): heroIntro(), showTagline(), snapHero(), typeTagline()

### Community 20 - "script.js"
Cohesion: 0.50
Nodes (4): hudReport(), hudSweepStep(), initHudTriggers(), openHud()

## Knowledge Gaps
- **5 isolated node(s):** `window.__BUILD__`, `window.__HERO3D_GLB__`, `window.__ttDraws`, `window.__ttGl`, `window.__vtN`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 280 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `window.__turntable` connect `hero-3d.js + main.js` to `smoke.mjs + build-site.mjs`, `script.js`, `turntable.js`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `start()` (e.g. with `boot()` and `stepCards()`) actually correct?**
  _`start()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `window.__BUILD__`, `window.__HERO3D_GLB__`, `window.__ttDraws` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `smoke.mjs + build-site.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.04251700680272109 - nodes in this community are weakly interconnected._
- **Why does `window.__WORKS__` connect `smoke.mjs + build-site.mjs` to `script.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `run()` (e.g. with `frame()` and `onScroll()`) actually correct?**
  _`run()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._