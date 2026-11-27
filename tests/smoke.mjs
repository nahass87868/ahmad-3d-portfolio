// Smoke test: opens the BUILT site (dist/) in a real browser and fails if a path, script or key feature is broken.
// Run: npm run build && npm run test:smoke   (uses the Chrome installed on the machine; or PW_CHROMIUM=/path/to/chrome)
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const DIST = resolve(process.env.DIST || 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.startsWith('/sub/')) p = p.slice(4); if (p.endsWith('/')) p += 'index.html'; // /sub/ = the same site under a sub-path
  const f = join(DIST, p);
  if (!f.startsWith(DIST) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

const { chromium } = await import(process.env.PW_MODULE || 'playwright-core');
const browser = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined, // optional: path to a Chrome/Chromium binary
  channel: process.env.PW_CHROMIUM ? undefined : 'chrome', // default: the Chrome already installed (your PC, GitHub runners)
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], // software WebGL so CI has no GPU
});
let failures = 0;
const check = (profile, name, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  [${profile}] ${name}${ok ? '' : '  ' + detail}`); };

for (const [profile, ctxOpts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  const ctx = await browser.newContext({ ...ctxOpts, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const problems = [];
  // pretend to be a strong device so the 3D is allowed to start (it is skipped on weak hardware on purpose)
  await page.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }); });
  page.on('pageerror', (e) => problems.push('script error: ' + String(e).slice(0, 120)));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console error: ' + m.text().slice(0, 120)); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url().replace(base, '')}`); });
  page.on('requestfailed', (r) => problems.push('request failed: ' + r.url().replace(base, '')));

  await page.goto(base);
  let lifted = true; try { await page.waitForFunction(() => document.body.classList.contains('go'), null, { timeout: 30000 }); } catch { lifted = false; }
  check(profile, 'loading curtain lifts', lifted);
  if (!lifted) { await ctx.close(); continue; }

  const name = await page.locator('#heroName').innerText();
  check(profile, 'hero name is there', /AHMAD/i.test(name), name);
  check(profile, 'hero stage exists (3D or designed fallback)', (await page.locator('.x-h3d').count()) === 1);

  if (profile === 'desktop') {
    let ran = true; try { await page.waitForFunction(() => window.__hero3d && window.__hero3d.state === 'running', null, { timeout: 25000 }); } catch { ran = false; }
    check(profile, '3D hero is running (not just the fallback)', ran, JSON.stringify(await page.evaluate(() => window.__hero3d || null)));
    // Phase 5c: on desktop the one canvas is a fixed full-viewport layer in <body> that never takes a click
    const cv = await page.evaluate(() => { const c = document.querySelector('canvas'); if (!c) return null; const s = getComputedStyle(c), r = c.getBoundingClientRect(); return { n: document.querySelectorAll('canvas').length, parent: c.parentElement.tagName, pos: s.position, pe: s.pointerEvents, w: Math.round(r.width), h: Math.round(r.height) }; });
    check(profile, 'desktop: one fixed full-viewport canvas that lets clicks through', !ran || (!!cv && cv.n === 1 && cv.parent === 'BODY' && cv.pos === 'fixed' && cv.pe === 'none' && cv.w === 1440 && cv.h === 900), JSON.stringify(cv));
  }
  if (profile === 'phone') {
    let ran = true; try { await page.waitForFunction(() => window.__hero3d && window.__hero3d.state === 'running', null, { timeout: 25000 }); } catch { ran = false; }
    // Phase 5f: on touch the canvas is the fixed full-viewport layer by default (stable 100lvh), and ?canvas=docked brings the old docked canvas back
    const cv = await page.evaluate(() => { const c = document.querySelector('canvas'); if (!c) return null; const s = getComputedStyle(c), r = c.getBoundingClientRect(); return { n: document.querySelectorAll('canvas').length, parent: c.parentElement.tagName, pos: s.position, pe: s.pointerEvents, w: Math.round(r.width), h: Math.round(r.height) }; });
    check(profile, 'touch: one fixed full-viewport canvas that lets touches through', !ran || (!!cv && cv.n === 1 && cv.parent === 'BODY' && cv.pos === 'fixed' && cv.pe === 'none' && cv.w === 390 && cv.h >= 844), JSON.stringify(cv));
    const p2 = await ctx.newPage();
    await p2.goto(base + '?canvas=docked');
    let ran2 = true; try { await p2.waitForFunction(() => window.__hero3d && window.__hero3d.state === 'running', null, { timeout: 25000 }); } catch { ran2 = false; }
    const docked = await p2.evaluate(() => { const c = document.querySelector('canvas'); return !!c && c.parentElement.classList.contains('x-h3d'); });
    check(profile, 'touch: ?canvas=docked keeps the canvas docked in the hero region', !ran2 || docked); // (when the designed fallback runs instead there is no canvas to place)
    await p2.evaluate(() => localStorage.removeItem('pf_canvas')); await p2.close();
  }
  // Phase 6b: the works planes (only when the 3D world runs)
  if (await page.evaluate(() => !!window.__hero3d && window.__hero3d.state === 'running')) {
    const planesOn = (pg) => pg.waitForFunction(() => { document.getElementById('works').scrollIntoView(); return !!window.__planes && window.__planes.state === 'on' && document.querySelectorAll('.tile.x-pl').length > 0; }, null, { timeout: 20000, polling: 500 }).then(() => true, () => false); // re-scrolls while polling: the intro can reset an early scroll
    const toWorks = async (pg) => { await pg.waitForFunction(() => window.__hero3d && window.__hero3d.state === 'running' && document.documentElement.classList.contains('x-hero-clear'), null, { timeout: 25000 }).catch(() => {}); await pg.evaluate(() => document.getElementById('works').scrollIntoView()); };
    await page.evaluate(() => document.getElementById('works').scrollIntoView());
    check(profile, 'works planes are on by default and at least one tile is a plane', await planesOn(page), JSON.stringify(await page.evaluate(() => window.__planes || null)));
    await page.waitForTimeout(2500); // Phase 6c: at rest (after the scroll wave has settled) the planes layer draws nothing
    const draws = await page.evaluate(() => new Promise((res) => { const G = WebGL2RenderingContext.prototype, de = G.drawElements, da = G.drawArrays; let n = 0; G.drawElements = function (...a) { n++; return de.apply(this, a); }; G.drawArrays = function (...a) { n++; return da.apply(this, a); }; setTimeout(() => { G.drawElements = de; G.drawArrays = da; res(n); }, 1000); }));
    check(profile, 'works planes idle: no GL draw call at rest', draws === 0, 'draw calls in 1 s: ' + draws);
    if (profile === 'desktop' && await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)) { // Phase 6d: a mouse on a tile wakes the layer; once the effects settle it is idle again with the pointer still there
      const drawCount = (ms) => page.evaluate((ms) => new Promise((res) => { const G = WebGL2RenderingContext.prototype, de = G.drawElements, da = G.drawArrays; let n = 0; G.drawElements = function (...a) { n++; return de.apply(this, a); }; G.drawArrays = function (...a) { n++; return da.apply(this, a); }; setTimeout(() => { G.drawElements = de; G.drawArrays = da; res(n); }, ms); }), ms);
      await page.evaluate(() => document.querySelector('#grid .tile.x-pl .th').scrollIntoView({ block: 'center', behavior: 'instant' })); await page.waitForTimeout(2500);
      const rc = await page.evaluate(() => { const r = document.querySelector('#grid .tile.x-pl .th').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      const during = drawCount(500);
      await page.mouse.move(rc.x - 40, rc.y - 40); await page.mouse.move(rc.x, rc.y, { steps: 5 });
      const woke = await during; await page.waitForTimeout(1500);
      const rest = await drawCount(1000);
      check(profile, 'works planes hover: a mouse on a tile draws, then no GL draw at rest', woke > 0 && rest === 0, `draw calls while moving ${woke}, at rest ${rest}`);
      await page.mouse.move(2, 2);
    }
    if (profile === 'desktop') { // Phase 6e: a card opens and Escape closes it, each with a View Transition; nothing is left behind and the card is a plane again
      await page.evaluate(() => { window.__vtN = 0; const s = document.startViewTransition; if (s) document.startViewTransition = function (...a) { window.__vtN++; return s.apply(this, a); }; });
      const href = await page.evaluate(() => { const t = document.querySelector('#grid .tile.x-pl'); t.querySelector('.th').scrollIntoView({ block: 'center', behavior: 'instant' }); return t.querySelector('a').getAttribute('href'); });
      await page.waitForTimeout(2500);
      await page.click(`#grid .tile > a[href="${href}"]`); await page.waitForTimeout(2200);
      await page.keyboard.press('Escape');
      await page.waitForFunction((h) => !document.documentElement.classList.contains('x-vt-close') && !document.documentElement.classList.contains('panel-open') && document.querySelector(`#grid .tile > a[href="${h}"]`).parentElement.classList.contains('x-pl'), href, { timeout: 8000 }).catch(() => {});
      const rv = await page.evaluate((h) => ({ n: window.__vtN, hash: location.hash, hidden: document.getElementById('panel').getAttribute('aria-hidden'), name: document.querySelector(`#grid .tile > a[href="${h}"] .th`).style.viewTransitionName, inst: document.getElementById('panel').classList.contains('instant'), hold: document.documentElement.classList.contains('x-vt-close'), pl: document.querySelector(`#grid .tile > a[href="${h}"]`).parentElement.classList.contains('x-pl') }), href);
      check(profile, 'works close: Escape runs the reverse View Transition, leaves nothing behind, the card is a plane again', rv.n === 2 && rv.hidden === 'true' && rv.hash.length <= 1 && !rv.name && !rv.inst && !rv.hold && rv.pl, JSON.stringify(rv));
    }
    const p3 = await ctx.newPage();
    await p3.goto(base + '?planes=off'); await toWorks(p3); await p3.waitForTimeout(2000);
    const off = await p3.evaluate(() => ({ pl: document.querySelectorAll('.tile.x-pl').length, st: window.__planes && window.__planes.state }));
    check(profile, '?planes=off: no plane tiles', off.pl === 0 && off.st !== 'on', JSON.stringify(off));
    await p3.goto(base + '?planes=on'); await toWorks(p3);
    const again = await planesOn(p3);
    await p3.evaluate(() => document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await p3.waitForTimeout(1500);
    const lost = await p3.evaluate(() => ({ pl: document.querySelectorAll('.tile.x-pl').length, st: window.__planes && window.__planes.state }));
    check(profile, 'forced context loss: no plane tiles remain, state lost', again && lost.pl === 0 && lost.st === 'lost', JSON.stringify(lost));
    await p3.evaluate(() => localStorage.removeItem('pf_planes')); await p3.close();
  }
  const badFonts = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'error').map((f) => f.family); });
  check(profile, 'all fonts loaded', badFonts.length === 0, badFonts.join(', '));

  const works = await page.evaluate(() => window.__WORKS__.length);
  const tiles = await page.locator('#grid .tile').count();
  check(profile, `grid shows all ${works} projects`, tiles === works, `found ${tiles}`);

  const chips = page.locator('#chips button');
  await page.locator('#works').scrollIntoViewIfNeeded();
  if ((await chips.count()) > 1) {
    const visible = () => page.locator('#grid .tile').evaluateAll((t) => t.filter((e) => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden').length);
    await chips.nth(1).click(); await page.waitForTimeout(900);
    const filtered = await visible();
    await chips.nth(0).click(); await page.waitForTimeout(900);
    const all = await visible();
    check(profile, 'category filter narrows the grid and ALL restores it', filtered > 0 && filtered < works && all === works, `filtered ${filtered}, all ${all}`);
  }

  await page.locator('#grid .tile > a').first().click(); await page.waitForTimeout(2500);
  const opened = await page.evaluate(() => ({ hash: location.hash, hidden: document.getElementById('panel').getAttribute('aria-hidden') }));
  check(profile, 'project opens (hash set, panel visible)', opened.hash.length > 1 && opened.hidden === 'false', JSON.stringify(opened));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  const closed = await page.evaluate(() => ({ hash: location.hash, hidden: document.getElementById('panel').getAttribute('aria-hidden') }));
  check(profile, 'Escape closes the project', closed.hidden === 'true' && closed.hash.length <= 1, JSON.stringify(closed));

  // breakdown slider: a flagged project shows it at "Wire" (scroll moves it from there), an arrow key changes the layer, a project without the flag has none
  await page.evaluate(() => { location.hash = '#work/realistic-ice'; }); await page.waitForTimeout(2500);
  const bd0 = await page.locator('.bd-stage[role=slider]').getAttribute('aria-valuetext');
  await page.locator('.bd-stage').evaluate((e) => e.focus({ preventScroll: true })); await page.keyboard.press('ArrowRight'); // preventScroll: scroll would move the slider
  const bd1 = await page.locator('.bd-stage').getAttribute('aria-valuetext');
  await page.evaluate(() => { location.hash = '#work/realistic-water-glass'; }); await page.waitForTimeout(2500);
  const bdNone = await page.locator('.bd').count();
  const ttNone = await page.locator('.x-turn').count(); // Phase 7b: realistic-water-glass has no `model`, so no stage
  check(profile, 'breakdown slider: Wire, arrow key changes layer, none without the flag', bd0 === 'Wire' && bd1 === 'Clay' && bdNone === 0, `${bd0} / ${bd1} / ${bdNone}`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);

  // Phase 7b: the project-panel turntable stage (it follows the hero's skip rules, so only when the 3D world runs)
  if (await page.evaluate(() => !!window.__hero3d && window.__hero3d.state === 'running')) {
    const recorder = () => { // record every stage GL context and every GL draw call made on a stage canvas
      window.__ttGl = []; window.__ttDraws = 0;
      const gc = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...a) { const c = gc.apply(this, a); if (c && a[0] === 'webgl2' && this.parentElement && this.parentElement.classList.contains('x-turn')) window.__ttGl.push(c); return c; };
      const G = WebGL2RenderingContext.prototype;
      for (const f of ['drawElements', 'drawArrays']) { const o = G[f]; G[f] = function (...a) { if (this.canvas.parentElement && this.canvas.parentElement.classList.contains('x-turn')) window.__ttDraws++; return o.apply(this, a); }; }
    };
    const sg = await ctx.newPage(); const sgEr = []; // a page of its own for the stage checks
    sg.on('pageerror', (e) => sgEr.push('script error: ' + String(e).slice(0, 100)));
    sg.on('console', (m) => { if (m.type() === 'error') sgEr.push('console error: ' + m.text().slice(0, 100)); });
    sg.on('response', (r) => { if (r.status() >= 400) sgEr.push(`HTTP ${r.status()}: ${r.url().replace(base, '')}`); });
    await sg.goto(base); await sg.waitForFunction(() => document.body.classList.contains('go'), null, { timeout: 30000 }).catch(() => {});
    await sg.evaluate(recorder);
    // the stage is in the page, at its final size, BEFORE the chunk and model arrive, and nothing below it moves when the model is drawn
    const sh = await sg.evaluate(() => new Promise((res) => {
      const panel = document.getElementById('panel'), out = {};
      const mo = new MutationObserver(() => {
        const t = panel.querySelector('.x-turn'); if (!t) return; mo.disconnect();
        const g = () => t.nextElementSibling.offsetTop;
        out.h0 = Math.round(t.getBoundingClientRect().height); out.top0 = g(); out.canvas0 = t.querySelector('canvas') ? 1 : 0;
        const iv = setInterval(() => { const i = window.__turntable.info; if (i && i.model === 'yerba-mate' && i.state !== 'loading') { clearInterval(iv); out.state = i.state; out.top1 = g(); out.canvas1 = t.querySelector('canvas') ? 1 : 0; res(out); } }, 50);
      });
      mo.observe(panel, { childList: true, subtree: true });
      setTimeout(() => res({ ...out, timeout: true }), 25000);
      location.hash = '#work/yerba-mate-animation';
    }));
    check(profile, 'stage: reserved at its final size before the model loads, nothing shifts when it is drawn', sh.h0 > 150 && sh.canvas0 === 0 && sh.state === 'ready' && sh.canvas1 === 1 && sh.top1 === sh.top0, JSON.stringify(sh));
    const lay = await sg.evaluate(() => { const t = document.querySelector('.x-turn'), c = t && t.querySelector('canvas'); return t && { prev: t.previousElementSibling && t.previousElementSibling.className, next: t.nextElementSibling && t.nextElementSibling.className, role: c && c.getAttribute('role'), label: c && c.getAttribute('aria-label') }; });
    check(profile, 'stage: sits between the Breakdown and the gallery, canvas has a name', !!lay && lay.prev === 'bd' && lay.next === 'gallery' && lay.role === 'img' && /3D model/.test(lay.label || ''), JSON.stringify(lay));
    // Phase 7c: the stage auto-rotates, so "at rest" is now the reduced-motion state (nothing moves by itself). Switching it on at run time also proves the loop reacts to the change.
    await sg.emulateMedia({ reducedMotion: 'reduce' });
    await sg.waitForTimeout(800);
    const d0 = await sg.evaluate(() => window.__ttDraws); await sg.waitForTimeout(1500); const d1 = await sg.evaluate(() => window.__ttDraws);
    check(profile, 'stage: one frame is drawn, then no GL draw call at rest (reduced motion)', d0 >= 1 && d0 === d1, `after load ${d0}, 1.5 s later ${d1}`);

    // ── Phase 7c: orbit, inertia, auto-rotate, loop gating (same page, same yerba-mate stage; reduced motion is still on) ──
    const snap = () => sg.evaluate(() => { const i = window.__turntable.info; return { y: i.yaw, auto: i.auto, ticks: i.ticks, draws: window.__ttDraws, st: i.state }; });
    const cbox = async () => { // bring the canvas to the middle of the panel and return its centre
      await sg.evaluate(() => document.querySelector('.x-turn canvas').scrollIntoView({ block: 'center', behavior: 'instant' })); await sg.waitForTimeout(300);
      return sg.evaluate(() => { const r = document.querySelector('.x-turn canvas').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
    };
    const drag = async (c, dx, steps, gap) => { await sg.mouse.move(c.x, c.y); await sg.mouse.down(); for (let k = 1; k <= steps; k++) { await sg.mouse.move(c.x + dx * k / steps, c.y); if (gap) await sg.waitForTimeout(gap); } await sg.mouse.up(); };
    const near = (a, b, e = 1e-6) => Math.abs(a - b) <= e;

    // reduced motion: no auto-rotate, no inertia; drag and keys still work
    const q0 = await snap(); await sg.waitForTimeout(1200); const q1 = await snap();
    const c0 = await cbox();
    await drag(c0, 150, 8, 16);
    const q2 = await snap(); await sg.waitForTimeout(700); const q3 = await snap();
    await sg.locator('.x-turn canvas').focus(); await sg.keyboard.press('ArrowRight'); await sg.waitForTimeout(150); const q4 = await snap();
    check(profile, 'stage: reduced motion has no auto-rotate and no inertia, drag and arrow keys still work',
      !q0.auto && !q1.auto && near(q0.y, q1.y) && q2.y > q1.y + 0.1 && near(q3.y, q2.y) && !q3.auto && q4.y > q3.y + 0.1,
      JSON.stringify({ q0, q1, q2, q3, q4 }));

    if (profile === 'phone') { // touch: a vertical swipe does not orbit (touch-action: pan-y hands it to the browser), a horizontal one does. Headless touch is simulated: real-finger scroll-versus-orbit stays unverified.
      const cdp = await ctx.newCDPSession(sg);
      const swipe = async (c, dx, dy, steps) => {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y }] });
        for (let k = 1; k <= steps; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x + dx * k / steps, y: c.y + dy * k / steps }] }); await sg.waitForTimeout(16); }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sg.waitForTimeout(500);
      };
      const ta = await sg.evaluate(() => getComputedStyle(document.querySelector('.x-turn canvas')).touchAction);
      const cs = await cbox(); const t0 = await snap(); const sc0 = await sg.evaluate(() => document.getElementById('panel').scrollTop);
      await swipe(cs, 0, -150, 6);
      const t1 = await snap(); const sc1 = await sg.evaluate(() => document.getElementById('panel').scrollTop);
      const ch = await cbox(); const t2 = await snap();
      await swipe(ch, 150, 0, 6);
      const t3 = await snap();
      check(profile, 'stage: touch-action is pan-y, a vertical swipe does not orbit the model, a horizontal swipe does (simulated touch)',
        ta === 'pan-y' && near(t1.y, t0.y, 0.02) && t3.y > t2.y + 0.3, JSON.stringify({ ta, t0: t0.y, t1: t1.y, scrollBefore: sc0, scrollAfter: sc1, t2: t2.y, t3: t3.y }));
    }

    // auto-rotate: it comes back by itself after the idle delay, advances while on screen, stops when a drag begins and resumes after the idle delay
    await sg.emulateMedia({ reducedMotion: 'no-preference' });
    const tA = Date.now();
    const auto1 = await sg.waitForFunction(() => window.__turntable.info.auto, null, { timeout: 8000 }).then(() => Date.now() - tA, () => -1);
    const b1 = await snap(); await sg.waitForTimeout(1200); const b2 = await snap();
    const cb = await cbox(); await sg.mouse.move(cb.x, cb.y); await sg.mouse.down(); await sg.waitForTimeout(150);
    const b3 = await snap(); await sg.waitForTimeout(700); const b4 = await snap();
    await sg.mouse.up(); const tB = Date.now();
    const auto2 = await sg.waitForFunction(() => window.__turntable.info.auto, null, { timeout: 8000 }).then(() => Date.now() - tB, () => -1);
    const b5 = await snap(); await sg.waitForTimeout(1000); const b6 = await snap();
    check(profile, 'stage: auto-rotate advances on screen, stops when a drag begins, resumes after the idle delay',
      auto1 >= 2300 && auto1 < 8000 && b2.y > b1.y + 0.03 && b2.draws > b1.draws && !b3.auto && near(b4.y, b3.y) && auto2 >= 2300 && auto2 < 8000 && b6.y > b5.y + 0.03,
      JSON.stringify({ auto1, auto2, b1: b1.y, b2: b2.y, b3: b3.y, b4: b4.y, b5: b5.y, b6: b6.y, d: [b1.draws, b2.draws] }));

    // a flick: the yaw keeps going after the release, in the drag direction, decays to exactly 0 (yaw and draw count stop moving, no tick pending), THEN the idle delay runs and auto-rotate returns
    const cf = await cbox();
    // the flick is dispatched inside the page with 16 ms between moves on the page's own clock (a driven mouse is delivered seconds apart when software GL hogs the thread, which would make it a slow drag, not a flick)
    await sg.evaluate(({ x, y }) => {
      const c = document.querySelector('.x-turn canvas'), spin = (ms) => { const e = performance.now() + ms; while (performance.now() < e); };
      const ev = (t, cx) => c.dispatchEvent(new PointerEvent(t, { pointerId: 7, isPrimary: true, pointerType: 'mouse', button: 0, clientX: cx, clientY: y, bubbles: true, cancelable: true }));
      ev('pointerdown', x - 100); for (let k = 1; k <= 8; k++) { spin(16); ev('pointermove', x - 100 + 25 * k); } ev('pointerup', x + 100);
    }, cf);
    const trace = await sg.evaluate(() => new Promise((res) => { const out = [], t0 = performance.now(); const iv = setInterval(() => { const i = window.__turntable.info; out.push([Math.round(performance.now() - t0), i.yaw, i.ticks, window.__ttDraws, i.auto]); if (performance.now() - t0 > 12000) { clearInterval(iv); res(out); } }, 50); }));
    let still = -1; // first sample that starts a stable run of 6 (300 ms): same yaw, same ticks, same draws, auto-rotate off
    for (let k = 0; k + 5 < trace.length; k++) { const w = trace.slice(k, k + 6); if (w.every((r) => r[1] === w[0][1] && r[2] === w[0][2] && r[3] === w[0][3] && !r[4])) { still = k; break; } }
    const gain = still > 0 ? trace[still][1] - trace[0][1] : 0; // yaw gained between 50 ms after the release and the stop
    const resumed = still >= 0 && trace.slice(still).some((r, k, a) => r[4] && r[1] > a[0][1]);
    check(profile, 'stage: a flick keeps turning after release, decays to exactly 0 and the loop stops, then auto-rotate returns',
      still > 0 && gain > 0.2 && resumed, JSON.stringify({ still, gain, resumed, head: trace.slice(0, 4), at: still >= 0 ? trace[still] : null, tail: trace.slice(-2) }));

    // gating: 0 GL draws and 0 ticks while the stage is off screen, the tab is hidden (mocked) or the panel is closed; it moves again when the condition ends
    await sg.waitForFunction(() => window.__turntable.info.auto, null, { timeout: 8000 }).catch(() => {});
    const still0 = async (ms = 1000) => { const a = await snap(); await sg.waitForTimeout(ms); const b = await snap(); return a.draws === b.draws && a.ticks === b.ticks && near(a.y, b.y); };
    const moves = async () => { const a = await snap(); return sg.waitForFunction((d) => window.__ttDraws > d, a.draws, { timeout: 4000 }).then(() => true, () => false); }; // software GL runs only a few frames a second
    await cbox(); const g0 = await moves();
    await sg.evaluate(() => { const p = document.getElementById('panel'); p.scrollTop = p.scrollHeight; }); await sg.waitForTimeout(600);
    const goff = await sg.evaluate(() => { const r = document.querySelector('.x-turn canvas').getBoundingClientRect(); return r.bottom < 0 || r.top > innerHeight; });
    const g1 = await still0(); await cbox(); const g2 = await moves();
    await sg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); await sg.waitForTimeout(400);
    const g3 = await still0();
    await sg.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); }); const g4 = await moves();
    await sg.evaluate(() => document.documentElement.classList.remove('panel-open')); await sg.waitForTimeout(400);
    const g5 = await still0();
    await sg.evaluate(() => document.documentElement.classList.add('panel-open')); const g6 = await moves();
    check(profile, 'stage: 0 GL draws and 0 ticks off screen, in a hidden tab (mocked) and with the panel closed; it moves again afterwards',
      g0 && goff && g1 && g2 && g3 && g4 && g5 && g6, JSON.stringify({ g0, goff, g1, g2, g3, g4, g5, g6 }));

    // keys: arrows turn it (and only arrows are taken), the focus ring shows, Tab leaves the canvas
    await cbox(); await sg.locator('.x-turn canvas').focus();
    const k0 = await snap(); await sg.keyboard.press('ArrowRight'); await sg.waitForTimeout(150); const k1 = await snap();
    await sg.keyboard.press('ArrowLeft'); await sg.waitForTimeout(150); const k2 = await snap();
    const ring = await sg.evaluate(() => { const c = document.querySelector('.x-turn canvas'), cs = getComputedStyle(c); return { vis: c.matches(':focus-visible'), style: cs.outlineStyle, width: cs.outlineWidth, tab: c.tabIndex }; });
    const prevented = await sg.evaluate(() => { const c = document.querySelector('.x-turn canvas'); const t = (key) => { const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }); c.dispatchEvent(e); return e.defaultPrevented; }; return { right: t('ArrowRight'), left: t('ArrowLeft'), tab: t('Tab'), up: t('ArrowUp') }; });
    await sg.keyboard.press('Tab'); const moved = await sg.evaluate(() => document.activeElement !== document.querySelector('.x-turn canvas'));
    check(profile, 'stage: arrow keys rotate it, the focus ring is visible, only arrows are handled, Tab is not trapped',
      k1.y - k0.y > 0.1 && k1.y - k0.y < 0.2 && near(k2.y, k1.y - 0.15, 1e-6) && ring.vis && ring.style !== 'none' && parseFloat(ring.width) > 0 && ring.tab === 0
        && prevented.right && prevented.left && !prevented.tab && !prevented.up && moved,
      JSON.stringify({ d1: k1.y - k0.y, d2: k2.y - k1.y, ring, prevented, moved }));
    // ten quick project swaps (models and non-models mixed) on a page of its own (they abort in-flight project videos, which is fine but is not what the check above is about),
    // then close: one stage at most, and once the close timer has run no canvas and no live GL context
    const seq = ['nike-shoe-modeling', 'realistic-water-glass', 'date-cookies-animation', 'yerba-mate-animation', 'youth-affairs-logo-animation', 'nike-shoe-modeling', 'realistic-ice', 'date-cookies-animation', 'yerba-mate-animation', 'nike-shoe-modeling'];
    for (const sl of seq) { await sg.evaluate((x) => { location.hash = '#work/' + x; }, sl); await sg.waitForTimeout(150); }
    const rdy = await sg.waitForFunction(() => window.__turntable.info && window.__turntable.info.model === 'nike-shoe' && window.__turntable.info.state === 'ready', null, { timeout: 25000 }).then(() => true, () => false);
    const one = await sg.evaluate(() => ({ st: document.querySelectorAll('.x-turn').length, cv: document.querySelectorAll('#panel canvas').length }));
    await sg.evaluate(() => document.querySelector('.x-turn canvas').scrollIntoView({ block: 'center', behavior: 'instant' })); // a new panel opens with the stage below the fold: bring it up so the loop is really running when it is closed
    const ran = await sg.waitForFunction(() => window.__turntable.info.ticks > 2, null, { timeout: 8000 }).then(() => true, () => false);
    await sg.keyboard.press('Escape');
    const gone = await sg.waitForFunction(() => !document.querySelector('.x-turn') && !document.querySelector('#panel canvas'), null, { timeout: 5000 }).then(() => true, () => false); // cleanup runs after the 600 ms close timer
    const leak = await sg.evaluate(() => ({ made: window.__ttGl.length, alive: window.__ttGl.filter((g) => !g.isContextLost()).length, state: window.__turntable.info.state }));
    check(profile, 'stage: 10 quick swaps leave one stage; after close no canvas and every GL context is released', rdy && one.st === 1 && one.cv === 1 && gone && leak.made >= 3 && leak.alive === 0 && leak.state === 'closed' && sgEr.length === 0, JSON.stringify({ rdy, one, gone, leak, sgEr }));
    const tk0 = await sg.evaluate(() => ({ t: window.__turntable.info.ticks, d: window.__ttDraws })); await sg.waitForTimeout(700); const tk1 = await sg.evaluate(() => ({ t: window.__turntable.info.ticks, d: window.__ttDraws }));
    check(profile, 'stage: no tick and no GL draw runs after close (it was running)', ran && gone && tk0.t > 2 && tk0.t === tk1.t && tk0.d === tk1.d, JSON.stringify({ tk0, tk1 }));
    await sg.close();
    check(profile, 'stage: a project without a model has none', ttNone === 0, String(ttNone));

    if (profile === 'desktop') {
      const open = async (url, route) => { const pg = await ctx.newPage(); const er = []; pg.on('pageerror', (e) => er.push('script error: ' + String(e).slice(0, 100))); pg.on('console', (m) => { if (m.type() === 'error') er.push('console error: ' + m.text().slice(0, 100)); }); pg.on('response', (r) => { if (r.status() >= 400) er.push(`HTTP ${r.status()}: ${r.url().replace(base, '')}`); }); const rq = []; pg.on('request', (r) => rq.push(r.url().replace(base, ''))); if (route) await route(pg); await pg.goto(url); return { pg, er, rq }; };
      const stageState = (pg, st) => pg.waitForFunction((s) => window.__turntable && window.__turntable.info && window.__turntable.info.state === s, st, { timeout: 25000 }).then(() => true, () => false);
      // deep link under a sub-path: the model URL is document-relative
      const a1 = await open(base + 'sub/#work/nike-shoe-modeling');
      const ok1 = await stageState(a1.pg, 'ready'); const n1 = await a1.pg.locator('.x-turn canvas').count();
      check(profile, 'stage: deep link under a sub-path loads its model (document-relative URL)', ok1 && n1 === 1 && a1.er.length === 0 && a1.rq.some((u) => /models\/nike-shoe\.glb$/.test(u)), JSON.stringify({ ok1, n1, er: a1.er, rq: a1.rq.filter((u) => /glb|turntable/.test(u)) }));
      await a1.pg.close();
      // ?turntable=off: no stage, no chunk, no model request; remembered; ?turntable=on clears it
      const a2 = await open(base + '?turntable=off#work/nike-shoe-modeling'); await a2.pg.waitForTimeout(4000);
      const n2 = await a2.pg.evaluate(() => ({ tt: document.querySelectorAll('.x-turn').length, mem: localStorage.getItem('pf_turntable') }));
      const bad2 = a2.rq.filter((u) => /chunks\/turntable|\.glb/.test(u));
      await a2.pg.goto(base + '#work/nike-shoe-modeling'); await a2.pg.waitForTimeout(3000); // remembered without the parameter
      const n2b = await a2.pg.evaluate(() => document.querySelectorAll('.x-turn').length);
      await a2.pg.goto(base + '?turntable=on#work/nike-shoe-modeling'); const ok2 = await stageState(a2.pg, 'ready');
      const mem2 = await a2.pg.evaluate(() => localStorage.getItem('pf_turntable'));
      check(profile, '?turntable=off: no stage and no requests, remembered; ?turntable=on brings it back', n2.tt === 0 && n2.mem === 'off' && bad2.length === 0 && n2b === 0 && ok2 && mem2 === null, JSON.stringify({ n2, bad2, n2b, ok2, mem2 }));
      await a2.pg.close();
      // a model that does not load: the stage goes away silently
      const a3 = await open(base + '#work/nike-shoe-modeling', (pg) => pg.route('**/models/nike-shoe.glb', (r) => r.fulfill({ status: 404, body: 'no' })));
      const f3 = await stageState(a3.pg, 'failed'); await a3.pg.waitForTimeout(300);
      const n3 = await a3.pg.locator('.x-turn').count();
      check(profile, 'stage: a missing model removes the stage silently (state failed)', f3 && n3 === 0 && !a3.er.some((e) => /script error/.test(e)), JSON.stringify({ f3, n3, er: a3.er }));
      await a3.pg.close();
      // forced context loss while open
      const a4 = await open(base + '#work/nike-shoe-modeling');
      await stageState(a4.pg, 'ready');
      await a4.pg.evaluate(() => document.querySelector('.x-turn canvas').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await a4.pg.waitForFunction(() => window.__turntable.info.ticks > 2, null, { timeout: 8000 }).catch(() => {});
      const tg0 = await a4.pg.evaluate(() => window.__turntable.info.ticks); // 7c: it is turning (ticks are running) when the context is lost
      await a4.pg.evaluate(() => document.querySelector('.x-turn canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      const l4 = await stageState(a4.pg, 'lost'); await a4.pg.waitForTimeout(300);
      const n4 = await a4.pg.locator('.x-turn').count();
      const tg1 = await a4.pg.evaluate(() => window.__turntable.info.ticks); await a4.pg.waitForTimeout(600); const tg2 = await a4.pg.evaluate(() => window.__turntable.info.ticks);
      check(profile, 'stage: after a forced context loss the loop is stopped (no tick runs)', tg0 > 2 && tg1 === tg2, JSON.stringify({ tg0, tg1, tg2 }));
      check(profile, 'stage: forced context loss removes the stage (state lost)', l4 && n4 === 0 && !a4.er.some((e) => /script error/.test(e)), JSON.stringify({ l4, n4, er: a4.er }));
      await a4.pg.close();
    }
  }

  if (profile === 'phone') {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Menu' }).first().click(); await page.waitForTimeout(800);
    check(profile, 'phone menu opens', (await page.locator('.x-sheet.open').count()) === 1);
    await page.keyboard.press('Escape'); await page.waitForTimeout(800);
    check(profile, 'Escape closes the phone menu', (await page.locator('.x-sheet.open').count()) === 0);
  }

  check(profile, 'no 404s, failed requests or script errors', problems.length === 0, '\n        ' + problems.slice(0, 6).join('\n        '));
  await ctx.close();
}
await browser.close(); server.close();
console.log(failures ? `\nSMOKE TEST FAILED (${failures})` : '\nSMOKE TEST PASSED');
process.exit(failures ? 1 : 0);
