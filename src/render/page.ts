/**
 * Entry point of the pure render layer. It is bundled by the Vite plugin (tools/prerender.ts) and
 * run in Node to produce static HTML, and it is imported by the browser router for client-side
 * navigation — so it must never touch `window`/`document` at import time.
 */
export { renderHead, routeMeta } from './meta';
export { renderShellBottom, renderShellTop } from './shell';
export { renderView } from './views';
export { allRoutes, parseRoute, routePath, sameRoute, findWork } from './routes';
export type { Route } from './routes';
