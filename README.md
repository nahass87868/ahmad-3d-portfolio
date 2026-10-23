# Ahmad Nahass — portfolio

Vite + TypeScript, prerendered to static HTML. No framework, no runtime dependencies in the main bundle
(~46 KB JS / ~17 KB gzipped). Every page is a real HTML file, and the same render code drives in-site navigation.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 — every route renders, edits reload
npm run build      # typecheck → media check → vite build → dist/ (18 static pages)
npm run preview    # serve dist/
```

Node 20.19+.

## Where things live

```
index.html              page template (markers: BOOT, HEAD, SHELL_TOP, VIEW, SHELL_BOTTOM)
src/
  main.ts               entry: runs the intro, then boots the app
  boot.ts               inlined in <head>, before first paint: theme, flags, failsafe
  app.ts                mount / unmount per route, starts the frame loop
  router.ts             client-side navigation + History API
  content/              ← edit your text here (site, about, services, works, privacy)
  media/manifest.ts     ← image / video catalogue (ids → files in public/media)
  config/               colour schemes, motion tunables
  render/               pure HTML builders (no DOM) — used by the browser AND the build
  features/             intro, theme, cursor, magnetic, headings/, hero, works, cards, viewport, hud…
  styles/               tokens, base, typography, intro, nav, hero, sections, controls,
                        cards, project, cursor, viewport, motion, a11y  (index.css sets the order)
tools/prerender.ts      Vite plugin: renders every route (dev + build), sitemap, 404
scripts/check-media.mjs fails the build if content and media disagree
public/                 fonts, favicon, media/ (served as-is)
docs/                   CHANGES.md (what differs from the original), DESIGN.md (tokens)
plans/                  deferred improvements, each self-contained
```

## Everyday tasks

**Edit text / contact details** — `src/content/*.ts`. The nav, footer, hero and meta tags all read from there.

**Add a project** — add an entry to `src/content/works.ts`, add its images to the manifest (below). The page,
grid tile, prev/next links, sitemap and prerendered HTML file appear automatically.

**Add an image** — drop `<id>-480.webp` (grid, 4:5 crop) and `<id>-900.webp` (project page) into
`public/media/images/`, then add `'<id>': { w, h }` (source pixel size) to `src/media/manifest.ts`.

**Add a video** — drop `<id>.mp4` (and optionally `.webm`, and `<id>.preview.mp4` for the hover preview) into
`public/media/videos/`, then list the formats in the manifest: `full: ['mp4']`, `preview: ['mp4']`.
A matching poster `public/media/posters/<id>.webp` is already there for all nine existing videos.

> The build you sent contained **no video files**, so the nine video projects show their poster until you add them.

`npm run media:check` (also part of `build`) fails on missing files and warns about unused ones.

## Deploying

| Setting                                       | How                                          | Default |
| --------------------------------------------- | -------------------------------------------- | ------- |
| Sub-path hosting (`user.github.io/repo/`)     | `BASE_PATH=/repo/ npm run build`             | `/`     |
| Canonical URLs + `sitemap.xml` + `robots.txt` | `SITE_URL=https://example.com npm run build` | off     |

Upload `dist/`. Any static host works. Unknown URLs should serve `404.html` (Netlify, Cloudflare Pages, GitHub Pages do this by default).

## Debug & test switches

- `Shift+D`, five quick taps on the logo, or `?debug=1` — performance HUD (frame times, forced-layout cost, Web Vitals, 6 s pointer sweep). Lazy-loaded; costs nothing otherwise.
- `?engine=b` — alternative heading engine (width table instead of per-letter DOM measurement). Switchable in the HUD.
- `?motion=full` — ignore the OS reduced-motion setting (testing only).
- Hold **Z** — Blender-style viewport shading menu (Wireframe / Solid / Material / Rendered).
- `<html data-ready="1">` appears when the hero sequence has finished — handy for screenshots.

## Things to keep in sync

- `--bg` in `styles/tokens.css` ↔ `THEME_COLOR` in `config/schemes.ts` (browser-chrome colour on phones).
- Accent colours live only in `config/schemes.ts`; `--acc` is set from there at runtime.

## Formatting

`npm run format` (Prettier). `npm run typecheck` runs `tsc` over the app and the Node tooling.
