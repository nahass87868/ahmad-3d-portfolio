/*
 * Phase 5a: Lenis smooth scroll. main.js loads this only for a mouse or trackpad with normal motion, after the intro (body.go).
 * Lenis moves the real window scroll, so ScrollTrigger, the scroll listeners, hash links and keyboard scrolling keep working unchanged.
 */
import Lenis from 'lenis';

// Owner tuning values
const FEEL = {
  lerp: 0.12, // share of the remaining distance covered per frame: lower = floatier, higher = snappier (1 = no smoothing)
  wheelMultiplier: 1, // distance per wheel notch: above 1 travels further per flick
};

// premium.js calls ScrollTrigger.refresh() on every <html> class change and Lenis would flip lenis-scrolling per gesture, so it gets no classes.
class QuietLenis extends Lenis { updateClassName() {} }

const gsap = window.gsap;
const ST = window.ScrollTrigger;
if (gsap) {
  const lenis = new QuietLenis({
    lerp: FEEL.lerp,
    wheelMultiplier: FEEL.wheelMultiplier,
    respectReducedMotion: false, // main.js already applied the site's rule, ?motion=full included
    prevent: (node) => node.id === 'panel', // the project panel keeps its native scroll (Phase 4c reads panel.scrollTop)
  });
  gsap.ticker.add(() => lenis.raf(performance.now()));
  if (ST) lenis.on('scroll', () => ST.update());

  // While it glides Lenis rewrites the scroll position every frame, which would cancel the browser's own scroll for a nav link or a scroll key
  // pressed mid-glide (landed far short in testing). So those end the glide first and the browser takes over.
  const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
  const endGlide = () => lenis.reset();
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href^="#"]')) endGlide(); }, true);
  addEventListener('keydown', (e) => { if (SCROLL_KEYS.has(e.key)) endGlide(); }, true);
  addEventListener('hashchange', endGlide);

  // the home page is locked while a project panel is open: stop Lenis then, resume on close
  const root = document.documentElement;
  const sync = () => (root.classList.contains('panel-open') ? lenis.stop() : lenis.start());
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  sync();
}
