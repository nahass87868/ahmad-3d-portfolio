import { WebGLRenderer } from 'three';

/*
 * Phase 5b: the world owns the page's one WebGLRenderer and its one requestAnimationFrame loop.
 * A layer (today only the hero) registers once, asks for a frame with wake(), and is called back as layer.frame(now) on the next
 * animation frame. The world also listens for tab visibility and WebGL context loss and passes both on to the layers.
 * Ownership only: what a layer draws, and when it needs a frame, stays in the layer.
 */
export function createWorld(canvas) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const layers = [];
  let raf = 0;
  let hidden = false; // like the hero before: starts false, only the visibilitychange event sets it

  function loop(now) {
    raf = 0;
    for (const l of layers) if (l.pending) { l.pending = false; l.frame(now); }
  }

  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    for (const l of layers) l.visible(!hidden);
  });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); for (const l of layers) l.lost(); });

  return {
    renderer,
    // layer = { frame(now), visible(isVisible), lost() }; returns it with wake(): ask for one frame (no-op while one is pending or the tab is hidden)
    add(layer) {
      layer.pending = false;
      layer.wake = () => { if (!layer.pending && !hidden) { layer.pending = true; if (!raf) raf = requestAnimationFrame(loop); } };
      layers.push(layer);
      return layer;
    },
    setQuality() {}, // quality hook: does nothing yet (Phase 5d)
  };
}
