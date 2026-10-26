/*
 * hero-3d.js — isolated add-on. It never edits script.js, style.css, extras.js, fixes.js or about-photo.js.
 * It only ADDS: one <style>, one <div> inside the hero (canvas + ghost text), and one ring <div>. Nothing existing is renamed or removed.
 *
 * Look and behaviour follow your prototype (portfolio-3d.html): clay letters in two rows, collision physics,
 * a pull toward the cursor, and a glowing ring that reveals the mesh inside it.
 *
 * Switch it all off with ONE flag: HERO3D.enabled = false (or delete the <script src="hero-3d.js"> line in index.html).
 * Flag off, no WebGL, Data Saver on, or the 3D files failing to load: none of the new CSS is applied,
 * so the hero is exactly the hero you had before. Every one of those cases says why in the console.
 *
 * Files it uses: vendor/three.min.js (three r128) and hero-3d-model.js (your portfolio.glb as base64 text,
 * so it also works when you open index.html straight from disk).
 */
(() => {
  'use strict';

  /* ══════════════════════════════════════════════════════════════════════════
     FLAGS
     ══════════════════════════════════════════════════════════════════════════ */
  const HERO3D = {
    enabled: true, // MASTER SWITCH. false = this file does nothing at all.
    layout: true, // name on one line, hairlines hidden, 3D cluster under the name. false = 3D only, hero layout untouched.
    pull: true, // desktop: the cluster is pulled toward the cursor
    portal: true, // the ring that reveals the mesh
    touchHold: true, // phones: press and hold on the 3D area, then drag, to move the ring
    three: 'vendor/three.min.js',
    model: 'hero-3d-model.js',
  };

  /* ══════════════════════════════════════════════════════════════════════════
     TUNABLES — art-direct by editing these numbers
     ══════════════════════════════════════════════════════════════════════════ */
  const T = {
    // ── name ──
    BREAKPOINT: 900, // px. At and above: one line. Below: AHMAD over NAHASS (same breakpoint as your work grid).
    NAME_FIT: 0.92, // how much of the free width the name fills. 1 = touching the page padding; .92 leaves a safe margin
    //                 so the cursor morph (letters widen near the pointer) does not push the ends off screen.
    NAME_ONE_LINE_EM: 6.196, NAME_TWO_LINE_EM: 3.178, // only a first-paint fallback: the page then MEASURES the real name and sets the exact size
    PAGE_PAD: 36, SCROLLBAR_RESERVE: 20, // px

    // ── region the 3D lives in (under the name) ──
    REGION_H_WIDE: 'clamp(300px, 50svh, 540px)',
    REGION_H_NARROW: 'clamp(230px, 34svh, 330px)',
    FILL_W: 0.86, FILL_H: 0.74, // how much of the region the cluster may use (the rest is room for tilt and pull)

    // ── motion: values from your prototype ──
    PULL: 0.3, // how far a letter is pulled toward the cursor (share of the distance). Higher = stronger.
    FALLOFF: 0.4, // how wide the cursor's influence is, in world units squared
    K: 60, C: 8.5, // spring stiffness and damping of the letters
    LIFT: 0.22, TILT: 0.75, EASE: 0.07, // forward lift, turn toward the cursor, and how smoothly both follow
    FLOAT_Y: 0.012, FLOAT_ROLL: 0.03, // idle float
    THICK: 1.8, // letters are made this much thicker (chunkier, like the reference)
    RELAX_PASSES: 300, // on load, overlapping letters are pushed until they just touch

    // ── ring ──
    OPEN_DIST: 0.42, OPEN_HOLD: 300, // ring opens within this distance of a letter (world units) and stays open this long (ms)
    RING_IDLE: 20, RING_OPEN_MAX: 150, // radius in px when idle and when open (open scales down in small regions)
    RING_FOLLOW: 0.22, RING_EASE: 0.12, // how the ring follows the cursor and opens
    WIRE_INSET: 22, // the mesh circle sits this many px inside the ring line

    // ── colours (clay, from your prototype) ──
    CLAY_DARK: '#a8a8a8', CLAY_LIGHT: '#8f8f8d', // letter colour in dark and light mode
    CLAY_TINT: 0.12, // 0–1: how much of your accent colour the clay picks up (0 = pure grey like the prototype)
    ROUGH: 0.85,
    WIRE: '#111111', WIRE_OPACITY: 0.35,
    GHOST_ALPHA: 0.045, // faint PORT / FOLIO behind the letters

    // ── phones ──
    HOLD_MS: 380, HOLD_SLOP_PX: 10, // press this long, without moving more than this, to start the ring
    TOUCH_OFFSET_PX: 80, // the ring sits this far above the finger

    DPR_MAX: 2, DPR_MAX_TOUCH: 1.5, FOV: 30,
  };

  /* Each letter, from your prototype. p: px in the 1200x900 reference image · s: scale · r: rotation in degrees (x, y, z) ·
     k: collision circles [x, y, radius] in letter units. Order: P O R T F O L I O. */
  const LETTERS = [
    { p: [290, 325], s: 1.0, r: [-10, 14, 6], k: [[-0.1, -0.15, 0.1], [-0.1, 0, 0.11], [-0.1, 0.15, 0.11], [0.06, 0.12, 0.13]] },
    { p: [480, 350], s: 1.05, r: [-14, 26, 10], k: [[0, 0, 0.24]] },
    { p: [665, 345], s: 1.0, r: [-8, -16, -9], k: [[-0.1, -0.15, 0.1], [-0.1, 0.05, 0.12], [0, 0.15, 0.12], [0.08, -0.12, 0.12]] },
    { p: [845, 325], s: 1.1, r: [-12, -20, -10], k: [[-0.13, 0.17, 0.1], [0, 0.17, 0.1], [0.13, 0.17, 0.1], [0, -0.05, 0.1], [0, -0.2, 0.08]] },
    { p: [270, 555], s: 1.0, r: [-5, 8, -6], k: [[-0.07, -0.15, 0.09], [-0.07, 0, 0.1], [-0.07, 0.17, 0.1], [0.08, 0.18, 0.09], [0.06, 0.02, 0.08]] },
    { p: [440, 565], s: 1.0, r: [0, 6, 0], k: [[0, 0, 0.24]] },
    { p: [630, 565], s: 1.0, r: [-10, -42, 4], k: [[-0.1, -0.15, 0.1], [-0.1, 0, 0.1], [-0.1, 0.15, 0.1], [0, -0.2, 0.08], [0.1, -0.2, 0.08]] },
    { p: [765, 560], s: 1.05, r: [-5, 55, 0], k: [[0, -0.18, 0.06], [0, 0, 0.06], [0, 0.18, 0.06]] },
    { p: [915, 570], s: 1.12, r: [-5, -15, 8], k: [[0, 0, 0.24]] },
  ];
  const REF_SCALE = 375; // reference px per world unit (the 1200x900 image is 3.2 x 2.4 units)

  if (!HERO3D.enabled) return;
  const debug = new URLSearchParams(location.search).get('debug') === '1';
  const status = { state: 'starting', reason: '' };
  window.__hero3d = status;
  const note = (state, reason, level) => {
    status.state = state; status.reason = reason || '';
    if (reason) console[level || 'info']('[hero-3d] ' + state + ': ' + reason);
    const el = document.getElementById('hero3d-status');
    if (el) el.textContent = 'hero-3d: ' + state + (reason ? '\n' + reason : '');
  };
  if (debug) {
    const el = document.createElement('div');
    el.id = 'hero3d-status';
    el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:95;background:#000c;color:#fff;font:10px/1.4 monospace;padding:6px 8px;white-space:pre;max-width:90vw;pointer-events:none';
    (document.body || document.documentElement).appendChild(el);
    setInterval(() => {
      const h = document.querySelector('.hero'), n = document.getElementById('heroName'), r = document.querySelector('.x-h3d');
      el.textContent = 'hero-3d: ' + status.state + (status.reason ? '\n' + status.reason : '') + '\nviewport ' + innerWidth + 'x' + innerHeight + ' dpr ' + devicePixelRatio +
        '\nhero ' + (h ? h.clientWidth : '-') + 'px · region ' + (r ? Math.round(r.getBoundingClientRect().width) + 'x' + Math.round(r.getBoundingClientRect().height) : 'none') +
        '\nname ' + (n ? getComputedStyle(n).fontSize : '-') + ' · touch ' + (matchMedia('(hover: hover) and (pointer: fine)').matches ? 'no' : 'yes');
    }, 700);
  }

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const TOUCH = !FINE;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* Bail out before touching anything if the 3D cannot work: the site stays exactly as it was. */
  if (navigator.connection && navigator.connection.saveData) { note('skipped', 'Data Saver is on'); return; }
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl')) { note('skipped', 'WebGL is not available in this browser'); return; }
  } catch (e) {
    note('skipped', 'WebGL check threw: ' + e.message);
    return;
  }

  const q = (s, scope = document) => scope.querySelector(s);
  function whenReady(selector, fn) {
    if (q(selector)) return fn();
    const mo = new MutationObserver(() => {
      if (!q(selector)) return;
      mo.disconnect();
      fn();
    });
    mo.observe(root, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 15000);
  }
  const loadScript = (src) =>
    new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('failed: ' + src));
      document.head.appendChild(s);
    });

  /* ══════════════════════════════════════════════════════════════════════════
     CSS (injected only when everything above says the 3D can run)
     ══════════════════════════════════════════════════════════════════════════ */
  const avail = `(100vw - ${T.PAGE_PAD + T.SCROLLBAR_RESERVE}px)`;
  const layoutCss = `
/* hairlines above and below the name are hidden (not deleted) */
html .hero .px:before, html .hero .px:after { display: none; }

/* name: centred; sized by measurement (see fitName), with a safe margin (NAME_FIT) */
html .hero #heroName { text-align: center; margin-top: auto; }
html .hero .px .w:last-of-type { text-align: center; }
@media (min-width: ${T.BREAKPOINT}px) {
  html .hero #heroName { font-size: var(--x-fs, calc(${avail} * ${T.NAME_FIT} / ${T.NAME_ONE_LINE_EM})); }
  html .hero .px .w { display: inline-block; }
}
@media (max-width: ${T.BREAKPOINT - 1}px) {
  html .hero #heroName { font-size: var(--x-fs, calc(${avail} * ${T.NAME_FIT} / ${T.NAME_TWO_LINE_EM})); }
}
`;
  const regionCss = `
.x-h3d { position: relative; flex: 0 0 auto; height: ${T.REGION_H_NARROW}; margin-bottom: auto;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
@media (min-width: ${T.BREAKPOINT}px) { .x-h3d { height: ${T.REGION_H_WIDE}; } }
.x-h3d canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; opacity: 0; transition: opacity .8s ease; }
.x-h3d.x-on canvas, .x-h3d.x-on .x-ghost { opacity: 1; }
/* faint PORT / FOLIO behind the letters, as in the prototype */
.x-ghost { opacity: 0; transition: opacity .8s ease; position: absolute; inset: 0; overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center;
  font-family: var(--font-display); font-weight: 900; line-height: .82; letter-spacing: -.04em; white-space: nowrap; text-transform: uppercase;
  color: var(--x-ghost, rgba(255,255,255,.045)); pointer-events: none; }
.x-h3d-hint { position: absolute; left: 50%; bottom: 4px; transform: translateX(-50%); margin: 0; color: var(--mut);
  white-space: nowrap; pointer-events: none; display: none; transition: opacity .3s; z-index: 2; }
@media (pointer: coarse) { .x-h3d-hint { display: block; } }
.x-h3d-hint.x-hide { opacity: 0; }
/* the ring: white line, soft glow in your accent colour */
.x-ring { position: fixed; left: 0; top: 0; z-index: 40; pointer-events: none; box-sizing: border-box; border-radius: 50%;
  border: 1.5px solid var(--ink); opacity: 0; transition: opacity .25s ease;
  box-shadow: 0 0 30px var(--x-glow, rgba(110,231,255,.35)), inset 0 0 40px var(--x-glow, rgba(110,231,255,.35)); }
/* while the ring is on screen the X/Y read-out would sit inside it */
#cur.x-portal #cx { opacity: 0; }
`;
  let styleEl, region, ringEl;
  function mountDom(hero) {
    styleEl = document.createElement('style');
    styleEl.id = 'hero3d-css';
    styleEl.textContent = (HERO3D.layout ? layoutCss : '') + regionCss;
    document.head.appendChild(styleEl);
    region = document.createElement('div');
    region.className = 'x-h3d';
    region.setAttribute('aria-hidden', 'true'); // decoration: the name stays the real, readable heading
    region.innerHTML = '<div class="x-ghost"><div>Port</div><div>Folio</div></div><canvas></canvas><p class="mono x-h3d-hint">Hold and drag</p>';
    hero.insertBefore(region, q('.hmeta', hero));
    ringEl = document.createElement('div');
    ringEl.className = 'x-ring';
    ringEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ringEl);
  }
  function teardown(why) {
    // Restores the original hero completely.
    if (why) note('stopped', why, 'warn');
    if (styleEl) styleEl.remove();
    if (region) region.remove();
    if (ringEl) ringEl.remove();
    const cur = q('#cur');
    if (cur) cur.classList.remove('x-portal');
  }

  /* The name is sized by MEASURING it, not by assuming font metrics: a hidden copy of the name is laid out at 100px
     with the same font settings, its real width is read, and the font-size that fills the hero's real content width
     (times NAME_FIT, the safe margin) is set on the heading. This holds on any browser, font fallback or odd viewport. */
  let fitKey = '';
  function fitName(force) {
    const hero = q('.hero'), h1 = q('#heroName');
    if (!hero || !h1 || !styleEl || !HERO3D.layout) return;
    const cs = getComputedStyle(hero);
    const avail = hero.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const two = !matchMedia('(min-width: ' + T.BREAKPOINT + 'px)').matches;
    const srEl = q('.sr', h1), text = ((srEl ? srEl.textContent : h1.textContent) || '').trim();
    const key = Math.round(avail) + '|' + two + '|' + text + '|' + (document.fonts && document.fonts.status);
    if (!force && key === fitKey) return;
    if (!(avail > 40) || !text) return;
    const probe = document.createElement('div');
    probe.className = 'px x-probe';
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;font-size:100px;width:max-content;max-width:none;margin:0;padding:0;' +
      '--w0:' + (h1.style.getPropertyValue('--w0') || 860) + ';--d0:' + (h1.style.getPropertyValue('--d0') || 68);
    text.split(' ').forEach((word, i, all) => {
      const w = document.createElement('span');
      w.className = 'w';
      for (const ch of word) { const l = document.createElement('span'); l.className = 'l'; l.textContent = ch; w.appendChild(l); }
      probe.appendChild(w);
      if (i < all.length - 1) probe.appendChild(document.createTextNode(' '));
    });
    document.body.appendChild(probe);
    const width = two ? Math.max(...Array.from(probe.querySelectorAll('.w')).map((e) => e.getBoundingClientRect().width)) : probe.getBoundingClientRect().width;
    probe.remove();
    if (!(width > 0)) return;
    fitKey = key;
    h1.style.setProperty('--x-fs', ((avail * T.NAME_FIT) / (width / 100)).toFixed(2) + 'px');
    status.nameFit = { avail: Math.round(avail), emWidth: +(width / 100).toFixed(3), two };
  }
  function watchName(hero) {
    const go = () => fitName(false);
    fitName(true);
    if (document.fonts) document.fonts.ready.then(() => fitName(true));
    new ResizeObserver(go).observe(hero);
    matchMedia('(min-width: ' + T.BREAKPOINT + 'px)').addEventListener('change', go);
    const h1 = q('#heroName');
    if (h1) new MutationObserver(() => fitName(true)).observe(h1, { attributes: true, attributeFilter: ['data-split'], childList: true }); // when the page splits the name into letters
    addEventListener('load', go);
  }



  /* ══════════════════════════════════════════════════════════════════════════
     3D
     ══════════════════════════════════════════════════════════════════════════ */
  function run(THREE) {
    const canvas = q('canvas', region);
    const ghost = q('.x-ghost', region);
    const hint = q('.x-h3d-hint', region);
    const cur = q('#cur');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(T.FOV, 1, 0.1, 50);

    // lights exactly as in the prototype
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(-2, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.4); rim.position.set(3, -1, 2); scene.add(rim);

    /* ── read the model: plain positions + normals + indices, so no loader library is needed ── */
    function parseGLB(buf) {
      const dv = new DataView(buf), jl = dv.getUint32(12, true);
      const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
      const bin = 20 + jl + 8, TY = { 5126: Float32Array, 5123: Uint16Array, 5125: Uint32Array }, N = { SCALAR: 1, VEC3: 3 };
      const read = (i) => {
        const a = json.accessors[i], v = json.bufferViews[a.bufferView], C = TY[a.componentType];
        const o = bin + (v.byteOffset || 0) + (a.byteOffset || 0);
        return new C(buf.slice(o, o + a.count * N[a.type] * C.BYTES_PER_ELEMENT));
      };
      return json.nodes.map((n) => {
        const p = json.meshes[n.mesh].primitives[0], g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(read(p.attributes.POSITION), 3));
        g.setAttribute('normal', new THREE.BufferAttribute(read(p.attributes.NORMAL), 3));
        g.setIndex(new THREE.BufferAttribute(read(p.indices), 1));
        return g;
      });
    }
    const geos = parseGLB(Uint8Array.from(atob(window.__HERO3D_GLB__), (c) => c.charCodeAt(0)).buffer);
    if (geos.length !== LETTERS.length) throw new Error('expected ' + LETTERS.length + ' letters, found ' + geos.length);

    /* ── materials: one clay for every letter; the mesh overlay is clipped to the ring by a fragment discard ── */
    const U = { uCur: { value: new THREE.Vector3(-999, -999, 0) } };
    const clay = new THREE.MeshStandardMaterial({ color: 0xa8a8a8, roughness: T.ROUGH, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const wireMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(T.WIRE), wireframe: true, transparent: true, opacity: T.WIRE_OPACITY, depthWrite: false });
    wireMat.onBeforeCompile = (sh) => {
      sh.uniforms.uCur = U.uCur;
      sh.fragmentShader = 'uniform vec3 uCur;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\n if(distance(gl_FragCoord.xy,uCur.xy)>uCur.z) discard;');
    };

    const d2r = Math.PI / 180;
    const P = [], wires = [];
    LETTERS.forEach((f, i) => {
      const geo = geos[i];
      geo.scale(1, T.THICK, 1); geo.rotateX(Math.PI / 2); geo.center(); // chunkier, stand upright (letter up was -Z), pivot at its centre
      const solid = new THREE.Mesh(geo, clay);
      const wire = new THREE.Mesh(geo, wireMat);
      wire.renderOrder = 1; wires.push(wire);
      const grp = new THREE.Group();
      grp.add(solid, wire);
      const x = (f.p[0] - 600) / REF_SCALE, y = (450 - f.p[1]) / REF_SCALE;
      grp.scale.setScalar(f.s);
      grp.rotation.set(f.r[0] * d2r, f.r[1] * d2r, f.r[2] * d2r, 'YXZ');
      scene.add(grp);
      P.push({ g: grp, pos: new THREE.Vector2(x, y), home: new THREE.Vector2(x, y), vel: new THREE.Vector2(), r: grp.rotation.clone(),
        ry: f.r[1] * d2r, s: f.s, k: f.k, inf: 0, ro: new THREE.Vector3(), z: 0 });
    });

    /* ── 2D collision physics in the screen plane (circle colliders), straight from the prototype ── */
    const circ = (p) => { const c = Math.cos(p.ry); return p.k.map((k) => [p.pos.x + k[0] * p.s * c, p.pos.y + k[1] * p.s, k[2] * p.s]); };
    function collide(vel) {
      for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
        const A = P[a], B = P[b], ca = circ(A), cb = circ(B);
        for (const u of ca) for (const v of cb) {
          let dx = v[0] - u[0], dy = v[1] - u[1], d = Math.hypot(dx, dy);
          const m = u[2] + v[2] + 0.006;
          if (d < m) {
            if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
            const nx = dx / d, ny = dy / d, o = (m - d) / 2;
            A.pos.x -= nx * o; A.pos.y -= ny * o; B.pos.x += nx * o; B.pos.y += ny * o;
            if (vel) {
              const vn = (B.vel.x - A.vel.x) * nx + (B.vel.y - A.vel.y) * ny;
              if (vn < 0) { const j = -vn * 0.65; A.vel.x -= nx * j; A.vel.y -= ny * j; B.vel.x += nx * j; B.vel.y += ny * j; }
            }
          }
        }
      }
    }
    for (let i = 0; i < T.RELAX_PASSES; i++) collide(false); // overlaps from the reference image become "just touching"
    P.forEach((p) => p.home.copy(p.pos));

    // bounds of the settled cluster (from the colliders), used to fit the camera to any region shape
    let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9;
    P.forEach((p) => circ(p).forEach(([x, y, r]) => { bx0 = Math.min(bx0, x - r); bx1 = Math.max(bx1, x + r); by0 = Math.min(by0, y - r); by1 = Math.max(by1, y + r); }));
    const cw = bx1 - bx0, ch = by1 - by0, ccx = (bx0 + bx1) / 2, ccy = (by0 + by1) / 2;

    /* ── colours follow your mode + scheme: clay picks up a little of the accent ── */
    const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
    const clayTarget = new THREE.Color(), tmp = new THREE.Color();
    function readTheme() {
      const light = root.dataset.theme === 'light';
      const acc = css('--acc') || '#d4663a';
      clayTarget.set(light ? T.CLAY_LIGHT : T.CLAY_DARK).lerp(tmp.set(acc), T.CLAY_TINT);
      tmp.set(acc);
      region.style.setProperty('--x-ghost', light ? 'rgba(20,19,16,' + T.GHOST_ALPHA + ')' : 'rgba(255,255,255,' + T.GHOST_ALPHA + ')');
      ringEl.style.setProperty('--x-glow', 'rgba(' + Math.round(tmp.r * 255) + ',' + Math.round(tmp.g * 255) + ',' + Math.round(tmp.b * 255) + ',.38)');
      wake();
    }
    clay.color.copy(clayTarget.set(root.dataset.theme === 'light' ? T.CLAY_LIGHT : T.CLAY_DARK)); // first paint; readTheme tints it
    let themeRaf = 0;
    new MutationObserver(() => { if (!themeRaf) themeRaf = requestAnimationFrame(() => { themeRaf = 0; readTheme(); }); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme', 'style'] });

    /* ── state ── */
    const S = { w: 1, h: 1, dpr: Math.min(devicePixelRatio || 1, TOUCH ? T.DPR_MAX_TOUCH : T.DPR_MAX), vW: 3.2, vH: 2.4, inView: true, hidden: false,
      raf: 0, last: 0, acc: 0, ema: 16, slow: 0 };
    // pointer in region pixels (mx,my = -999 means "no pointer"); cx,cy = the ring's smoothed position; rr/tr = ring radius and its target
    const I = { mx: -999, my: -999, wx: 0, wy: 0, cx: -999, cy: -999, rr: T.RING_IDLE, openT: -1e9, inside: false };
    const ringOpenR = () => clamp(S.h * 0.34, 70, T.RING_OPEN_MAX);
    let rect = region.getBoundingClientRect();

    function resize() {
      rect = region.getBoundingClientRect();
      S.w = Math.max(1, rect.width); S.h = Math.max(1, rect.height);
      renderer.setPixelRatio(S.dpr); renderer.setSize(S.w, S.h, false);
      const aspect = S.w / S.h;
      camera.aspect = aspect;
      S.vH = Math.max(ch / T.FILL_H, cw / (T.FILL_W * aspect)); // the cluster fills the region, whatever its shape
      S.vW = S.vH * aspect;
      camera.position.set(ccx, ccy, S.vH / 2 / Math.tan((T.FOV / 2) * d2r));
      camera.updateProjectionMatrix();
      const fs = Math.min(S.h * 0.5, (S.w * 0.9) / 3.1);
      ghost.style.fontSize = fs + 'px';
      wake();
    }
    function setPointer(clientX, clientY) {
      I.mx = clientX - rect.left; I.my = clientY - rect.top;
      I.wx = camera.position.x + (I.mx / S.w * 2 - 1) * S.vW / 2;
      I.wy = camera.position.y - (I.my / S.h * 2 - 1) * S.vH / 2;
      if (I.cx < -900) { I.cx = clientX; I.cy = clientY; }
      I.inside = I.mx >= 0 && I.my >= 0 && I.mx <= S.w && I.my <= S.h;
    }
    const clearPointer = () => { I.mx = I.my = -999; I.inside = false; wake(); };
    const frozen = () => root.classList.contains('vp-off') || root.classList.contains('panel-open');

    /* ── input ── */
    if (FINE) {
      addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; setPointer(e.clientX, e.clientY); wake(); }, { passive: true });
      addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') setPointer(e.clientX, e.clientY); }, { passive: true });
      root.addEventListener('mouseleave', clearPointer);
    }
    const hold = { timer: 0, on: false, id: -1, sx: 0, sy: 0 };
    if (TOUCH && HERO3D.touchHold) {
      let used = false;
      try { used = sessionStorage.getItem('hero3d_hint') === '1'; } catch (e) { /* private mode */ }
      if (used) hint.classList.add('x-hide');
      // the ring is held above the finger and kept fully inside the frame (both directions)
      const place = (e) => {
        const r = region.getBoundingClientRect(), rr = Math.min(ringOpenR(), r.width / 2, r.height / 2);
        const x = clamp(e.clientX - r.left, rr, Math.max(r.width - rr, r.width / 2));
        const y = clamp(e.clientY - r.top - T.TOUCH_OFFSET_PX, rr, Math.max(r.height - rr, r.height / 2));
        setPointer(r.left + x, r.top + y);
      };
      const end = () => { clearTimeout(hold.timer); hold.on = false; hold.id = -1; clearPointer(); };
      region.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch' || frozen()) return;
        hold.id = e.pointerId; hold.sx = e.clientX; hold.sy = e.clientY;
        clearTimeout(hold.timer);
        hold.timer = setTimeout(() => {
          hold.on = true; place(e); // the first position is where the finger rests
          if (navigator.vibrate) navigator.vibrate(10);
          hint.classList.add('x-hide'); // the hint disappears as soon as the hold starts, and stays gone this session
          try { sessionStorage.setItem('hero3d_hint', '1'); } catch (err) { /* ignore */ }
          wake();
        }, T.HOLD_MS);
      }, { passive: true });
      region.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'touch' || e.pointerId !== hold.id) return;
        if (hold.on) { place(e); wake(); }
        else if (Math.hypot(e.clientX - hold.sx, e.clientY - hold.sy) > T.HOLD_SLOP_PX) clearTimeout(hold.timer); // moved early: it is a scroll
      }, { passive: true });
      // Once the hold has started, dragging moves the ring instead of scrolling. Before it starts, scrolling is untouched.
      region.addEventListener('touchmove', (e) => { if (hold.on) e.preventDefault(); }, { passive: false });
      ['pointerup', 'pointercancel'].forEach((n) => region.addEventListener(n, (e) => { if (e.pointerType === 'touch') end(); }));
      region.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /* ── physics step (fixed 1/120 s), straight from the prototype ── */
    function step(dt) {
      P.forEach((p) => {
        const dx = I.wx - p.home.x, dy = I.wy - p.home.y;
        const inf = !HERO3D.pull || I.mx < -900 || !(FINE || hold.on) ? 0 : Math.exp(-(dx * dx + dy * dy) / T.FALLOFF);
        p.inf = inf;
        const tx = p.home.x + dx * T.PULL * inf, ty = p.home.y + dy * T.PULL * inf;
        p.vel.x += (T.K * (tx - p.pos.x) - T.C * p.vel.x) * dt; p.vel.y += (T.K * (ty - p.pos.y) - T.C * p.vel.y) * dt;
        p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt;
      });
      for (let i = 0; i < 3; i++) collide(i === 0);
    }

    /* ── loop: sleeps when off-screen or the tab is hidden ── */
    function wake() { if (!S.raf && S.inView && !S.hidden) S.raf = requestAnimationFrame(frame); }
    function frame(now) {
      S.raf = 0;
      try { tick(now); } catch (err) { teardown('runtime error: ' + (err && err.message)); }
    }
    function tick(now) {
      rect = region.getBoundingClientRect(); // read fresh: the hero can shift when the web font arrives
      const t = now / 1000, off = frozen();
      const gap = S.last ? now - S.last : 16; // ms since the last frame
      S.acc += Math.min(gap / 1000, 1 / 20); S.last = now;
      if (!off) while (S.acc >= 1 / 120) { step(1 / 120); S.acc -= 1 / 120; }
      else S.acc = 0;

      // theme: clay eases toward the current colour
      if (Math.abs(clay.color.r - clayTarget.r) + Math.abs(clay.color.g - clayTarget.g) + Math.abs(clay.color.b - clayTarget.b) > 0.003) clay.color.lerp(clayTarget, 0.12);
      else clay.color.copy(clayTarget);

      // the ring opens while the cursor is near any letter (covers holes and gaps) and stays open a moment after leaving
      const near = I.mx > -900 && P.some((p) => Math.hypot(I.wx - p.pos.x, I.wy - p.pos.y) < T.OPEN_DIST);
      if (near && HERO3D.portal && !off) I.openT = now;
      const target = now - I.openT < T.OPEN_HOLD ? ringOpenR() : T.RING_IDLE;
      I.rr += (target - I.rr) * T.RING_EASE;
      const px = I.mx + rect.left, py = I.my + rect.top;
      if (I.mx > -900) { I.cx += (px - I.cx) * T.RING_FOLLOW; I.cy += (py - I.cy) * T.RING_FOLLOW; }
      const showRing = HERO3D.portal && !off && I.mx > -900 && (TOUCH ? hold.on : I.inside);
      ringEl.style.opacity = showRing ? 1 : 0;
      if (showRing) {
        ringEl.style.width = ringEl.style.height = I.rr * 2 + 'px';
        ringEl.style.transform = 'translate(' + (I.cx - I.rr) + 'px,' + (I.cy - I.rr) + 'px)';
      }
      if (cur) cur.classList.toggle('x-portal', showRing && FINE);
      // mesh circle, in canvas pixels (gl_FragCoord origin is the canvas' bottom-left)
      const dpr = renderer.getPixelRatio(), wr = showRing ? Math.max(0, I.rr - T.WIRE_INSET) : 0;
      U.uCur.value.set((I.cx - rect.left) * dpr, (rect.height - (I.cy - rect.top)) * dpr, wr * dpr);
      wires.forEach((w) => { w.visible = wr > 0; }); // no mesh pass at all while the ring is idle

      P.forEach((p, i) => {
        const dx = I.wx - p.pos.x, dy = I.wy - p.pos.y, inf = p.inf;
        p.z += (inf * T.LIFT - p.z) * T.EASE;
        p.ro.x += (-dy * T.TILT * inf - p.ro.x) * T.EASE; p.ro.y += (dx * T.TILT * inf - p.ro.y) * T.EASE;
        const fy = reduced ? 0 : Math.sin(t * 0.9 + i * 1.3) * T.FLOAT_Y, fr = reduced ? 0 : Math.sin(t * 0.7 + i) * T.FLOAT_ROLL;
        p.g.position.set(p.pos.x, p.pos.y + fy, p.z);
        p.g.rotation.set(p.r.x + p.ro.x, p.r.y + p.ro.y, p.r.z + fr);
      });
      renderer.render(scene, camera);

      // adaptive quality: sustained slow frames step the pixel ratio down toward 1
      S.ema += (Math.min(60, gap) - S.ema) * 0.05; S.slow = S.ema > 26 ? S.slow + 1 : 0;
      if (S.slow > 90 && S.dpr > 1) { S.dpr = Math.max(1, S.dpr - 0.25); S.slow = 0; resize(); }
      const moving = P.some((p) => Math.abs(p.vel.x) + Math.abs(p.vel.y) > 0.002 || p.inf > 0.001 || Math.abs(p.z) > 0.001);
      if (!reduced || moving || near || Math.abs(I.rr - target) > 0.3) wake();
    }
    /* ── life-cycle ── */
    readTheme();
    new IntersectionObserver((en) => { S.inView = en[0].isIntersecting; if (S.inView) { S.last = 0; wake(); } }).observe(region);
    document.addEventListener('visibilitychange', () => { S.hidden = document.hidden; if (!S.hidden) { S.last = 0; wake(); } });
    new ResizeObserver(resize).observe(region);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); teardown('WebGL context was lost'); });
    new MutationObserver(wake).observe(root, { attributes: true, attributeFilter: ['class'] }); // shading modes / project panel
    resize();

    // the canvas fades in with the hero sequence (body.go), so the letters arrive with the name, not behind the intro curtain
    const show = () => { region.classList.add('x-on'); wake(); };
    if (reduced || document.body.classList.contains('go')) show();
    else {
      const mo = new MutationObserver(() => { if (document.body.classList.contains('go')) { mo.disconnect(); show(); } });
      mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      setTimeout(() => { mo.disconnect(); show(); }, 9000); // failsafe
    }
  }

  /* ══════════════════════════════════════════════════════════════════════════
     start
     ══════════════════════════════════════════════════════════════════════════ */
  whenReady('.hero .hmeta', () => {
    const hero = q('.hero');
    if (!hero) return;
    mountDom(hero); // layout is in place before the intro curtain lifts, so nothing jumps
    watchName(hero);
    loadScript(HERO3D.three)
      .then(() => loadScript(HERO3D.model))
      .then(() => {
        if (!window.THREE || !window.__HERO3D_GLB__) throw new Error('3D files missing');
        try {
          run(window.THREE);
          note('running', '');
        } catch (err) {
          teardown('startup error: ' + (err && err.message));
        }
      })
      .catch((err) => {
        teardown('files did not load (' + (err && err.message) + '). Check that vendor/three.min.js and hero-3d-model.js are uploaded');
      });
  });
})();

