/**
 * Environment flags, read once at start-up (browser only).
 *
 * Debug / override flags can come from the query string (`?motion=full`) or from
 * localStorage (`pf_motion`), so they survive a reload from the HUD.
 */
function readParam(key: string): string | null {
  const fromUrl = new URLSearchParams(location.search).get(key);
  if (fromUrl !== null) return fromUrl;
  try {
    return localStorage.getItem('pf_' + key);
  } catch {
    return null;
  }
}

/** Raw OS preference. */
export const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** `?motion=full` forces full motion even when the OS asks for reduced motion (for testing). */
export const forceFullMotion = readParam('motion') === 'full';

/** Effective reduced-motion state used by the whole app. */
export const reduced = prefersReducedMotion && !forceFullMotion;

/** Primary input is touch. */
export const coarsePointer = matchMedia('(pointer: coarse)').matches;

/** A mouse/trackpad is the primary input — hover effects, custom cursor, magnetism are allowed. */
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Heading engine: 'a' = per-letter DOM measurement (default), 'b' = precomputed width table. */
export const headingEngine: 'a' | 'b' = readParam('engine') === 'b' ? 'b' : 'a';

export const debugHud = readParam('debug') === '1';

export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode / quota — preferences just won't persist */
    }
  },
};
