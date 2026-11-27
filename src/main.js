/*
 * The modern layer. Features are written here as ES modules (three, GSAP, Lenis ... imported from npm) and loaded lazily,
 * so the page's first load does not grow. Type  __BUILD__  in the browser console to see which build you are looking at.
 */
import { mountHeroFallback } from './hero/hero-fallback.js';

window.__BUILD__ = { tool: 'vite', phase: 3 };

// The loading curtain (premium.js) waits on this while the hero is prepared. It must exist before either hero module loads.
let done;
window.__hero3dReady = new Promise((resolve) => { done = resolve; });
window.__hero3dResolve = done;

// Always prepare the lightweight design first. It contains the real hero spacing and the faint PORT / FOLIO backdrop,
// but no Three.js, model download, WebGL context or animation loop.
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const saveData = !!(connection && connection.saveData);
const effectiveType = connection && connection.effectiveType;
const downlink = connection && connection.downlink;
const slowNetwork = !!(connection && (effectiveType === 'slow-2g' || effectiveType === '2g' || (Number.isFinite(downlink) && downlink > 0 && downlink < 0.5)));
// Owner decision (Fix 07): RAM and CPU core count never skip the 3D, every device gets it. Data Saver, a very slow link and a missing WebGL 2 still fall back to the designed hero.
let webgl2 = false;
if (!saveData && !slowNetwork) {
  try { webgl2 = !!document.createElement('canvas').getContext('webgl2'); } catch (e) { webgl2 = false; }
}
const skipReason = saveData
  ? 'Data Saver is on'
  : slowNetwork
    ? 'The connection is too slow for the 3D hero'
    : !webgl2
      ? 'WebGL 2 is not available in this browser'
      : '';

mountHeroFallback()
  .then((fallbackRegion) => {
    if (!fallbackRegion) {
      window.__hero3d = { state: 'fallback-unavailable', reason: 'The hero layout was not ready' };
      done();
      return;
    }
    if (skipReason) {
      window.__hero3d = { state: 'skipped', reason: skipReason };
      done();
      return;
    }

    // Load Three.js and the hero only after the matching lightweight fallback is visible.
    import('./hero/hero-3d.js').catch((err) => {
      console.warn('[hero-3d] could not load:', err);
      window.__hero3d = { state: 'failed', reason: err && err.message ? err.message : String(err) };
      done();
    });
  })
  .catch((err) => {
    console.warn('[hero-fallback] could not mount:', err);
    window.__hero3d = { state: 'fallback-failed', reason: err && err.message ? err.message : String(err) };
    done();
  });

// Phase 5a: Lenis smooth scroll, desktop only. The test is the same as FINE and REDUCED in js/script.js (including the ?motion=full override),
// so touch and reduced motion never download it. It starts once the intro is done (body.go).
const motionParam = (() => {
  try { const q = new URLSearchParams(location.search).get('motion'); if (q !== null) return q; } catch (e) { /* ignore */ }
  try { return localStorage.getItem('pf_motion'); } catch (e) { return null; }
})();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches && motionParam !== 'full';
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
  const startLenis = () => import('./scroll/lenis.js').catch((err) => console.warn('[lenis] could not load:', err));
  if (document.body.classList.contains('go')) startLenis();
  else {
    const mo = new MutationObserver(() => {
      if (!document.body.classList.contains('go')) return;
      mo.disconnect();
      startLenis();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
}

// Phase 7b: the project-panel turntable (src/turntable/turntable.js, a lazy chunk). js/script.js calls this right after the Breakdown hook and keeps the returned cleanup.
// The empty stage goes in NOW at its final size, so nothing shifts while the chunk and the model load. Off: Data Saver / slow link / no WebGL 2 (skipReason),
// html.vp-off, and ?turntable=off (remembered in pf_turntable; ?turntable=on clears it).
const ttQ = new URLSearchParams(location.search).get('turntable');
let ttOff = ttQ === 'off';
try {
  if (ttQ === 'off') localStorage.setItem('pf_turntable', 'off');
  else if (ttQ === 'on') localStorage.removeItem('pf_turntable');
  else ttOff = localStorage.getItem('pf_turntable') === 'off';
} catch (e) { /* storage blocked: ?turntable still works for this page */ }
window.__turntable = (body, work) => {
  const host = body.querySelector('.gallery') || body.querySelector('.pn');
  if (!host || skipReason || ttOff || document.documentElement.classList.contains('vp-off')) return () => {};
  host.insertAdjacentHTML('beforebegin', '<section class="x-turn" style="aspect-ratio:4/3;width:min(100%,106svh);margin:0 auto 48px;background:var(--surface)"></section>');
  const el = host.previousElementSibling;
  let stop, dead;
  import('./turntable/turntable.js').then((m) => { if (!dead) stop = m.mountTurntable(el, work); }).catch(() => el.remove());
  return () => { dead = 1; if (stop) stop(); el.remove(); };
};
