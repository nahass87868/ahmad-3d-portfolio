import { INTRO } from '../config/motion';
import { prefersReducedMotion } from '../core/env';

/** Ease-in-out cubic: the counter lingers at both ends and rushes through the middle. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Counts 000 → 100 on the curtain, then lifts it. Resolves when the curtain starts to lift, which is
 * the moment the rest of the app starts (so the hero animation begins as the page is revealed).
 */
export function runIntro(): Promise<void> {
  const root = document.documentElement;
  const curtain = document.getElementById('pre');
  const counter = document.getElementById('pn');
  const bar = document.getElementById('pb');

  return new Promise((resolve) => {
    if (!curtain || !counter || !bar) {
      root.classList.remove('pre');
      resolve();
      return;
    }

    root.classList.add('pre');
    const duration = prefersReducedMotion ? INTRO.COUNT_MS_REDUCED : INTRO.COUNT_MS;
    const startedAt = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      curtain.classList.add('out');
      root.classList.remove('pre');
      resolve();
      setTimeout(() => curtain.remove(), INTRO.CLEANUP_MS);
    };

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const value = Math.round(ease(t) * 100);
      counter.textContent = String(value).padStart(3, '0');
      bar.style.transform = `scaleX(${value / 100})`;
      if (t < 1) requestAnimationFrame(tick);
      else setTimeout(finish, INTRO.SETTLE_MS);
    };

    requestAnimationFrame(tick);
    // rAF is paused in background tabs; don't let the page wait forever.
    setTimeout(finish, INTRO.FAILSAFE_MS);
  });
}
