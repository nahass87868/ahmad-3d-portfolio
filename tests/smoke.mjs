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
    await sg.waitForTimeout(800);
    const d0 = await sg.evaluate(() => window.__ttDraws); await sg.waitForTimeout(1500); const d1 = await sg.evaluate(() => window.__ttDraws);
    check(profile, 'stage: one frame is drawn, then no GL draw call at rest', d0 >= 1 && d0 === d1, `after load ${d0}, 1.5 s later ${d1}`);
    // ten quick project swaps (models and non-models mixed) on a page of its own (they abort in-flight project videos, which is fine but is not what the check above is about),
    // then close: one stage at most, and once the close timer has run no canvas and no live GL context
    const seq = ['nike-shoe-modeling', 'realistic-water-glass', 'date-cookies-animation', 'yerba-mate-animation', 'youth-affairs-logo-animation', 'nike-shoe-modeling', 'realistic-ice', 'date-cookies-animation', 'yerba-mate-animation', 'nike-shoe-modeling'];
    for (const sl of seq) { await sg.evaluate((x) => { location.hash = '#work/' + x; }, sl); await sg.waitForTimeout(150); }
    const rdy = await sg.waitForFunction(() => window.__turntable.info && window.__turntable.info.model === 'nike-shoe' && window.__turntable.info.state === 'ready', null, { timeout: 25000 }).then(() => true, () => false);
    const one = await sg.evaluate(() => ({ st: document.querySelectorAll('.x-turn').length, cv: document.querySelectorAll('#panel canvas').length }));
    await sg.keyboard.press('Escape');
    const gone = await sg.waitForFunction(() => !document.querySelector('.x-turn') && !document.querySelector('#panel canvas'), null, { timeout: 5000 }).then(() => true, () => false); // cleanup runs after the 600 ms close timer
    const leak = await sg.evaluate(() => ({ made: window.__ttGl.length, alive: window.__ttGl.filter((g) => !g.isContextLost()).length, state: window.__turntable.info.state }));
    check(profile, 'stage: 10 quick swaps leave one stage; after close no canvas and every GL context is released', rdy && one.st === 1 && one.cv === 1 && gone && leak.made >= 3 && leak.alive === 0 && leak.state === 'closed' && sgEr.length === 0, JSON.stringify({ rdy, one, gone, leak, sgEr }));
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
      await a4.pg.evaluate(() => document.querySelector('.x-turn canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      const l4 = await stageState(a4.pg, 'lost'); await a4.pg.waitForTimeout(300);
      const n4 = await a4.pg.locator('.x-turn').count();
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
