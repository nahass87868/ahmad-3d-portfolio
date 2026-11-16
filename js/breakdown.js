/*
 * Breakdown slider (Phase 4a): wire, clay and final renders of one project, one 9:16-or-other stage above the gallery.
 * Shown only for projects with `breakdown: [width, height]` in content/works.js. Instant switching, no motion (motion is 4b).
 * Called once by openPanel() in script.js after the project markup is in the panel. A classic script, loaded last.
 */
(function () {
  'use strict';
  const LAYERS = ['wire', 'clay', 'final'];
  const NAMES = ['Wire', 'Clay', 'Final'];
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  window.__breakdown = function (body, work) {
    const size = work.breakdown;
    const host = body.querySelector('.gallery') || body.querySelector('.pn'); // above the gallery
    if (!Array.isArray(size) || !host) return;
    const [w, h] = size;
    const imgs = LAYERS.map(
      (l, i) =>
        `<img src="images/projects-breakdown/${esc(work.slug)}-image-${l}.webp" width="${w}" height="${h}" alt="${esc(work.title)}: ${NAMES[i].toLowerCase()} layer" loading="lazy" decoding="async">`,
    ).join('');
    const stops = NAMES.map((n, i) => `<button class="bd-stop mono" type="button" tabindex="-1" aria-hidden="true" data-i="${i}">${n}</button>`).join('');
    host.insertAdjacentHTML(
      'beforebegin',
      `<section class="bd" aria-label="Breakdown of ${esc(work.title)}"><div class="bd-in" style="--bd-r:${w} / ${h};--bd-n:${(w / h).toFixed(4)}">` +
        `<div class="bd-stage" role="slider" tabindex="0" aria-label="${esc(work.title)} breakdown layer" aria-valuemin="0" aria-valuemax="2" aria-valuenow="2" aria-valuetext="Final">${imgs}</div>` +
        `<div class="bd-stops">${stops}</div></div></section>`,
    );
    const root = host.previousElementSibling;
    const stage = root.querySelector('.bd-stage');
    const layers = stage.querySelectorAll('img');
    const btns = root.querySelectorAll('.bd-stop');
    const set = (n) => {
      const v = Math.max(0, Math.min(2, n));
      layers.forEach((im, i) => im.classList.toggle('on', i === v));
      btns.forEach((b, i) => b.classList.toggle('on', i === v));
      stage.setAttribute('aria-valuenow', v);
      stage.setAttribute('aria-valuetext', NAMES[v]);
      return v;
    };
    let value = set(2); // rests on final
    stage.addEventListener('keydown', (e) => {
      const to = { ArrowLeft: value - 1, ArrowDown: value - 1, ArrowRight: value + 1, ArrowUp: value + 1, Home: 0, End: 2 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      value = set(to);
    });
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        value = set(+b.dataset.i);
        stage.focus({ preventScroll: true });
      }),
    );
  };
})();
