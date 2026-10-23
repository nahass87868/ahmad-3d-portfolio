import { site } from '../content/site';
import { esc } from '../core/escape';
import { ARROW_OUT } from './icons';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

/** Intro curtain, skip links and the fixed header — everything before <main>. */
export function renderShellTop(base = '/'): string {
  const ab = initials(site.name);
  return [
    `<div id="pre" aria-hidden="true"><div class="pc l2"></div><div class="pc l1"><span class="mono pt">rendering<b>...</b></span><span class="mono pa">${esc(ab)}</span><div class="pn mono" id="pn">000</div><div class="pbar"><i id="pb"></i></div></div></div>`,
    `<a class="skipnav" href="#top">Skip to content</a>`,
    `<button class="skip" id="skip" type="button">Skip intro</button>`,
    `<header class="nav"><a href="${base}" class="mono" data-link data-cur="Home" aria-label="${esc(site.name)}, home">${esc(ab)}</a>` +
      `<nav aria-label="Primary" class="mono">` +
      (['works', 'about', 'skills', 'contact'] as const)
        .map(
          (id) =>
            `<a href="${base}#${id}" data-link data-cur="Go">${id[0]?.toUpperCase()}${id.slice(1)}</a>`,
        )
        .join('') +
      `</nav></header>`,
  ].join('\n');
}

/** Footer, theme dock, live region and cursor elements — everything after <main>. */
export function renderShellBottom(base = '/'): string {
  const c = site.contacts;
  const ext = (href: string, label: string) =>
    `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-cur="Go">${label}${ARROW_OUT}</a>`;
  return [
    `<footer class="foot mono"><p>Independent 3D artist shaping ideas into images, motion and atmosphere.</p><div class="foot-links">` +
      `<a href="mailto:${esc(c.email)}" data-cur="Go">Email${ARROW_OUT}</a>` +
      ext(c.instagram.url, 'Instagram') +
      ext(c.telegram.url, 'Telegram') +
      ext(c.whatsapp.url, 'WhatsApp') +
      `<a href="${base}privacy/" data-link data-cur="Go">Privacy</a></div><span>© 2026 ${esc(site.name)}</span></footer>`,
    `<div class="dock"><button class="md mono" id="md" type="button" data-cur="Mode"><i></i><span id="mdName">Dark</span></button><button class="sw mono" id="sw" type="button" data-cur="Scheme"><i></i><i></i><span id="swName">Copper</span></button></div>`,
    `<div class="sr" id="live" role="status" aria-live="polite"></div>`,
    `<div id="cl" aria-hidden="true"><i class="h"></i><i class="v"></i></div>`,
    `<div id="cur" aria-hidden="true"><b class="cs"></b><span id="cx" class="mono">X 0000 · Y 0000</span></div>`,
  ].join('\n');
}
