/**
 * Tunables for the interactive typography, magnetic controls and intro sequence.
 * Times are milliseconds unless the name says otherwise.
 */
export const MOTION = {
  /** Variable-font axes for headings: weight 860 → 160 and width 68 → 125 near the pointer. */
  W_REST: 860,
  W_MIN: 160,
  D_REST: 68,
  D_MAX: 125,
  /** Influence radius, in multiples of the heading's font size (min 140px). */
  RADIUS: 1.15,
  /** Per-frame easing toward the target axis value (0–1). */
  EASE: 0.16,
  /** Reduced-motion: weight floor, so headings stay legible and only change subtly. */
  CALM_W_MIN: 480,

  /** Stroke → fill reveal of headings: per-letter stagger, seconds = n × stagger / 1000. */
  STROKE_STAGGER: 40,
  FILL_STAGGER: 70,
  /** Hero sequence. */
  FILL_MS: 2600,
  INTRO_END_MS: 4400,
  HOLD_MS: 1200,
  TYPE_MS: 26,

  /** Magnetic controls: reach (px), pull strength, max shift (px), easing. */
  MAG_REACH: 90,
  MAG_PULL: 0.28,
  MAG_MAX: 14,
  MAG_EASE: 0.18,
  /** Controls larger than this are never magnetic. */
  MAG_MAX_W: 320,
  MAG_MAX_H: 96,

  /** Simultaneous hover/in-view video previews on touch devices. */
  PREVIEW_MAX: 2,
} as const;

/** Intro counter: duration of the 000→100 count (ms) and the safety timeout. */
export const INTRO = {
  COUNT_MS: 2600,
  COUNT_MS_REDUCED: 300,
  SETTLE_MS: 380,
  FAILSAFE_MS: 9000,
  CLEANUP_MS: 1900,
} as const;
