# Graph Report - ahmad-3d-portfolio  (2026-11-27)

## Corpus Check
- 26 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 464 nodes · 679 edges · 23 communities (18 shown, 5 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- script.js
- build-site.mjs + smoke.mjs
-  + graph-map.py
- hero-3d.js + world.js
- breakdown.js + fixes.js
- deploy.yml
- package.json + lenis.js
- polish.js
- planes.js
- premium.js
- extras.js
- hero-3d.js + script.js
- script.js
- script.js + build-site.mjs
- hero-fallback.js
- turntable.js + main.js
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
- `renderProject()` --indirect_call--> `esc()`  [INFERRED]
  js/script.js → tools/build-site.mjs
- `typeTagline()` --indirect_call--> `step()`  [INFERRED]
  js/script.js → src/hero/hero-3d.js
- `run()` --calls--> `createWorld()`  [EXTRACTED]
  src/hero/hero-3d.js → src/world/world.js

## Import Cycles
- None detected.

## Communities (23 total, 5 thin omitted)

### Community 1 - "build-site.mjs + smoke.mjs"
Cohesion: 0.05
Nodes (18): DIST, server, TYPES, ctx, DIRS, DIST, FILES, html (+10 more)

### Community 2 - " + graph-map.py"
Cohesion: 0.09
Nodes (15): accessor(), main(), pad4(), read_glb(), accessor(), convert(), instances(), local_matrix() (+7 more)

### Community 3 - "hero-3d.js + world.js"
Cohesion: 0.06
Nodes (11): fitName(), watchName(), motionParam, ttQ, createWorld(), QUALITY, window.__BUILD__, window.__hero3d (+3 more)

### Community 5 - "deploy.yml"
Cohesion: 0.06
Nodes (31): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+23 more)

### Community 6 - "package.json + lenis.js"
Cohesion: 0.08
Nodes (24): dependencies, lenis@1.3.27, three@0.186.1, description, devDependencies, playwright-core@1.65.1, vite@8.3.5, engines (+16 more)

### Community 8 - "planes.js"
Cohesion: 0.14
Nodes (17): bezier(), FEEL, ramp(), smooth(), startPlanes(), build(), clearFx(), draw() (+9 more)

### Community 9 - "premium.js"
Cohesion: 0.09
Nodes (4): initIndex(), initPortrait(), initProject(), whenReady()

### Community 10 - "extras.js"
Cohesion: 0.13
Nodes (9): initAvailability(), initBackToTop(), initCopyLabel(), initCursorIdle(), initFilterTransition(), initNavActive(), initScrollProgress(), initToolbarTips() (+1 more)

### Community 11 - "hero-3d.js + script.js"
Cohesion: 0.21
Nodes (17): typeTagline(), run(), collide(), derivePointer(), frame(), measure(), onScroll(), place() (+9 more)

### Community 12 - "script.js"
Cohesion: 0.19
Nodes (15): bindMagnetRefresh(), heroIntro(), initGlobalUi(), initMedia(), initProjectVideos(), initScrollMotion(), initTheme(), mountPanelContent() (+7 more)

### Community 13 - "script.js + build-site.mjs"
Cohesion: 0.21
Nodes (13): closeFromUi(), closePanel(), disposeHeadings(), go(), initPanel(), openPanel(), parseHash(), renderProject() (+5 more)

### Community 14 - "hero-fallback.js"
Cohesion: 0.35
Nodes (9): ensureFallbackStyle(), fitName(), mountHeroFallback(), mountIntoHero(), observeHero(), queueSizeFallback(), sizeFallback(), sizeGhost() (+1 more)

### Community 15 - "turntable.js + main.js"
Cohesion: 0.18
Nodes (4): mountTurntable(), parseGLB(), T, window.__turntable

### Community 16 - "script.js"
Cohesion: 0.22
Nodes (10): bindHeadingMeasure(), buildWidthTable(), enableEngineB(), frame(), initCursor(), initHeadings(), initPointer(), measureHeadings() (+2 more)

### Community 17 - "script.js"
Cohesion: 0.22
Nodes (9): boot(), categories(), render(), renderHome(), renderShellBottom(), renderShellTop(), runIntro(), tile() (+1 more)

### Community 18 - "script.js"
Cohesion: 0.40
Nodes (6): initCards(), initViewport(), apply(), releaseCard(), stepCards(), viewportOff()

### Community 19 - "script.js"
Cohesion: 0.40
Nodes (5): layoutLines(), stepEngineA(), stepEngineB(), stepHeadings(), widthAt()

### Community 20 - "script.js"
Cohesion: 0.50
Nodes (4): hudReport(), hudSweepStep(), initHudTriggers(), openHud()

## Knowledge Gaps
- **5 isolated node(s):** `window.__BUILD__`, `window.__HERO3D_GLB__`, `window.__ttDraws`, `window.__ttGl`, `window.__vtN`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 259 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `window.__turntable` connect `turntable.js + main.js` to `script.js`, `build-site.mjs + smoke.mjs`, `hero-3d.js + world.js`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `start()` (e.g. with `boot()` and `stepCards()`) actually correct?**
  _`start()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `window.__BUILD__`, `window.__HERO3D_GLB__`, `window.__ttDraws` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Why does `window.__WORKS__` connect `build-site.mjs + smoke.mjs` to `script.js`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `run()` (e.g. with `frame()` and `onScroll()`) actually correct?**
  _`run()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `build-site.mjs + smoke.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.05121951219512195 - nodes in this community are weakly interconnected._