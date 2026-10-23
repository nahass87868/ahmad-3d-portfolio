import { MOTION } from '../../config/motion';
import { qs, qsa } from '../../core/dom';
import { coarsePointer, headingEngine, reduced } from '../../core/env';
import { pointer } from '../../core/pointer';
import { stepEngineA } from './engine-a';
import { enableEngineB, layoutLines, stepEngineB } from './engine-b';
import { splitHeading } from './split';
import { headings } from './state';
import type { Box, Near } from './types';

/**
 * Interactive display typography.
 *
 *   initHeadings(root)   split every `.px` heading into letters and start observing it
 *   stepHeadings(now)    per frame: ease letters toward the pointer; returns letters written
 *   disposeHeadings()    on route change
 *
 * Headings only work while visible, and only near the pointer (or while still easing back).
 */

const rectOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
};

/** Tracks which headings are on (or near) screen. */
const visibility = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const h = headings.find((x) => x.el === entry.target);
      if (h) h.visible = entry.isIntersecting;
    }
  },
  { rootMargin: '120px' },
);

/** Stroke → fill reveal when a heading first scrolls into view. */
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      el.classList.add('stroke');
      setTimeout(() => el.classList.add('on'), MOTION.HOLD_MS);
      reveal.unobserve(el);
    }
  },
  { threshold: 0.25 },
);

/** Re-measure everything: font sizes, page rects, and (engine B) line rects. */
export function measureHeadings(): void {
  for (const h of headings) {
    h.fontSize = parseFloat(getComputedStyle(h.el).fontSize);
    h.pageRect = rectOf(h.el);
    if (h.engineB && h.table) {
      for (const line of h.lines!) line.rect = rectOf(line.word);
      layoutLines(h, true);
    }
  }
}

export function initHeadings(root: ParentNode): void {
  for (const el of qsa('.px', root)) {
    if (el.dataset.split) continue;
    splitHeading(el);
    visibility.observe(el);
    // the hero name is revealed by features/hero.ts; every other heading reveals on scroll
    if (el.id !== 'heroName') {
      if (reduced) el.classList.add('stroke', 'on');
      else reveal.observe(el);
    }
  }
  measureHeadings();

  // widths are only right once the web fonts are in
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    for (const h of headings) if (h.engineB && !h.table) enableEngineB(h);
    measureHeadings();
  });
}

export function disposeHeadings(): void {
  for (const h of headings) {
    visibility.unobserve(h.el);
    reveal.unobserve(h.el);
  }
  headings.length = 0;
}

/** Keep measurements fresh on resize / load / layout change of <main>. */
export function bindHeadingMeasure(): void {
  addEventListener('resize', measureHeadings);
  addEventListener('load', measureHeadings);
  const main = qs('#top');
  if (main && window.ResizeObserver) {
    let queued = false;
    new ResizeObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        measureHeadings();
      });
    }).observe(main);
  }
}

export const headingStats = () => ({
  letters: headings.reduce((n, h) => n + h.letters.length, 0),
  engineB: headings.filter((h) => h.engineB && h.table).length,
  engine: headingEngine,
});

/** Per frame. */
export function stepHeadings(now: number): number {
  const t = now / 1000;
  // pointer-driven if a pointer is active; on touch with no finger down, a slow idle wave drifts across each heading
  const pointerActive = pointer.on || (coarsePointer && !reduced);
  const idleWave = coarsePointer && !pointer.on && !reduced;
  const sx = scrollX;
  const sy = scrollY;

  const queueA: Near[] = [];
  let writes = 0;

  for (const h of headings) {
    if (!h.visible) continue;
    const box = h.pageRect;
    const radius = Math.max(140, h.fontSize * MOTION.RADIUS);

    // pointer position in page space
    const ox = idleWave
      ? box.left + box.width * (0.5 + 0.5 * Math.sin(t * 0.5 + h.index))
      : pointer.x + sx;
    const oy = idleWave ? box.top + box.height / 2 : pointer.y + sy;

    const near =
      pointerActive &&
      ox > box.left - radius &&
      ox < box.left + box.width + radius &&
      oy > box.top - radius &&
      oy < box.top + box.height + radius;

    if (!near && !h.busy) continue;

    if (h.engineB && h.table) writes += stepEngineB(h, ox, oy, radius, near);
    else queueA.push({ heading: h, px: ox - sx, py: oy - sy, radius, near });
  }

  // engine A: read every letter's centre first (one layout), then write
  for (const item of queueA) {
    for (const l of item.heading.letters) {
      const r = l.el.getBoundingClientRect();
      l.x = r.left + r.width / 2;
      l.y = r.top + r.height / 2;
    }
  }
  for (const item of queueA) writes += stepEngineA(item);
  return writes;
}
