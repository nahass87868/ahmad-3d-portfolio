import { defineConfig } from 'vite';

/*
 * Vite builds only the NEW layer: src/main.js and whatever it imports (three, GSAP, Lenis, ...), minified, with the heavy parts
 * in their own lazy chunks. The older site files (script.js, style.css, ...) are not bundled: tools/build-site.mjs copies them
 * unchanged, so they cannot behave differently. Features move into src/ one phase at a time.
 *
 * If you ever get a custom domain nothing here changes: every path is relative.
 */
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  publicDir: false, // the static files are handled by tools/build-site.mjs, not by Vite
  build: {
    rollupOptions: { input: 'src/main.js', output: { entryFileNames: 'main.js', chunkFileNames: 'chunks/[name]-[hash].js' } },
    outDir: '.build/modules',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    minify: true,
    modulePreload: false,
    chunkSizeWarningLimit: 900, // three.js is big by nature; it is a lazy chunk
  },
}));
