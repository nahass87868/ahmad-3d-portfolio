import { qsa } from '../core/dom';
import { reduced } from '../core/env';

/** Max elements staggered per batch, and the gap between them (ms). Keeps a full grid from feeling slow. */
const STAGGER_MAX = 5;
const STAGGER_MS = 50;

/** Fade/slide `.rv` elements in once as they enter the viewport. Elements revealed together cascade. */
export function initReveal(root: ParentNode): () => void {
  const items = qsa('.rv', root);
  if (reduced) {
    items.forEach((el) => el.classList.add('in'));
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      let n = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.transitionDelay = `${Math.min(n++, STAGGER_MAX) * STAGGER_MS}ms`;
        el.classList.add('in');
        io.unobserve(el);
      }
    },
    { threshold: 0.15 },
  );
  items.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
