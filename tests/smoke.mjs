// Smoke test: opens the BUILT site (dist/) in a real browser and fails if a path, script or key feature is broken.
// Run: npm run build && npm run test:smoke   (uses the Chrome installed on the machine; or PW_CHROMIUM=/path/to/chrome)
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';

const DIST = resolve(process.env.DIST || 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
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
  check(profile, 'breakdown slider: Wire, arrow key changes layer, none without the flag', bd0 === 'Wire' && bd1 === 'Clay' && bdNone === 0, `${bd0} / ${bd1} / ${bdNone}`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);

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
