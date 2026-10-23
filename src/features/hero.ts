import { MOTION } from '../config/motion';
import { must, qs } from '../core/dom';
import { reduced } from '../core/env';

/**
 * The hero sequence on the home page:
 *   name outline draws → ink wipes up through it → tagline types in → "Skip intro" fades away.
 * `data-ready="1"` on <html> marks the end of the sequence (handy for screenshots/tests).
 */

let typeToken = 0;
let timers: ReturnType<typeof setTimeout>[] = [];

const later = (fn: () => void, ms: number) => {
  timers.push(setTimeout(fn, ms));
};
const clearTimers = () => {
  timers.forEach(clearTimeout);
  timers = [];
};

const markReady = () => {
  document.documentElement.dataset.ready = '1';
};
const hideSkip = () => qs('#skip')?.classList.add('gone');

/** Show the whole tagline at once. */
function showTagline(): void {
  const typed = qs('#tagv');
  const tag = qs('#tag');
  if (!typed || !tag) return;
  typeToken++; // cancels a typing run in progress
  typed.textContent = tag.dataset.text ?? '';
}

/** Type the tagline in, one character at a time. */
function typeTagline(): void {
  const typed = qs('#tagv');
  const tag = qs('#tag');
  if (!typed || !tag) return;
  const token = ++typeToken;
  const text = tag.dataset.text ?? '';
  let n = 0;
  (function step() {
    if (token !== typeToken) return;
    typed.textContent = text.slice(0, ++n);
    if (n < text.length) setTimeout(step, MOTION.TYPE_MS);
  })();
}

/** Jump straight to the finished state. */
function snap(): void {
  const hero = qs('#heroName');
  document.body.classList.add('go');
  hero?.classList.add('snap', 'stroke', 'on');
  showTagline();
  hideSkip();
  markReady();
}

/** First load of the home page: play the full sequence. */
export function heroIntro(): void {
  const hero = must('#heroName');
  const body = document.body;

  if (reduced) {
    hero.classList.add('stroke', 'on');
    body.classList.add('go');
    showTagline();
    hideSkip();
    markReady();
    return;
  }

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      body.classList.add('go');
      hero.classList.add('stroke');
    }),
  );
  later(() => hero.classList.add('on'), MOTION.FILL_MS);
  later(typeTagline, MOTION.FILL_MS + 300);
  later(hideSkip, MOTION.INTRO_END_MS);
  later(markReady, MOTION.INTRO_END_MS + 700);

  must('#skip').addEventListener('click', () => {
    clearTimers(); // otherwise the tagline would start typing again after the skip
    snap();
  });
}

/** Navigating back to the home page from another page: no sequence, just the finished hero. */
export function heroSnap(): void {
  clearTimers();
  snap();
}

/** Any page other than home. */
export function pageReady(): void {
  hideSkip();
  setTimeout(markReady, reduced ? 0 : MOTION.HOLD_MS + 1500);
}
