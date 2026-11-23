/*
 * Phase 6b: the works cards' images drawn as WebGL planes on the world's shared fixed canvas. The DOM cards stay the click, focus,
 * accessibility and fallback layer: a tile switches to plane mode (html .x-pl: DOM image invisible, .th background clear) only after its
 * plane was drawn once, in the same frame, and any failure puts that tile (or all of them) back to the plain DOM image.
 * Lazy chunk: hero-3d.js imports it after the world's first frame (fixed canvas only) and passes the world and THREE, so it imports nothing.
 * Phase 6c: scroll wave. The scrollY of the frame (read in the batched READ pass) gives a smoothed, clamped scroll speed; the vertex shader shifts the card's
 * middle along the scroll with a half sine over the card's height, so the top and bottom edges stay on the DOM card and the sides only slide along themselves.
 * Phase 6d: desktop hover (mouse / pen behind hover:hover + pointer:fine): a fast blur pulse (uBlur, 9 taps only while > 0) and a pointer fisheye (uLens, uLensC) on the hovered
 * tile; touch: a subtle press zoom of the image, cancelled the moment the touch moves or becomes a scroll. Each effect is a 0..1 progress ramped linearly per frame time
 * (reverses from where it is), then smoothstepped; at rest every uniform is 0 and the shader takes the 6c path.
 * Phase 6e: while polish.js runs its reverse View Transition on close (html.x-vt-close, the card carries data-x-hold) that one card stays its DOM image (vtHold); it is a plane again once the class is gone.
 * Switch: ?planes=off | on (remembered in localStorage pf_planes; ?planes=on clears it).
 * window.__planes (the 8th window global) = { state: 'on'|'off'|'lost', reason, tiles, ready, last }
 *   tiles: tiles found; ready: tiles in plane mode now; last[i]: the last drawn rectangle of tile i, { x, y, w, h } in CSS px (reused objects).
 */

// Tuning: the one place. HOVER_* copy css/style.css (.th img transition 0.7s var(--ease-out), .tile > a:hover .th img scale 1.05); SATURATE copies .th img filter.
const FEEL = {
  HOVER_ZOOM: 1.05, HOVER_MS: 700, HOVER_EASE: [0.2, 0.7, 0.1, 1], // hover / focus-visible image zoom
  SATURATE: 0.8, // CSS saturate() of the card image
  SEGMENTS: 24, // plane subdivisions along the card's height (the wave bends it there): at full wave 0.08 px of chord error and a 4.1% strain step per segment on a 350 px card
  WAVE_AMP: 0.10, // full wave: the card's middle shifts this fraction of the card's height (sign flips the direction: + lags behind the scroll)
  WAVE_TOUCH: 0.7, // touch multiplier of the wave
  WAVE_VMAX: 1.4, // scroll speed in px per ms that is a full wave (faster is clamped)
  WAVE_TAU_MS: 100, // smoothing time constant of the scroll speed
  WAVE_EPS: 0.01, // below this fraction of a full wave it is exactly zero
  GAP_MS: 200, // a longer gap between two frames (idle, panel open) has no speed history
  BLUR_PX: 5, BLUR_IN_MS: 120, BLUR_OUT_MS: 350, // hover blur pulse: tap spacing in card px at the peak (TUNE 1: raise for a stronger blur), time to rise, time to clear
  LENS_STRENGTH: 0.25, LENS_R: 170, LENS_IN_MS: 180, LENS_OUT_MS: 260, // pointer fisheye: magnification at the pointer 1/(1 - strength) (TUNE 2), radius in card px, time to build, time to clear
  PRESS_ZOOM: 1.04, PRESS_IN_MS: 150, PRESS_OUT_MS: 300, PRESS_CANCEL_MS: 80, PRESS_SLOP: 10, // touch press: image zoom, in, out, out when the touch turns into a scroll, movement in px that cancels it
  FIRST_MS: 16, // effect ramps: the frame time used for the first frame after a gap
  ANISOTROPY: 4, // texture anisotropy cap
  NEAR: '100%', // tiles within this margin (of the viewport height) above and below are planes
  FAR_VH: 2, // touch: textures further than this many viewport heights away are disposed
  SETTLE_FRAMES: 3, // frames without any change before the layer goes idle
  AFTER_CLICK_MS: 1500, // keep drawing this long after a filter or Grid/Index click (the Grid/Index fade is a GSAP tween: no event marks its end)
  UPLOADS_PER_FRAME: 1,
};

const VS = `
uniform float uWave; varying vec2 vUv; // uWave: shift of the card's middle as a fraction of its height, positive = towards the bottom of the screen
void main() {
  vUv = uv;
  vec3 p = position; p.y -= uWave * sin(3.14159265 * uv.y);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FS = `
uniform sampler2D uMap; uniform vec2 uSize, uCover, uLensC; uniform float uRadius, uOpacity, uPx, uBlur, uLens; varying vec2 vUv;
const float LR = ${FEEL.LENS_R.toFixed(1)}, BLUR = ${FEEL.BLUR_PX.toFixed(2)};
const float S = ${FEEL.SATURATE.toFixed(4)};
const mat3 SAT = mat3(0.213 + 0.787 * S, 0.213 - 0.213 * S, 0.213 - 0.213 * S, 0.715 - 0.715 * S, 0.715 + 0.285 * S, 0.715 - 0.715 * S, 0.072 - 0.072 * S, 0.072 - 0.072 * S, 0.072 + 0.928 * S);
void main() {
  vec2 q = abs((vUv - 0.5) * uSize) - 0.5 * uSize + uRadius;
  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius; // rounded-rect distance in CSS px
  float a = clamp(0.5 - d / uPx, 0.0, 1.0) * uOpacity; // 1 device px anti-aliasing
  vec2 p = vUv;
  if (uLens > 0.0) { // fisheye: samples nearer the pointer, nothing beyond LR moves, never folds (uLens < 1)
    float k = 1.0 - clamp(length((vUv - uLensC) * uSize) / LR, 0.0, 1.0);
    p = uLensC + (vUv - uLensC) * (1.0 - uLens * k * k);
  }
  vec2 st = 0.5 + (p - 0.5) * uCover;
  vec3 c = texture2D(uMap, st).rgb; // raw sRGB, like the DOM image
  if (uBlur > 0.0) { // 3x3 tent, tap spacing uBlur * BLUR card px
    vec2 o = uBlur * BLUR / uSize * uCover, ox = vec2(o.x, 0.0), oy = vec2(0.0, o.y);
    c = (c * 4.0 + (texture2D(uMap, st + ox).rgb + texture2D(uMap, st - ox).rgb + texture2D(uMap, st + oy).rgb + texture2D(uMap, st - oy).rgb) * 2.0
      + texture2D(uMap, st + o).rgb + texture2D(uMap, st - o).rgb + texture2D(uMap, st + vec2(o.x, -o.y)).rgb + texture2D(uMap, st + vec2(-o.x, o.y)).rgb) / 16.0;
  }
  c = clamp(SAT * c, 0.0, 1.0);
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

const smooth = (v) => v * v * (3 - 2 * v);
const ramp = (v, to, d) => (to > v ? Math.min(to, v + d) : Math.max(to, v - d)); // v moves towards `to` by at most d

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
    bl: 0, bUp: false, ln: 0, pr: 0, isHov: false, lu: 0.5, lv: 0.5, // 6d: blur pulse, lens and press progress (0..1), pulse rising, hovered last frame, lens centre in card uv
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
  const geo = new THREE.PlaneGeometry(1, 1, 1, FEEL.SEGMENTS); // shared by every tile; disposed in fail()
  const sz = new THREE.Vector2();
  const uWave = { value: 0 }; // one uniform object shared by every tile's material
  const AMP = FEEL.WAVE_AMP * (FINE ? 1 : FEEL.WAVE_TOUCH), REDUCED = matchMedia('(prefers-reduced-motion: reduce)'); // planes never start with reduced motion; this guards a runtime change
  let wv = 0, wY = 0, wT = -1e9; // smoothed scroll speed (px per ms), the last frame's scrollY and time
  let W = 0, H = 0, hadDrawn = false, calm = 0, until = 0, nearCount = 0, force = false, held = null, heldAt = 0, sawOpen = false, hoverRec = null, focusRec = null, vtHold = null;
  let pointerX = 0, pointerY = 0, pressRec = null, pressX = 0, pressY = 0, pressFast = false; // 6d: last mouse position (viewport px), the tile under a touch and where it started
  const eligible = (r) => r.near && !r.bad && r !== held && r !== vtHold;

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
  function clearFx(r) { r.bl = r.ln = r.pr = 0; r.bUp = r.isHov = false; }
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
        uniforms: { uMap: { value: t }, uSize: { value: new THREE.Vector2() }, uWave: uWave, uCover: { value: new THREE.Vector2(1, 1) }, uRadius: { value: 0 }, uOpacity: { value: 1 }, uPx: { value: 1 }, uBlur: { value: 0 }, uLens: { value: 0 }, uLensC: { value: new THREE.Vector2(0.5, 0.5) } },
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
    if (P.state === 'on') { P.state = 'off'; P.reason = 'vp-off'; for (const r of recs) { dropPl(r); clearFx(r); r.draw = false; if (r.mesh) r.mesh.visible = false; } P.ready = 0; hadDrawn = false; layer.view(false); }
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
    const fx = !REDUCED.matches && !root.classList.contains('panel-open'); // 6d effects: off for reduced motion (runtime) and while a panel is open
    // 1. READ (one batched pass, nothing is written): scrollY, rectangles, opacity, scroll zoom
    const sy = window.scrollY;
    for (const r of recs) {
      r.draw = false;
      r.rect = null;
      if (!eligible(r) || gridOff || r.tile.hidden) { clearFx(r); continue; }
      r.rect = r.th.getBoundingClientRect(); r.o = parseFloat(r.cs.opacity);
      r.sz = parseFloat(r.tile.style.getPropertyValue('--x-z')) || 1; // initImageZoom's own value (desktop only)
    }
    // 2. UPDATE (uniforms, textures): no DOM access
    let moved = false, busy = false, uploads = 0;
    const dt = now - wT, fdt = dt <= 0 ? 0 : dt < FEEL.GAP_MS ? dt : FEEL.FIRST_MS; // frame time of the 6d ramps
    if (pressRec && wv !== 0) { pressRec = null; pressFast = true; } // never a press zoom during a scroll wave
    // scroll wave: exponential smoothing of the scroll speed, exactly zero below WAVE_EPS
    if (dt > 0) {
      if (dt < FEEL.GAP_MS) wv += (Math.max(-FEEL.WAVE_VMAX, Math.min(FEEL.WAVE_VMAX, (sy - wY) / dt)) - wv) * (1 - Math.exp(-dt / FEEL.WAVE_TAU_MS));
      else wv = 0;
      wY = sy; wT = now;
    }
    if (REDUCED.matches || Math.abs(wv) < FEEL.WAVE_EPS * FEEL.WAVE_VMAX) wv = 0;
    uWave.value = (wv / FEEL.WAVE_VMAX) * AMP;
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
      // 6d: blur pulse and lens (hovered tile, mouse / pen), press zoom (touch); ramps run on frame time and reverse from the current value
      if (!fx) clearFx(r);
      const hov = fx && r === hoverRec, prs = fx && r === pressRec, b0 = r.bl, l0 = r.ln, p0 = r.pr;
      if (hov !== r.isHov) { r.isHov = hov; r.bUp = hov; } // entering starts a pulse, leaving lets it fall from where it is
      r.bl = ramp(r.bl, r.bUp ? 1 : 0, fdt / (r.bUp ? FEEL.BLUR_IN_MS : FEEL.BLUR_OUT_MS));
      if (r.bl === 1) r.bUp = false; // the pulse clears back while the pointer stays
      r.ln = ramp(r.ln, hov ? 1 : 0, fdt / (hov ? FEEL.LENS_IN_MS : FEEL.LENS_OUT_MS));
      r.pr = ramp(r.pr, prs ? 1 : 0, fdt / (prs ? FEEL.PRESS_IN_MS : pressFast ? FEEL.PRESS_CANCEL_MS : FEEL.PRESS_OUT_MS));
      if (r.bl !== b0 || r.ln !== l0 || r.pr !== p0) moved = true;
      if (r.bl > 0 || r.ln !== (hov ? 1 : 0) || r.pr !== (prs ? 1 : 0)) busy = true;
      const sn = (v) => Math.round(v * dpr) / dpr; // the DOM paints the box on whole device pixels
      const x0 = sn(b.left) + r.bw, y0 = sn(b.top) + r.bw, w = sn(b.right) - r.bw - x0, h = sn(b.bottom) - r.bw - y0;
      const z = r.sz * r.hv * (1 + (FEEL.PRESS_ZOOM - 1) * smooth(r.pr)), o = r.o;
      if (!(w > 0 && h > 0 && o > 0.001)) { if (o > 0.001 || r.op > 0.001) moved = true; r.op = o; continue; }
      if (Math.abs(x0 - r.x) > 0.01 || Math.abs(y0 - r.y) > 0.01 || Math.abs(w - r.w) > 0.01 || Math.abs(h - r.h) > 0.01 || Math.abs(o - r.op) > 0.002 || Math.abs(z - r.zoom) > 0.0005) moved = true;
      if (o < 0.999) busy = true; // fading (CSS or GSAP): keep following it
      r.x = x0; r.y = y0; r.w = w; r.h = h; r.op = o; r.zoom = z;
      const u = r.mat.uniforms, ra = w / h;
      u.uSize.value.set(w, h); u.uRadius.value = Math.min(r.rad, w / 2, h / 2); u.uOpacity.value = o; u.uPx.value = 1 / dpr;
      u.uCover.value.set((r.aspect > ra ? ra / r.aspect : 1) / z, (r.aspect > ra ? 1 : r.aspect / ra) / z);
      u.uBlur.value = smooth(r.bl); u.uLens.value = FEEL.LENS_STRENGTH * smooth(r.ln);
      if (hov) { // the pointer in card uv from the rectangle already read this frame (no layout read of its own); a leaving lens keeps its last centre
        const lu = (pointerX - x0) / w, lv = 1 - (pointerY - y0) / h;
        if (Math.abs(lu - r.lu) > 0.0005 || Math.abs(lv - r.lv) > 0.0005) moved = true;
        r.lu = lu; r.lv = lv;
      }
      if (r.ln > 0) u.uLensC.value.set(r.lu, r.lv);
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
    if (wv !== 0 && any) moved = true; // a frame with the wave is a frame that moved
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
  const mo = new MutationObserver(() => {
    if (root.classList.contains('panel-open')) { sawOpen = true; pressRec = null; for (const r of recs) clearFx(r); } // a panel opening ends every 6d effect
    if (!root.classList.contains('x-vt-close')) vtHold = null; // 6e: the reverse transition is over
    else if (!vtHold) { const t = grid.querySelector('.tile[data-x-hold]'), r = t && byTile.get(t); if (r) { vtHold = r; dropPl(r); clearFx(r); r.draw = false; } } // once per close, never per frame
    poke();
  });
  mo.observe(root, { attributes: true, attributeFilter: ['class', 'data-vp'] });

  on(window, 'scroll', () => { force = true; if (pressRec) { pressRec = null; pressFast = true; } poke(); }); // a scroll cancels a press at once
  on(window, 'resize', () => { force = true; refresh(); poke(); });
  on(grid, 'transitionrun', poke);
  on(grid, 'pointerover', (e) => { // hover: mouse or pen on a fine-pointer device, never touch
    const t = FINE && e.pointerType !== 'touch' && e.target.closest('.tile');
    hoverRec = (t && byTile.get(t)) || null;
    if (hoverRec) { pointerX = e.clientX; pointerY = e.clientY; }
    poke();
  });
  on(grid, 'pointermove', (e) => {
    if (e.pointerType !== 'touch') { if (hoverRec) { pointerX = e.clientX; pointerY = e.clientY; poke(); } return; }
    if (pressRec && Math.hypot(e.clientX - pressX, e.clientY - pressY) > FEEL.PRESS_SLOP) { pressRec = null; pressFast = true; poke(); } // the touch is becoming a scroll
  });
  on(grid, 'pointerdown', (e) => { // touch press (not during a scroll wave)
    const t = e.pointerType === 'touch' && e.isPrimary && wv === 0 && e.target.closest('.tile');
    pressRec = (t && byTile.get(t)) || null; pressFast = false; pressX = e.clientX; pressY = e.clientY; poke();
  });
  on(grid, 'pointerup', () => { pressRec = null; poke(); });
  on(grid, 'pointercancel', () => { pressRec = null; pressFast = true; poke(); });
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
    dropPl(r); clearFx(r); r.draw = false; held = r; heldAt = performance.now(); sawOpen = false;
  }, { capture: true });

  refresh();
  poke();
  return { stop: () => fail('stopped') };
}
