/*
 * premium.js — the premium layer, built on GSAP + ScrollTrigger (vendor/gsap.min.js, vendor/ScrollTrigger.min.js).
 *
 *   1. Loading curtain   name in Archivo, one line, a counter driven by what is really loading, and a hand-off to the hero sequence
 *   2. Grid / Index      a second way to browse: a clean list with a preview that follows the cursor
 *   3. Project gallery   masked, staggered reveal on scroll, a "03 / 09" counter, and a Next project card
 *   4. Parallax          small and controlled: the project hero image and your portrait, desktop only
 *
 * Switch everything off: PREMIUM.enabled = false (or remove the <script src="premium.js"> line).
 * Each part has its own flag. Reduced motion: no reveals, no parallax, a short fade instead of the curtain lift.
 * If GSAP is missing, script.js falls back to its original curtain and everything else simply stays as it was.
 */
(() => {
  'use strict';

  const PREMIUM = {
    enabled: true, // MASTER SWITCH
    intro: true, // loading curtain
    index: true, // Grid / Index toggle
    gallery: true, // project gallery reveal, counter, next card
    parallax: true, // hero image + portrait, desktop only
  };

  const T = {
    // ── curtain ──
    INTRO_MIN_MS: 2000, // first visit of a session: the shortest the curtain stays (so the name can land)
    INTRO_MIN_REPEAT_MS: 800, // later visits in the same session
    INTRO_MAX_MS: 4200, // hard cap: the curtain never waits longer than this, whatever is still loading
    ASSETS_CAP_MS: 3800, // how long to wait for the 3D hero's files
    HOLD_MS: 250, // pause at 100% before the lift
    LETTER_S: 1.0, LETTER_STAGGER: 0.045, WIDTH_FROM: 125, WIDTH_TO: 68, // name letters rise, condensing like your heading morph
    LIFT_S: 1.05,
    // ── index view ──
    PREVIEW_OFFSET: 28, // px between the cursor and the preview
    // ── gallery ──
    REVEAL_S: 1.1, GALLERY_STAGGER: 0.12, SCALE_FROM: 1.18, GALLERY_START: 'top 88%',
    // ── parallax ──
    PARALLAX_PCT: 4, // % of travel each way. Keep small.
  };

  if (!PREMIUM.enabled) return;
  const g = window.gsap;
  if (!g) { console.warn('[premium] GSAP not loaded: the site runs without the premium layer'); return; }
  const ST = window.ScrollTrigger;
  if (ST) { g.registerPlugin(ST); ST.config({ ignoreMobileResize: true }); }

  const root = document.documentElement;
  const $ = (s, scope = document) => scope.querySelector(s);
  const $$ = (s, scope = document) => Array.from(scope.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pad = (n) => String(n).padStart(2, '0');
  const safely = (name, fn) => { try { fn(); } catch (e) { console.warn('[premium] "' + name + '" skipped:', e); } };
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  function whenReady(sel, fn, ms = 15000) {
    if ($(sel)) return fn();
    const mo = new MutationObserver(() => { if (!$(sel)) return; mo.disconnect(); fn(); });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), ms);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     1. LOADING CURTAIN
     script.js calls this in place of its own curtain. The promise resolves the moment the curtain starts to lift,
     which is when the hero sequence (name drawing in, 3D letters arriving) begins: they pick up exactly as it lifts.
     ══════════════════════════════════════════════════════════════════════════ */
  if (PREMIUM.intro) {
    window.PREMIUM_INTRO = (curtain, counter, bar) =>
      new Promise((resolve) => {
        const seen = store.get('intro_seen') === '1' && !/[?&]intro=full/.test(location.search);
        const minMs = reduced ? 300 : seen ? T.INTRO_MIN_REPEAT_MS : T.INTRO_MIN_MS;
        const l1 = $('.l1', curtain), l2 = $('.l2', curtain), line = $('.pline', curtain), track = bar.parentNode;

        // the name, split into letters, each in its own mask
        $$('.pnw', curtain).forEach((w) => {
          const text = w.textContent.trim();
          w.textContent = '';
          for (const ch of text) {
            const o = document.createElement('span'); o.className = 'po';
            const i = document.createElement('span'); i.className = 'pi'; i.textContent = ch;
            o.appendChild(i); w.appendChild(o);
          }
        });
        const letters = $$('.pi', curtain);
        g.set(letters, { yPercent: 115, '--wd': T.WIDTH_FROM });
        g.set(line, { opacity: 0, y: 14 });
        g.set(l1, { borderBottomLeftRadius: '0% 0vh', borderBottomRightRadius: '0% 0vh' });
        curtain.classList.add('x-ready');

        // wait briefly for Archivo so the name never shows in a fallback face
        const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
        Promise.race([fontsReady, new Promise((r) => setTimeout(r, 700))]).then(() => {
          if (reduced || seen) { g.set(letters, { yPercent: 0, '--wd': T.WIDTH_TO }); g.set(line, { opacity: 1, y: 0 }); return; }
          g.to(letters, { yPercent: 0, '--wd': T.WIDTH_TO, duration: T.LETTER_S, stagger: T.LETTER_STAGGER, ease: 'expo.out' });
          g.to(line, { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: 'expo.out' });
        });

        // real progress: fonts 30%, page load 35%, the 3D hero's files 35% (each capped, so a slow file cannot hold the curtain)
        const real = { fonts: 0, load: document.readyState === 'complete' ? 1 : 0, assets: window.__hero3dReady ? 0 : 1 };
        fontsReady.then(() => { real.fonts = 1; });
        if (!real.load) addEventListener('load', () => { real.load = 1; }, { once: true });
        if (window.__hero3dReady) Promise.race([window.__hero3dReady, new Promise((r) => setTimeout(r, T.ASSETS_CAP_MS))]).then(() => { real.assets = 1; });

        const proxy = { v: 0 };
        g.to(proxy, { v: 1, duration: minMs / 1000, ease: 'power2.inOut' }); // the minimum time, so the name can land
        const t0 = performance.now();
        let lifted = false;
        const lift = () => {
          if (lifted) return;
          lifted = true;
          g.ticker.remove(tick);
          counter.textContent = '100'; g.set(bar, { scaleX: 1 });
          store.set('intro_seen', '1');
          root.classList.remove('pre');
          const tl = g.timeline({ onComplete: () => { curtain.classList.add('out'); curtain.remove(); } });
          if (reduced) { tl.to(curtain, { opacity: 0, duration: 0.3, ease: 'power1.out' }); resolve(); return; }
          const d = seen ? T.LIFT_S * 0.8 : T.LIFT_S;
          tl.to(letters, { yPercent: -115, duration: 0.6, stagger: 0.02, ease: 'power3.in' }, 0)
            .to([line, counter, track], { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0)
            .to(l1, { yPercent: -101, borderBottomLeftRadius: '50% 14vh', borderBottomRightRadius: '50% 14vh', duration: d, ease: 'expo.inOut' }, 0.12)
            .to(l2, { yPercent: -101, duration: d, ease: 'expo.inOut' }, 0.24)
            .add(resolve, 0.12); // the hero sequence starts here, as the curtain moves
        };
        function tick() {
          const capped = performance.now() - t0 > T.INTRO_MAX_MS;
          const shown = Math.min(proxy.v, capped ? 1 : 0.3 * real.fonts + 0.35 * real.load + 0.35 * real.assets);
          counter.textContent = String(Math.round(shown * 100)).padStart(3, '0');
          g.set(bar, { scaleX: shown });
          if (shown >= 0.999) { g.ticker.remove(tick); setTimeout(lift, T.HOLD_MS); }
        }
        g.ticker.add(tick);
        setTimeout(lift, T.INTRO_MAX_MS + 600); // failsafe
      });
  }

  /* ══════════════════════════════════════════════════════════════════════════
     2. GRID / INDEX
     ══════════════════════════════════════════════════════════════════════════ */
  function initIndex() {
    const grid = $('#grid'), chips = $('#chips');
    if (!grid || !chips) return;
    const tiles = $$('.tile', grid);

    // rows are built from the cards themselves, so the two views can never disagree
    const list = document.createElement('ol');
    list.className = 'x-index'; list.id = 'xIndex'; list.hidden = true;
    list.setAttribute('aria-label', 'Projects, index view');
    const rows = tiles.map((tile) => {
      const a = $('a[data-panel]', tile);
      const [cat, year] = ($('p', a).textContent || '').split(' · ');
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.getAttribute('href'); link.setAttribute('data-panel', ''); link.setAttribute('data-cur', 'View');
      const mk = (cls, text) => { const s = document.createElement('span'); s.className = cls; if (text != null) s.textContent = text; return s; };
      const th = mk('xth'); const im = document.createElement('img');
      im.src = $('img', a).getAttribute('src'); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; th.appendChild(im);
      link.append(mk('xn mono'), mk('xt', $('h3', a).textContent), mk('xc', cat || ''), mk('xy', year || ''), th);
      li.appendChild(link);
      list.appendChild(li);
      return { li, link, tile, src: im.src };
    });
    grid.after(list);

    const sync = () => { // follows the category filter; numbers follow what is visible
      let n = 0;
      rows.forEach((r) => { r.li.hidden = r.tile.hidden; if (!r.tile.hidden) $('.xn', r.link).textContent = pad(++n); });
    };

    // the toggle lives in the filter row
    const view = document.createElement('div');
    view.className = 'x-view'; view.setAttribute('role', 'group'); view.setAttribute('aria-label', 'View');
    view.innerHTML = '<button type="button" data-v="grid" aria-pressed="true">Grid</button><button type="button" data-v="index" aria-pressed="false">Index</button>';
    chips.appendChild(view);

    let current = 'grid';
    const visTiles = () => tiles.filter((t) => !t.hidden);
    const visRows = () => rows.filter((r) => !r.li.hidden).map((r) => r.li);
    function setView(v, animate) {
      if (v === current) return;
      current = v;
      store.set('works_view', v);
      $$('button', view).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
      g.killTweensOf([...tiles, ...rows.map((r) => r.li)]);
      const toIndex = v === 'index';
      const apply = () => {
        grid.classList.toggle('x-off', toIndex); list.hidden = !toIndex; sync();
        g.set([...tiles, ...rows.map((r) => r.li)], { clearProps: 'opacity,transform' });
        hidePv(true);
        if (!animate || reduced) return;
        const incoming = toIndex ? visRows() : visTiles();
        g.fromTo(incoming, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.035, ease: 'expo.out', clearProps: 'opacity,transform' });
      };
      if (!animate || reduced) { apply(); return; }
      const outgoing = toIndex ? visTiles() : visRows();
      g.to(outgoing, { opacity: 0, y: -10, duration: 0.28, stagger: 0.012, ease: 'power2.out', onComplete: apply });
    }
    view.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setView(b.dataset.v, true); });
    chips.addEventListener('click', (e) => { if (e.target.closest('.chip')) requestAnimationFrame(sync); });

    // preview that follows the cursor (desktop)
    let hidePv = () => {};
    if (FINE) {
      const pv = document.createElement('div');
      pv.className = 'x-pv'; pv.setAttribute('aria-hidden', 'true');
      pv.innerHTML = '<img alt=""><img alt="">';
      document.body.appendChild(pv);
      const imgs = $$('img', pv);
      let top = 0;
      g.set(pv, { autoAlpha: 0, scale: 0.92, xPercent: 0 });
      const dur = reduced ? 0 : 0.5;
      const xTo = g.quickTo(pv, 'x', { duration: dur, ease: 'power3' }), yTo = g.quickTo(pv, 'y', { duration: dur, ease: 'power3' });
      const rTo = g.quickTo(pv, 'rotation', { duration: reduced ? 0 : 0.7, ease: 'power3' });
      let shown = false;
      const place = (x, y, snap) => {
        const w = pv.offsetWidth, h = pv.offsetHeight;
        const px = clamp(x + T.PREVIEW_OFFSET, 12, innerWidth - w - 12), py = clamp(y - h / 2, 12, innerHeight - h - 12);
        if (snap) g.set(pv, { x: px, y: py }); else { xTo(px); yTo(py); }
      };
      const show = (src, x, y) => {
        const next = imgs[top ^ 1], prev = imgs[top];
        if (next.getAttribute('src') !== src) next.setAttribute('src', src);
        g.set(next, { zIndex: 2 }); g.set(prev, { zIndex: 1 });
        g.fromTo(next, { opacity: shown ? 0 : 1 }, { opacity: 1, duration: 0.25, ease: 'power1.out' });
        top ^= 1;
        if (!shown) { place(x, y, true); shown = true; }
        g.to(pv, { autoAlpha: 1, scale: 1, duration: reduced ? 0 : 0.35, ease: 'expo.out', overwrite: 'auto' });
      };
      hidePv = (instant) => { shown = false; g.to(pv, { autoAlpha: 0, scale: 0.92, duration: instant || reduced ? 0 : 0.25, ease: 'power2.out', overwrite: 'auto' }); };
      list.addEventListener('pointermove', (e) => { if (!shown) return; place(e.clientX, e.clientY, false); if (!reduced) rTo(clamp((e.movementX || 0) * 0.15, -7, 7)); });
      list.addEventListener('pointerleave', () => hidePv());
      rows.forEach((r) => {
        r.link.addEventListener('pointerenter', (e) => show(r.src, e.clientX, e.clientY));
        r.link.addEventListener('focusin', () => { const b = r.link.getBoundingClientRect(); show(r.src, b.right - 360, b.top + b.height / 2); place(b.right - 360, b.top + b.height / 2, true); });
        r.link.addEventListener('focusout', () => hidePv());
        r.link.addEventListener('click', () => hidePv(true));
      });
    }

    sync();
    if (store.get('works_view') === 'index') setView('index', false);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     3. PROJECT GALLERY: staggered masked reveal, counter, next card, hero parallax
     ══════════════════════════════════════════════════════════════════════════ */
  function initProject() {
    const panel = $('#panel');
    if (!panel || !ST) return;
    const body = $('.panel-body', panel);
    const cnt = document.createElement('div');
    cnt.className = 'x-cnt mono'; cnt.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cnt);
    let live = [], current = null;
    const kill = () => { live.forEach((t) => t.kill()); live = []; cnt.classList.remove('on'); };
    const keep = (t) => { if (t) (Array.isArray(t) ? t : [t]).forEach((x) => live.push(x)); };

    function mount(project) {
      kill();
      const figs = $$('.gallery figure', project);
      const heroFig = $('.hero-media', project);
      const items = [...(heroFig && $('img', heroFig) ? [heroFig] : []), ...figs];

      // next project card, built from the card already on the page
      const nextLink = $('.pn a:last-child', project);
      let card = null;
      if (PREMIUM.gallery && nextLink) {
        const tileImg = $('#grid a[href="' + nextLink.getAttribute('href') + '"] img');
        card = document.createElement('a');
        card.className = 'x-next'; card.href = nextLink.getAttribute('href'); card.setAttribute('data-swap', ''); card.setAttribute('data-cur', 'Next');
        card.innerHTML = '<span class="mono">Next project</span><span class="tt"></span><span class="im"><img alt="" loading="lazy" decoding="async"></span>';
        $('.tt', card).textContent = $('b', nextLink).textContent;
        const im = $('img', card);
        if (tileImg) { im.src = tileImg.dataset.full || tileImg.getAttribute('src'); im.addEventListener('error', () => { if (im.src !== tileImg.src) im.src = tileImg.src; }, { once: true }); }
        $('.pn', project).before(card);
      }

      if (PREMIUM.gallery && !reduced && figs.length) {
        figs.forEach((f) => f.removeAttribute('data-sa')); // this reveal replaces the generic one
        try {
          const imgsIn = figs.map((f) => $('img', f)).filter(Boolean);
          g.set(figs, { clipPath: 'inset(100% 0% 0% 0%)' });
          g.set(imgsIn, { scale: T.SCALE_FROM });
          keep(ST.batch(figs, {
            scroller: panel, start: T.GALLERY_START, once: true, interval: 0.1, batchMax: 3,
            onEnter: (batch) => {
              g.to(batch, { clipPath: 'inset(0% 0% 0% 0%)', duration: T.REVEAL_S, stagger: T.GALLERY_STAGGER, ease: 'expo.out', overwrite: true });
              g.to(batch.map((f) => $('img', f)).filter(Boolean), { scale: 1, duration: T.REVEAL_S * 1.3, stagger: T.GALLERY_STAGGER, ease: 'power3.out', overwrite: true });
            },
          }));
        } catch (e) { g.set(figs, { clearProps: 'clipPath' }); console.warn('[premium] gallery reveal skipped:', e); }
      }
      if (card && !reduced) {
        g.set(card, { opacity: 0, y: 24 });
        keep(ST.create({ trigger: card, scroller: panel, start: 'top 92%', once: true, onEnter: () => g.to(card, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }) }));
      }

      // "03 / 09": which picture is in view
      if (PREMIUM.gallery && items.length > 1) {
        items.forEach((el, i) => keep(ST.create({ trigger: el, scroller: panel, start: 'top 62%', end: 'bottom 38%',
          onToggle: (s) => { if (s.isActive) { cnt.textContent = pad(i + 1) + ' / ' + pad(items.length); cnt.classList.add('on'); } } })));
        keep(ST.create({ trigger: items[0], scroller: panel, start: 'top 62%', onLeaveBack: () => cnt.classList.remove('on') }));
        if (card) keep(ST.create({ trigger: card, scroller: panel, start: 'top 85%', onEnter: () => cnt.classList.remove('on'), onLeaveBack: () => cnt.classList.add('on') }));
      }

      // controlled parallax on the project's hero image: 4% each way, desktop only
      if (PREMIUM.parallax && FINE && !reduced && heroFig && $('img', heroFig)) {
        const img = $('img', heroFig);
        keep(g.fromTo(img, { yPercent: -T.PARALLAX_PCT, scale: 1.1 }, { yPercent: T.PARALLAX_PCT, ease: 'none',
          scrollTrigger: { trigger: heroFig, scroller: panel, start: 'top bottom', end: 'bottom top', scrub: 0.5 } }));
        heroFig.style.overflow = 'hidden';
      }
    }

    new MutationObserver(() => {
      const pr = $('.project', body);
      if (pr && pr !== current) { current = pr; safely('project', () => mount(pr)); }
      else if (!pr && current) { current = null; kill(); }
    }).observe(body, { childList: true });

    // images change the height as they load: keep the triggers honest
    let rt = 0;
    body.addEventListener('load', () => { clearTimeout(rt); rt = setTimeout(() => ST.refresh(), 150); }, true);
  }

  /* portrait parallax on the home page (desktop only) */
  function initPortrait() {
    if (!PREMIUM.parallax || !FINE || reduced || !ST) return;
    whenReady('.about-photo img', () => {
      const img = $('.about-photo img'), fig = $('.about-photo');
      g.fromTo(img, { yPercent: -T.PARALLAX_PCT, scale: 1.1 }, { yPercent: T.PARALLAX_PCT, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
    }, 20000);
  }

  whenReady('#grid', () => {
    if (PREMIUM.index) safely('index', initIndex);
    if (PREMIUM.gallery || PREMIUM.parallax) safely('project', initProject);
    safely('portrait', initPortrait);
    // positions are final once the curtain has gone and fonts are in
    const refresh = () => ST && ST.refresh();
    if (document.fonts) document.fonts.ready.then(refresh);
    addEventListener('load', refresh);
    new MutationObserver(() => { if (!root.classList.contains('pre')) refresh(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
  });
})();
