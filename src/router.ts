import { BASE } from './core/base';
import { must, sleep } from './core/dom';
import { reduced } from './core/env';
import { parseRoute, renderView, routeMeta, sameRoute, type Route } from './render/page';

/**
 * Client-side navigation between the home page, project pages, privacy and 404.
 *
 * Every page is also a real prerendered HTML file, so a reload or a shared link always works; this
 * router only makes in-site navigation instant (fade out → swap <main> → fade in) and keeps the
 * URL / Back button in sync via the History API.
 */

export interface RouteLifecycle {
  mount(route: Route, opts: { first: boolean }): void;
  unmount(): void;
}

// file:// pages can't pushState to a new path, so there the router keeps its state in memory only.
const canUseHistory = location.protocol !== 'file:';

let lifecycle: RouteLifecycle;
let current: Route = { name: 'home' };
let navigationId = 0;

export const currentRoute = (): Route => current;

function scrollToHash(hash: string, smooth: boolean): boolean {
  let target: HTMLElement | null = null;
  try {
    target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  } catch {
    /* malformed % sequence in the hash */
  }
  if (!target) return false;
  target.scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'auto', block: 'start' });
  return true;
}

function applyMeta(route: Route): void {
  const meta = routeMeta(route, BASE);
  document.title = meta.title;
  document.querySelector('meta[name=description]')?.setAttribute('content', meta.description);
}

async function swapView(route: Route): Promise<void> {
  const id = ++navigationId;
  const main = must('#top');

  if (!reduced) {
    main.classList.add('leaving');
    await sleep(160);
    if (id !== navigationId) return; // a newer navigation took over
  }

  lifecycle.unmount();
  main.innerHTML = renderView(route, BASE);
  applyMeta(route);
  current = route;
  lifecycle.mount(route, { first: false });
  if (!reduced) main.classList.remove('leaving');

  // keyboard / screen-reader users: move focus to the new page and announce it
  main.focus({ preventScroll: true });
  const live = document.getElementById('live');
  if (live) live.textContent = document.title;
}

async function navigate(href: string, push: boolean): Promise<void> {
  const url = new URL(href, location.href);
  const route = parseRoute(url.pathname, BASE);

  if (push && canUseHistory) {
    try {
      history.pushState(null, '', url.pathname + url.search + url.hash);
    } catch {
      /* sandboxed frame etc. — navigation still works, the URL just doesn't update */
    }
  }

  if (sameRoute(current, route)) {
    // same page: just move to the section (or back to the top)
    if (!scrollToHash(url.hash, true)) scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    return;
  }

  await swapView(route);
  if (!scrollToHash(url.hash, false)) scrollTo({ top: 0, behavior: 'instant' });
}

export function initRouter(hooks: RouteLifecycle): void {
  lifecycle = hooks;
  current = canUseHistory ? parseRoute(location.pathname, BASE) : { name: 'home' };
  try {
    history.scrollRestoration = 'manual';
  } catch {
    /* older browsers */
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[data-link]');
    if (!link || link.target || new URL(link.href, location.href).origin !== location.origin)
      return;
    e.preventDefault();
    void navigate(link.href, true);
  });

  addEventListener('popstate', () => void navigate(location.href, false));
}
