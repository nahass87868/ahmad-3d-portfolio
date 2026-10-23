import { MOTION } from '../../config/motion';
import { headingEngine, reduced } from '../../core/env';
import { headings } from './state';
import type { Heading, Letter } from './types';

/**
 * Replace a heading's text with:
 *   <span.sr>Full text</span>                         (screen readers)
 *   <span.w aria-hidden><span.l>A</span>…</span> …    (one span per word, one per letter)
 */
export function splitHeading(el: HTMLElement): Heading {
  const text = (el.textContent ?? '').trim();
  const words = text.split(' ');
  const w0 = Number(el.dataset.w0) || MOTION.W_REST;
  const dmax = Number(el.dataset.dmax) || MOTION.D_MAX;
  const d0 = MOTION.D_REST;

  el.dataset.split = '1';
  el.textContent = '';
  el.style.setProperty('--w0', String(w0));
  el.style.setProperty('--d0', String(d0));

  const sr = document.createElement('span');
  sr.className = 'sr';
  sr.textContent = text;
  el.appendChild(sr);

  const letters: Letter[] = [];
  let n = 0;
  words.forEach((word, wi) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'w';
    wordEl.setAttribute('aria-hidden', 'true');

    for (const ch of word) {
      const l = document.createElement('span');
      l.className = 'l';
      l.textContent = ch;
      // stagger for the stroke → fill reveal (typography.css reads --d and --f)
      l.style.setProperty('--d', (n * MOTION.STROKE_STAGGER) / 1000 + 's');
      l.style.setProperty('--f', (n * MOTION.FILL_STAGGER) / 1000 + 's');
      n++;
      wordEl.appendChild(l);
      letters.push({
        el: l,
        ch,
        cw: w0,
        cd: d0,
        lw: w0,
        ld: d0,
        x: 0,
        y: 0,
        ck: 0,
        lk: -1,
        lx: 0,
        cx: 0,
        cy: 0,
        wpx: 0,
      });
    }
    el.appendChild(wordEl);
    if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
  });

  const heading: Heading = {
    el,
    letters,
    index: headings.length,
    visible: false,
    fontSize: 100,
    busy: false,
    w0,
    d0,
    dmax,
    engineB: headingEngine === 'b' && !reduced && (el.id === 'heroName' || el.tagName === 'H2'),
    table: null,
    lines: null,
    pageRect: { left: 0, top: 0, width: 1, height: 1 },
  };
  headings.push(heading);
  return heading;
}
