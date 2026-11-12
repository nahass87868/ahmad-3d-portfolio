/*
 * hero-fallback.js — lightweight, always-available hero composition.
 * Keeps the designed hero layout and faint PORT / FOLIO backdrop when WebGL
 * is unavailable, Data Saver is enabled, the network is too slow, hardware is
 * limited, or the 3D scene fails. No Three.js dependency or animation loop.
 */
const BREAKPOINT = 900;
const NAME_FIT = 0.92;
const NAME_ONE_LINE_EM = 6.196;
const NAME_TWO_LINE_EM = 3.178;
const PAGE_PAD = 36;
const SCROLLBAR_RESERVE = 20;
const REGION_H_WIDE = 'clamp(300px, 50svh, 540px)';
const REGION_H_NARROW = 'clamp(230px, 34svh, 330px)';

const GHOST_HTML = '<div class="x-ghost"><div>Port</div><div>Folio</div></div>';
const FALLBACK_CSS = `
:root { --x-ghost: rgba(255,255,255,.045); }
:root[data-theme="light"] { --x-ghost: rgba(20,19,16,.045); }

/* The fallback uses the same measured name layout and reserved 3D stage as the full hero. */
html .hero .px:before, html .hero .px:after { display: none; }
html .hero #heroName { text-align: center; margin-top: auto; }
html .hero .px .w:last-of-type { text-align: center; }
@media (min-width: ${BREAKPOINT}px) {
  html .hero #heroName { font-size: var(--x-fs, calc((100vw - ${PAGE_PAD + SCROLLBAR_RESERVE}px) * ${NAME_FIT} / ${NAME_ONE_LINE_EM})); }
  html .hero .px .w { display: inline-block; }
}
@media (max-width: ${BREAKPOINT - 1}px) {
  html .hero #heroName { font-size: var(--x-fs, calc((100vw - ${PAGE_PAD + SCROLLBAR_RESERVE}px) * ${NAME_FIT} / ${NAME_TWO_LINE_EM})); }
}
.x-h3d.x-fallback {
  position: relative;
  flex: 0 0 auto;
  height: 34vh;
  height: clamp(230px, 34vh, 330px);
  height: ${REGION_H_NARROW};
  margin-bottom: auto;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
@media (min-width: ${BREAKPOINT}px) {
  .x-h3d.x-fallback { height: 50vh; height: clamp(300px, 50vh, 540px); height: ${REGION_H_WIDE}; }
}
/* Also supply the same legacy viewport-unit fallback to the upgraded 3D region. */
.x-h3d:not(.x-fallback) { height: 34vh; height: clamp(230px, 34vh, 330px); height: ${REGION_H_NARROW}; }
@media (min-width: ${BREAKPOINT}px) {
  .x-h3d:not(.x-fallback) { height: 50vh; height: clamp(300px, 50vh, 540px); height: ${REGION_H_WIDE}; }
}
.x-h3d.x-fallback .x-ghost {
  opacity: 1;
  position: absolute;
  inset: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: var(--font-display);
  font-weight: 900;
  line-height: .82;
  letter-spacing: -.04em;
  white-space: nowrap;
  text-transform: uppercase;
  color: var(--x-ghost);
  pointer-events: none;
}
/* Once the 3D region takes over, keep its matching ghost text visible behind the canvas. */
.hero .x-h3d .x-ghost.x-static {
  opacity: 1 !important;
  transition: none !important;
}
`;

let fallbackStyle;
let fallbackRegion;
let observedHero;
let heroObserver;
let resizeObserver;
let resizeFrame = 0;
let resizeBound = false;

function ensureFallbackStyle() {
  if (!fallbackStyle) {
    fallbackStyle = document.createElement('style');
    fallbackStyle.id = 'hero-fallback-css';
    fallbackStyle.textContent = FALLBACK_CSS;
  }
  if (!fallbackStyle.isConnected) document.head.appendChild(fallbackStyle);
}

function sizeGhost(region = fallbackRegion) {
  if (!region || !region.isConnected) return;
  const ghost = region.querySelector('.x-ghost');
  if (!ghost) return;
  const width = region.clientWidth;
  const height = region.clientHeight;
  if (!width || !height) return;
  ghost.style.fontSize = Math.min(height * 0.5, (width * 0.9) / 3.1) + 'px';
}

function fitName(hero) {
  const h1 = hero && hero.querySelector('#heroName');
  if (!hero || !h1) return;
  const cs = getComputedStyle(hero);
  const available = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const twoLines = !matchMedia('(min-width: ' + BREAKPOINT + 'px)').matches;
  const sr = h1.querySelector('.sr');
  const text = ((sr ? sr.textContent : h1.textContent) || '').trim();
  if (!(available > 40) || !text) return;

  const probe = document.createElement('div');
  probe.className = 'px x-probe';
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;font-size:100px;width:max-content;max-width:none;margin:0;padding:0;' +
    '--w0:' + (h1.style.getPropertyValue('--w0') || 860) + ';--d0:' + (h1.style.getPropertyValue('--d0') || 68);
  text.split(' ').forEach((word, index, words) => {
    const span = document.createElement('span');
    span.className = 'w';
    for (const character of word) {
      const letter = document.createElement('span');
      letter.className = 'l';
      letter.textContent = character;
      span.appendChild(letter);
    }
    probe.appendChild(span);
    if (index < words.length - 1) probe.appendChild(document.createTextNode(' '));
  });
  document.body.appendChild(probe);
  const width = twoLines
    ? Math.max(...Array.from(probe.querySelectorAll('.w')).map((el) => el.getBoundingClientRect().width))
    : probe.getBoundingClientRect().width;
  probe.remove();
  if (width > 0) h1.style.setProperty('--x-fs', ((available * NAME_FIT) / (width / 100)).toFixed(2) + 'px');
}

function sizeFallback(hero) {
  sizeGhost();
  fitName(hero);
}

function queueSizeFallback() {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    if (observedHero) sizeFallback(observedHero);
  });
}

function mountIntoHero(hero) {
  const meta = hero.querySelector('.hmeta');
  if (!meta) return null;

  ensureFallbackStyle();
  fallbackRegion = hero.querySelector('.x-h3d.x-fallback') || document.createElement('div');
  fallbackRegion.className = 'x-h3d x-fallback';
  fallbackRegion.setAttribute('aria-hidden', 'true');
  if (!fallbackRegion.querySelector('.x-ghost')) fallbackRegion.innerHTML = GHOST_HTML;
  if (!fallbackRegion.parentNode) hero.insertBefore(fallbackRegion, meta);
  sizeFallback(hero);
  return fallbackRegion;
}

function syncHeroRegion(hero) {
  const liveRegion = Array.from(hero.querySelectorAll('.x-h3d')).find((el) => !el.classList.contains('x-fallback'));
  if (liveRegion) {
    const ghost = liveRegion.querySelector('.x-ghost');
    const alreadyRevealed = document.body.classList.contains('go') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Before the intro lifts, preserve the original ghost fade. If 3D arrives after the reveal,
    // keep the backdrop visible immediately instead of briefly flashing an empty stage.
    if (ghost && alreadyRevealed) ghost.classList.add('x-static');
    if (fallbackRegion && fallbackRegion !== liveRegion && fallbackRegion.isConnected) fallbackRegion.remove();
    return;
  }
  if (!fallbackRegion || !fallbackRegion.isConnected) mountIntoHero(hero);
}

function observeHero(hero) {
  if (observedHero === hero && heroObserver) return;
  if (heroObserver) heroObserver.disconnect();
  observedHero = hero;
  heroObserver = new MutationObserver(() => syncHeroRegion(hero));
  heroObserver.observe(hero, { childList: true, subtree: true });
  syncHeroRegion(hero);

  if (typeof ResizeObserver !== 'undefined') {
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = new ResizeObserver(queueSizeFallback);
    resizeObserver.observe(hero);
  }
  if (!resizeBound) {
    window.addEventListener('resize', queueSizeFallback, { passive: true });
    resizeBound = true;
  }
  const h1 = hero.querySelector('#heroName');
  if (h1) new MutationObserver(() => fitName(hero)).observe(h1, { attributes: true, attributeFilter: ['data-split'], childList: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => sizeFallback(hero));
}

/** Mounts the fallback before optional Three.js and model files are requested. */
export function mountHeroFallback() {
  return new Promise((resolve) => {
    let settled = false;
    let observer;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (observer) observer.disconnect();
      resolve(value);
    };
    const tryMount = () => {
      const hero = document.querySelector('.hero');
      if (!hero || !hero.querySelector('.hmeta')) return false;
      const region = mountIntoHero(hero);
      observeHero(hero);
      finish(region);
      return true;
    };

    if (tryMount()) return;
    observer = new MutationObserver(() => tryMount());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // Never hold the loading curtain indefinitely if the classic page renderer fails.
    setTimeout(() => finish(null), 15000);
  });
}
