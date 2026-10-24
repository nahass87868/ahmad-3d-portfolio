/*
 * fixes.js — isolated add-on. It never edits script.js, style.css or extras.js.
 * It only sets attributes on existing elements and (optionally) injects one <style>.
 *
 * Switch everything off: set FIXES.enabled = false, or delete the <script src="fixes.js"> line in index.html.
 */
(() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     FLAGS — true = on, false = off
     ══════════════════════════════════════════════════════════════════════════ */
  const FIXES = {
    enabled: true, // MASTER SWITCH. false = this file does nothing at all.

    // ON. Invisible change: the project panel can receive focus, so keyboard and screen-reader users
    // land inside it when it opens. Only adds attributes; no visual or motion change.
    panelFocus: true,

    // OFF until you approve it: it changes how the intro looks. The intro counter (#pn) also carries the
    // global .pn class (project prev/next grid), so it picks up that rule's hairline + 18px top padding.
    // true = remove those two inherited properties from the counter only.
    introCounterBox: false,

    // OFF until you approve it: it changes how cards look on touch phones. true = drop backdrop-filter blur
    // from the card scrim and the badges when the primary pointer is coarse (touch). Desktop is unaffected.
    coarseNoBackdropBlur: false,
  };

  if (!FIXES.enabled) return;

  const root = document.documentElement;

  /** Call fn once `selector` exists (script.js builds the page after DOMContentLoaded). */
  function whenReady(selector, fn) {
    const found = () => document.querySelector(selector);
    if (found()) return fn(found());
    const mo = new MutationObserver(() => {
      const el = found();
      if (!el) return;
      mo.disconnect();
      fn(el);
    });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 15000);
  }

  const safely = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.warn('[fixes] "' + name + '" failed and was skipped:', err);
    }
  };

  /* ── panel focus ──────────────────────────────────────────────────────────
     script.js calls panel.focus() on open, but a <section> without tabindex ignores focus(), so keyboard
     users dropped to <body> after the tile went inert. tabindex="-1" makes it focusable by script only
     (not in the Tab order). role=dialog + aria-modal tell screen readers the rest of the page is blocked,
     which matches what the code already does with `inert`. The existing aria-label="Project" is kept. */
  function initPanelFocus(panel) {
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'dialog');
    if (!panel.hasAttribute('aria-modal')) panel.setAttribute('aria-modal', 'true');
  }

  /* ── optional CSS (only injected if a flag needs it) ───────────────────── */
  let css = '';
  if (FIXES.introCounterBox) {
    // #pre .pn beats the global .pn rule; position/font/size from the existing #pre .pn rule are untouched.
    css += '#pre .pn { display: block; border-top: 0; padding-top: 0; gap: 0; }\n';
  }
  if (FIXES.coarseNoBackdropBlur) {
    css +=
      '@media (pointer: coarse) {\n' +
      '  .tile > a:after, .th:before, .mot { -webkit-backdrop-filter: none; backdrop-filter: none; }\n' +
      '}\n';
  }
  if (css) {
    const style = document.createElement('style');
    style.id = 'fixes-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  if (FIXES.panelFocus) whenReady('#panel', (panel) => safely('panelFocus', () => initPanelFocus(panel)));
})();
