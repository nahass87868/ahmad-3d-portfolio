import { works } from '../content/works';
import type { Work } from '../content/types';

export type Route =
  { name: 'home' } | { name: 'project'; slug: string } | { name: 'privacy' } | { name: 'notfound' };

export const findWork = (slug: string): Work | undefined => works.find((w) => w.slug === slug);

/** Map a URL pathname to a route. `base` is the site's deploy base ("/" or "/sub/"). */
export function parseRoute(pathname: string, base = '/'): Route {
  let path = pathname || '/';
  if (base !== '/' && path.startsWith(base)) path = '/' + path.slice(base.length);
  path = path.replace(/index\.html$/, '');
  if (path === '' || path === '/') return { name: 'home' };

  const project = /^\/work\/([a-z0-9-]+)\/?$/.exec(path);
  if (project) {
    const slug = project[1] as string;
    return findWork(slug) ? { name: 'project', slug } : { name: 'notfound' };
  }
  if (/^\/privacy\/?$/.test(path)) return { name: 'privacy' };
  return { name: 'notfound' };
}

/** Absolute path (including base) of a route. */
export function routePath(route: Route, base = '/'): string {
  switch (route.name) {
    case 'project':
      return `${base}work/${route.slug}/`;
    case 'privacy':
      return `${base}privacy/`;
    default:
      return base;
  }
}

export const sameRoute = (a: Route | null, b: Route | null): boolean =>
  !!a &&
  !!b &&
  a.name === b.name &&
  (a as { slug?: string }).slug === (b as { slug?: string }).slug;

/** Every page that gets its own static HTML file at build time. */
export function allRoutes(): Route[] {
  return [
    { name: 'home' },
    ...works.map((w): Route => ({ name: 'project', slug: w.slug })),
    { name: 'privacy' },
  ];
}
