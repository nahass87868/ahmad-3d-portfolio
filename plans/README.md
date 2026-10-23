# Deferred improvements

Found while auditing the original's motion and touch behaviour. None were applied because each changes the feel
or needs a real-device check. Each plan is self-contained.

| #   | Finding                                                     | Effort | Risk                       |
| --- | ----------------------------------------------------------- | ------ | -------------------------- |
| 001 | ~39 simultaneous `backdrop-filter` layers on the works grid | S      | needs device measurement   |
| 002 | Filter chips re-pack the grid with no transition            | M      | low                        |
| 003 | Intro replays on every load                                 | S      | changes the owner's design |
| 004 | Cursor ring animates `width/height/left/top`                | S      | low                        |
| 005 | Card image hover zoom is 700 ms                             | XS     | feel                       |
| 006 | Single-key shortcut (Z) with no off switch (WCAG 2.1.4)     | S      | low                        |

## 001 — Count and cost of `backdrop-filter`

**Where:** `src/styles/cards.css` — `.tile > a:after` (blur 12px, 15×), `.th:before` and `.mot` (blur 8px, up to 24×).
**Problem:** ~39 blurred layers over images. Cheap on desktop GPUs; the likely cost is on mid-range Android and older iPhones.
**Do:** profile the home page scrolling on a real mid-range phone (Chrome DevTools remote → Performance, or Safari Web Inspector → Timelines). If frames drop,
first remove the blur from the badges (solid `rgba(12,12,11,.7)` is nearly indistinguishable), then, if needed, from the scrim at `(pointer: coarse)` (the gradient already carries legibility).
**Verify:** before/after frame times while flinging the grid; compare screenshots.

## 002 — Animate the filter re-pack (FLIP)

**Where:** `src/features/works.ts` filter handler, `layoutBento`.
**Do:** before toggling `hidden`, record each visible tile's rect; after `layoutBento`, apply `transform: translate(dx,dy)` and transition to none (200–260 ms, `--ease-out`); fade tiles that appear. Skip under reduced motion.
**Verify:** switching chips never jumps; rapid clicks interrupt cleanly (transitions, not keyframes).

## 003 — Show the intro once per session

**Where:** `src/features/intro.ts`, `src/boot.ts`.
**Do:** set `sessionStorage.introSeen`; when set, resolve immediately and skip the curtain (`html.pre` must not be added by boot).
**Why not applied:** it removes part of the experience on reloads. Your call.

## 004 — Cursor ring on transform

**Where:** `src/styles/cursor.css` `.cs` transitions `width, height, left, top`.
**Do:** keep a 32px element and `transform: scale(.31)` at rest → `scale(1)` on `.hov`; border width compensates with a pseudo-element or `outline`. Verify the ring stays crisp.

## 005 — Hover zoom duration

**Where:** `.th img` `transition: transform .7s`. A 5% scale on hover at 700 ms reads slow for something done dozens of times per visit; try 450 ms with the same curve.

## 006 — Z shortcut and WCAG 2.1.4

**Where:** `src/features/viewport.ts` keydown handler.
**Problem:** a bare letter key triggers UI with no way to disable it.
**Do:** require Shift+Z, or only activate while the toolbar has focus, or add a "Shortcuts: on/off" toggle persisted in `localStorage`.
