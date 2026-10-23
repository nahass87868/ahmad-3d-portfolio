import { must } from '../core/dom';
import { finePointer } from '../core/env';
import { pointer } from '../core/pointer';

/**
 * Crosshair + X/Y read-out that follows the mouse (and shows briefly under a finger on touch).
 * Over links/buttons the dot becomes a ring labelled by the element's `data-cur`.
 */
let lines: HTMLElement;
let hLine: HTMLElement;
let vLine: HTMLElement;
let cursor: HTMLElement;
let label: HTMLElement;
let hoverLabel = '';
let shownLabel = '';
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const root = document.documentElement;
const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, '0');

export function initCursor(): void {
  lines = must('#cl');
  cursor = must('#cur');
  hLine = lines.children[0] as HTMLElement;
  vLine = lines.children[1] as HTMLElement;
  label = must('#cx');

  if (finePointer) {
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'mouse') root.classList.add('cur-on', 'fine');
      },
      { passive: true },
    );
    root.addEventListener('mouseleave', () => root.classList.remove('cur-on'));
    document.addEventListener('pointerover', (e) => {
      const target = (e.target as Element | null)?.closest?.<HTMLElement>('[data-cur],a,button');
      hoverLabel = target ? target.dataset.cur || 'Go' : '';
      cursor.classList.toggle('hov', !!target);
    });
  } else {
    addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType !== 'touch') return;
        clearTimeout(hideTimer);
        root.classList.add('cur-on');
      },
      { passive: true },
    );
    addEventListener(
      'pointerup',
      () => {
        hideTimer = setTimeout(() => root.classList.remove('cur-on'), 700);
      },
      { passive: true },
    );
  }
}

/** Per frame. */
export function updateCursor(): void {
  if (!root.classList.contains('cur-on')) return;
  const { x, y } = pointer;

  hLine.style.transform = `translate3d(0,${y}px,0)`;
  vLine.style.transform = `translate3d(${x}px,0,0)`;
  cursor.style.transform = `translate3d(${x}px,${y}px,0)`;

  const text = hoverLabel || `X ${pad(x)} · Y ${pad(y)}`;
  if (text !== shownLabel) {
    label.textContent = text;
    shownLabel = text;
  }
  // flip the read-out to the other side of the dot near the right / bottom edges
  cursor.classList.toggle('fx', x > innerWidth - 190);
  cursor.classList.toggle('fy', y > innerHeight - 50);
}
