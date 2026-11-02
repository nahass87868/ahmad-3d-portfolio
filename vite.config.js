import { defineConfig } from 'vite';

/*
 * Vite builds only the NEW layer (src/main.js and whatever it imports: three, GSAP, Lenis, ...).
 * The existing site (index.html, script.js, style.css, hero-3d.js, ...) is not bundled: tools/build-site.mjs copies it unchanged,
 * so it cannot behave differently. Features move into src/ one at a time, each in its own tested phase.
 *
 * If you ever get a custom domain nothing here changes: every path is relative.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  publicDir: false, // the static files are handled by tools/build-site.mjs, not by Vite
  build: {
    lib: { entry: 'src/main.js', formats: ['es'], fileName: () => 'main.js' },
    outDir: '.build/modules',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
  },
}));
