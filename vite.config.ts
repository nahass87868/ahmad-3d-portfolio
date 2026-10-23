import { defineConfig, loadEnv } from 'vite';
import { portfolioHtml } from './tools/prerender.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Deploying under a sub-path (GitHub Pages project site)? Set BASE_PATH=/repo-name/ at build time.
    base: env.BASE_PATH || '/',
    plugins: [portfolioHtml({ siteUrl: env.SITE_URL })],
    build: {
      target: 'es2022',
      // esbuild's CSS minifier keeps gradients as written. The default (Lightning CSS) rewrites
      // `linear-gradient(to top, …)` into reversed, rounded hex stops, which rasterized a 1px seam
      // on the card scrim (cards.css) in Chromium.
      cssMinify: 'esbuild',
      sourcemap: true,
    },
  };
});
