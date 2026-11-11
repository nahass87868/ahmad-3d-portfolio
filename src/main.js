/*
 * The modern layer. Features are written here as ES modules (three, GSAP, Lenis ... imported from npm) and loaded lazily,
 * so the page's first load does not grow. Type  __BUILD__  in the browser console to see which build you are looking at.
 */
window.__BUILD__ = { tool: 'vite', phase: 3 };

// The loading curtain (premium.js) waits on this while the 3D loads. It must exist BEFORE the hero chunk arrives, and it is
// resolved by the hero when the scene runs or when it decides to skip (no WebGL, Data Saver, ...).
let done;
window.__hero3dReady = new Promise((resolve) => { done = resolve; });
window.__hero3dResolve = done;

// three.js and the hero load as their own chunk, in parallel with the page and never in front of it.
// If that chunk fails to load, the curtain must not wait for it.
// Same eligibility checks the hero makes (Data Saver, WebGL), done here so an ineligible device never downloads the chunk.
let eligible = !(navigator.connection && navigator.connection.saveData);
if (eligible) {
  try { eligible = !!document.createElement('canvas').getContext('webgl'); } catch (e) { eligible = false; }
}
if (eligible) {
  import('./hero/hero-3d.js').catch((err) => {
    console.warn('[hero-3d] could not load:', err);
    done();
  });
} else {
  done();
}
