# Design tokens & conventions

Extracted from the shipped CSS; `src/styles/tokens.css` is the source of truth.

## Colour

| Token       | Dark      | Light     |
| ----------- | --------- | --------- |
| `--bg`      | `#0C0C0B` | `#F1EEE8` |
| `--ink`     | `#ECE8E0` | `#141310` |
| `--mut`     | `#8F8B83` | `#6A665E` |
| `--surface` | `#161614` | `#E6E2DA` |
| `--line`    | ink @ 13% | ink @ 14% |

Accent (`--acc`) is a user-switchable scheme, set at runtime from `src/config/schemes.ts`:
Copper `#D4663A`/`#B8501F`, Sage `#9FB08A`/`#5F7550`, Ice `#9DB4C4`/`#4F6F86` (dark/light).
Card captions always use `#F2EEE6` because they sit on a dark image scrim in both modes.

## Type

- Display: Archivo (variable: weight 100–900, width 62–125) — headings animate `wght` 860→160 and `wdth` 68→125 near the pointer.
- Mono labels: Space Mono 400, 11px, uppercase.
- Body: Archivo 400, 17px / 1.55. Metric-matched fallbacks avoid layout shift while fonts load.

## Motion

| Token            | Value                       | Used for                                         |
| ---------------- | --------------------------- | ------------------------------------------------ |
| `--ease-out`     | `cubic-bezier(.2,.7,.1,1)`  | things that respond: hovers, reveals, card drift |
| `--ease-in-out`  | `cubic-bezier(.65,0,.35,1)` | things that travel: heading ink wipe             |
| `--ease-curtain` | `cubic-bezier(.76,0,.24,1)` | intro curtain                                    |
| `--press`        | `160ms var(--ease-out)`     | `:active` scale(.97) on buttons/chips/switches   |

Rules followed: animate `transform`/`opacity` for anything that moves; hover effects only where hover exists
(`@media (hover:hover) and (pointer:fine)`); reduced motion keeps short opacity/colour changes and removes movement;
keyboard-initiated UI (the Z menu) does not animate.
