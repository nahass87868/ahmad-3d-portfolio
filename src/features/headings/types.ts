export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** One letter of a split heading, plus the animation state for its variable-font axes. */
export interface Letter {
  el: HTMLSpanElement;
  ch: string;
  /** Current / last-written weight and width axis values (engine A). */
  cw: number;
  cd: number;
  lw: number;
  ld: number;
  /** Viewport centre, measured each frame near the pointer (engine A). */
  x: number;
  y: number;
  /** Current / last-written 0–1 influence (engine B). */
  ck: number;
  lk: number;
  /** Last-written x offset (engine B). */
  lx: number;
  /** Page-space centre (engine B). */
  cx: number;
  cy: number;
  /** Width in px (engine B). */
  wpx: number;
}

/** One word of an engine-B heading: letters are absolutely positioned inside it. */
export interface Line {
  word: HTMLElement;
  letters: Letter[];
  /** The last word of the hero name is right-aligned. */
  rightAligned: boolean;
  rect: Box;
}

export interface Heading {
  el: HTMLElement;
  letters: Letter[];
  index: number;
  /** Within 120px of the viewport (IntersectionObserver). */
  visible: boolean;
  fontSize: number;
  /** Still easing toward its target: keep stepping even if the pointer has left. */
  busy: boolean;
  /** Axis values at rest, and the width-axis maximum. */
  w0: number;
  d0: number;
  dmax: number;
  engineB: boolean;
  /** Engine B: glyph widths (em) sampled along the morph, per character. */
  table: Record<string, number[]> | null;
  lines: Line[] | null;
  /** Page-space bounding box. */
  pageRect: Box;
}

/** Engine A work item for a frame: a heading the pointer is near (or that is still easing). */
export interface Near {
  heading: Heading;
  /** Pointer in viewport coordinates. */
  px: number;
  py: number;
  /** Influence radius. */
  radius: number;
  near: boolean;
}
