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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const MODULES = join(ROOT, '.build', 'modules');

const FILES = ['style.css', 'premium.css', 'script.js', 'extras.js', 'fixes.js', 'about-photo.js', 'hero-3d-model.js', 'polish.js', 'premium.js'];
const SKIP = new Set(['vendor/three.min.js']); // the old three.js (r128): replaced by the npm version inside the modern layer, so it is no longer published
const rel = (p) => relative(ROOT, p).split('\\').join('/');
const DIRS = ['vendor', 'fonts', 'images', 'videos'];
const MODULE_TAG_SOURCE = 'src="src/main.js"'; // as written in index.html, which Vite's dev server serves from the project root
const MODULE_TAG_DIST = 'src="main.js"'; // the same file, as published next to index.html

const fail = (msg) => { console.error('\nBUILD FAILED: ' + msg); process.exit(1); };
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

console.log('1/3  building the modern layer with Vite');
await build({ configFile: join(ROOT, 'vite.config.js'), logLevel: 'warn' });
if (!existsSync(join(MODULES, 'main.js'))) fail('Vite did not produce main.js');

console.log('2/3  assembling dist/');
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
for (const f of FILES) { if (!existsSync(join(ROOT, f))) fail('missing ' + f); cpSync(join(ROOT, f), join(DIST, f)); }
for (const d of DIRS) { if (!existsSync(join(ROOT, d))) fail('missing folder ' + d); cpSync(join(ROOT, d), join(DIST, d), { recursive: true, filter: (src) => !SKIP.has(rel(src)) }); }
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
if (html.split(MODULE_TAG_SOURCE).length !== 2) fail('index.html must contain exactly one ' + MODULE_TAG_SOURCE);
writeFileSync(join(DIST, 'index.html'), html.replace(MODULE_TAG_SOURCE, MODULE_TAG_DIST));
cpSync(MODULES, DIST, { recursive: true });

console.log('3/3  checking that the published copy is identical to the source');
let checked = 0, bytes = 0;
const same = (a, b) => readFileSync(a).equals(readFileSync(b));
for (const f of FILES) { if (!same(join(ROOT, f), join(DIST, f))) fail(f + ' differs from its source'); checked++; bytes += statSync(join(DIST, f)).size; }
for (const d of DIRS) for (const p of walk(join(ROOT, d))) {
  if (SKIP.has(rel(p))) { if (existsSync(join(DIST, rel(p)))) fail(rel(p) + ' must not be published'); continue; }
  const q = join(DIST, relative(ROOT, p));
  if (!existsSync(q) || !same(p, q)) fail(relative(ROOT, p) + ' differs from its source');
  checked++; bytes += statSync(q).size;
}
if (readFileSync(join(DIST, 'index.html'), 'utf8').replace(MODULE_TAG_DIST, MODULE_TAG_SOURCE) !== html) fail('index.html differs by more than the module tag');
console.log(`\nOK  ${checked} files identical to source (${(bytes / 1e6).toFixed(1)} MB) + index.html (only change: the module tag) + the modern layer (${walk(MODULES).length} files, ${(walk(MODULES).reduce((n, f) => n + statSync(f).size, 0) / 1e3).toFixed(0)} KB)`);
console.log('    published folder: dist/');
