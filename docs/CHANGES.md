# What changed from `ahmad-portfolio-viewport.html`

The visual design, copy, durations and easings are unchanged. Verified against your original in headless Chromium:
same DOM (549 elements), same geometry on desktop, desktop screenshots within 0.011% of pixels, phone screenshots
identical outside the time-driven heading wave and the viewport toolbar.

## Restructure

| Before                                                                          | After                                                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| One 1.1 MB HTML: 773 KB minified module, 127 inline base64 WebP, 2 base64 fonts | `src/` TypeScript modules, 97 WebP files + 2 woff2 + favicon in `public/`; JS 46 KB, CSS 25.6 KB |
| Base CSS + a second "patch" layer overriding it (`html .tile>a`, `html .px`…)   | One flat rule per selector, split by feature (`intro.css`, `cards.css`, `viewport.css`…)         |
| Patch JS (`vp-js`) as a separate inline script                                  | `features/viewport.ts` (shading + Z menu) and `features/cards.ts`                                |
| Contact details/nav/footer duplicated between generated HTML and JS             | `src/content/*` is the single source; `src/render/*` builds HTML for the build and the browser   |
| `Te`/`Me`/`Q`… minified names                                                   | Typed content (`Work`, `Site`…) and named modules                                                |

## Bugs fixed

| Issue in the original                                          | Fix                                                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| URL never changed; Back button did nothing (no `pushState`)    | History API with `popstate`; `file://` falls back to in-memory routing; every route also exists as a prerendered file |
| `theme-color` was `#000`/`#FFF`, page is `#0C0C0B`/`#F1EEE8`   | Matches `--bg`, set before paint and on every toggle                                                                  |
| Intro curtain covered the page forever with JS off             | Curtain, "Skip intro" and theme dock only exist when JS runs; boot script adds a 9 s failsafe                         |
| Skipping the intro made the tagline retype itself              | Pending timers cleared on skip                                                                                        |
| Skip left a 1.4px outline on headings (animation kept running) | Stroke width is a transition; snap and reduced motion land at 0                                                       |
| Reduced motion: tiles still drifted                            | Card drift and magnetism off                                                                                          |
| Accent flipped Orange→Copper as the curtain lifted             | Accent applied before first paint                                                                                     |
| Footer swatch said "Ember" until JS ran                        | Prerendered as "Copper"                                                                                               |
| Video projects rendered `<source src="">` (no files shipped)   | Poster-only hero when no video file is declared                                                                       |
| `--mx/--my` glow offset by 10px from a removed padding         | Offset by the 1px border                                                                                              |
| IntersectionObservers leaked across navigations                | Per-mount observers, disposed on route change                                                                         |

## Dead code removed

- `--hd`, `HD` map (`Pumpkin`/`Meadow` schemes no longer exist), `--on-acc` + luminance function (button was re-skinned by the patch).
- Card scroll-tilt (`bend()`, `--sx/--rx/--ry/--col`): written every frame but overridden by the patch CSS.
- `work.poster`, `work.credits`, AVIF plumbing (no AVIF files), `data-hero`.
- `MutationObserver` over all of `<main>` for bento layout → explicit call after filter.

## Performance

- Card pointer effects: one batched read of tile rects, then writes, once per frame (was a `getBoundingClientRect` + style write per tile per pointer event).
- Scrim hover on cards animates `transform` instead of `height` (mouse devices).
- HUD + `web-vitals` are a lazy chunk (was a CDN script); no network until opened.
- Heading/reveal observers disposed per route.

## Mobile / touch (`mobile-native`)

Hover rules gated to `(hover:hover) and (pointer:fine)`; `:active` press feedback; tap-highlight off; `touch-action: manipulation`;
no text selection on controls; 44px targets (nav links, logo, toolbar on touch); toolbar and intro labels respect safe-area insets;
`interactive-widget=resizes-content`; `text-size-adjust`.

## Motion (`emil-design-eng`, `improve-animations`)

Reduced motion keeps short opacity/colour changes instead of nothing; Z-menu entrance removed (keyboard-initiated);
tiles in one reveal batch cascade 50 ms apart (max 5); focus moves to `<main>` and the title is announced on navigation.

## Known caveats

- Nine videos have no files (see README).
- Verified in Chromium only; not tested on iOS Safari, Firefox or a real GPU.
- Build uses esbuild's CSS minifier on purpose: Lightning CSS rewrote the scrim gradients and produced a visible seam.
