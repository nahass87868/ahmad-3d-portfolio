/*
 * extras.js — optional add-ons for the portfolio.
 *
 * Isolated on purpose:
 *   • It never edits script.js or style.css. It only ADDS elements, classes (all prefixed "x-") and one <style>.
 *   • Turn everything off with EXTRAS.enabled = false — or delete the one <script src="extras.js"> line in index.html.
 *   • Each feature has its own flag. Every feature is wrapped so a failure can never break the site.
 *   • It relies on these existing names: .nav, #grid, .tile, #chips, #mail, #stat, #cl, #cx, #panel, .hero, .hmeta, .foot-links.
 *     If you ever rename them in script.js, the matching extra quietly does nothing.
 */
(() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     FLAGS — true = on, false = off
     ══════════════════════════════════════════════════════════════════════════ */
  const EXTRAS = {
    enabled: true, // MASTER SWITCH. false = this file does nothing at all.

    navActive: true, // the nav link of the section you are in gets an accent underline
    filterTransition: true, // works grid: tiles glide to their new places when you click a filter chip
    cursorIdleFade: true, // crosshair lines + X·Y readout fade when the mouse rests, return on movement
    backToTop: true, // "Back to top" link in the footer
    copyLabel: true, // the "Copy address" button itself says "Copied" for a moment
    scrollProgress: true, // thin accent line under the header showing how far you have scrolled
    toolbarTooltips: true, // visible tooltips for the top-right shading icons (hover + keyboard focus)
    heroClearsDock: true, // FIX: keeps the hero footer line clear of the Dark/Copper pills on desktop

    // Availability dot in the hero footer. 'available' = exactly as it is now (no change).
    // 'busy' = the dot becomes a hollow ring and the text becomes busyText.
    availability: { status: 'available', busyText: 'Fully booked right now' },

    // FIX, OFF by default because it changes an existing colour: a darker backing behind the
    // "MOTION" and number badges so they stay readable over very bright images (3.8:1 → about 7:1).
    badgeContrast: false,
  };

  /* ══════════════════════════════════════════════════════════════════════════
     TUNABLES
     ══════════════════════════════════════════════════════════════════════════ */
  const T = {
    EASE: 'cubic-bezier(.2,.7,.1,1)', // same curve the site already uses
    FILTER_MS: 450, // tile glide when filtering
    IDLE_MS: 3000, // mouse rest time before the crosshair fades
    IDLE_LINES_OPACITY: 0.25, // crosshair opacity while resting (1 = unchanged)
    IDLE_FADE_MS: 1200, // how slowly it fades out (it returns at the site's normal speed)
    COPIED_MS: 1800, // how long the button shows "Copied"
    NAV_BAND: '-40% 0px -59% 0px', // a thin band 40% down the screen decides the current section
    TIP_GAP: 8, // px between a toolbar icon and its tooltip
    DOCK_CLEARANCE: 72, // px of space kept under the hero footer line on desktop
  };

  if (!EXTRAS.enabled) return;

  /* ══════════════════════════════════════════════════════════════════════════
     helpers
     ══════════════════════════════════════════════════════════════════════════ */
  const root = document.documentElement;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

  /** Run a feature; if it throws, log once and carry on. */
  const safely = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.warn('[extras] "' + name + '" failed and was skipped:', err);
    }
  };

  /** Call fn once `selector` exists (the page is built by script.js after the DOM loads). */
  function whenReady(selector, fn) {
    if ($(selector)) return fn();
    const mo = new MutationObserver(() => {
      if (!$(selector)) return;
      mo.disconnect();
      fn();
    });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 15000);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     CSS — every selector is new (x- prefix) except the two clearly marked FIX blocks
     ══════════════════════════════════════════════════════════════════════════ */
  const css = `
/* nav: current-section underline */
.nav nav a { position: relative; }
.nav nav a::after {
  content: ''; position: absolute; left: 9px; right: 9px; bottom: 9px; height: 1px;
  background: var(--acc); transform: scaleX(0); transform-origin: 0 50%;
  transition: transform .35s ${T.EASE};
}
.nav nav a.x-active::after { transform: scaleX(1); }
@media (max-width: 720px) { .nav nav a::after { left: 7px; right: 7px; } }

/* scroll progress: a 2px line sitting on the header's bottom edge */
.x-progress { position: fixed; left: 0; right: 0; top: calc(52px + env(safe-area-inset-top, 0px) - 2px); height: 2px; z-index: 61; pointer-events: none; }
.x-progress i { display: block; height: 100%; background: var(--acc); transform: scaleX(0); transform-origin: 0 50%; will-change: transform; }
@media (max-width: 720px) { .x-progress { top: calc(46px + env(safe-area-inset-top, 0px) - 2px); } }

/* cursor idle: lines and readout rest */
html.x-idle.cur-on #cl { opacity: ${T.IDLE_LINES_OPACITY}; transition: opacity ${T.IDLE_FADE_MS}ms ease; }
html.x-idle #cx { opacity: 0; transition: opacity ${T.IDLE_FADE_MS}ms ease; }
#cx { transition: opacity .3s ease; }

/* toolbar tooltips */
.x-tip {
  position: fixed; left: 0; top: 0; z-index: 95; pointer-events: none; white-space: nowrap;
  font: 10px/1 var(--font-mono); letter-spacing: .02em; text-transform: uppercase;
  background: var(--ink); color: var(--bg); padding: 6px 8px; border-radius: 4px;
  opacity: 0; transform: translateY(-3px); transition: opacity .15s ease, transform .15s ${T.EASE};
}
.x-tip.on { opacity: 1; transform: none; }

/* availability: busy */
.dot.x-busy { background: transparent; box-shadow: inset 0 0 0 1.5px var(--mut); }

/* FIX (flag heroClearsDock): the Dark/Copper pills sat on top of the hero footer line on desktop */
@media (min-width: 721px) {
  html.x-hero-clear .hero { padding-bottom: calc(${T.DOCK_CLEARANCE}px + env(safe-area-inset-bottom, 0px)); }
}

/* FIX (flag badgeContrast, off by default): darker backing behind the badges */
html.x-badge .th:before, html.x-badge .mot { background: rgba(12, 12, 11, .72); }
`;

  const style = document.createElement('style');
  style.id = 'extras-css';
  style.textContent = css;
  document.head.appendChild(style);
  root.dataset.extras = 'on';

  /* ══════════════════════════════════════════════════════════════════════════
     FEATURES
     ══════════════════════════════════════════════════════════════════════════ */

  /* ── nav: highlight the section you are in ─────────────────────────────── */
  function initNavActive() {
    const ids = ['works', 'about', 'skills', 'contact'];
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const links = new Map(ids.map((id) => [id, $('.nav nav a[href="#' + id + '"]')]));
    if (!sections.length) return;
    const inBand = new Set();

    const apply = () => {
      let current = null;
      sections.forEach((s) => {
        if (inBand.has(s)) current = s.id;
      });
      // scrolled to the very end: the last section wins even if it is short
      if (innerHeight + scrollY >= root.scrollHeight - 4) current = sections[sections.length - 1].id;
      links.forEach((a, id) => {
        if (!a) return;
        const on = id === current;
        a.classList.toggle('x-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? inBand.add(e.target) : inBand.delete(e.target)));
        apply();
      },
      { rootMargin: T.NAV_BAND }
    );
    sections.forEach((s) => io.observe(s));
    let queued = false;
    addEventListener(
      'scroll',
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          apply();
        });
      },
      { passive: true }
    );
  }

  /* ── works: tiles glide to their new places when a filter chip is clicked ──
     FLIP with the Web Animations API: it records where each visible tile is, lets the page's own filter run,
     then plays each surviving tile from its old place to its new one. It sets no inline styles, so the page's
     own scroll motion and hover effects are untouched. Tiles that newly appear keep the page's own slide-in. */
  function initFilterTransition() {
    const grid = $('#grid');
    if (!grid || !grid.animate) return;
    const running = new WeakMap();

    document.addEventListener(
      'click',
      (e) => {
        const chip = e.target.closest && e.target.closest('#chips .chip');
        if (!chip || reduced()) return;
        const tiles = $$('.tile', grid);
        const before = new Map();
        tiles.forEach((t) => {
          if (!t.hidden) before.set(t, t.getBoundingClientRect());
        });
        requestAnimationFrame(() => {
          // by now the page's own handler has filtered and re-packed the grid
          tiles.forEach((t) => {
            const a = before.get(t);
            if (!a || t.hidden) return;
            const b = t.getBoundingClientRect();
            const dx = a.left - b.left;
            const dy = a.top - b.top;
            const sx = a.width / b.width;
            const sy = a.height / b.height;
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
            const previous = running.get(t);
            if (previous) previous.cancel();
            const anim = t.animate(
              [
                { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')', transformOrigin: '0 0' },
                { transform: 'none', transformOrigin: '0 0' },
              ],
              { duration: T.FILTER_MS, easing: T.EASE }
            );
            running.set(t, anim);
          });
        });
      },
      true // capture: runs before the page's own click handler
    );
  }

  /* ── cursor: crosshair + readout rest when the mouse is still ─────────── */
  function initCursorIdle() {
    if (!fine()) return;
    let timer = 0;
    const wake = () => {
      root.classList.remove('x-idle');
      clearTimeout(timer);
      timer = setTimeout(() => root.classList.add('x-idle'), T.IDLE_MS);
    };
    addEventListener('pointermove', wake, { passive: true });
    addEventListener('pointerdown', wake, { passive: true });
    wake();
  }

  /* ── footer: Back to top ──────────────────────────────────────────────── */
  function initBackToTop() {
    const links = $('.foot-links');
    if (!links || $('.x-top', links)) return;
    const a = document.createElement('a');
    a.className = 'x-top';
    a.href = '#top';
    a.dataset.cur = 'Top';
    a.innerHTML = 'Back to top <span aria-hidden="true">↑</span>';
    links.appendChild(a);
  }

  /* ── contact: the button itself confirms the copy ─────────────────────────
     The page already writes "Copied to clipboard" / "Copy failed…" into #stat (a screen-reader status region).
     This watches that text and mirrors it on the button for a moment. */
  function initCopyLabel() {
    const button = $('#mail');
    const status = $('#stat');
    if (!button || !status) return;
    const original = button.textContent;
    let timer = 0;
    new MutationObserver(() => {
      const text = status.textContent || '';
      const label = /^Copied/i.test(text) ? 'Copied' : /failed/i.test(text) ? 'Copy failed' : null;
      if (!label) return;
      clearTimeout(timer);
      if (!button.style.minWidth) button.style.minWidth = button.offsetWidth + 'px'; // no width jump
      button.textContent = label;
      timer = setTimeout(() => {
        button.textContent = original;
        button.style.minWidth = '';
      }, T.COPIED_MS);
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }

  /* ── header: scroll progress line (home page, or the open project panel) ─ */
  function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'x-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    const fill = $('i', bar);
    let queued = false;

    const update = () => {
      queued = false;
      const panel = $('#panel');
      const inPanel = panel && panel.classList.contains('open');
      const max = inPanel ? panel.scrollHeight - panel.clientHeight : root.scrollHeight - innerHeight;
      const pos = inPanel ? panel.scrollTop : scrollY;
      fill.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, pos / max)) : 0) + ')';
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    addEventListener('hashchange', queue);
    addEventListener('popstate', queue);
    const panel = $('#panel');
    if (panel) panel.addEventListener('scroll', queue, { passive: true });
    if (panel) new MutationObserver(queue).observe(panel, { attributes: true, attributeFilter: ['class'] });
    update();
  }

  /* ── header: visible tooltips for the shading icons ───────────────────────
     Moves each button's native title="…" into data-tip (so you don't get two tooltips). The accessible
     name (aria-label) is untouched. Mouse hover and keyboard focus only; touch devices don't get hover tips. */
  function initToolbarTips() {
    const tip = document.createElement('div');
    tip.className = 'x-tip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);

    const adopt = () =>
      $$('.vpt button[title]').forEach((b) => {
        b.dataset.tip = b.getAttribute('title');
        b.removeAttribute('title');
      });
    adopt();
    const nav = $('.nav');
    if (nav) new MutationObserver(adopt).observe(nav, { childList: true, subtree: true });

    const hide = () => tip.classList.remove('on');
    const show = (button) => {
      const text = button.dataset.tip;
      if (!text) return;
      tip.textContent = text;
      const r = button.getBoundingClientRect();
      const w = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
      tip.style.top = r.bottom + T.TIP_GAP + 'px';
      tip.classList.add('on');
    };
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType === 'touch') return;
      const b = e.target.closest && e.target.closest('.vpt button');
      if (b) show(b);
      else hide();
    });
    document.addEventListener('pointerleave', hide, true);
    document.addEventListener('focusin', (e) => {
      const b = e.target.closest && e.target.closest('.vpt button');
      if (b && b.matches(':focus-visible')) show(b);
    });
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hide();
    });
    addEventListener('scroll', hide, { passive: true });
  }

  /* ── hero footer: availability status ──────────────────────────────────── */
  function initAvailability(cfg) {
    if (cfg.status !== 'busy') return; // 'available' = exactly as it is now
    const dot = $('.hmeta .dot');
    if (!dot || !dot.parentElement) return;
    dot.classList.add('x-busy');
    const label = dot.parentElement.lastChild;
    if (label && label.nodeType === 3) label.textContent = ' ' + cfg.busyText;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     start (after script.js has built the page)
     ══════════════════════════════════════════════════════════════════════════ */
  function start() {
    if (EXTRAS.heroClearsDock) root.classList.add('x-hero-clear');
    if (EXTRAS.badgeContrast) root.classList.add('x-badge');
    if (EXTRAS.navActive) safely('navActive', initNavActive);
    if (EXTRAS.filterTransition) safely('filterTransition', initFilterTransition);
    if (EXTRAS.cursorIdleFade) safely('cursorIdleFade', initCursorIdle);
    if (EXTRAS.backToTop) safely('backToTop', initBackToTop);
    if (EXTRAS.copyLabel) safely('copyLabel', initCopyLabel);
    if (EXTRAS.scrollProgress) safely('scrollProgress', initScrollProgress);
    if (EXTRAS.toolbarTooltips) safely('toolbarTooltips', initToolbarTips);
    if (EXTRAS.availability) safely('availability', () => initAvailability(EXTRAS.availability));
  }

  whenReady('#top .hero', start);
})();
