/**
 * Vite plugin: turns `index.html` into real, content-complete pages.
 *
 *  • inlines `src/boot.ts` (compiled) so theme + flags are set before first paint
 *  • renders the page shell, <head> and the current route's view from `src/render/*`
 *  • dev server:  renders whichever route the URL asks for, on every request
 *  • build:       emits one static HTML file per route (work/<slug>/index.html, privacy/, 404.html)
 *                 and, when SITE_URL is set, a sitemap.xml and robots.txt
 *
 * The same pure render functions also run in the browser for client-side navigation, so the
 * prerendered markup and the SPA markup can never drift apart.
 */
import { build } from 'esbuild';
import { resolve } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

type Page = typeof import('../src/render/page');

interface Options {
  /** Public origin, e.g. https://example.com — enables canonical URLs and a sitemap. */
  siteUrl?: string;
}

const HEAD = /<!--HEAD-->[\s\S]*?<!--\/HEAD-->/;
const VIEW = /<!--VIEW-->[\s\S]*?<!--\/VIEW-->/;

export function portfolioHtml(options: Options = {}): Plugin {
  const siteUrl = options.siteUrl?.trim() ?? '';
  let config: ResolvedConfig;
  let page: Promise<Page> | null = null;
  let boot: Promise<string> | null = null;

  const bundle = async (entry: string, format: 'esm' | 'iife', minify: boolean) => {
    const result = await build({
      entryPoints: [resolve(config.root, entry)],
      bundle: true,
      write: false,
      format,
      minify,
      platform: format === 'esm' ? 'node' : 'browser',
      target: format === 'esm' ? 'node20' : 'es2020',
      logLevel: 'silent',
    });
    const file = result.outputFiles[0];
    if (!file) throw new Error(`esbuild produced no output for ${entry}`);
    return file.text;
  };

  const loadPage = (): Promise<Page> =>
    (page ??= bundle('src/render/page.ts', 'esm', false).then(
      (code) =>
        import(
          `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
        ) as Promise<Page>,
    ));

  const loadBoot = (): Promise<string> => (boot ??= bundle('src/boot.ts', 'iife', true));

  const reset = () => {
    page = null;
    boot = null;
  };

  /** Fill the per-route regions of an HTML document. */
  const forRoute = (html: string, p: Page, route: ReturnType<Page['parseRoute']>) =>
    html
      .replace(HEAD, () => `<!--HEAD-->${p.renderHead(route, config.base, siteUrl)}<!--/HEAD-->`)
      .replace(VIEW, () => `<!--VIEW-->${p.renderView(route, config.base)}<!--/VIEW-->`);

  return {
    name: 'portfolio-html',
    // run after Vite's own HTML plugin so `index.html` exists in the bundle when we derive the other pages
    enforce: 'post',

    configResolved(c) {
      config = c;
    },

    handleHotUpdate({ file, server }) {
      // Content, render and boot code feed the HTML, so a change means a fresh render + reload.
      if (
        /[\\/]src[\\/](content|render|media|config|boot)/.test(file) ||
        file.endsWith('src/boot.ts')
      ) {
        reset();
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },

    async transformIndexHtml(html, ctx) {
      const p = await loadPage();
      const url = (ctx.originalUrl ?? ctx.path ?? '/').split(/[?#]/)[0] as string;
      const route = p.parseRoute(url, config.base);
      const inlineBoot = `<script>${(await loadBoot()).trim()}</script>`;

      return forRoute(
        html
          .replace('<!--BOOT-->', () => inlineBoot)
          .replace('<!--SHELL_TOP-->', () => p.renderShellTop(config.base))
          .replace('<!--SHELL_BOTTOM-->', () => p.renderShellBottom(config.base)),
        p,
        route,
      );
    },

    async generateBundle(_, bundleOutput) {
      const index = bundleOutput['index.html'];
      if (!index || index.type !== 'asset') return;
      const home = String(index.source);
      const p = await loadPage();

      for (const route of p.allRoutes()) {
        if (route.name === 'home') continue;
        const dir = p.routePath(route, '/').replace(/^\//, '');
        this.emitFile({
          type: 'asset',
          fileName: `${dir}index.html`,
          source: forRoute(home, p, route),
        });
      }
      // Static hosts serve this for unknown URLs. noindex comes from the notfound head.
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: forRoute(home, p, { name: 'notfound' }),
      });

      if (siteUrl) {
        const origin = siteUrl.replace(/\/$/, '');
        const urls = p
          .allRoutes()
          .map((r) => `  <url><loc>${origin}${p.routePath(r, config.base)}</loc></url>`);
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
        });
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: `User-agent: *\nAllow: /\nSitemap: ${origin}${config.base}sitemap.xml\n`,
        });
      }
    },
  };
}
