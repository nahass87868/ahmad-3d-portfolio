import { clamp, qsa } from '../core/dom';
import { reduced } from '../core/env';
import { viewportOff } from './viewport';

/**
 * Works-grid cards.
 *
 *  layoutBento   numbers the visible tiles 0–9 in `data-b`; cards.css maps that to a grid slot.
 *  initCardPointer + stepCards
 *                tiles near the pointer drift toward it (--tx/--ty) and a glow follows it (--mx/--my).
 *                Pointer events only record a position; the work happens once per frame in stepCards,
 *                reading all tile rects first and writing styles after (no layout thrash).
 */

export function layoutBento(tiles: HTMLElement[]): void {
  let i = 0;
  for (const tile of tiles) {
    if (tile.hidden) continue;
    const slot = String(i++ % 10);
    if (tile.dataset.b !== slot) tile.dataset.b = slot;
  }
}

/** How close (px) the pointer must be to a card's edge before it reacts, and the maximum drift (px). */
const REACH = 48;
const DRIFT_X = 10;
const DRIFT_Y = 10;

const desktopMouse = matchMedia('(min-width:900px) and (hover:hover)');

let tiles: HTMLElement[] = [];
let active = new Set<HTMLElement>();
let x = 0;
let y = 0;
let dirty = false;

const release = (tile: HTMLElement) => {
  active.delete(tile);
  tile.style.removeProperty('--tx');
  tile.style.removeProperty('--ty');
};

export function initCardPointer(root: ParentNode): () => void {
  tiles = qsa('.tile', root);
  active = new Set();
  if (!tiles.length || reduced) return () => {};

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !desktopMouse.matches) return;
    x = e.clientX;
    y = e.clientY;
    dirty = true;
  };
  const onLeave = () => {
    dirty = false;
    tiles.forEach(release);
  };

  document.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  return () => {
    document.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('mouseleave', onLeave);
    tiles.forEach(release);
    tiles = [];
    active.clear();
    dirty = false;
  };
}

/** Per frame. */
export function stepCards(): void {
  if (!dirty || viewportOff()) return;
  dirty = false;

  // read…
  const rects = tiles.map((t) => (t.hidden ? null : t.getBoundingClientRect()));

  // …then write
  tiles.forEach((tile, i) => {
    const r = rects[i];
    if (!r) {
      if (active.has(tile)) release(tile);
      return;
    }
    const gapX = Math.max(r.left - x, 0, x - r.right);
    const gapY = Math.max(r.top - y, 0, y - r.bottom);
    const distance = Math.hypot(gapX, gapY);
    if (distance > REACH) {
      if (active.has(tile)) release(tile);
      return;
    }

    const strength = 1 - distance / REACH;
    const dx = clamp((x - r.left - r.width / 2) / (r.width / 2), -1, 1);
    const dy = clamp((y - r.top - r.height / 2) / (r.height / 2), -1, 1);

    active.add(tile);
    tile.style.setProperty('--tx', (dx * DRIFT_X * strength).toFixed(1) + 'px');
    tile.style.setProperty('--ty', (dy * DRIFT_Y * strength).toFixed(1) + 'px');
    // glow centre, relative to the card's inner edge (1px border)
    tile.style.setProperty('--mx', x - r.left - 1 + 'px');
    tile.style.setProperty('--my', y - r.top - 1 + 'px');
  });
}
