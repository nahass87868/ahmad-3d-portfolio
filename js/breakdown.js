/*
 * Breakdown slider (Phase 4a structure + 4b motion + 4c scroll): wire, clay and final renders of one project, one stage above the gallery.
 * Shown only for projects with `breakdown: [width, height]` in content/works.js. Called once by openPanel() in script.js
 * after the project markup is in the panel. A classic script, loaded last.
 *
 * Wipe: clay wipes in over wire (position 0..1), then final over clay (1..2). One drag across the stage width = one layer step,
 * and the edge moves 1:1 with the finger. Only transform and opacity change (each layer is a clipping wrapper moved by
 * translateX, its image moved back so the picture stays put). One rAF loop runs only while dragging or settling, and only
 * while the slider is on screen.
 *
 * Scroll (4c): the slider starts on Wire and scrolling the project panel moves it Wire > Clay > Final (up again reverses).
 * Scroll only ADDS its change to the current position (never an absolute mapping), so after a drag, key or stop click the
 * scroll carries on from wherever the slider was left, with no jump. A drag in progress wins over scroll. Reduced motion:
 * scroll does not drive it, it rests on Final.
 */
(function () {
  'use strict';
  const LAYERS = ['wire', 'clay', 'final'];
  const NAMES = ['Wire', 'Clay', 'Final'];
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Feel. Spring pairs are the apple-design table values (damping ratio, response in seconds); owner: tune these first.
  const FEEL = {
    response: 0.4, // settle spring, damping 1.0 ("move"): lower = snappier
    flickResponse: 0.3, // damping 0.8 ("drawer"): only for a flick that lands on an end stop
    decel: 0.99, // momentum projection rate: lower = a flick throws less far (0.998 is scroll-like)
    parallax: 0.012, // counter-parallax of the layers, share of the stage width
    grab: 0.02, // extra scale while grabbed
    rubber: 0.04, // end-stop reach, in stage widths (Apple rubber-band curve, constant 0.55)
    scrollResponse: 0.3, // scroll smoothing spring, damping 1.0 (the lightest of the default 0.3-0.4 range)
    scrollStart: 0.8, // scroll starts moving it when the slider's top reaches this share of the viewport height (from the top)
    scrollEnd: 0.5, // and it is on Final when the slider's centre reaches this share (0.5 = the middle of the viewport)
  };
  const SLOP = 6; // px of horizontal travel before a touch or click counts as a drag (vertical scroll keeps working)
  const GRIP = 8; // px the handle keeps from the stage edge
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mq.matches && !document.documentElement.classList.contains('mfull'); // ?motion=full overrides, as in script.js
  const rb = (o) => (Math.sign(o) * (Math.abs(o) * FEEL.rubber * 0.55)) / (FEEL.rubber + 0.55 * Math.abs(o));
  const disp = (x) => clamp(x, 0, 2) + rb(x - clamp(x, 0, 2)); // position as drawn: soft past the ends
  
  window.__breakdown = function (body, work) {
    const size = work.breakdown;
    const host = body.querySelector('.gallery') || body.querySelector('.pn'); // above the gallery
    const panel = body.closest('.panel'); // the scroll container (the page behind it is locked while it is open)
    if (!Array.isArray(size) || !host || !panel) return;
    const at = reduced() ? 2 : 0; // starts on Wire; reduced motion rests on Final
    const [w, h] = size;
    const imgs = LAYERS.map(
      (l, i) =>
        `<div class="bd-l"><img src="images/projects-breakdown/${esc(work.slug)}-image-${l}.webp" width="${w}" height="${h}" alt="${esc(work.title)}: ${NAMES[i].toLowerCase()} layer" loading="lazy" decoding="async" draggable="false"></div>`,
    ).join('');
    const stops = NAMES.map((n, i) => `<button class="bd-stop mono" type="button" tabindex="-1" aria-hidden="true" data-i="${i}">${n}</button>`).join('');
    host.insertAdjacentHTML(
      'beforebegin',
      `<section class="bd" aria-label="Breakdown of ${esc(work.title)}"><div class="bd-in" style="--bd-r:${w} / ${h};--bd-n:${(w / h).toFixed(4)}">` +
        `<div class="bd-stage" role="slider" tabindex="0" aria-label="${esc(work.title)} breakdown layer" aria-valuemin="0" aria-valuemax="2" aria-valuenow="${at}" aria-valuetext="${NAMES[at]}">${imgs}<span class="bd-h" aria-hidden="true"></span></div>` +
        `<div class="bd-stops">${stops}</div></div></section>`,
    );
    const root = host.previousElementSibling;
    const stage = root.querySelector('.bd-stage');
    const wraps = [...stage.querySelectorAll('.bd-l')];
    const pics = wraps.map((l) => l.firstElementChild);
    const handle = stage.querySelector('.bd-h');
    const btns = [...root.querySelectorAll('.bd-stop')];

    let value = at; // the stop the slider is heading for (what aria reports)
    let x = at, v = 0; // position in layers (0 wire .. 2 final) and velocity in layers/s
    let T = at, wn = 0, zeta = 1, dir = 0; // settle target and spring
    let mode = 'idle'; // idle | settle | drag
    let grab = 0, grabTo = 0, W = 1, visible = false, raf = 0, last = 0, drag = null;
    const shown = [true, true, true];

    const render = () => {
      const xd = disp(x);
      const c = clamp(xd, 0, 2);
      const over = xd - c; // soft overshoot at the ends, in stage widths
      const R = [1, clamp(xd, 0, 1), clamp(xd - 1, 0, 1)]; // how much of each layer is revealed, left to right
      for (let i = 0; i < 3; i++) {
        const vis = R[i] > 0 && (i === 2 || R[i + 1] < 1); // a layer fully covered by the next one is hidden
        if (vis !== shown[i]) wraps[i].classList.toggle('off', !(shown[i] = vis));
        const d = (i ? -FEEL.parallax * (1 - R[i]) : 0) + (i < 2 ? FEEL.parallax * R[i + 1] : 0); // counter-parallax
        wraps[i].style.transform = `translateX(${((over - (1 - R[i])) * 100).toFixed(3)}%)`;
        pics[i].style.transform = `translateX(${(((1 - R[i]) + d) * 100).toFixed(3)}%) scale(${(1 + 2 * Math.abs(d) + FEEL.grab * grab).toFixed(4)})`;
      }
      const edge = xd < 1 ? R[1] : R[2]; // the visible wipe edge
      handle.style.transform = `translateX(${(clamp(edge * W, GRIP, W - GRIP) + over * W).toFixed(2)}px)`;
      handle.style.opacity = clamp(Math.abs(xd - 1) / 0.08, 0, 1).toFixed(3); // the edge restarts at the left between clay and final
      btns.forEach((b, i) => {
        b.style.setProperty('--k', (1 - Math.min(1, Math.abs(xd - i))).toFixed(3));
        b.classList.toggle('on', i === Math.round(clamp(xd, 0, 2)));
      });
    };

    const live = (on) => root.classList.toggle('bd-live', on); // will-change only while it moves
    const rest = () => {
      mode = 'idle';
      grab = grabTo = 0;
      render();
      live(false);
    };
    const frame = (t) => {
      raf = 0;
      if (!root.isConnected || !visible) return stop();
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      let done = false;
      if (mode === 'settle') {
        const n = Math.ceil(dt * 240);
        for (let i = 0; i < n; i++) {
          v += (-wn * wn * (x - T) - 2 * zeta * wn * v) * (dt / n);
          x += v * (dt / n);
        }
        if (T === 1 && (x - T) * dir > 0) { x = T; v = 0; } // never flash the next layer past the middle stop
        if (Math.abs(x - T) < 0.0004 && Math.abs(v) < 0.01) { x = T; v = 0; done = true; }
      }
      grab += (grabTo - grab) * (1 - Math.exp(-dt / 0.09));
      render();
      if (mode === 'drag' || (mode === 'settle' && !done) || Math.abs(grab - grabTo) > 0.002) raf = requestAnimationFrame(frame);
      else if (mode === 'settle') rest();
    };
    const kick = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      // off screen or panel closed: land on the stop it was heading for, no loop left running
      cancelAnimationFrame(raf);
      raf = 0;
      if (mode !== 'idle' || drag) {
        drag = null;
        x = mode === 'drag' ? clamp(Math.round(x), 0, 2) : T;
        v = 0;
        rest();
      }
    };
    const settle = (t) => {
      T = t;
      dir = Math.sign(t - x);
      const flick = Math.abs(v) > 0.8 && (t === 0 || t === 2) && x >= 0 && x <= 2;
      wn = (2 * Math.PI) / (flick ? FEEL.flickResponse : FEEL.response);
      zeta = flick ? 0.8 : 1;
      mode = 'settle';
      grabTo = 0;
      live(true);
      kick();
    };
    const aria = (n) => {
      value = n;
      stage.setAttribute('aria-valuenow', n);
      stage.setAttribute('aria-valuetext', NAMES[n]);
    };
    const go = (n, instant) => {
      const t = clamp(n, 0, 2);
      aria(t);
      if (instant || reduced() || !visible) { x = t; v = 0; mode = 'idle'; rest(); } // instant switching
      else settle(t);
      return t;
    };

    // --- finger: pointer events (mouse, touch, pen); the edge follows the finger 1:1, one stage width = one layer ---
    const velocity = (d) => {
      const p = d.pts;
      const a = p[0], b = p[p.length - 1];
      if (p.length < 2 || b.t - a.t < 8 || performance.now() - b.t > 100) return 0; // a pause before release means no throw
      return ((b.x - a.x) / (b.t - a.t)) * 1000 / W;
    };
    stage.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (mode === 'settle') { v = 0; mode = 'hold'; } // grabbing a moving slider: take over from where it is, no jump
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, on: false, pts: [] };
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      if (!drag.on) {
        if (Math.abs(e.clientY - drag.y0) > Math.max(SLOP, Math.abs(dx))) { drag = null; if (mode === 'hold') settle(T); return; } // vertical: leave it to scrolling
        if (Math.abs(dx) < SLOP) return;
        drag.on = true; // horizontal intent confirmed: from here the edge tracks the finger
        drag.px = e.clientX;
        drag.x = x;
        mode = 'drag';
        W = stage.clientWidth || 1;
        if (!reduced()) grabTo = 1;
        stage.setPointerCapture(e.pointerId);
        live(true);
        kick();
      }
      x = drag.x + (e.clientX - drag.px) / W;
      drag.pts.push({ t: e.timeStamp, x: e.clientX });
      if (drag.pts.length > 6) drag.pts.shift();
      const near = clamp(Math.round(x), 0, 2);
      if (near !== value) aria(near);
      if (!raf) kick();
    });
    const release = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.on) { if (mode === 'hold') settle(T); return; } // a plain tap on the stage does nothing (a grabbed settle carries on)
      v = reduced() ? 0 : velocity(d);
      const proj = x + ((v / 1000) * FEEL.decel) / (1 - FEEL.decel); // where a thrown layer would stop (Apple's projection)
      const t = clamp(Math.round(proj), 0, 2);
      aria(t);
      if (reduced()) { x = t; v = 0; rest(); }
      else settle(t);
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);

    // --- scroll: the change in the panel's scroll position inside the range [lo, hi] is added to the slider position ---
    let s0 = 0; // last scrollTop seen (openPanel resets it to 0 right after this runs)
    const scrolled = () => {
      const s = panel.scrollTop, H = panel.clientHeight, r = stage.getBoundingClientRect();
      const top = s + r.top - panel.getBoundingClientRect().top; // slider top in panel content coordinates
      const lo = Math.max(0, top - FEEL.scrollStart * H); // scroll where it starts moving
      const hi = Math.max(lo + 1, Math.min(top + r.height / 2 - FEEL.scrollEnd * H, panel.scrollHeight - H)); // where it is on Final
      const d = ((clamp(s, lo, hi) - clamp(s0, lo, hi)) / (hi - lo)) * 2; // layers
      s0 = s;
      return d;
    };
    const onScroll = () => {
      if (!root.isConnected) return panel.removeEventListener('scroll', onScroll); // the panel loaded another project
      const d = scrolled(); // always advances s0, so a drag or reduced motion never leaves a backlog
      if (!d || mode === 'drag' || reduced()) return; // a drag in progress wins
      T = clamp((mode === 'settle' || mode === 'hold' ? T : x) + d, 0, 2); // carry on from where the slider is heading
      const n = clamp(Math.round(T), 0, 2);
      if (n !== value) aria(n);
      if (mode === 'hold') return; // a finger just landed on it: the release picks up the new target
      if (!visible) { x = T; v = 0; mode = 'idle'; return render(); } // off screen: no loop, just stay in step
      dir = Math.sign(T - x);
      if (mode !== 'settle') { wn = (2 * Math.PI) / FEEL.scrollResponse; zeta = 1; mode = 'settle'; live(true); } // a flick in flight keeps its own spring
      kick();
    };
    panel.addEventListener('scroll', onScroll, { passive: true });

    // --- keyboard and stops: same keys and values as 4a ---
    stage.addEventListener('keydown', (e) => {
      const to = { ArrowLeft: value - 1, ArrowDown: value - 1, ArrowRight: value + 1, ArrowUp: value + 1, Home: 0, End: 2 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      go(to, true); // keyboard: instant, as in 4a (keyboard actions get no animation)
    });
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        go(+b.dataset.i);
        stage.focus({ preventScroll: true });
      }),
    );

    // --- on screen: run the loop only while visible; the hidden layers load and decode a screen BEFORE the slider scrolls in ---
    new ResizeObserver(() => (W = stage.clientWidth || 1)).observe(stage);
    const pre = new IntersectionObserver(
      (entries) => {
        if (!root.isConnected) return pre.disconnect();
        if (!entries[entries.length - 1].isIntersecting) return;
        pre.disconnect();
        pics.forEach((im) => {
          im.loading = 'eager'; // the two hidden layers are clipped away, so lazy loading would never fetch them
          if (im.decode) im.decode().catch(() => {});
        });
      },
      { root: panel, rootMargin: '0px 0px 100% 0px' }, // one panel height below the visible area
    );
    pre.observe(stage);
    const io = new IntersectionObserver((entries) => {
      if (!root.isConnected) return io.disconnect();
      visible = entries[entries.length - 1].isIntersecting;
      if (!visible) stop();
    });
    io.observe(stage);
    render(); // starts on Wire (reduced motion: Final)
  };
})();
