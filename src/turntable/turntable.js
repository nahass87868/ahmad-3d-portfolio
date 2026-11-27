/*
 * Project-panel turntable stage. A lazy chunk: the stub at the end of src/main.js (window.__turntable) inserts the empty, final-size stage and imports this
 * only when a project has a `model` (models/<name>.glb, built by tools/build-turntable-models.py).
 *
 * Phase 7b: mount, parse, draw ONE Clay frame, dispose. No loop, no motion, no controls (7c orbit, 7d styles + accent, 7e polish).
 * One GL context per open stage; it is released on close, on a project swap, on any failure and on context loss. Failure removes the stage silently.
 * State for tests and the console: window.__turntable.info = { state: loading | ready | closed | failed | lost, reason, draws, model }.
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
};

const CSS = '.x-turn canvas{display:block;width:100%;height:100%;opacity:0;transition:opacity .6s var(--ease-out);background:var(--surface);background:radial-gradient(ellipse at 50% 40%,color-mix(in srgb,var(--ink) 10%,var(--surface)),var(--surface) 72%)}'
  + '.x-turn canvas.on{opacity:1}@media (prefers-reduced-motion:reduce){.x-turn canvas{transition:none}}'; // the box itself is the flat --surface placeholder (set by the stub); the spotlight fades in with the model

// ── GLB reader for the quantized files from tools/build-turntable-models.py (POSITION int16, NORMAL int8, both normalised; indices u16/u32) ──
// One mesh, one triangle list, no transforms. Positions and normals are widened to Float32 (the biggest model is ~0.4 MB that way),
// so no driver ever has to read normalised integer attributes. COLOR_0 is not read yet (Clay does not use it; 7d does).
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
  const info = { state: 'loading', reason: '', draws: 0, model: work.model };
  window.__turntable.info = info;
  const ac = new AbortController();
  let canvas, renderer, geo, mat, ro, timer, dead = false;

  function dispose(state, reason) {
    if (dead) return;
    dead = true;
    info.state = state; info.reason = reason || '';
    clearTimeout(timer); ac.abort(); if (ro) ro.disconnect();
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
      canvas.setAttribute('aria-label', (work.title || 'Project') + ' — 3D model');
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
    } catch (e) {
      if (!dead) dispose('failed', String((e && e.message) || e).slice(0, 80)); // silent: no console noise, the stage just goes away
    }
  })();
  return stop;
}
