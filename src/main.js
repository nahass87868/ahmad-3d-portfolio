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
const memory = navigator.deviceMemory;
const cores = navigator.hardwareConcurrency;
const lowHardware = (Number.isFinite(memory) && memory <= 2) || (Number.isFinite(cores) && cores <= 2);
let webgl2 = false;
if (!saveData && !slowNetwork && !lowHardware) {
  try { webgl2 = !!document.createElement('canvas').getContext('webgl2'); } catch (e) { webgl2 = false; }
}
const skipReason = saveData
  ? 'Data Saver is on'
  : slowNetwork
    ? 'The connection is too slow for the 3D hero'
    : lowHardware
      ? 'The device has limited hardware resources'
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
