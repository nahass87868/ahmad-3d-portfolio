# LOG: one entry per task, newest first, 15 entries max

Read the top 3 entries only. Prepend a new entry every task. When one falls off the bottom, its lasting facts must already be in CONTEXT.md (git history keeps the rest).
Keep an entry to about 10 lines: verification detail belongs in the commit message, not here. Never copy current state here (state lives in CONTEXT section 6).
Status words: DELIVERED (in the zip) | PUSHED <sha7> (seen in git log; flipped by the next task) | OWNER-REPORTED | VERIFIED | UNVERIFIED.

Template
```
### YYYY-MM-DD | <task id> | base <sha7> | DELIVERED
- Files: ...
- Change: ... (what and why, 1 to 3 lines)
- Verified: ... (what ran, what it showed)
- Not verified: ... (no GPU, no device, Actions, ...)
- Next: ...
- by: <model>
```

### 2026-11-28 | DOCS-MIGRATION | base e5bed98 | DELIVERED
- Files: new `docs/ai/CONTEXT.md`, `docs/ai/LOG.md`, `docs/ai/BACKLOG.md`; `README.md` (3 lines: AI-context pointer, folder-map line, never-published list); `graphify-out/` regenerated (the 3 new .md files appear as rows and nodes, nothing else changed).
- Change: AI project context moves from Notion (HQ, MIGRATION, ROADMAP, LOG, Backlog: about 90 KB, each fact repeated 3 to 8 times) into 3 repo files. Notion is left untouched as an archive and is no longer read or updated. Dropped on purpose (git history and the Notion archive keep it): per-stage verification write-ups for 4a to 6e, repeated status lines, finished-phase owner-gate checklists, and the PROMPTS and "Update Plan & Code Structure" pages (owner: not needed).
- Reconciled: the migration chat read a Notion state that still said "7b is next" (it reported a last edit of 2026-11-26); GitHub had 7b, 7c, 7f and "Phase 7 closed", so the repo was treated as the truth. Correction at review (2026-11-28): the Notion pages (HQ, LOG, MIGRATION, ROADMAP) had in fact been updated through `e5bed98`, including the owner's reports. The 7b, 7c and 7f entries below are reconstructed from git; their OWNER-REPORTED lines were added from that Notion record.
- Verified: build OK (134 files identical to source, modern layer 6 files 811 KB); `dist/` byte-identical to a control build of `e5bed98` (157 files, no docs in it); smoke 63/64 on the docs build, the same single failure as on the unchanged `e5bed98` (the 7c flick check, see CONTEXT section 7); Actions runs 43 to 54 all completed successfully (Actions page); graph-map on unmodified `e5bed98` reproduces the committed `graphify-out` except `built_at_commit` in graph.json; replay on a second fresh clone: the zip changes exactly 8 paths (README.md, the 3 docs, 4 files in `graphify-out/`) and graph-map reproduces `graphify-out` byte for byte.
- Not verified: any device or GPU; whether CONTEXT drops a fact the owner still needs (the owner reviews the "dropped" list in the delivery message); why the 7c flick check fails in this sandbox (inferred: sandbox speed, since Actions passed smoke for `e5bed98`).
- Next: the owner pushes; the next task flips this entry to PUSHED <sha7>. The owner removes the Notion rules from his chat preferences and swaps in the short Coder prompt from the delivery message.
- by: Claude Sonnet 5.5

### 2026-11-28 | Phase 7f | base 8d0bc25 | PUSHED e5bed98 (seen in git log at migration)
- Files (git): `README.md` (+56 -5: "Add a 3D model" guide, "3D turntable" section, Phase 7 budgets table, counts updated to 64 smoke checks and a 6-file 811 KB modern layer), `graphify-out/` (3 files), `src/turntable/turntable.js` (3 comment lines: Phase 7 closed at 7c, known WCAG gap accepted).
- Change: Phase 7 closed; 7d (Solid/Wire styles, accent, Pause) and 7e (ASUS decimation) dropped by the owner 2026-11-28.
- Budgets (README, measured by the original chat against `a995a25`): eager +338 B (limit +400, met), lazy +4,457 B (three.js is now its own shared chunk).
- Actions: VERIFIED success, run 54 (Actions page read at migration and again at review). Owner: closed the stage after the push (OWNER-REPORTED, devices not itemised); the Galaxy A10 test comes later. The hash the owner typed was 8d0bc25 (the 7c commit); the real hash was read from git. Not verified here: any device.
- by: reconstructed from git

### 2026-11-28 | Phase 7c | base 836da41 | PUSHED 8d0bc25 (seen in git log at migration)
- Files (git): `src/turntable/turntable.js` (+98 -7), `tests/smoke.mjs` (+108 -1), `graphify-out/`.
- Change (from the file header and the smoke check names): yaw orbit by drag, inertia, arrow keys, slow auto-rotate; one rAF loop gated by on screen AND panel open AND tab visible AND something changing; touch at most 30 fps; reduced motion = no auto-rotate or inertia. New smoke checks cover auto-rotate advance/stop/resume, reduced motion, and no tick after close.
- Actions: VERIFIED success, run 53 (Actions page read at migration). Owner: Actions green and the live site checked, everything working (OWNER-REPORTED, devices not itemised). Sandbox then: smoke 63/64, the one failure the known planes-hover flake. Not verified here: device feel.
- by: reconstructed from git

### 2026-11-27 | Phase 7b | base a995a25 | PUSHED 836da41 (seen in git log at migration)
- Files (git): new `src/turntable/turntable.js` (161 lines), `src/main.js` (+20: the `window.__turntable` stub), `js/script.js` (+1: the hook line after the Breakdown), `tests/smoke.mjs` (+85 -2), `graphify-out/`.
- Change: the stage mounts above the gallery at final size (aspect 4/3), fetches and parses the model, draws one clay frame, and disposes on close, swap, failure and context loss.
- Actions: VERIFIED success, run 52 (Actions page read at migration). Owner: tested the live site, "great" (OWNER-REPORTED, devices not itemised). Not verified here: the D1 risk (a second GL context on low-end phones) and per-device feel.
- by: reconstructed from git

### 2026-11-25 | Phase 7a | base 49b7f19 | PUSHED a995a25 (checked against GitHub then; Actions success via the API then)
- Files: new `tools/build-turntable-models.py` and `models/` (4 GLBs); `content/works.js` (`model` on 4 projects); `tools/build-site.mjs` (publishes `models/`, validates `model`); `tools/graph-map.py` (a "turntable model" column); `README.md`; `graphify-out/`. No visible change.
- Models: nike-shoe 102 KB (8,628 tris), yerba-mate 377 KB (31,346), youth-affairs 425 KB (37,114; flat-shaded, no normals; the only one with colour), date-cookies 114 KB (9,696). Sources 15.4 MB. int16 positions and int8 normals (KHR_mesh_quantization) were needed for the 500 KB gate.
- Verified then (sandbox): triangle counts equal the source; independent decode matches; Khronos validator 0 errors; rebuild byte-identical; control comparison: only `content/works.js` differs and `models/` is new.
- Owner: pushed after checking the aliases on the contact sheet; per-alias yes/no not itemised; "the site is great, as planned" (OWNER-REPORTED).
- by: Claude Sonnet 5.5 (carried over from the Notion LOG)

### 2026-11-25 | SIDE-spinner | base 4ecd0ef | PUSHED 49b7f19
- Files: `js/premium.js` (+5), `css/premium.css` (+1), `graphify-out/`. Not a phase; the owner approved touching the curtain.
- Change: an npm-style `| / - \` spinner replaces the pulsing dots on the loading curtain (GSAP path only; `SPIN_MS` 100 in the `T` block; reduced motion and the no-GSAP path keep "..."). Post-lift page identical to the control (mean diff 0.0).
- Owner: tested OK, Actions green (OWNER-REPORTED, devices not itemised). The spinner freezes on its last frame during the 250 ms hold at 100% (ticker removed then).
- by: Claude Sonnet 5.5 (carried over from the Notion LOG)

### 2026-11-24 | Phase 6f | base fb325ed | PUSHED 4ecd0ef
- Files: `README.md` and `graphify-out/` only (no application code).
- Change: budgets measured against the end of Phase 5 (`6e914d5`): eager gzip +587 B (over the stage rule, never decided: CONTEXT section 7), lazy +5,559 B; CLS 0.212 at 1440x900 (pre-existing, at load) and 0.006 at 390x844; 0 errors over 27 scenarios; world rAF 0 at rest. README stale facts fixed; review notes are now in CONTEXT section 7.
- Owner: iPad Pro Safari gate passed, "excellent, native" (OWNER-REPORTED). Phase 6 closed.
- by: Claude (carried over from the Notion LOG)
