import { Vector2, WebGLRenderer } from 'three';

/*
 * Phase 5b: the world owns the page's one WebGLRenderer and its one requestAnimationFrame loop.
 * A layer (today only the hero) registers once, asks for a frame with wake(), and is called back as layer.frame(now) on the next
 * animation frame. The world also listens for tab visibility and WebGL context loss and passes both on to the layers.
 * Ownership only: what a layer draws, and when it needs a frame, stays in the layer.
 * Phase 5c: renderRegion() lets a layer draw into one rectangle of a canvas that covers the whole viewport.
 * Phase 5d: the quality presets, the pause rules (tab hidden, project panel open, layer off screen) and dispose() live here too.
 * Phase 6a: the world hosts several layers on the one canvas. In a pass the canvas is cleared once (on the first draw), every in-view layer that
 * did not draw in that pass is asked to redraw() its current state (no stepping), and the world hides the canvas when no layer is in view.
 * Reduced motion is not a pause rule: it changes what the hero draws (static scene, theme repaints), so it stays in the hero.
 */

// Quality presets: the one place the pixel-ratio cap and the frame-rate cap are set. Tune here.
const QUALITY = {
  desktop: { dpr: 2, fps: 0 }, // fine pointer (also with reduced motion): pixel ratio capped at 2, no frame-rate cap (0 = none): what the hero did before
  touch: { dpr: 1, fps: 30 }, // coarse pointer: pixel ratio capped at 1 (it was 1.25), at most 30 drawn frames per second
};

export function createWorld(canvas, fixed) { // fixed: the canvas covers the viewport and layers draw with renderRegion (the world then also hides it while nothing is in view)
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const root = document.documentElement;
  const quality = matchMedia('(hover: hover) and (pointer: fine)').matches ? QUALITY.desktop : QUALITY.touch; // the hero's own FINE test
  const layers = [];
  let raf = 0;
  let hidden = false; // like the hero before: starts false, only the visibilitychange event sets it
  let dead = false;
  let cleared = false, cur = null, hiddenCv = false; // this pass's clear, the layer being called, canvas hidden while no layer is in view
  const size = new Vector2();

  // Pause rules. A layer draws nothing while the tab is hidden, a project panel is open (or html.vp-off: the viewport mode that switches motion off),
  // or it has reported itself off screen with layer.view(false). A layer's urgent() frame (theme change, resize) is still drawn while frozen.
  const frozen = () => root.classList.contains('vp-off') || root.classList.contains('panel-open');
  const urgent = (l) => !!l.urgent && l.urgent();

  function loop(now) {
    raf = 0; cleared = false;
    for (const l of layers) l.drew = false;
    for (const l of layers) {
      if (!l.pending) continue;
      if (!l.inView) { l.pending = false; continue; } // asked for before it went off screen
      if (frozen() && !urgent(l)) { l.pending = false; l.visible(false); continue; }
      if (quality.fps && !urgent(l) && now - l.ran < 1000 / quality.fps - 3) { raf = raf || requestAnimationFrame(loop); continue; } // too soon: ask again next frame (3 ms slack for rAF jitter)
      l.pending = false; l.ran = now; cur = l; l.frame(now); cur = null;
    }
    if (cleared) for (const l of layers) if (l.inView && !l.drew && l.redraw) { cur = l; l.redraw(); cur = null; } // the clear wiped them: draw their current state
    cleared = false;
  }

  const onVisibility = () => { hidden = document.hidden; for (const l of layers) l.visible(!hidden); };
  const onLost = (e) => { e.preventDefault(); for (const l of layers) l.lost(); };
  const onClass = new MutationObserver(() => { for (const l of layers) l.wake(); }); // a panel or viewport mode came or went: one frame so the layer ends in the right state
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onLost);
  onClass.observe(root, { attributes: true, attributeFilter: ['class'] });

  return {
    renderer,
    quality, // { dpr, fps } of the preset in use
    frozen,
    // layer = { frame(now), visible(isShown), lost(), urgent?(), redraw?() }; returns it with wake(): ask for one frame (no-op while one is pending, the tab is hidden or the layer is off screen)
    // and view(isOnScreen): the layer's own measurement of whether it can be seen (it knows its rectangle); layer.visible() is told of every change
    add(layer) {
      layer.pending = false; layer.inView = true; layer.ran = -1e9;
      layer.wake = () => { if (!layer.pending && !hidden && layer.inView && !dead) { layer.pending = true; if (!raf) raf = requestAnimationFrame(loop); } };
      layer.view = (on) => {
        layer.inView = on; layer.visible(on);
        if (fixed && !on && !layers.some((l) => l.inView)) { hiddenCv = true; canvas.style.visibility = 'hidden'; } // a fixed canvas must not keep the last frame on screen
      };
      layers.push(layer);
      return layer;
    },
    // x, y, w, h: the rectangle in CSS px from the canvas' top-left. The first draw of a pass clears the whole canvas (rectangles move with the scroll),
    // the viewport and scissor confine each draw to its rectangle. Layers draw in call order (redraws come last, so they sit on top).
    renderRegion(scene, camera, x, y, w, h) {
      renderer.getSize(size);
      if (!cleared) { renderer.setScissorTest(false); renderer.clear(); cleared = true; }
      renderer.setScissorTest(true);
      renderer.setViewport(x, size.y - y - h, w, h); renderer.setScissor(x, size.y - y - h, w, h);
      renderer.render(scene, camera);
      if (cur) cur.drew = true;
      if (hiddenCv) { hiddenCv = false; canvas.style.visibility = ''; } // shown again only after a fresh draw
    },
    // Teardown: stop the loop, remove the world's listeners, dispose the renderer and release its GL context (once; a lost context is left alone).
    dispose() {
      if (dead) return;
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      layers.length = 0;
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      onClass.disconnect();
      renderer.dispose();
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
    },
  };
}
