/*
 * polish.js — isolated add-on: calmer cards and grid, a clean phone header, and Apple-style motion.
 * It never edits script.js, style.css, extras.js, fixes.js, about-photo.js or hero-3d.js. It only ADDS one <style>,
 * a few small elements (menu button, appearance button, menu sheet) and listeners.
 *
 * NOT touched, on purpose: the heading letter morph (text proximity), the custom cursor, the magnetic controls,
 * and the card drift. Those keep running exactly as before.
 *
 * Switch everything off: POLISH.enabled = false (or delete the <script src="polish.js"> line in index.html).
 * Each part also has its own flag below.
 */
(() => {
  'use strict';

  const POLISH = {
    enabled: true, // MASTER SWITCH. false = this file does nothing at all.
    type: true, // phones: sentence case for readable text, 13px minimum
    cards: true, // clean cards: image, then title and one muted line (no badges, arrows, scrim, brackets, glow)
    grid: true, // calmer rhythm: five featured rows, then an even grid
    phoneHeader: true, // phones: Menu button + sheet, one Appearance button instead of the dock
    scrollMotion: true, // one gentle fade + rise, played once
    imageZoom: true, // desktop: a very slight image zoom while scrolling
    cardLift: true, // soft lift on hover (the existing press-down on tap stays)
    viewTransition: true, // tapping a card expands its image into the project (falls back to the normal slide-up)
    swipeClose: true, // phones: swipe the project sheet down to close it
  };

  const T = {
    PHONE: 720, // px: at and below = phone layout. Same value your own phone styles use.
    DESKTOP: 900, // px: at and above = desktop grid (same as your work grid)
    FEATURED: ['realistic-ice', 'booth-design', 'youth-affairs-logo-animation', 'asus-product-animation', 'vellum-simulation'],
    RISE_PX: 12, // scroll motion: how far an item rises while fading in
    ZOOM: 0.06, // desktop image zoom over the card's trip through the screen (0.06 = 6%)
    LIFT_PX: 6, // desktop hover lift
    RADIUS: 12, // card image corner radius, px
    SWIPE_CLOSE_PX: 110, // how far to pull the project sheet down to close it
  };

  if (!POLISH.enabled) return;

  const root = document.documentElement;
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const safely = (name, fn) => { try { fn(); } catch (e) { console.warn('[polish] "' + name + '" skipped:', e); } };
  function whenReady(sel, fn) {
    if ($(sel)) return fn();
    const mo = new MutationObserver(() => { if (!$(sel)) return; mo.disconnect(); fn(); });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 15000);
  }

  /* ══════════════════════════════ CSS ══════════════════════════════ */
  const P = T.PHONE, D = T.DESKTOP;
  let css = '';

  if (POLISH.type) css += `
@media (max-width: ${P}px) {
  .mono { font-size: 13px; letter-spacing: .01em; }
  .hmeta, .foot, .note { text-transform: none; }
  .chip { font-size: 13px; flex: 0 0 auto; }
  html .nav > a { font-size: 15px; }
  /* the filter chips become one swipeable row instead of four wrapped lines */
  .chips { flex-wrap: nowrap; overflow-x: auto; margin-left: -18px; margin-right: -18px; padding: 0 18px; scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
}`;

  /* accent only for active states: the section label squares go muted */
  css += `.lab:before { background: var(--mut); }`;

  if (POLISH.cards) css += `
/* ── clean cards: image, then title and one muted line ── */
html #grid { display: grid; grid-template-columns: 1fr; grid-auto-rows: auto; gap: 36px; align-items: start; }
html #grid .tile { grid-column: auto; grid-row: auto; height: auto; }
html #grid .tile > a { display: block; height: auto; overflow: visible; background: none; border: 0; color: var(--ink); }
html #grid .tile > a:before, html #grid .tile > a:after, html #grid .tile .th:before, html #grid .tile .th:after { display: none; }
html #grid .th { position: relative; inset: auto; aspect-ratio: 1 / 1; border-radius: ${T.RADIUS}px; border: 1px solid var(--line); }
html #grid .tile > a > h3 { position: static; display: block; margin: 14px 0 4px; font-size: 20px; font-weight: 600; line-height: 1.2; letter-spacing: -.01em; color: var(--ink); }
html #grid .tile > a > h3:after { display: none; }
html #grid .tile > a > p { position: static; margin: 0; padding: 0; border: 0; font: 400 14px/1.4 var(--font-sans); letter-spacing: 0; text-transform: none; color: var(--mut); }
/* the MOTION tag becomes a small play mark */
html #grid .mot { font-size: 0; width: 30px; height: 30px; padding: 0; border-radius: 50%; border: 0; -webkit-backdrop-filter: none; backdrop-filter: none; background: rgba(12,12,11,.5); }
html #grid .mot:after { content: ''; position: absolute; left: 12px; top: 9px; border-style: solid; border-width: 6px 0 6px 10px; border-color: transparent transparent transparent #f2eee6; }
html #grid .tile .th img.cov { scale: var(--x-z, 1); }
@media (max-width: ${P}px) { html #grid .tile.x-f .th { aspect-ratio: 4 / 5; } }
@media (min-width: ${P + 1}px) and (max-width: ${D - 1}px) {
  html #grid { grid-template-columns: repeat(2, 1fr); gap: 40px 20px; }
  html #grid .th { aspect-ratio: 4 / 5; }
}`;

  if (POLISH.grid && POLISH.cards) css += `
@media (min-width: ${D}px) {
  html #grid { grid-template-columns: repeat(12, 1fr); gap: 56px 24px; --x-row: clamp(300px, 31vw, 520px); }
  html #grid .tile { grid-column: span 4; }
  html #grid .th { aspect-ratio: 4 / 3; }
  /* three featured rows, every one a big + a smaller card side by side (no card runs full width) */
  html #grid:not(.x-filtered) .tile.x-f1, html #grid:not(.x-filtered) .tile.x-f3, html #grid:not(.x-filtered) .tile.x-f5 { grid-column: span 7; }
  html #grid:not(.x-filtered) .tile.x-f2, html #grid:not(.x-filtered) .tile.x-f4, html #grid:not(.x-filtered) .tile.x-f6 { grid-column: span 5; }
  html #grid:not(.x-filtered) .tile.x-f .th { aspect-ratio: auto; height: var(--x-row); }
  html #grid:not(.x-filtered) .tile.x-f > a > h3 { font-size: 28px; }
}`;

  if (POLISH.cardLift && POLISH.cards) css += `
@media (hover: hover) and (pointer: fine) {
  html #grid .tile > a { transition: transform .4s var(--ease-out), translate .5s var(--ease-out); }
  html #grid .tile > a:hover { translate: 0 -${T.LIFT_PX}px; }
}`;

  if (POLISH.scrollMotion) css += `
/* one gentle fade + rise, played once: it stays visible after it has appeared */
.js [data-sa] { transform: translate3d(0, ${T.RISE_PX}px, 0); }
.js [data-sa].sa-above { opacity: 1; transform: none; }
.js [data-sa].x-seen { opacity: 1; transform: none; }`;

  if (POLISH.viewTransition) css += `
::view-transition-group(x-hero) { animation-duration: .6s; animation-timing-function: cubic-bezier(.2,.7,.1,1); }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .4s; }`;

  if (POLISH.phoneHeader) css += `
/* shading toolbar: desktop only */
@media (max-width: ${D - 1}px), (pointer: coarse) { .vpt { display: none !important; } }
.x-hdr { display: none; align-items: center; gap: 8px; margin-left: auto; }
.x-b { position: relative; appearance: none; display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 14px; cursor: pointer;
  font: 500 15px/1 var(--font-sans); color: var(--ink); background: none; border: 1px solid var(--line); border-radius: 999px; touch-action: manipulation;
  -webkit-user-select: none; user-select: none; }
.x-b:after { content: ''; position: absolute; inset: -4px; }
.x-b:active { opacity: .6; }
.x-b i { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid var(--ink); background: linear-gradient(90deg, var(--ink) 50%, transparent 50%); }
.x-pop { position: fixed; z-index: 62; top: calc(46px + env(safe-area-inset-top, 0px) + 8px); right: 12px; min-width: 220px; padding: 6px;
  background: var(--bg); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 14px 40px rgba(0,0,0,.35);
  opacity: 0; visibility: hidden; transform: translateY(-6px); transition: opacity .2s ease, transform .25s var(--ease-out), visibility 0s .25s; }
.x-pop.open { opacity: 1; visibility: visible; transform: none; transition: opacity .2s ease, transform .25s var(--ease-out); }
.x-pop button { appearance: none; width: 100%; display: flex; justify-content: space-between; align-items: center; min-height: 48px; padding: 0 12px; border: 0; border-radius: 10px;
  background: none; color: var(--ink); font: 400 16px/1 var(--font-sans); cursor: pointer; touch-action: manipulation; }
.x-pop button:active { background: var(--line); }
.x-pop button span { color: var(--mut); }
.x-sheet { position: fixed; inset: 0; z-index: 58; display: flex; flex-direction: column; justify-content: space-between; background: var(--bg);
  padding: calc(46px + env(safe-area-inset-top, 0px) + 28px) 24px calc(28px + env(safe-area-inset-bottom, 0px));
  opacity: 0; visibility: hidden; transition: opacity .3s ease, visibility 0s .3s; }
.x-sheet.open { opacity: 1; visibility: visible; transition: opacity .3s ease; }
.x-sheet nav a { display: block; padding: 10px 0; font: 600 40px/1.15 var(--font-sans); letter-spacing: -.02em; text-decoration: none;
  opacity: 0; transform: translateY(${T.RISE_PX}px); transition: opacity .4s ease, transform .5s var(--ease-out); }
.x-sheet.open nav a { opacity: 1; transform: none; }
.x-sheet.open nav a:nth-child(2) { transition-delay: .05s; } .x-sheet.open nav a:nth-child(3) { transition-delay: .1s; } .x-sheet.open nav a:nth-child(4) { transition-delay: .15s; }
.x-sheet .x-links { display: flex; flex-wrap: wrap; gap: 6px 22px; }
.x-sheet .x-links a { min-height: 44px; display: inline-flex; align-items: center; font: 400 16px/1 var(--font-sans); color: var(--mut); text-decoration: none; }
html.x-menu-open { overflow: hidden; }
@media (max-width: ${P}px) {
  .dock { display: none; }
  .nav nav { display: none; }
  .x-hdr { display: flex; }
}
@media (min-width: ${P + 1}px) { .x-pop, .x-sheet { display: none; } }`;

  const style = document.createElement('style');
  style.id = 'polish-css';
  style.textContent = css;
  document.head.appendChild(style);

  /* ══════════════════════════════ JS ══════════════════════════════ */

  /* featured tiles: tagged and moved to the front, in the order you gave (real DOM order = visual order, so keyboard order matches) */
  function initGrid() {
    const grid = $('#grid');
    if (!grid || !POLISH.cards) return;
    const bySlug = new Map($$('.tile', grid).map((t) => { const a = $('a[href^="#work/"]', t); return [a ? a.getAttribute('href').slice(6) : '', t]; }));
    T.FEATURED.slice().reverse().forEach((slug) => { const t = bySlug.get(slug); if (t) grid.insertBefore(t, grid.firstChild); });
    T.FEATURED.forEach((slug, i) => { const t = bySlug.get(slug); if (t) t.classList.add('x-f', 'x-f' + (i + 1)); });
    const partner = $$('.tile', grid).find((t) => !t.classList.contains('x-f')); // the 5th featured card needs a neighbour: the next project
    if (partner) partner.classList.add('x-f', 'x-f6');
    // while a category filter is on, an even grid is calmer than featured spans
    const chips = $('#chips');
    if (chips) chips.addEventListener('click', () => requestAnimationFrame(() => {
      const on = $('.chip[aria-pressed="true"]', chips);
      grid.classList.toggle('x-filtered', !!(on && on.dataset.cat));
    }));
  }

  /* scroll motion: once an item has appeared it stays; your own code still decides when it appears */
  function initScrollMotion() {
    if (!POLISH.scrollMotion) return;
    new MutationObserver((list) => {
      // the contains('x-seen') check matters: re-adding an existing class still counts as a change and would loop forever
      list.forEach((m) => {
        const t = m.target;
        if (t.hasAttribute && t.hasAttribute('data-sa') && t.classList.contains('sa-in') && !t.classList.contains('x-seen')) t.classList.add('x-seen');
      });
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  /* desktop image zoom: tiny, tied to where the card is on screen */
  function initImageZoom() {
    if (!POLISH.imageZoom || !POLISH.cards || !FINE || reduced) return;
    const vis = new Set();
    const io = new IntersectionObserver((en) => { en.forEach((e) => (e.isIntersecting ? vis.add(e.target) : vis.delete(e.target))); update(); }, { rootMargin: '10% 0px' });
    $$('.tile').forEach((t) => io.observe(t));
    let queued = false;
    function update() {
      queued = false;
      const vh = innerHeight;
      vis.forEach((t) => { const r = t.getBoundingClientRect(); const p = clamp((vh - r.top) / (vh + r.height), 0, 1); t.style.setProperty('--x-z', (1 + T.ZOOM * p).toFixed(4)); });
    }
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  }

  /* tap a card: its image expands into the project (View Transitions). No support or reduced motion: your normal slide-up runs. */
  function initViewTransition() {
    if (!POLISH.viewTransition || reduced || !document.startViewTransition) return;
    document.addEventListener('click', (e) => {
      if (e.__xvt || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('.tile > a[data-panel]');
      const th = a && $('.th', a);
      if (!th) return;
      e.preventDefault(); e.stopImmediatePropagation(); // we re-send the same click ourselves, inside the transition
      const panel = $('#panel');
      th.style.viewTransitionName = 'x-hero';
      const open = () => {
        panel.classList.add('instant'); // no slide: the transition itself is the motion
        const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, view: window });
        ev.__xvt = true;
        a.dispatchEvent(ev);
        th.style.viewTransitionName = '';
        const hm = $('.hero-media', panel);
        if (hm) { hm.style.viewTransitionName = 'x-hero'; hm.style.opacity = 1; hm.style.transform = 'none'; hm.style.transition = 'none'; }
      };
      const done = () => {
        panel.classList.remove('instant'); th.style.viewTransitionName = '';
        const hm = $('.hero-media', panel);
        if (hm) ['viewTransitionName', 'opacity', 'transform', 'transition'].forEach((p) => { hm.style[p] = ''; });
      };
      try { document.startViewTransition(open).finished.then(done, done); } catch (err) { open(); done(); }
    }, true);
  }

  /* phones: Menu button + sheet, one Appearance button (it simply presses your own mode and scheme buttons) */
  function initPhoneHeader() {
    if (!POLISH.phoneHeader) return;
    const nav = $('.nav');
    if (!nav) return;
    const hdr = document.createElement('div');
    hdr.className = 'x-hdr';
    hdr.innerHTML = '<button type="button" class="x-b" id="xApp" aria-haspopup="true" aria-expanded="false"><i></i>Appearance</button>' +
      '<button type="button" class="x-b" id="xMenu" aria-expanded="false" aria-controls="xSheet">Menu</button>';
    nav.appendChild(hdr);

    const pop = document.createElement('div');
    pop.className = 'x-pop'; pop.id = 'xPop';
    pop.innerHTML = '<button type="button" data-t="md">Mode <span></span></button><button type="button" data-t="sw">Scheme <span></span></button>';
    document.body.appendChild(pop);

    const sheet = document.createElement('div');
    sheet.className = 'x-sheet'; sheet.id = 'xSheet'; sheet.setAttribute('aria-hidden', 'true');
    const links = $$('.nav nav a').map((a) => '<a href="' + a.getAttribute('href') + '">' + a.textContent + '</a>').join('');
    const extra = $$('.foot-links a').filter((a) => !a.hasAttribute('data-panel') && !a.classList.contains('x-top')).map((a) => {
      const ext = a.target === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + a.getAttribute('href') + '"' + ext + '>' + a.textContent.trim() + '</a>';
    }).join('');
    sheet.innerHTML = '<nav aria-label="Menu">' + links + '</nav><div class="x-links">' + extra + '</div>';
    document.body.appendChild(sheet);

    const app = $('#xApp'), menu = $('#xMenu');
    const labels = () => { $('[data-t="md"] span', pop).textContent = ($('#mdName') || {}).textContent || ''; $('[data-t="sw"] span', pop).textContent = ($('#swName') || {}).textContent || ''; };
    const setPop = (on) => { pop.classList.toggle('open', on); app.setAttribute('aria-expanded', String(on)); if (on) labels(); };
    const setMenu = (on) => {
      sheet.classList.toggle('open', on); sheet.setAttribute('aria-hidden', String(!on)); root.classList.toggle('x-menu-open', on);
      menu.textContent = on ? 'Close' : 'Menu'; menu.setAttribute('aria-expanded', String(on));
      if (on) { setPop(false); const f = $('nav a', sheet); if (f) f.focus({ preventScroll: true }); }
    };
    app.addEventListener('click', () => { setMenu(false); setPop(!pop.classList.contains('open')); });
    menu.addEventListener('click', () => setMenu(!sheet.classList.contains('open')));
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const real = $(b.dataset.t === 'md' ? '#md' : '#sw'); if (real) real.click(); // your own handler does the work
      setTimeout(labels, 60);
    });
    sheet.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', (e) => { if (pop.classList.contains('open') && !e.target.closest('#xPop, #xApp')) setPop(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') { setPop(false); setMenu(false); } });
    matchMedia('(min-width: ' + (T.PHONE + 1) + 'px)').addEventListener('change', (m) => { if (m.matches) { setPop(false); setMenu(false); } });
  }

  /* phones: pull the project sheet down to close it */
  function initSwipeClose() {
    if (!POLISH.swipeClose || FINE) return;
    const panel = $('#panel');
    if (!panel) return;
    let y0 = 0, dy = 0, on = false, t0 = 0;
    const reset = (ms) => { setTimeout(() => { panel.style.transition = ''; panel.style.transform = ''; }, ms); };
    panel.addEventListener('touchstart', (e) => { on = panel.scrollTop <= 0 && e.touches.length === 1; if (on) { y0 = e.touches[0].clientY; dy = 0; t0 = e.timeStamp; } }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (!on) return;
      dy = e.touches[0].clientY - y0;
      if (dy < -6 || panel.scrollTop > 0) { on = false; return; }
      if (dy <= 0) return;
      e.preventDefault(); // we own the gesture from here
      panel.style.transition = 'none'; panel.style.transform = 'translate3d(0,' + dy * 0.9 + 'px,0)';
    }, { passive: false });
    const end = (e) => {
      if (!on) return; on = false;
      const fast = dy / (e.timeStamp - t0 + 1) > 0.6 && dy > 40;
      if (dy > T.SWIPE_CLOSE_PX || fast) {
        panel.style.transition = 'transform .25s ease-out'; panel.style.transform = 'translate3d(0,100%,0)';
        const x = $('#panelX'); if (x) x.click();
        reset(450);
      } else if (dy > 0) { panel.style.transition = 'transform .3s var(--ease-out)'; panel.style.transform = 'none'; reset(350); }
    };
    panel.addEventListener('touchend', end); panel.addEventListener('touchcancel', end);
  }

  whenReady('#grid', () => {
    safely('grid', initGrid);
    safely('scrollMotion', initScrollMotion);
    safely('imageZoom', initImageZoom);
    safely('viewTransition', initViewTransition);
    safely('phoneHeader', initPhoneHeader);
    safely('swipeClose', initSwipeClose);
  });
})();
