/*
 * about-photo.js — isolated add-on: puts your portrait in the empty space of the About section.
 * It never edits script.js, style.css, extras.js or fixes.js. It only ADDS one <figure> and one <style>.
 *
 * Switch it off: set ABOUT_PHOTO.enabled = false, or delete the <script src="about-photo.js"> line in index.html.
 */
(() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     SETTINGS — art-direct by editing these
     ══════════════════════════════════════════════════════════════════════════ */
  const ABOUT_PHOTO = {
    enabled: true, // MASTER SWITCH. false = this file does nothing at all.

    src: 'images/ahmad-photo.jpg', // must match the file name exactly (GitHub Pages is case-sensitive)
    alt: 'Portrait of Ahmad Nahass', // read by screen readers; describe the photo if you like

    aspect: '4 / 5', // frame shape (width / height). '1 / 1' square, '3 / 4' taller, '4 / 3' wider.
    maxWidth: 'clamp(280px, 28vw, 480px)', // frame width on desktop: min 280px, scales with the window, max 480px
    position: '50% 25%', // which part of the photo stays in frame when it is cropped: x y. Lower y = shows more of the top (face).
  };

  if (!ABOUT_PHOTO.enabled) return;

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

  /* CSS uses only the site's existing tokens (--surface, --line, --mut), so it follows dark/light/scheme changes
     and the Wireframe / Solid viewport modes without extra rules. Square corners and brackets match the work cards. */
  const css = `
.about-photo {
  --k: 10px; /* corner-bracket length, same as the work cards */
  position: relative;
  margin: 0;
  align-self: start;
  grid-column: 1 / -1;
  width: min(100%, ${ABOUT_PHOTO.maxWidth});
  aspect-ratio: ${ABOUT_PHOTO.aspect}; /* reserves the space before the image loads: no layout shift */
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
}
.about-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: ${ABOUT_PHOTO.position};
}
.about-photo:before {
  content: '';
  position: absolute;
  inset: -1px;
  z-index: 2;
  pointer-events: none;
  color: var(--mut);
  background:
    linear-gradient(currentColor, currentColor) 0 0 / var(--k) 1px,
    linear-gradient(currentColor, currentColor) 0 0 / 1px var(--k),
    linear-gradient(currentColor, currentColor) 100% 0 / var(--k) 1px,
    linear-gradient(currentColor, currentColor) 100% 0 / 1px var(--k),
    linear-gradient(currentColor, currentColor) 0 100% / var(--k) 1px,
    linear-gradient(currentColor, currentColor) 0 100% / 1px var(--k),
    linear-gradient(currentColor, currentColor) 100% 100% / var(--k) 1px,
    linear-gradient(currentColor, currentColor) 100% 100% / 1px var(--k);
  background-repeat: no-repeat;
}
/* desktop: the empty left half under the big quote (the text block starts at column 7) */
@media (min-width: 900px) {
  .about-photo { grid-column: 1 / 7; }
}
`;

  function inject(cols) {
    if (cols.querySelector('.about-photo')) return;

    const style = document.createElement('style');
    style.id = 'about-photo-css';
    style.textContent = css;
    document.head.appendChild(style);

    const figure = document.createElement('figure');
    figure.className = 'about-photo';
    // Reuse the site's own scroll slide-in, but only while the page is still starting up (html.pre is the intro
    // curtain). script.js collects [data-sa] blocks once, when the intro ends; adding the attribute later would
    // leave the figure hidden forever, so in that case it simply appears without the slide.
    if (root.classList.contains('pre')) figure.setAttribute('data-sa', '');

    const img = document.createElement('img');
    img.src = ABOUT_PHOTO.src;
    img.alt = ABOUT_PHOTO.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    // If the file is missing or misnamed, remove the empty frame instead of showing a broken image.
    img.addEventListener('error', () => {
      console.warn('[about-photo] Image not found:', ABOUT_PHOTO.src);
      figure.remove();
    });
    figure.appendChild(img);

    // Between the big quote and the text block: on phones it stacks in that order, on desktop it fills the left half.
    const copy = cols.querySelector('.copy');
    if (copy) cols.insertBefore(figure, copy);
    else cols.appendChild(figure);
  }

  whenReady('#about .cols', (cols) => {
    try {
      inject(cols);
    } catch (err) {
      console.warn('[about-photo] skipped:', err);
    }
  });
})();
