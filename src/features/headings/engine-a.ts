import { MOTION } from '../../config/motion';
import { clamp, smooth } from '../../core/dom';
import { reduced } from '../../core/env';
import type { Near } from './types';

/**
 * Engine A (default). Each letter's weight and width axes ease toward a target set by its distance
 * from the pointer. Letter centres are read from the DOM (one batched read pass for the frame, then
 * writes), so it stays correct whatever the heading's layout is.
 * Returns how many letters were written.
 */
export function stepEngineA({ heading, px, py, radius, near }: Near): number {
  const { EASE, W_MIN, CALM_W_MIN } = MOTION;
  let moving = false;
  let writes = 0;

  for (const letter of heading.letters) {
    let influence = 0;
    if (near)
      influence = smooth(clamp(1 - Math.hypot(letter.x - px, letter.y - py) / radius, 0, 1));

    // reduced motion: narrower weight range, and no width change
    const weightFloor = reduced ? CALM_W_MIN : W_MIN;
    const targetW = heading.w0 - (heading.w0 - weightFloor) * influence;
    const targetD = reduced ? heading.d0 : heading.d0 + (heading.dmax - heading.d0) * influence;

    letter.cw += (targetW - letter.cw) * EASE;
    letter.cd += (targetD - letter.cd) * EASE;

    if (Math.abs(letter.cw - targetW) > 0.4 || Math.abs(letter.cd - targetD) > 0.2) moving = true;

    if (Math.abs(letter.cw - letter.lw) > 0.3 || Math.abs(letter.cd - letter.ld) > 0.15) {
      letter.lw = letter.cw;
      letter.ld = letter.cd;
      letter.el.style.fontVariationSettings = `"wght" ${letter.cw.toFixed(1)},"wdth" ${letter.cd.toFixed(1)}`;
      writes++;
    }
  }
  heading.busy = moving;
  return writes;
}
