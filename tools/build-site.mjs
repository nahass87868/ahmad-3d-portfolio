/*
 * npm run build
 *   1. Vite builds the modern layer (src/main.js) into .build/modules
 *   2. the existing site is copied into dist/ UNCHANGED, plus the module bundle
 *   3. every copied file is compared with its source, byte for byte. A difference stops the build.
 * Only the files listed below are published. tools/, models-src/, assets-src/ and the like never are.
 */
import { build } from 'vite';
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const MODULES = join(ROOT, '.build', 'modules');

const SITE_URL = 'https://nahass87868.github.io/ahmad-3d-portfolio/'; // share cards need absolute addresses. If you ever get a custom domain, change this one line.
const FILES = ['content/works.js', 'style.css', 'premium.css', 'script.js', 'extras.js', 'fixes.js', 'about-photo.js', 'hero-3d-model.js', 'polish.js', 'premium.js'];
// not published: the old three.js (replaced by the npm version), and the .jpg masters in images/ (they stay in the repo; the site shows the .webp versions)
const skipped = (r) => r === 'vendor/three.min.js' || (r.startsWith('images/') && r.endsWith('.jpg'));
const rel = (p) => relative(ROOT, p).split('\\').join('/');
const DIRS = ['vendor', 'fonts', 'images', 'videos', 'og'];
const MODULE_TAG_SOURCE = 'src="src/main.js"'; // as written in index.html, which Vite's dev server serves from the project root
const MODULE_TAG_DIST = 'src="main.js"'; // the same file, as published next to index.html
const NOSCRIPT_MARKER = '<!-- NOSCRIPT_PROJECTS -->'; // in index.html: replaced by a plain list of the projects, for visitors and scrapers without JavaScript

const fail = (msg) => { console.error('\nBUILD FAILED: ' + msg); process.exit(1); };
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

console.log('1/3  building the modern layer with Vite');
await build({ configFile: join(ROOT, 'vite.config.js'), logLevel: 'warn' });
if (!existsSync(join(MODULES, 'main.js'))) fail('Vite did not produce main.js');

const ctx = { window: {} };
vm.runInNewContext(readFileSync(join(ROOT, 'content/works.js'), 'utf8'), ctx);
const works = ctx.window.__WORKS__;
if (!Array.isArray(works) || !works.length) fail('content/works.js has no projects');
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

console.log('2/3  assembling dist/');
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const f of FILES) { if (!existsSync(join(ROOT, f))) fail('missing ' + f); cpSync(join(ROOT, f), join(DIST, f)); }
for (const d of DIRS) { if (!existsSync(join(ROOT, d))) fail('missing folder ' + d); cpSync(join(ROOT, d), join(DIST, d), { recursive: true, filter: (src) => !skipped(rel(src)) }); }
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
if (html.split(MODULE_TAG_SOURCE).length !== 2) fail('index.html must contain exactly one ' + MODULE_TAG_SOURCE);
if (html.split(NOSCRIPT_MARKER).length !== 2) fail('index.html must contain exactly one ' + NOSCRIPT_MARKER);
const projectList = `<h2>Projects</h2>\n        <ul>\n${works.map((w) => `          <li><a href="work/${esc(w.slug)}/">${esc(w.title)}</a> (${esc(w.category)}, ${esc(w.year)})</li>`).join('\n')}\n        </ul>`;
writeFileSync(join(DIST, 'index.html'), html.replace(MODULE_TAG_SOURCE, MODULE_TAG_DIST).replace(NOSCRIPT_MARKER, () => projectList));

// one small page per project: its own title and preview image for chat apps; people are sent on to the project on the real site
let cards = 0;
for (const w of works) {
  const hasOg = existsSync(join(ROOT, 'og', w.slug + '.jpg'));
  if (!hasOg) console.warn('  warning: og/' + w.slug + '.jpg is missing, so ' + w.slug + ' shares without a preview image');
  const url = SITE_URL + 'work/' + w.slug + '/', title = w.title + ' \u2014 Ahmad Nahass';
  const page = `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <title>${esc(title)}</title>\n    <meta name="description" content="${esc(w.description)}" />\n    <link rel="canonical" href="${url}" />\n    <meta property="og:type" content="article" />\n    <meta property="og:site_name" content="Ahmad Nahass" />\n    <meta property="og:title" content="${esc(title)}" />\n    <meta property="og:description" content="${esc(w.description)}" />\n    <meta property="og:url" content="${url}" />\n${hasOg ? `    <meta property="og:image" content="${SITE_URL}og/${esc(w.slug)}.jpg" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n` : ''}    <meta name="twitter:card" content="${hasOg ? 'summary_large_image' : 'summary'}" />\n    <meta http-equiv="refresh" content="0; url=../../#work/${esc(w.slug)}" />\n    <script>location.replace('../../#work/${esc(w.slug)}');</script>\n  </head>\n  <body>\n    <main>\n      <h1>${esc(w.title)}</h1>\n      <p>${esc(w.category)}, ${esc(w.year)}</p>\n      <p>${esc(w.description)}</p>\n      <p>${esc(w.details)}</p>\n      <p>Tools: ${esc((w.tools || []).join(', '))}</p>\n      <p><a href="../../#work/${esc(w.slug)}">View the project</a> | <a href="../../">Ahmad Nahass, 3D artist</a></p>\n    </main>\n  </body>\n</html>\n`;
  mkdirSync(join(DIST, 'work', w.slug), { recursive: true });
  writeFileSync(join(DIST, 'work', w.slug, 'index.html'), page);
  cards++;
}
cpSync(MODULES, DIST, { recursive: true });

console.log('3/3  checking that the published copy is identical to the source');
let checked = 0, bytes = 0;
const same = (a, b) => readFileSync(a).equals(readFileSync(b));
for (const f of FILES) { if (!same(join(ROOT, f), join(DIST, f))) fail(f + ' differs from its source'); checked++; bytes += statSync(join(DIST, f)).size; }
for (const d of DIRS) for (const p of walk(join(ROOT, d))) {
  if (skipped(rel(p))) { if (existsSync(join(DIST, rel(p)))) fail(rel(p) + ' must not be published'); continue; }
  const q = join(DIST, relative(ROOT, p));
  if (!existsSync(q) || !same(p, q)) fail(relative(ROOT, p) + ' differs from its source');
  checked++; bytes += statSync(q).size;
}
if (readFileSync(join(DIST, 'index.html'), 'utf8').replace(MODULE_TAG_DIST, MODULE_TAG_SOURCE).replace(projectList, () => NOSCRIPT_MARKER) !== html) fail('index.html differs by more than the module tag and the project list');
console.log(`\nOK  ${checked} files identical to source (${(bytes / 1e6).toFixed(1)} MB) + index.html (only changes: the module tag and the no-JS project list) + ${cards} share-card pages + the modern layer (${walk(MODULES).length} files, ${(walk(MODULES).reduce((n, f) => n + statSync(f).size, 0) / 1e3).toFixed(0)} KB)`);
console.log('    published folder: dist/');
