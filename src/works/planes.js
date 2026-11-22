/*
 * Phase 6b: the works cards' images drawn as WebGL planes on the world's shared fixed canvas. The DOM cards stay the click, focus,
 * accessibility and fallback layer: a tile switches to plane mode (html .x-pl: DOM image invisible, .th background clear) only after its
 * plane was drawn once, in the same frame, and any failure puts that tile (or all of them) back to the plain DOM image.
 * Lazy chunk: hero-3d.js imports it after the world's first frame (fixed canvas only) and passes the world and THREE, so it imports nothing.
 * Switch: ?planes=off | on (remembered in localStorage pf_planes; ?planes=on clears it).
 * window.__planes (the 8th window global) = { state: 'on'|'off'|'lost', reason, tiles, ready, last }
 *   tiles: tiles found; ready: tiles in plane mode now; last[i]: the last drawn rectangle of tile i, { x, y, w, h } in CSS px (reused objects).
 */

// Tuning: the one place. HOVER_* copy css/style.css (.th img transition 0.7s var(--ease-out), .tile > a:hover .th img scale 1.05); SATURATE copies .th img filter.
const FEEL = {
  HOVER_ZOOM: 1.05, HOVER_MS: 700, HOVER_EASE: [0.2, 0.7, 0.1, 1], // hover / focus-visible image zoom
  SATURATE: 0.8, // CSS saturate() of the card image
  SEGMENTS: 1, // plane subdivisions per side (6c raises this for the wave)
  ANISOTROPY: 4, // texture anisotropy cap
  NEAR: '100%', // tiles within this margin (of the viewport height) above and below are planes
  FAR_VH: 2, // touch: textures further than this many viewport heights away are disposed
  SETTLE_FRAMES: 3, // frames without any change before the layer goes idle
  AFTER_CLICK_MS: 1500, // keep drawing this long after a filter or Grid/Index click (the Grid/Index fade is a GSAP tween: no event marks its end)
  UPLOADS_PER_FRAME: 1,
};

const VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const FS = `
uniform sampler2D uMap; uniform vec2 uSize, uCover; uniform float uRadius, uOpacity, uPx; varying vec2 vUv;
const float S = ${FEEL.SATURATE.toFixed(4)};
const mat3 SAT = mat3(0.213 + 0.787 * S, 0.213 - 0.213 * S, 0.213 - 0.213 * S, 0.715 - 0.715 * S, 0.715 + 0.285 * S, 0.715 - 0.715 * S, 0.072 - 0.072 * S, 0.072 - 0.072 * S, 0.072 + 0.928 * S);
void main() {
  vec2 q = abs((vUv - 0.5) * uSize) - 0.5 * uSize + uRadius;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius; // rounded-rect distance in CSS px
  float a = clamp(0.5 - d / uPx, 0.0, 1.0) * uOpacity; // 1 device px anti-aliasing
  vec3 c = clamp(SAT * texture2D(uMap, 0.5 + (vUv - 0.5) * uCover).rgb, 0.0, 1.0); // raw sRGB, like the DOM image
  gl_FragColor = vec4(c * a, a); // premultiplied
}`;

const CSS = `
html.x-planes #grid .tile { z-index: 2; }
html #grid .tile.x-pl .th { background: transparent; }
html #grid .tile.x-pl .th img.cov { opacity: 0; }`;

// cubic-bezier(x1, y1, x2, y2) easing of a 0..1 progress (a few Newton steps are plenty for the site's curve)
function bezier([x1, y1, x2, y2], x) {
  let t = x;
  for (let i = 0; i < 5; i++) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const f = ((ax * t + bx) * t + cx) * t - x, df = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(df) < 1e-6) break;
    t -= f / df;
  }
  t = Math.min(1, Math.max(0, t));
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy;
  return ((1 - cy - by) * t + by) * t * t + cy * t;
}

export function startPlanes(world, THREE) {
  const P = (window.__planes = { state: 'off', reason: 'starting', tiles: 0, ready: 0, last: [] });
  const root = document.documentElement, renderer = world.renderer, grid = document.getElementById('grid');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const stop = (reason) => { P.state = 'off'; P.reason = reason; return null; };

  let sw = null;
  try {
    sw = new URLSearchParams(location.search).get('planes');
    if (sw === 'off') localStorage.setItem('pf_planes', 'off');
    else if (sw === 'on') localStorage.removeItem('pf_planes');
    else if (sw === null) sw = localStorage.getItem('pf_planes');
  } catch (e) { /* storage blocked */ }
  if (sw === 'off') return stop('?planes=off');
  if (!grid) return stop('no grid');
  if (!document.getElementById('polish-css')) return stop('no polish-css');

  const recs = Array.from(grid.querySelectorAll('.tile'), (tile) => ({
    tile, th: tile.querySelector('.th'), img: tile.querySelector('img.cov'), cs: getComputedStyle(tile),
    near: false, pl: false, draw: false, bad: false, rect: null, o: 1, sz: 1, tex: null, mat: null, mesh: null, src: '', aspect: 1,
    bw: 1, rad: 0, x: 0, y: 0, w: 0, h: 0, op: -1, zoom: 1, hv: 1, hFrom: 1, hTo: 1, hT0: 0, hDur: 0,
  })).filter((r) => r.th && r.img);
  if (!recs.length) return stop('no tiles');
  const byTile = new Map(recs.map((r) => [r.tile, r]));
  P.tiles = recs.length;
  P.last = recs.map(() => ({ x: 0, y: 0, w: 0, h: 0 }));

  const ac = new AbortController();
  const on = (t, type, fn, extra) => t.addEventListener(type, fn, { passive: true, signal: ac.signal, ...extra });
  const style = document.createElement('style');
  style.id = 'planes-css'; style.textContent = CSS; document.head.appendChild(style);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 1, 1e5); // 1 unit = 1 CSS px at z = 0
  const geo = new THREE.PlaneGeometry(1, 1, FEEL.SEGMENTS, FEEL.SEGMENTS);
  const sz = new THREE.Vector2();
  let W = 0, H = 0, hadDrawn = false, calm = 0, until = 0, nearCount = 0, force = false, held = null, heldAt = 0, sawOpen = false, hoverRec = null, focusRec = null;
  const eligible = (r) => r.near && !r.bad && r !== held;

  function fit() { // the camera follows the canvas size (the hero resizes the shared renderer)
    renderer.getSize(sz);
    if (sz.x === W && sz.y === H) return;
    W = sz.x; H = sz.y;
    cam.aspect = W / H; cam.position.z = H / 2 / Math.tan((15 * Math.PI) / 180); cam.far = cam.position.z + 1000; cam.updateProjectionMatrix();
  }
  function refresh() { // border width and inner radius change with layout, not per frame
    for (const r of recs) {
      const s = getComputedStyle(r.th);
      r.bw = parseFloat(s.borderTopWidth) || 0;
      r.rad = Math.max(0, (parseFloat(s.borderTopLeftRadius) || 0) - r.bw);
    }
  }
  function dropPl(r) { if (r.pl) { r.pl = false; r.tile.classList.remove('x-pl'); } }
  function dropTex(r) {
    dropPl(r); r.draw = false;
    if (r.mesh) r.mesh.visible = false;
    if (r.tex) { r.tex.dispose(); r.tex = null; }
  }
  function build(r) { // one texture from the already decoded card image
    const t = new THREE.Texture(r.img);
    t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearMipmapNearestFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true;
    t.anisotropy = Math.min(FEEL.ANISOTROPY, renderer.capabilities.getMaxAnisotropy()); t.needsUpdate = true;
    r.tex = t; r.src = r.img.currentSrc; r.aspect = r.img.naturalWidth / r.img.naturalHeight;
    if (!r.mat) {
      r.mat = new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: FS, transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false,
        uniforms: { uMap: { value: t }, uSize: { value: new THREE.Vector2() }, uCover: { value: new THREE.Vector2(1, 1) }, uRadius: { value: 0 }, uOpacity: { value: 1 }, uPx: { value: 1 } },
      });
      r.mesh = new THREE.Mesh(geo, r.mat); r.mesh.visible = false; scene.add(r.mesh);
    } else r.mat.uniforms.uMap.value = t;
  }
  function draw() { // the world clears once per pass; autoClear off so a full-canvas draw cannot wipe the hero drawn before it
    const ac0 = renderer.autoClear;
    renderer.autoClear = false;
    try { world.renderRegion(scene, cam, 0, 0, W, H); } finally { renderer.autoClear = ac0; }
  }

  const allowed = () => !root.classList.contains('vp-off') && !!document.getElementById('polish-css');
  function sync() { // false while a viewport mode switches motion off: every tile is its DOM image
    if (allowed()) { if (P.state === 'off') { P.state = 'on'; P.reason = ''; root.classList.add('x-planes'); } return true; }
    if (P.state === 'on') { P.state = 'off'; P.reason = 'vp-off'; for (const r of recs) { dropPl(r); r.draw = false; if (r.mesh) r.mesh.visible = false; } P.ready = 0; hadDrawn = false; layer.view(false); }
    return false;
  }
  function fail(reason) { // terminal: everything back to DOM images, everything disposed
    if (P.state === 'lost') return;
    P.state = 'lost'; P.reason = reason; P.ready = 0;
    ac.abort(); io.disconnect(); far.disconnect(); ro.disconnect(); mo.disconnect();
    for (const r of recs) { dropTex(r); if (r.mat) r.mat.dispose(); }
    geo.dispose(); style.remove(); root.classList.remove('x-planes');
    try { layer.view(false); } catch (e) { /* world already gone */ }
  }
  const poke = () => { if (P.state === 'lost') return; if (!layer.inView && nearCount) layer.view(true); layer.wake(); };

  function tick(now) {
    force = false;
    if (!sync()) return;
    fit();
    if (held) { if (!root.classList.contains('panel-open') && (sawOpen || now - heldAt > 2000)) held = null; }
    const dpr = renderer.getPixelRatio(), gridOff = grid.classList.contains('x-off');
    // 1. READ (one batched pass, nothing is written): rectangles, opacity, scroll zoom
    for (const r of recs) {
      r.draw = false;
      r.rect = null;
      if (!eligible(r) || gridOff || r.tile.hidden) continue;
      r.rect = r.th.getBoundingClientRect(); r.o = parseFloat(r.cs.opacity);
      r.sz = parseFloat(r.tile.style.getPropertyValue('--x-z')) || 1; // initImageZoom's own value (desktop only)
    }
    // 2. UPDATE (uniforms, textures): no DOM access
    let moved = false, busy = false, uploads = 0;
    for (let i = 0; i < recs.length; i++) {
      const r = recs[i];
      const b = r.rect;
      if (!b) continue;
      if (r.tex && (r.img.currentSrc !== r.src || !r.img.complete)) dropTex(r); // the image changed under us: rebuild from the new one
      if (!r.tex && r.img.complete && r.img.naturalWidth) {
        if (uploads < FEEL.UPLOADS_PER_FRAME) { try { build(r); uploads++; } catch (e) { r.bad = true; continue; } } else busy = true;
      }
      if (!r.tex) continue;
      // hover / focus-visible zoom: copy of the CSS transition (full duration for the full 1 -> 1.05 travel, reversing from the current value)
      const tgt = r === hoverRec || r === focusRec ? FEEL.HOVER_ZOOM : 1;
      if (tgt !== r.hTo) { r.hFrom = r.hv; r.hTo = tgt; r.hT0 = now; r.hDur = (FEEL.HOVER_MS * Math.abs(tgt - r.hv)) / (FEEL.HOVER_ZOOM - 1); }
      if (r.hv !== r.hTo) {
        const p = r.hDur > 0 ? Math.min(1, (now - r.hT0) / r.hDur) : 1;
        r.hv = p >= 1 ? r.hTo : r.hFrom + (r.hTo - r.hFrom) * bezier(FEEL.HOVER_EASE, p);
        if (p < 1) busy = true;
      }
      const sn = (v) => Math.round(v * dpr) / dpr; // the DOM paints the box on whole device pixels
      const x0 = sn(b.left) + r.bw, y0 = sn(b.top) + r.bw, w = sn(b.right) - r.bw - x0, h = sn(b.bottom) - r.bw - y0;
      const z = r.sz * r.hv, o = r.o;
      if (!(w > 0 && h > 0 && o > 0.001)) { if (o > 0.001 || r.op > 0.001) moved = true; r.op = o; continue; }
      if (Math.abs(x0 - r.x) > 0.01 || Math.abs(y0 - r.y) > 0.01 || Math.abs(w - r.w) > 0.01 || Math.abs(h - r.h) > 0.01 || Math.abs(o - r.op) > 0.002 || Math.abs(z - r.zoom) > 0.0005) moved = true;
      if (o < 0.999) busy = true; // fading (CSS or GSAP): keep following it
      r.x = x0; r.y = y0; r.w = w; r.h = h; r.op = o; r.zoom = z;
      const u = r.mat.uniforms, ra = w / h;
      u.uSize.value.set(w, h); u.uRadius.value = Math.min(r.rad, w / 2, h / 2); u.uOpacity.value = o; u.uPx.value = 1 / dpr;
      u.uCover.value.set((r.aspect > ra ? ra / r.aspect : 1) / z, (r.aspect > ra ? 1 : r.aspect / ra) / z);
      r.mesh.position.set(x0 + w / 2 - W / 2, H / 2 - (y0 + h / 2), 0); r.mesh.scale.set(w, h, 1);
      const l = P.last[i]; l.x = x0; l.y = y0; l.w = w; l.h = h;
      r.draw = true; r.mesh.visible = true;
    }
    for (const r of recs) if (!r.draw && r.mesh) r.mesh.visible = false;
    // 3. DRAW (also once with nothing visible, to wipe what was drawn before)
    let any = false;
    for (const r of recs) if (r.draw) { any = true; break; }
    if (any || hadDrawn) draw();
    hadDrawn = any;
    // 4. HAND OVER, in this same frame: a tile becomes a plane only after its plane was drawn
    let ready = 0;
    for (const r of recs) {
      if (r.draw && !r.pl) { r.pl = true; r.tile.classList.add('x-pl'); } else if (!r.draw) dropPl(r);
      if (r.pl) ready++;
    }
    P.ready = ready;
    if (!nearCount) layer.view(false);
    // 5. next frame? only while something changed in the last SETTLE_FRAMES frames, is animating or uploading
    calm = moved ? 0 : calm + 1;
    if (nearCount && (calm < FEEL.SETTLE_FRAMES || busy || now < until || grid.getAnimations({ subtree: true }).length)) layer.wake();
  }
  function frame(now) { try { tick(now); } catch (err) { fail('runtime error: ' + (err && err.message)); } }
  function redraw() { if (P.state === 'on' && hadDrawn) { try { draw(); } catch (err) { fail('runtime error: ' + (err && err.message)); } } }

  const layer = world.add({
    frame, redraw, lost: () => fail('WebGL context was lost'),
    visible: (shown) => { if (shown) poke(); },
    urgent: () => force && !world.frozen(), // touch: a scroll-forced frame skips the world's frame-rate cap; never while frozen
  });

  // tiles near the viewport are planes; touch also frees the textures of tiles far away
  const io = new IntersectionObserver((en) => {
    for (const e of en) { const r = byTile.get(e.target); r.near = e.isIntersecting; if (!r.near) dropPl(r); }
    nearCount = 0; for (const r of recs) if (r.near) nearCount++;
    poke();
  }, { rootMargin: FEEL.NEAR + ' 0px' });
  const far = new IntersectionObserver((en) => { for (const e of en) if (!e.isIntersecting) dropTex(byTile.get(e.target)); }, { rootMargin: FEEL.FAR_VH * 100 + '% 0px' });
  recs.forEach((r) => { io.observe(r.tile); if (!FINE) far.observe(r.tile); });

  const ro = new ResizeObserver(() => { refresh(); poke(); });
  ro.observe(grid);
  const mo = new MutationObserver(() => { if (root.classList.contains('panel-open')) sawOpen = true; poke(); });
  mo.observe(root, { attributes: true, attributeFilter: ['class', 'data-vp'] });

  on(window, 'scroll', () => { force = true; poke(); });
  on(window, 'resize', () => { force = true; refresh(); poke(); });
  ['pointerdown', 'pointerup', 'pointercancel', 'transitionrun'].forEach((t) => on(grid, t, poke));
  on(grid, 'pointerover', (e) => { const t = FINE && e.pointerType === 'mouse' && e.target.closest('.tile'); hoverRec = (t && byTile.get(t)) || null; poke(); });
  on(grid, 'pointerleave', () => { hoverRec = null; poke(); });
  on(grid, 'focusin', (e) => { const t = e.target.closest('.tile'); focusRec = (t && e.target.matches(':focus-visible') && byTile.get(t)) || null; poke(); });
  on(grid, 'focusout', () => { focusRec = null; poke(); });
  on(grid, 'load', poke, { capture: true }); // a card image finished loading
  on(document, 'click', (e) => { if (e.target.closest && e.target.closest('#chips')) { until = performance.now() + FEEL.AFTER_CLICK_MS; poke(); } }); // filter chips and the Grid/Index toggle
  // Before polish.js's click handler (window capture runs first): the clicked tile is its DOM image again, so the View Transition snapshots a real image.
  // It stays so until the panel has been opened and closed again (or 2 s passed without a panel).
  on(window, 'click', (e) => {
    const t = e.target.closest && e.target.closest('#grid .tile'), r = t && byTile.get(t);
    if (!r) return;
    dropPl(r); r.draw = false; held = r; heldAt = performance.now(); sawOpen = false;
  }, { capture: true });

  refresh();
  poke();
  return { stop: () => fail('stopped') };
}
