# BACKLOG: parked ideas (NOT approved scope)

Read this file only when a task names a backlog item. Nothing here may be started, scheduled or pulled into a stage unless the owner explicitly selects it.
Source: the owner's Notion backlog (last edited 2026-11-24), migrated 2026-11-28. Item numbers are the owner's; B0 is the audit.
Status values: parked | selected | done | changed | dropped. Update an item here when its status changes.

Rules for any selected item
- Inspect the current live code and the relevant interactions first; confirm scope; name the regression risks (STOP and ask on a conflict).
- Preserve layout, responsiveness, 3D behaviour, motion and interactions unless the selected item explicitly changes them.
- Protected areas (CONTEXT section 4) stay protected unless the owner names them for the item.
- "Inference" below = my reading of the repo at migration, not verified: check it in the code before relying on it.

## B0. Full codebase architecture, performance and compatibility audit (very high priority, keep first)

Status: parked. Future-focused investigation and optimisation, not current scope. Do not begin until the owner selects it. It is NOT permission for immediate changes.
- Scope: the whole structure and every technology actually present (HTML, CSS, JavaScript, Python, other tooling; verify, do not assume Java or anything else).
- Architecture: module boundaries, organisation, dependencies, maintainability, duplication, complexity, build configuration, code quality.
- Performance: runtime and rendering, 3D/WebGL lifecycle and resource management, loading, asset delivery, bundle size, memory, animations, CPU/GPU cost, bottlenecks.
- Compatibility and resilience: browsers, devices, viewports, input, accessibility, graceful degradation, with evidence and realistic test coverage.
- Professional review: security, reliability, standards, testing strategy, accessibility, developer experience, regression risk.
- Process: first a deeply evidenced audit with prioritised findings, impact, risks and proposed fixes. After the owner's review, implement incrementally (never a blind rewrite), testing each change with regression and compatibility checks.
- Goal: professional engineering standard while preserving the site's established design, behaviour and constraints.
- Seed for the audit: CONTEXT section 7 (open and unverified) already lists known measurement gaps and review notes.

## B1. Hero scaling: name and 3D model

Status: parked.
- Issue: zoomed far out (about 30% browser scale) the hero name stays large while the 3D model becomes disproportionately small.
- Desired: the hero typography and the 3D model scale and respond as one cohesive, native-feeling composition across viewport sizes and zoom levels.
- Inference: the hero is a protected area. The 3D hero draws into its region's rectangle on the shared fixed canvas (Phase 5c); cause not diagnosed.

## B2. Cursor interaction: cards and About image

Status: parked.
- Current: the cursor pulls the whole card toward itself.
- Desired: keep each card anchored; move the thumbnail/media inside the card with the cursor (restrained parallax); apply the same idea to the personal image in the About section; smooth and controlled; the card itself never follows the cursor.
- Inference: the card drift is DOM-side and the planes (Phase 6) copy the DOM card's rectangle within 1 px, so changing it changes what the plane must match; with planes on, the inner motion has to happen in the plane's shader or sampling, with planes off on the DOM image. About image code: `js/about-photo.js`.

## B3. Responsive 3D portfolio wordmark

Status: parked.
- Desired: wide screens show "PORTFOLIO" on one line; narrow screens and phones transition into two lines, "PORT" and "FOLIO"; the change is fluid and animated, not an abrupt breakpoint swap; keep the existing visual identity and animation quality.
- Inference: PORT / FOLIO are the hero's 3D letters with physics (protected); how they lay out today is not diagnosed.

## B4. Project-card media slideshow

Status: parked.
- Desired: instead of one continuous thumbnail video, cycle repeatedly through the media inside each project as a looping slideshow with smooth fade-out / fade-in, restrained and polished (Apple product-presentation style).
- Inference: the card hover-video preview was removed in Phase 6b (owner: images only), and each card image is a WebGL plane with one texture per tile (16 resident on desktop, GPU memory unmeasured). A slideshow means several textures per tile or a DOM layer: weigh it against that.

## B5. Remove site-wide dividing lines

Status: parked.
- Desired: remove the horizontal/section-dividing lines used across the site. Review the whole page so the removal is consistent and does not remove meaningful borders or functional UI separators.
- Inference: styles are in `css/style.css` and `css/premium.css`.

## B6. Download CV button in the About section

Status: parked.
- Desired: a clearly visible button in the About section that lets visitors download Ahmad's CV.
- Fact: no CV file exists in the repo (checked at migration: no file named cv or resume, and no CV/resume wording in `index.html`, `content/works.js`, `js/script.js`, `js/extras.js`, `css/style.css`). The owner must supply the file. Files are published only if they sit in a whitelisted folder or are added to `FILES` / `DIRS` in `tools/build-site.mjs`.

## B7. Expand the footer into a second hero section

Status: parked.
- Desired: make the footer substantially larger and more prominent, treated like another hero section rather than a small closing strip.

## B8. Change the site font system

Status: parked.
- Desired roles: Arial Black (very bold display: hero name and headings); Courier New (monospace: code and technical details); Georgia Italic (editorial supporting text).
- Required by the owner: review font availability, fallbacks, hierarchy and responsive rendering before applying.
- Fact: the site currently uses Archivo and Space Mono (`fonts/archivo.woff2`, `fonts/space-mono.woff2`) with metric-matched fallback faces in `css/style.css`. The smoke test has a check "all fonts loaded".
- Inference: Arial Black, Courier New and Georgia are system fonts (no files to publish); availability differs by OS (likely missing on Android: unverified), so each needs a fallback stack.
