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
