import { MOTION } from '../../config/motion';
import { clamp, qsa, smooth } from '../../core/dom';
import type { Heading } from './types';

/**
 * Engine B (opt-in: ?engine=b or the HUD). Glyph widths along the morph are sampled once into a
 * table; after that nothing is measured. Letters sit absolutely inside their word and are
 * positioned by summing interpolated widths, so a frame is pure arithmetic + writes.
 */

/** Samples along the 0→1 morph. */
const SAMPLES = 9;

/** font-variation-settings for a morph position t ∈ [0,1]. */
export const variation = (h: Heading, t: number) =>
  `"wght" ${(h.w0 - (h.w0 - MOTION.W_MIN) * t).toFixed(1)},"wdth" ${(h.d0 + (h.dmax - h.d0) * t).toFixed(1)}`;

function buildWidthTable(h: Heading): void {
  const style = getComputedStyle(h.el);
  const chars = [...new Set(h.letters.map((l) => l.ch))];

  // off-screen probe at 100px so widths come out as em fractions
  const probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font-size:100px;letter-spacing:-.01em;' +
    `font-family:${style.fontFamily};text-transform:${style.textTransform}`;
  const spans = chars.map((ch) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.display = 'inline-block';
    probe.appendChild(s);
    return s;
  });
  document.body.appendChild(probe);

  const table: Record<string, number[]> = {};
  for (const ch of chars) table[ch] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const settings = variation(h, i / (SAMPLES - 1));
    spans.forEach((s) => (s.style.fontVariationSettings = settings)); // all writes…
    spans.forEach((s, n) => table[chars[n]!]!.push(s.getBoundingClientRect().width / 100)); // …then all reads
  }
  probe.remove();
  h.table = table;
}

/** Linear interpolation of a glyph's width (em) at morph position k. */
function widthAt(h: Heading, ch: string, k: number): number {
  const row = h.table![ch]!;
  const pos = k * (SAMPLES - 1);
  const i = Math.min(SAMPLES - 2, pos | 0);
  const f = pos - i;
  return row[i]! * (1 - f) + row[i + 1]! * f;
}

/** Position every letter of every word; writes only letters that actually changed. */
export function layoutLines(h: Heading, force: boolean): number {
  let writes = 0;
  for (const line of h.lines!) {
    let total = 0;
    for (const l of line.letters) {
      l.wpx = widthAt(h, l.ch, l.ck) * h.fontSize;
      total += l.wpx;
    }
    let offset = line.rightAligned ? line.rect.width - total : 0;
    for (const l of line.letters) {
      l.cx = line.rect.left + offset + l.wpx / 2;
      l.cy = line.rect.top + line.rect.height / 2;
      if (force || Math.abs(l.ck - l.lk) > 0.002 || Math.abs(offset - l.lx) > 0.3) {
        l.lk = l.ck;
        l.lx = offset;
        l.el.style.fontVariationSettings = variation(h, l.ck);
        l.el.style.transform = `translate3d(${offset.toFixed(2)}px,0,0)`;
        writes++;
      }
      offset += l.wpx;
    }
  }
  return writes;
}

/** Switch a heading over to engine B (needs web fonts loaded so widths are right). */
export function enableEngineB(h: Heading): void {
  buildWidthTable(h);
  h.lines = qsa<HTMLElement>('.w', h.el).map((word, i, all) => ({
    word,
    letters: h.letters.filter((l) => l.el.parentNode === word),
    rightAligned: h.el.id === 'heroName' && i === all.length - 1,
    rect: { left: 0, top: 0, width: 0, height: 0 },
  }));
  h.el.classList.add('bm');
}

/** Engine B frame step. px/py are page-space. */
export function stepEngineB(
  h: Heading,
  px: number,
  py: number,
  radius: number,
  near: boolean,
): number {
  let moving = false;
  for (const line of h.lines!) {
    for (const l of line.letters) {
      let influence = 0;
      if (near) influence = smooth(clamp(1 - Math.hypot(l.cx - px, l.cy - py) / radius, 0, 1));
      l.ck += (influence - l.ck) * MOTION.EASE;
      if (Math.abs(l.ck - influence) > 0.004) moving = true;
    }
  }
  h.busy = moving;
  return layoutLines(h, false);
}
