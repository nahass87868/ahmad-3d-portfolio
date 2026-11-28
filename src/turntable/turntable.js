/*
 * Project-panel turntable stage. A lazy chunk: the stub at the end of src/main.js (window.__turntable) inserts the empty, final-size stage and imports this
 * only when a project has a `model` (models/<name>.glb, built by tools/build-turntable-models.py).
 *
 * Phase 7b: mount, parse, draw ONE Clay frame, dispose. Phase 7c (this file): yaw orbit by drag, inertia, arrow keys, slow auto-rotate, ONE rAF loop. Phase 7 closed at 7c: Solid/Wire styles, a Pause control and the ASUS model were dropped by the owner (2026-11-28).
 * One GL context per open stage; it is released on close, on a project swap, on any failure and on context loss. Failure removes the stage silently.
 * The loop runs ONLY while the stage is on screen AND html.panel-open AND the tab is visible AND something changes (drag, inertia, auto-rotate); otherwise no rAF is pending and nothing is drawn.
 * State for tests and the console: window.__turntable.info = { state: loading | ready | closed | failed | lost, reason, draws, ticks, yaw (radians), auto (auto-rotate active), model }.
 * Known gap, accepted by the owner (the Pause control was dropped): auto-rotate runs longer than 5 s with no pause button (WCAG 2.2.2). Reduced motion turns it off.
 */
import { ACESFilmicToneMapping, BufferAttribute, BufferGeometry, ColorManagement, DirectionalLight, HemisphereLight, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from 'three';

// ── tune here ──
const T = {
  FOV: 30, // degrees (vertical)
  TILT: 12, // camera looks down this many degrees
  FIT: 1.08, // 1 = the model touches the frame edge, bigger = more air around it
  YAW: 28, // start angle (degrees) for a model that is wider than deep
  YAW_LONG: 62, // start angle (degrees) for a model that is longer than wide (a shoe), so its long side faces the viewer
  CLAY_DARK: '#a8a8a8', CLAY_LIGHT: '#8f8f8d', ROUGH: 0.85, // same clay as the hero letters
  LIGHT_HEMI: 0.65, LIGHT_KEY: 2.7, LIGHT_RIM: 1.1, EXPOSURE: 1.0, // hero-style rig, turned down: the hero's own values blow a big model out to white
  DPR_MAX: 2, // sharp on phones, but never more than 2x pixels
  TIMEOUT_MS: 20000, // a model that has not arrived by now is given up on
  // 7c: motion
  AUTO_SPEED: 0.3, // auto-rotate, radians per second (about 21 s per turn)
  AUTO_RAMP: 0.6, // seconds the auto-rotate takes to ease up to speed, so it never starts with a jolt
  IDLE_MS: 2500, // quiet time after the last input (for a flick: after the inertia has ended) before auto-rotate resumes
  INERTIA_TAU: 0.35, // seconds: after a release the spin decays as exp(-t / tau), whatever the frame rate
  VEL_EPS: 0.02, // rad/s: below this the inertia snaps to exactly 0 and the loop stops
  VEL_MAX: 8, // rad/s: cap on a flick
  VEL_SMOOTH_MS: 60, // the release speed is the drag speed averaged over about this long
  HOLD_MS: 100, // a release this long after the last move is a hold, not a flick: no inertia
  DRAG_TURN: 5, // radians turned by a drag across the full width of the stage (so the same finger travel feels the same at any stage size)
  KEY_STEP: 0.15, // radians per arrow-key press (about 9 degrees)
  DT_MAX: 0.1, // seconds: a longer frame (tab was away, slow GPU) counts as this long, so nothing jumps
  TOUCH_FPS: 30, // coarse pointer: at most this many drawn frames per second when not dragging. Mirrors QUALITY.touch.fps in src/world/world.js on purpose (that file is not imported)
};

const CSS = '.x-turn canvas{display:block;width:100%;height:100%;opacity:0;transition:opacity .6s var(--ease-out);background:var(--surface);background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--ink) 10%,var(--surface)),var(--surface) 72%)}'
  + '.x-turn canvas.on{opacity:1}@media (prefers-reduced-motion:reduce){.x-turn canvas{transition:none}}'
  + '.x-turn canvas{cursor:grab;touch-action:pan-y;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}' // pan-y: a vertical swipe still scrolls the panel; horizontal is the orbit
  + '.x-turn canvas.drag{cursor:grabbing}.x-turn canvas:focus-visible{outline-offset:-4px}'; // the page-wide :focus-visible ring, drawn inside the edge // the box itself is the flat --surface placeholder (set by the stub); the spotlight fades in with the model

// ── GLB reader for the quantized files from tools/build-turntable-models.py (POSITION int16, NORMAL int8, both normalised; indices u16/u32) ──
// One mesh, one triangle list, no transforms. Positions and normals are widened to Float32 (the biggest model is ~0.4 MB that way),
// so no driver ever has to read normalised integer attributes. COLOR_0 is not read (the stage is Clay only, so it does not use it).
function parseGLB(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67 || dv.getUint32(4, true) !== 2) throw new Error('not a GLB 2 file');
  const jl = dv.getUint32(12, true);
  if (dv.getUint32(16, true) !== 0x4e4f534a) throw new Error('no JSON chunk');
  const j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
  if ((j.extensionsRequired || []).some((x) => x !== 'KHR_mesh_quantization')) throw new Error('unsupported extension');
  if (dv.getUint32(20 + jl + 4, true) !== 0x004e4942) throw new Error('no BIN chunk');
  const bin = 20 + jl + 8;
  const prim = j.meshes[0].primitives[0];
  if (prim.mode !== undefined && prim.mode !== 4) throw new Error('not a triangle list');

  const view = (a) => {
    const v = j.bufferViews[a.bufferView];
    return { at: bin + (v.byteOffset || 0) + (a.byteOffset || 0), stride: v.byteStride };
  };
  const floats = (i, comps) => { // a VEC3 attribute as Float32
    const a = j.accessors[i], { at, stride } = view(a);
    const size = { 5126: 4, 5122: 2, 5120: 1 }[a.componentType];
    if (!size || a.type !== 'VEC3' || (a.componentType !== 5126 && !a.normalized)) throw new Error('unsupported attribute format');
    const step = stride || size * comps, out = new Float32Array(a.count * comps);
    for (let k = 0; k < a.count; k++) {
      for (let c = 0; c < comps; c++) {
        const o = at + k * step + c * size;
        out[k * comps + c] = a.componentType === 5126 ? dv.getFloat32(o, true) : Math.max(a.componentType === 5122 ? dv.getInt16(o, true) / 32767 : dv.getInt8(o) / 127, -1);
      }
    }
    return out;
  };
  const pos = floats(prim.attributes.POSITION, 3);
  const nor = prim.attributes.NORMAL === undefined ? null : floats(prim.attributes.NORMAL, 3);

  const ia = j.accessors[prim.indices], { at: ia0 } = view(ia);
  if (ia.componentType !== 5123 && ia.componentType !== 5125) throw new Error('unsupported index format');
  const idx = new (ia.componentType === 5123 ? Uint16Array : Uint32Array)(buf.slice(ia0, ia0 + ia.count * (ia.componentType === 5123 ? 2 : 4)));
  const n = pos.length / 3;
  if (!n || !idx.length || idx.length % 3) throw new Error('empty or broken mesh');
  for (let k = 0; k < idx.length; k++) if (idx[k] >= n) throw new Error('index out of range');

  // size of the model (it is already centred and scaled into the unit sphere): widest reach in the floor plane, height, and which way it is longer
  let r2 = 0, ex = 0, ez = 0, ya = 0;
  for (let k = 0; k < pos.length; k += 3) {
    const x = pos[k], y = pos[k + 1], z = pos[k + 2];
    if (!(x === x && y === y && z === z)) throw new Error('bad vertex');
    r2 = Math.max(r2, x * x + z * z); ex = Math.max(ex, Math.abs(x)); ez = Math.max(ez, Math.abs(z)); ya = Math.max(ya, Math.abs(y));
  }
  return { pos, nor, idx, r: Math.sqrt(r2) || 1, h: ya, longZ: ez > ex * 1.15 };
}

export function mountTurntable(el, work) {
  const info = { state: 'loading', reason: '', draws: 0, ticks: 0, yaw: null, auto: false, model: work.model };
  window.__turntable.info = info;
  const ac = new AbortController();
  let canvas, renderer, geo, mat, ro, timer, off, dead = false; // off: removes the 7c loop, listeners and observers

  function dispose(state, reason) {
    if (dead) return;
    dead = true;
    info.state = state; info.reason = reason || '';
    clearTimeout(timer); ac.abort(); if (ro) ro.disconnect(); if (off) off();
    if (canvas) canvas.removeEventListener('webglcontextlost', onLost);
    if (geo) geo.dispose();
    if (mat) mat.dispose();
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); }
    if (canvas) { canvas.width = canvas.height = 0; canvas.remove(); } // 0x0 frees the drawing buffer at once (iOS Safari holds it otherwise)
    el.remove(); // a stage that is not working is not left behind as an empty box
  }
  const onLost = () => dispose('lost');
  const stop = () => dispose('closed');

  (async () => {
    try {
      if (!/^[\w-]+$/.test(work.model)) throw new Error('bad model name');
      timer = setTimeout(() => dispose('failed', 'timeout'), T.TIMEOUT_MS);
      // document-relative, so it works under any sub-path (GitHub Pages) and with hash routes
      const res = await fetch(new URL('models/' + work.model + '.glb', document.baseURI), { signal: ac.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const m = parseGLB(await res.arrayBuffer());
      if (dead) return;

      if (!document.getElementById('x-turn-css')) { const s = document.createElement('style'); s.id = 'x-turn-css'; s.textContent = CSS; document.head.append(s); }
      canvas = document.createElement('canvas');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', (work.title || 'Project') + ' — 3D model. Left and right arrow keys rotate it.');
      canvas.tabIndex = 0; // reachable by keyboard; Tab is never trapped (only the two arrow keys are handled)
      el.append(canvas); // in the page before the context is made
      canvas.addEventListener('webglcontextlost', onLost);
      ColorManagement.enabled = false; // as the hero does: r128-style colour, so the clay matches
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = T.EXPOSURE;
      renderer.setClearColor(0, 0);

      geo = new BufferGeometry();
      geo.setAttribute('position', new BufferAttribute(m.pos, 3));
      if (m.nor) geo.setAttribute('normal', new BufferAttribute(m.nor, 3));
      geo.setIndex(new BufferAttribute(m.idx, 1));
      mat = new MeshStandardMaterial({ color: document.documentElement.dataset.theme === 'light' ? T.CLAY_LIGHT : T.CLAY_DARK, roughness: T.ROUGH, metalness: 0, flatShading: !m.nor }); // no normals in the file: flat facets
      const mesh = new Mesh(geo, mat);
      mesh.frustumCulled = false; // one mesh, always in frame
      mesh.rotation.y = (m.longZ ? T.YAW_LONG : T.YAW) * Math.PI / 180;
      const scene = new Scene();
      scene.add(mesh, new HemisphereLight(0xffffff, 0x303040, T.LIGHT_HEMI));
      const key = new DirectionalLight(0xffffff, T.LIGHT_KEY); key.position.set(-2, 3, 4); scene.add(key);
      const rim = new DirectionalLight(0xffffff, T.LIGHT_RIM); rim.position.set(3, -1, 2); scene.add(rim);
      const cam = new PerspectiveCamera(T.FOV, 1, 0.1, 50);

      // Frame the model so it fits at EVERY angle (7c turns it): the floor-plane reach r must fit the width, the height h (plus the tilt) the height.
      let lw = 0, lh = 0;
      const size = () => {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h || (w === lw && h === lh)) return false;
        lw = w; lh = h;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, T.DPR_MAX));
        renderer.setSize(w, h, false);
        const th = Math.tan(T.FOV * Math.PI / 360), tilt = T.TILT * Math.PI / 180;
        const d = Math.max(T.FIT * m.r / Math.sin(Math.atan(th * w / h)), m.r + T.FIT * (m.h + m.r * Math.sin(tilt)) / th);
        cam.aspect = w / h; cam.near = d * 0.1; cam.far = d * 2; cam.updateProjectionMatrix();
        cam.position.set(0, d * Math.sin(tilt), d * Math.cos(tilt)); cam.lookAt(0, 0, 0);
        return true;
      };
      const draw = () => { renderer.render(scene, cam); info.draws++; };
      if (size()) { draw(); clearTimeout(timer); info.state = 'ready'; canvas.classList.add('on'); }
      // a resize (a phone turned, a window dragged) redraws once; at rest nothing runs
      ro = new ResizeObserver(() => { if (!dead && size()) { draw(); if (info.state !== 'ready') { clearTimeout(timer); info.state = 'ready'; canvas.classList.add('on'); } } });
      ro.observe(el);

      // ── 7c: orbit, inertia, auto-rotate. ONE rAF loop, owned here; nothing below allocates per frame ──
      const rm = matchMedia('(prefers-reduced-motion: reduce)');
      const cap = matchMedia('(hover: hover) and (pointer: fine)').matches ? 0 : 1000 / T.TOUCH_FPS - 3; // ms between drawn frames on a coarse pointer (3 ms rAF slack, as the world); 0 = none
      const html = document.documentElement, ry = mesh.rotation;
      let reduced = rm.matches, onScreen = false, dragging = false, pid = -1, px = 0, pt = 0, vel = 0, av = 0, idleAt = 0, idleTimer = 0, last = 0, raf = 0, drawn = ry.y;
      Object.defineProperty(info, 'yaw', { get: () => ry.y, enumerable: true });
      const autoOn = () => !dead && !reduced && !dragging && performance.now() >= idleAt;
      Object.defineProperty(info, 'auto', { get: autoOn, enumerable: true });
      const live = () => !dead && onScreen && html.classList.contains('panel-open') && !document.hidden;
      const moving = () => dragging || vel !== 0 || autoOn();
      const stopLoop = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } last = 0; };
      const armIdle = () => { clearTimeout(idleTimer); idleAt = performance.now() + T.IDLE_MS; if (!reduced) idleTimer = setTimeout(wake, T.IDLE_MS + 20); };
      function wake() { // anything that may change what the loop should do calls this
        if (dead) return;
        if (!live()) { stopLoop(); return; }
        if (!raf && (moving() || ry.y !== drawn)) raf = requestAnimationFrame(tick);
      }
      function tick(t) {
        raf = 0; info.ticks++;
        if (!live()) { last = 0; return; }
        if (cap && !dragging && last && t - last < cap) { raf = requestAnimationFrame(tick); return; } // touch: too soon, ask again next frame
        const dt = last ? Math.min((t - last) / 1000, T.DT_MAX) : 0; last = t;
        if (dt) {
          if (vel) { vel *= Math.exp(-dt / T.INERTIA_TAU); if (Math.abs(vel) < T.VEL_EPS) vel = 0; }
          if (autoOn()) av += (T.AUTO_SPEED - av) * (1 - Math.exp(-dt / T.AUTO_RAMP));
          ry.y += (vel + av) * dt;
        }
        if (ry.y !== drawn) { draw(); drawn = ry.y; }
        if (moving()) raf = requestAnimationFrame(tick);
        else { last = 0; if (idleAt === Infinity) armIdle(); } // a flick has run out: the quiet time starts now
      }
      const onDown = (e) => {
        if (dragging || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
        dragging = true; pid = e.pointerId; px = e.clientX; pt = e.timeStamp; vel = 0; av = 0; idleAt = Infinity; clearTimeout(idleTimer);
        try { canvas.setPointerCapture(pid); } catch (_) { /* the drag still works without capture */ }
        canvas.classList.add('drag'); wake();
      };
      const onMove = (e) => {
        if (!dragging || e.pointerId !== pid) return;
        const dy = (e.clientX - px) / (lw || 1) * T.DRAG_TURN, dm = Math.max(e.timeStamp - pt, 1);
        ry.y += dy; vel += (dy / dm * 1000 - vel) * (1 - Math.exp(-dm / T.VEL_SMOOTH_MS)); // yaw only: no pitch, zoom or pan
        px = e.clientX; pt = e.timeStamp; wake();
      };
      const endDrag = (fling) => (e) => {
        if (!dragging || e.pointerId !== pid) return;
        dragging = false; canvas.classList.remove('drag');
        try { if (canvas.hasPointerCapture(pid)) canvas.releasePointerCapture(pid); } catch (_) { /* already released */ }
        if (!fling || reduced || e.timeStamp - pt > T.HOLD_MS) vel = 0; // event time, not handler time: a busy main thread must not turn a flick into a hold
        else vel = Math.max(-T.VEL_MAX, Math.min(T.VEL_MAX, vel));
        if (Math.abs(vel) < T.VEL_EPS) vel = 0;
        if (vel) idleAt = Infinity; else armIdle(); // with inertia the quiet time starts when it ends (see tick)
        wake();
      };
      const onKey = (e) => {
        if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return; // everything else (Tab too) is left alone
        e.preventDefault();
        ry.y += e.key === 'ArrowRight' ? T.KEY_STEP : -T.KEY_STEP; vel = 0; av = 0; armIdle(); wake();
      };
      const onRm = () => { reduced = rm.matches; vel = 0; av = 0; clearTimeout(idleTimer); if (!reduced) armIdle(); wake(); }; // reduced motion: no auto-rotate, no inertia; drag and keys stay
      const up = endDrag(true), cancel = endDrag(false);
      const ev = [['pointerdown', onDown], ['pointermove', onMove], ['pointerup', up], ['pointercancel', cancel], ['lostpointercapture', cancel], ['keydown', onKey]];
      for (const [n, f] of ev) canvas.addEventListener(n, f);
      const io = new IntersectionObserver((es) => { onScreen = es[es.length - 1].isIntersecting; wake(); });
      io.observe(el);
      const mo = new MutationObserver(wake); mo.observe(html, { attributes: true, attributeFilter: ['class'] }); // html.panel-open
      document.addEventListener('visibilitychange', wake);
      rm.addEventListener('change', onRm);
      off = () => {
        stopLoop(); clearTimeout(idleTimer); io.disconnect(); mo.disconnect();
        document.removeEventListener('visibilitychange', wake); rm.removeEventListener('change', onRm);
        for (const [n, f] of ev) canvas.removeEventListener(n, f);
      };
    } catch (e) {
      if (!dead) dispose('failed', String((e && e.message) || e).slice(0, 80)); // silent: no console noise, the stage just goes away
    }
  })();
  return stop;
}
