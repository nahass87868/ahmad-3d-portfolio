import { clamp, must, qs, qsa } from '../core/dom';

/**
 * Blender-style "viewport shading" easter egg.
 *
 *   • a toolbar in the header: Wireframe · Solid · Material · Rendered (+ pause motion while rendered)
 *   • hold Z (or Ctrl/Cmd+Z): a pie menu at the pointer. Flick ← → ↓ ↑, or tap 4 6 2 8 / arrow keys
 *   • any mode other than "Rendered", or paused, switches the page's motion off (html.vp-off)
 *
 * Styling lives in styles/viewport.css; html[data-vp] carries the current mode.
 */

type ShadingMode = 'wire' | 'solid' | 'mat' | 'ren';

interface ModeInfo {
  key: ShadingMode;
  name: string;
  /** Numpad-style hotkey shown in the menu. */
  hotkey: number;
  /** Position in the pie: West / East / South / North. */
  slot: 'W' | 'E' | 'S' | 'N';
}

const MODES: readonly ModeInfo[] = [
  { key: 'wire', name: 'Wireframe', hotkey: 4, slot: 'W' },
  { key: 'solid', name: 'Solid', hotkey: 6, slot: 'E' },
  { key: 'mat', name: 'Material Preview', hotkey: 2, slot: 'S' },
  { key: 'ren', name: 'Rendered', hotkey: 8, slot: 'N' },
];

const HOTKEYS: Record<string, ShadingMode> = {
  '4': 'wire',
  '6': 'solid',
  '2': 'mat',
  '8': 'ren',
  ArrowLeft: 'wire',
  ArrowRight: 'solid',
  ArrowDown: 'mat',
  ArrowUp: 'ren',
};

const svg = (body: string) => `<svg viewBox="0 0 16 16" aria-hidden="true">${body}</svg>`;
const ICONS: Record<ShadingMode, string> = {
  wire: svg(
    '<circle cx="8" cy="8" r="6"/><ellipse cx="8" cy="8" rx="2.6" ry="6"/><path d="M2 8h12"/>',
  ),
  solid: svg('<circle cx="8" cy="8" r="6" fill="currentColor"/>'),
  mat: svg('<circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 0 0 12z" fill="currentColor"/>'),
  ren: svg('<circle cx="8" cy="8" r="6"/><circle cx="6" cy="6" r="2" fill="currentColor"/>'),
};

/** Holding Z longer than this (ms) and releasing picks the highlighted entry; a quick tap leaves the menu open. */
const HOLD_MS = 220;
/** Pointer must leave this radius (px) around the menu centre before an entry is highlighted. */
const DEAD_ZONE = 28;

const root = document.documentElement;

let mode: ShadingMode = 'ren';
let paused = false;
let menuOpen = false;
let selected: ShadingMode | null = null;
let openedAt = 0;
let px = innerWidth / 2;
let py = innerHeight / 2;
let cx = 0;
let cy = 0;

/** True when the page should be still: any non-rendered mode, or paused. */
export const viewportOff = (): boolean => mode !== 'ren' || paused;

export function initViewport(): void {
  // ── toolbar ──
  const toolbar = document.createElement('div');
  toolbar.className = 'vpt';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Viewport shading');
  toolbar.innerHTML =
    MODES.map(
      (m) =>
        `<button type="button" data-k="${m.key}" title="${m.name} (Z)" aria-label="${m.name}">${ICONS[m.key]}</button>`,
    ).join('') +
    '<button type="button" class="vpz" title="Pause motion" aria-label="Pause motion">||</button>';
  must('.nav').appendChild(toolbar);

  // ── overlay text (visible outside Rendered) ──
  const hint = document.createElement('div');
  hint.className = 'vph mono';
  document.body.appendChild(hint);

  // ── pie menu ──
  const pie = document.createElement('div');
  pie.id = 'vpie';
  pie.hidden = true;
  pie.setAttribute('role', 'menu');
  pie.innerHTML =
    '<div class="pc">' +
    MODES.map(
      (m) =>
        `<button type="button" role="menuitem" class="pi ${m.slot}" data-k="${m.key}">${ICONS[m.key]}<span>${m.name}</span><em>${m.hotkey}</em></button>`,
    ).join('') +
    '<div class="pd"><b>Shading</b><i></i></div></div>';
  document.body.appendChild(pie);
  const pieCentre = pie.firstElementChild as HTMLElement;

  // ── state → DOM ──
  function apply(): void {
    root.dataset.vp = mode;
    root.classList.toggle('vp-off', viewportOff());

    if (viewportOff()) {
      qsa('video').forEach((v) => (v as HTMLVideoElement).pause());
      if (mode !== 'ren') qs('#skip')?.click(); // finish the intro sequence immediately
    }

    const current = MODES.find((m) => m.key === mode)!;
    qsa('[data-k]', toolbar).forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.k === mode)),
    );
    toolbar.querySelector('.vpz')?.setAttribute('aria-pressed', String(paused));
    qsa('.pi', pie).forEach((b) => b.toggleAttribute('aria-current', b.dataset.k === mode));
    hint.innerHTML = `User Perspective<br>(1) Collection | Portfolio<br><b>${current.name} shading</b>`;
    const live = qs('#live');
    if (live) live.textContent = `${current.name} viewport shading`;
  }

  const setMode = (next: ShadingMode) => {
    mode = next;
    apply();
  };

  toolbar.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLElement>('button');
    if (!button) return;
    if (button.classList.contains('vpz')) {
      paused = !paused;
      apply();
    } else setMode(button.dataset.k as ShadingMode);
  });

  // ── pie menu behaviour ──
  const pick = (x: number, y: number): ShadingMode | null => {
    const dx = x - cx;
    const dy = y - cy;
    if (Math.hypot(dx, dy) < DEAD_ZONE) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'wire' : 'solid') : dy < 0 ? 'ren' : 'mat';
  };

  const highlight = () => {
    selected = pick(px, py);
    qsa('.pi', pie).forEach((b) => b.classList.toggle('hv', b.dataset.k === selected));
  };

  const open = () => {
    if (menuOpen) return;
    menuOpen = true;
    openedAt = Date.now();
    // keep the whole menu on screen
    cx = clamp(px, 150, innerWidth - 150);
    cy = clamp(py, 110, innerHeight - 110);
    pieCentre.style.left = cx + 'px';
    pieCentre.style.top = cy + 'px';
    pie.hidden = false;
    highlight();
  };

  const close = (choose?: ShadingMode | null) => {
    if (!menuOpen) return;
    menuOpen = false;
    pie.hidden = true;
    if (choose) setMode(choose);
  };

  /*
   * Pointer tracking runs in the CAPTURE phase on window, ahead of every other listener. While the
   * page is "off" (or the menu is open) it also stops the event, so the cursor, magnetic controls,
   * heading morph and card drift receive nothing and the page goes still.
   */
  for (const type of ['pointermove', 'mousemove'] as const) {
    addEventListener(
      type,
      (e) => {
        px = e.clientX;
        py = e.clientY;
        if (menuOpen) highlight();
        if (viewportOff() || menuOpen) e.stopImmediatePropagation();
      },
      true,
    );
  }

  pie.addEventListener('click', (e) => {
    const item = (e.target as Element).closest<HTMLElement>('.pi');
    close(item ? (item.dataset.k as ShadingMode) : selected);
  });
  pie.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    close();
  });

  addEventListener(
    'keydown',
    (e) => {
      const target = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;

      if (menuOpen) {
        if (e.key === 'Escape') {
          close();
          e.preventDefault();
        } else if (HOTKEYS[e.key]) {
          close(HOTKEYS[e.key]);
          e.preventDefault();
        }
        return;
      }
      if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (!e.repeat) open();
      }
    },
    true,
  );

  addEventListener(
    'keyup',
    (e) => {
      if (
        menuOpen &&
        ['z', 'Z', 'Control', 'Meta'].includes(e.key) &&
        Date.now() - openedAt > HOLD_MS
      ) {
        close(selected);
      }
    },
    true,
  );
  addEventListener('blur', () => close());

  apply();
}
