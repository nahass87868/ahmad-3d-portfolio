import { site } from '../content/site';
import { esc } from '../core/escape';
import { findWork, routePath, type Route } from './routes';

export interface PageMeta {
  title: string;
  description: string;
  /** Absolute canonical URL, or '' when no site URL is configured. */
  url: string;
  noindex: boolean;
}

export function routeMeta(route: Route, base = '/', siteUrl = ''): PageMeta {
  const work = route.name === 'project' ? findWork(route.slug) : undefined;
  const title = work
    ? `${work.title} — ${site.name} / ${site.role}`
    : route.name === 'privacy'
      ? `Privacy — ${site.name} / ${site.role}`
      : route.name === 'notfound'
        ? `Not found — ${site.name}`
        : `${site.name} — ${site.role}`;

  return {
    title,
    description: work ? work.description : site.positioning,
    url: siteUrl ? siteUrl.replace(/\/$/, '') + routePath(route, base) : '',
    noindex: route.name === 'notfound',
  };
}

/** The <head> block that changes per page (title, description, social tags, structured data). */
export function renderHead(route: Route, base = '/', siteUrl = ''): string {
  const m = routeMeta(route, base, siteUrl);
  const out = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:site_name" content="${esc(site.name)}">`,
    `<meta name="twitter:card" content="summary">`,
  ];
  if (m.url) {
    out.push(
      `<link rel="canonical" href="${esc(m.url)}">`,
      `<meta property="og:url" content="${esc(m.url)}">`,
    );
  }
  if (m.noindex) out.push(`<meta name="robots" content="noindex">`);
  if (route.name === 'home') {
    const person = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: site.name,
      jobTitle: site.role,
      description: site.positioning,
      sameAs: [site.contacts.instagram.url, site.contacts.telegram.url],
    };
    // "<" is escaped so the JSON can never close the script element early.
    out.push(
      `<script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`,
    );
  }
  return out.join('\n');
}
