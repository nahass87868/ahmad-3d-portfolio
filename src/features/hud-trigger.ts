import { debugHud } from '../core/env';

/**
 * Ways to open the performance HUD: Shift+D, five quick clicks on the logo (works on touch), or ?debug=1.
 * The HUD itself (and web-vitals) is a separate chunk that is only fetched when one of these fires.
 */
let loading = false;
const openHud = () => {
  if (loading) return;
  loading = true;
  import('./hud').then((m) => m.openHud());
};

export function initHudTriggers(): void {
  addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'D') openHud();
  });

  let taps = 0;
  let last = 0;
  document.querySelector('.nav a')?.addEventListener('click', () => {
    const now = performance.now();
    taps = now - last < 1500 ? taps + 1 : 1;
    last = now;
    if (taps >= 5) {
      taps = 0;
      openHud();
    }
  });

  if (debugHud) openHud();
}
