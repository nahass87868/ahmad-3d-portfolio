# Graph Report - p1  (2026-11-04)

## Corpus Check
- 17 files · ~0 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 324 nodes · 459 edges · 21 communities (17 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
-  + graph-map.py
- hero-3d.js + main.js
- premium.js
- extras.js
- package.json + vite.config.js
- polish.js
- deploy.yml
- build-site.mjs + 
- script.js
- deploy.yml
- hero-3d.js
- script.js
- script.js
- script.js
- script.js
- script.js
- script.js
- script.js

## God Nodes (most connected - your core abstractions)
1. `start()` - 28 edges
2. `wake()` - 13 edges
3. `run()` - 13 edges
4. `start()` - 9 edges
5. `route()` - 9 edges
6. `main()` - 8 edges
7. `initHeadings()` - 7 edges
8. `mountPanelContent()` - 7 edges
9. `openPanel()` - 7 edges
10. `closePanel()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `typeTagline()` --indirect_call--> `step()`  [INFERRED]
  script.js → src/hero/hero-3d.js

## Import Cycles
- None detected.

## Communities (21 total, 4 thin omitted)

### Community 1 - " + graph-map.py"
Cohesion: 0.10
Nodes (9): accessor(), main(), pad4(), read_glb(), add_node(), fnode(), label(), slug() (+1 more)

### Community 2 - "hero-3d.js + main.js"
Cohesion: 0.08
Nodes (7): fitName(), watchName(), window.__BUILD__, window.__hero3d, window.__HERO3D_GLB__, window.__hero3dReady, window.__hero3dResolve

### Community 3 - "premium.js"
Cohesion: 0.09
Nodes (4): initIndex(), initPortrait(), initProject(), whenReady()

### Community 4 - "extras.js"
Cohesion: 0.13
Nodes (9): initAvailability(), initBackToTop(), initCopyLabel(), initCursorIdle(), initFilterTransition(), initNavActive(), initScrollProgress(), initToolbarTips() (+1 more)

### Community 5 - "package.json + vite.config.js"
Cohesion: 0.12
Nodes (17): dependencies, three@0.186.1, description, devDependencies, vite@8.3.5, engines, node, name (+9 more)

### Community 7 - "deploy.yml"
Cohesion: 0.12
Nodes (18): runs-on, steps, environment, needs, runs-on, steps, name, url (+10 more)

### Community 8 - "build-site.mjs + "
Cohesion: 0.13
Nodes (8): DIRS, DIST, FILES, html, MODULES, ROOT, SKIP, walk()

### Community 10 - "script.js"
Cohesion: 0.19
Nodes (14): bindMagnetRefresh(), initGlobalUi(), initMedia(), initProjectVideos(), initScrollMotion(), initTheme(), initWorks(), layoutBento() (+6 more)

### Community 11 - "deploy.yml"
Cohesion: 0.15
Nodes (12): concurrency, cancel-in-progress, group, name, on, push, workflow_dispatch, permissions (+4 more)

### Community 12 - "hero-3d.js"
Cohesion: 0.28
Nodes (10): run(), collide(), derivePointer(), frame(), readTheme(), resize(), step(), tick() (+2 more)

### Community 13 - "script.js"
Cohesion: 0.23
Nodes (12): closeFromUi(), closePanel(), disposeHeadings(), go(), initPanel(), openPanel(), parseHash(), renderProject() (+4 more)

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
Cohesion: 0.67
Nodes (4): heroIntro(), showTagline(), snapHero(), typeTagline()

### Community 19 - "script.js"
Cohesion: 0.50
Nodes (4): hudReport(), hudSweepStep(), initHudTriggers(), openHud()

## Knowledge Gaps
- **3 isolated node(s):** `window.__BUILD__`, `window.__HERO3D_GLB__`, `window.__hero3d`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 180 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `three` connect `package.json + vite.config.js` to `hero-3d.js + main.js`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `start()` (e.g. with `boot()` and `stepCards()`) actually correct?**
  _`start()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `window.__BUILD__`, `window.__HERO3D_GLB__`, `window.__hero3d` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Why does `vite` connect `package.json + vite.config.js` to `build-site.mjs + `?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `wake()` (e.g. with `frame()` and `initPanel()`) actually correct?**
  _`wake()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should ` + graph-map.py` be split into smaller, more focused modules?**
  _Cohesion score 0.1010752688172043 - nodes in this community are weakly interconnected._