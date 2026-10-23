import { MOTION } from '../config/motion';
import { qsa } from '../core/dom';
import { finePointer, reduced } from '../core/env';
import { pointer } from '../core/pointer';

/**
 * Links, buttons and [data-mag] elements lean toward the pointer when it is within MAG_REACH px.
 * Positions are measured once (and on resize / content change), not per frame.
 */
interface Target {
  el: HTMLElement;
  /** Fixed-position elements are measured in viewport coordinates, the rest in page coordinates. */
  fixed: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Current and last-written offset. */
  cx: number;
  cy: number;
  lx: number;
  ly: number;
}

const enabled = finePointer && !reduced;
let targets: Target[] = [];

export function refreshMagnets(): void {
  if (!enabled) return;
  for (const t of targets) t.el.style.translate = '';

  targets = qsa<HTMLElement>('a[href],button,[data-mag]')
    .filter(
      (el) =>
        !el.closest('#hud') && !el.classList.contains('skipnav') && !el.classList.contains('gone'),
    )
    .flatMap((el): Target[] => {
      const r = el.getBoundingClientRect();
      if (!r.width || r.width > MOTION.MAG_MAX_W || r.height > MOTION.MAG_MAX_H) return [];
      const fixed = !!el.closest('.nav,.dock,.skip');
      return [
        {
          el,
          fixed,
          x: r.left + (fixed ? 0 : scrollX),
          y: r.top + (fixed ? 0 : scrollY),
          w: r.width,
          h: r.height,
          cx: 0,
          cy: 0,
          lx: 0,
          ly: 0,
        },
      ];
    });
}

/** Keep the measurements fresh. */
export function bindMagnetRefresh(): void {
  if (!enabled) return;
  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      refreshMagnets();
    });
  };
  addEventListener('resize', queue);
  addEventListener('load', queue);
  const main = document.getElementById('top');
  if (main && window.ResizeObserver) new ResizeObserver(queue).observe(main);
  document.fonts?.ready.then(queue);
}

/** Per frame. */
export function stepMagnets(): void {
  if (!enabled || !targets.length) return;
  const { MAG_REACH, MAG_PULL, MAG_MAX, MAG_EASE } = MOTION;
  const sx = scrollX;
  const sy = scrollY;

  for (const t of targets) {
    const left = t.fixed ? t.x : t.x - sx;
    const top = t.fixed ? t.y : t.y - sy;
    const dx = Math.max(left - pointer.x, 0, pointer.x - (left + t.w));
    const dy = Math.max(top - pointer.y, 0, pointer.y - (top + t.h));
    const strength = pointer.on ? Math.max(0, 1 - Math.hypot(dx, dy) / MAG_REACH) : 0;

    const goalX = strength
      ? Math.max(-MAG_MAX, Math.min(MAG_MAX, (pointer.x - (left + t.w / 2)) * MAG_PULL * strength))
      : 0;
    const goalY = strength
      ? Math.max(-MAG_MAX, Math.min(MAG_MAX, (pointer.y - (top + t.h / 2)) * MAG_PULL * strength))
      : 0;

    t.cx += (goalX - t.cx) * MAG_EASE;
    t.cy += (goalY - t.cy) * MAG_EASE;

    if (Math.abs(t.cx - t.lx) > 0.05 || Math.abs(t.cy - t.ly) > 0.05) {
      t.lx = t.cx;
      t.ly = t.cy;
      t.el.style.translate =
        Math.abs(t.cx) < 0.05 && Math.abs(t.cy) < 0.05
          ? ''
          : `${t.cx.toFixed(2)}px ${t.cy.toFixed(2)}px`;
    }
  }
}
