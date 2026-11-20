# Graph Report - repo  (2026-11-20)

## Corpus Check
- 23 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 398 nodes · 569 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- script.js
- hero-3d.js + world.js
- breakdown.js + fixes.js
- deploy.yml
-  + graph-map.py
- build-site.mjs + smoke.mjs
- package.json + lenis.js
- premium.js
- extras.js
- polish.js
- hero-3d.js + script.js
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
2. `run()` - 19 edges
3. `wake()` - 13 edges
4. `start()` - 9 edges
5. `route()` - 9 edges
6. `main()` - 8 edges
7. `initHeadings()` - 7 edges
8. `mountPanelContent()` - 7 edges
9. `openPanel()` - 7 edges
10. `tick()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `renderProject()` --indirect_call--> `esc()`  [INFERRED]
  js/script.js → tools/build-site.mjs
- `typeTagline()` --indirect_call--> `step()`  [INFERRED]
  js/script.js → src/hero/hero-3d.js
- `run()` --calls--> `createWorld()`  [EXTRACTED]
  src/hero/hero-3d.js → src/world/world.js

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 1 - "hero-3d.js + world.js"
Cohesion: 0.07
Nodes (10): fitName(), watchName(), motionParam, createWorld(), QUALITY, window.__BUILD__, window.__hero3d, window.__HERO3D_GLB__ (+2 more)

### Community 3 - "deploy.yml"
Cohesion: 0.06
Nodes (31): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+23 more)

### Community 4 - " + graph-map.py"
Cohesion: 0.10
Nodes (9): accessor(), main(), pad4(), read_glb(), add_node(), fnode(), label(), slug() (+1 more)

### Community 5 - "build-site.mjs + smoke.mjs"
Cohesion: 0.07
Nodes (15): DIST, server, TYPES, ctx, DIRS, DIST, FILES, html (+7 more)

### Community 6 - "package.json + lenis.js"
Cohesion: 0.08
Nodes (24): dependencies, lenis@1.3.27, three@0.186.1, description, devDependencies, playwright-core@1.65.1, vite@8.3.5, engines (+16 more)

### Community 7 - "premium.js"
Cohesion: 0.09
Nodes (4): initIndex(), initPortrait(), initProject(), whenReady()

### Community 8 - "extras.js"
Cohesion: 0.13
Nodes (9): initAvailability(), initBackToTop(), initCopyLabel(), initCursorIdle(), initFilterTransition(), initNavActive(), initScrollProgress(), initToolbarTips() (+1 more)

### Community 10 - "hero-3d.js + script.js"
Cohesion: 0.22
Nodes (16): typeTagline(), run(), collide(), derivePointer(), frame(), measure(), onScroll(), place() (+8 more)

### Community 11 - "script.js"
Cohesion: 0.21
Nodes (15): closeFromUi(), go(), heroIntro(), initGlobalUi(), initPanel(), initTheme(), parseHash(), route() (+7 more)

### Community 12 - "script.js + build-site.mjs"
Cohesion: 0.18
Nodes (13): bindMagnetRefresh(), closePanel(), disposeHeadings(), initMedia(), initProjectVideos(), initScrollMotion(), mountPanelContent(), openPanel() (+5 more)

### Community 13 - "hero-fallback.js"
Cohesion: 0.35
Nodes (9): ensureFallbackStyle(), fitName(), mountHeroFallback(), mountIntoHero(), observeHero(), queueSizeFallback(), sizeFallback(), sizeGhost() (+1 more)

### Community 14 - "script.js"
Cohesion: 0.22
Nodes (10): bindHeadingMeasure(), buildWidthTable(), enableEngineB(), frame(), initCursor(), initHeadings(), initPointer(), measureHeadings() (+2 more)

### Community 15 - "script.js"
Cohesion: 0.22
Nodes (9): boot(), categories(), render(), renderHome(), renderShellBottom(), renderShellTop(), runIntro(), tile() (+1 more)

### Community 16 - "script.js"
Cohesion: 0.40
Nodes (6): initCards(), initViewport(), apply(), releaseCard(), stepCards(), viewportOff()

### Community 17 - "script.js"
Cohesion: 0.40
Nodes (5): layoutLines(), stepEngineA(), stepEngineB(), stepHeadings(), widthAt()

### Community 18 - "script.js"
Cohesion: 0.50
Nodes (4): hudReport(), hudSweepStep(), initHudTriggers(), openHud()

## Knowledge Gaps
- **2 isolated node(s):** `window.__BUILD__`, `window.__HERO3D_GLB__`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 222 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `window.__WORKS__` connect `build-site.mjs + smoke.mjs` to `script.js`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `start()` (e.g. with `boot()` and `stepCards()`) actually correct?**
  _`start()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `window.__BUILD__`, `window.__HERO3D_GLB__` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Why does `run()` connect `hero-3d.js + script.js` to `hero-3d.js + world.js`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `run()` (e.g. with `frame()` and `onScroll()`) actually correct?**
  _`run()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `hero-3d.js + world.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06554621848739496 - nodes in this community are weakly interconnected._