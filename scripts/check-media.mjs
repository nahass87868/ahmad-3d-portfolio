#!/usr/bin/env node
/**
 * Fails the build if the content and the media folder disagree:
 *   • a work references an image / video id that is not in src/media/manifest.ts
 *   • a manifest entry has no file in public/media/ (every declared file must exist)
 *   • a file in public/media/ is not declared (reported as a warning, never fails)
 *
 * Reads the TypeScript sources by bundling them with esbuild — no build step to remember.
 */
import { build } from 'esbuild';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const load = async (entry) => {
  const out = await build({
    entryPoints: [join(root, entry)],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64')
  );
};

const { images, videos, THUMB_WIDTHS, FULL_WIDTHS } = await load('src/media/manifest.ts');
const { works } = await load('src/content/works.ts');
const pub = (p) => join(root, 'public', p);

const errors = [];
const warnings = [];
const declared = new Set();

for (const w of works) {
  for (const id of w.images)
    if (!images[id]) errors.push(`work "${w.slug}": image id "${id}" is not in the manifest`);
  if (w.video && !videos[w.video])
    errors.push(`work "${w.slug}": video id "${w.video}" is not in the manifest`);
}

for (const id of Object.keys(images)) {
  for (const width of [...THUMB_WIDTHS, ...FULL_WIDTHS]) {
    const rel = `media/images/${id}-${width}.webp`;
    declared.add(rel);
    if (!existsSync(pub(rel))) errors.push(`missing file: public/${rel}`);
  }
}
for (const [id, v] of Object.entries(videos)) {
  const rel = `media/posters/${id}.webp`;
  declared.add(rel);
  if (!existsSync(pub(rel))) errors.push(`missing file: public/${rel}`);
  for (const f of v.full) {
    declared.add(`media/videos/${id}.${f}`);
    if (!existsSync(pub(`media/videos/${id}.${f}`)))
      errors.push(`missing file: public/media/videos/${id}.${f}`);
  }
  for (const f of v.preview) {
    declared.add(`media/videos/${id}.preview.${f}`);
    if (!existsSync(pub(`media/videos/${id}.preview.${f}`)))
      errors.push(`missing file: public/media/videos/${id}.preview.${f}`);
  }
}

const walk = (dir) =>
  existsSync(pub(dir))
    ? readdirSync(pub(dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
      )
    : [];
for (const f of walk('media'))
  if (!declared.has(f))
    warnings.push(`not in the manifest (unused or not yet declared): public/${f}`);

const noVideo = Object.entries(videos)
  .filter(([, v]) => !v.full.length)
  .map(([id]) => id);
if (noVideo.length)
  warnings.push(`${noVideo.length} video(s) have no file yet (poster only): ${noVideo.join(', ')}`);

for (const w of warnings) console.warn('⚠ ' + w);
for (const e of errors) console.error('✖ ' + e);
if (errors.length) process.exit(1);
console.log(
  `✔ media ok — ${Object.keys(images).length} images, ${Object.keys(videos).length} video entries, ${works.length} works`,
);
