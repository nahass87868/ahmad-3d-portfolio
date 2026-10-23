import { about } from '../content/about';
import { privacy } from '../content/privacy';
import { process as processSteps, services } from '../content/services';
import { site } from '../content/site';
import type { Work } from '../content/types';
import { works } from '../content/works';
import { esc } from '../core/escape';
import { ARROW_BACK, ARROW_OUT } from './icons';
import { picture, resolveVideo } from './media';
import { findWork, type Route } from './routes';

/** [category, count] in order of first appearance. */
const categories = (): [string, number][] => {
  const counts = new Map<string, number>();
  for (const w of works) counts.set(w.category, (counts.get(w.category) ?? 0) + 1);
  return [...counts];
};

/** The most-used tools across all projects, most frequent first (ties alphabetical). */
const topTools = (limit = 14): string[] => {
  const counts = new Map<string, number>();
  for (const w of works) for (const t of w.tools) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'))
    .slice(0, limit)
    .map(([tool]) => tool);
};

const num = (i: number) => `0${i + 1}`;

// ───────────────────────── home ─────────────────────────

function tile(work: Work, base: string): string {
  const thumb = work.images[0]
    ? picture({
        base,
        id: work.images[0],
        sizes: '(min-width:900px) 33vw, 50vw',
        kind: 'thumb',
        cls: 'cov',
      })
    : '';
  const video = work.video ? ` data-video="${esc(work.video)}"` : '';
  return (
    `<article class="tile rv" data-cat="${esc(work.category)}"${video}>` +
    `<a href="${base}work/${work.slug}/" data-link data-cur="View">` +
    `<div class="th">${thumb}${work.video ? '<span class="mono mot">Motion</span>' : ''}<span class="mono miss">Media missing</span></div>` +
    `<h3>${esc(work.title)}</h3><p class="mono">${esc(work.category)} · ${esc(work.year)}</p></a></article>`
  );
}

const outbound = (href: string, label: string, text: string) =>
  `<li><span class="mono">${label}</span><a href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-cur="Go">${esc(text)}${ARROW_OUT}</a></li>`;

function home(base: string): string {
  const chips =
    `<div class="chips" id="chips" role="group" aria-label="Filter works by category" hidden>` +
    `<button type="button" class="chip" data-cat="" aria-pressed="true" data-cur="Filter">All <i>${works.length}</i></button>` +
    categories()
      .map(
        ([cat, n]) =>
          `<button type="button" class="chip" data-cat="${esc(cat)}" aria-pressed="false" data-cur="Filter">${esc(cat)} <i>${n}</i></button>`,
      )
      .join('') +
    `</div>`;

  const facts = about.facts
    .map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join('');
  const principles = about.principles
    .map(
      ([t, d], i) =>
        `<li><span class="mono">${num(i)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`,
    )
    .join('');
  const groups = services
    .map(
      (s, i) =>
        `<article class="grp"><span class="mono">${num(i)} / ${esc(s.id)}</span><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p>` +
        `<ul>${s.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>`,
    )
    .join('');
  const steps = processSteps
    .map(
      ([t, d], i) =>
        `<li><span class="mono">${num(i)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`,
    )
    .join('');
  const c = site.contacts;

  return (
    `<section class="hero" aria-label="Introduction"><h1 class="px st" id="heroName">${esc(site.name)}</h1>\n` +
    `<div class="hmeta mono"><div class="tagw" id="tag" data-text="${esc(site.tagline)}"><span class="sr">${esc(site.tagline)}</span><span class="ghost" aria-hidden="true">${esc(site.tagline)}</span><span class="typed" id="tagv" aria-hidden="true"></span></div>` +
    `<div>${esc(site.timeLabel)} <span id="clock" data-tz="${esc(site.timezone)}">--:--</span></div>` +
    `<div><span class="dot"></span> ${esc(site.availability)}</div></div></section>\n` +
    `<section class="s" id="works" aria-labelledby="wt"><div class="mono lab">01 / Selected works · ${works.length}</div><h2 class="px st" id="wt">Works</h2>${chips}<p class="sr" id="count" role="status"></p><div class="grid" id="grid">${works.map((w) => tile(w, base)).join('')}</div></section>\n` +
    `<section class="s" id="about" aria-labelledby="at"><div class="mono lab">02 / ${esc(about.label)}</div><h2 class="px st" id="at">About</h2>` +
    `<div class="cols"><p class="px st pull" data-w0="700" data-dmax="100">${esc(about.pull)}</p><div class="copy"><p class="lead">${esc(about.lead)}</p>${about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}<dl class="facts">${facts}</dl></div></div>` +
    `<ol class="princ">${principles}</ol></section>\n` +
    `<section class="s" id="skills" aria-labelledby="kt"><div class="mono lab">03 / Skills &amp; services</div><h2 class="px st" id="kt">Skills</h2><div class="groups">${groups}</div>` +
    `<div class="tools"><span class="mono">Tools &amp; techniques</span><ul>${topTools()
      .map((t) => `<li class="mono">${esc(t)}</li>`)
      .join('')}</ul></div>` +
    `<div class="proc"><span class="mono">The process</span><ol>${steps}</ol></div></section>\n` +
    `<section class="s" id="contact" aria-labelledby="ct"><div class="mono lab">04 / Contact</div><h2 class="px st" id="ct">Contact</h2>` +
    `<p class="lead">Have a product, a scene, or a half-formed idea? Let's turn it into something with presence.</p>` +
    `<div class="cta"><a class="btn" href="mailto:${esc(c.email)}" data-cur="Email" data-mag>Email me${ARROW_OUT}</a>` +
    `<button class="btn ghost" id="mail" type="button" data-cur="Copy" data-email="${esc(c.email)}">Copy address</button>` +
    `<span class="mono addr">${esc(c.email)}</span></div><span class="stat mono" id="stat" role="status"></span>` +
    `<ul class="clinks">${outbound(c.instagram.url, 'Instagram', c.instagram.handle)}${outbound(c.telegram.url, 'Telegram', c.telegram.handle)}${outbound(c.whatsapp.url, 'WhatsApp', 'Message me')}</ul>` +
    `<p class="mono note">${esc(site.response)} For a faster hello, find me on social.</p></section>`
  );
}

// ───────────────────────── project ─────────────────────────

function project(slug: string, base: string): string {
  const index = works.findIndex((w) => w.slug === slug);
  const work = works[index] as Work;
  const prev = works[(index - 1 + works.length) % works.length] as Work;
  const next = works[(index + 1) % works.length] as Work;
  const alt = (i: number, total: number) => `${work.title}: image ${i} of ${total}`;

  let hero = '';
  let gallery = work.images;

  if (work.video) {
    const v = resolveVideo(base, work.video);
    hero = v.full.length
      ? `<figure class="hero-media"><video class="pv" muted loop playsinline preload="metadata" controls poster="${v.poster}" aria-label="${esc(work.title)}, animation">` +
        v.full.map((s) => `<source src="${s.url}" type="${s.type}">`).join('') +
        `</video></figure>`
      : // No video file shipped yet: show the poster frame instead of a player that can't play.
        `<figure class="hero-media"><img class="gi" src="${v.poster}" width="${v.w}" height="${v.h}" alt="${esc(work.title)}: poster frame" loading="eager" decoding="async" fetchpriority="high"></figure>`;
  } else if (gallery[0]) {
    hero = `<figure class="hero-media">${picture({
      base,
      id: gallery[0],
      alt: alt(1, work.images.length),
      sizes: '100vw',
      cls: 'gi',
      eager: true,
    })}</figure>`;
    gallery = gallery.slice(1);
  }

  // Alt-text numbering: with a video every image is in the gallery (starts at 1); otherwise image 1 is the hero.
  const offset = work.video ? 1 : 2;

  return (
    `<article class="project" aria-labelledby="pt"><nav class="crumbs mono" aria-label="Breadcrumb"><a href="${base}#works" data-link data-cur="Back">${ARROW_BACK} All works</a><span>${esc(work.category)}</span><span>${esc(work.year)}</span></nav>` +
    `<h1 class="px st" id="pt">${esc(work.title)}</h1><p class="plead">${esc(work.description)}</p>${hero}` +
    `<dl class="pmeta"><div><dt class="mono">Discipline</dt><dd>${esc(work.category)}</dd></div><div><dt class="mono">Year</dt><dd>${esc(work.year)}</dd></div><div><dt class="mono">Tools</dt><dd>${work.tools.map(esc).join(' / ')}</dd></div></dl>` +
    `<section class="story" aria-label="About this project"><span class="mono">The idea</span><p>${esc(work.details)}</p></section>` +
    (gallery.length
      ? `<section class="gallery" aria-label="Project gallery">${gallery
          .map(
            (id, i) =>
              `<figure class="rv">${picture({
                base,
                id,
                alt: alt(i + offset, work.images.length),
                sizes: '(min-width:1100px) 1000px, 100vw',
                cls: 'gi',
              })}</figure>`,
          )
          .join('')}</section>`
      : '') +
    `<nav class="pn" aria-label="More projects"><a href="${base}work/${prev.slug}/" data-link data-cur="Prev"><span class="mono">Previous</span><b>${esc(prev.title)}</b></a>` +
    `<a href="${base}work/${next.slug}/" data-link data-cur="Next"><span class="mono">Next</span><b>${esc(next.title)}</b></a></nav></article>`
  );
}

// ───────────────────────── documents ─────────────────────────

const privacyView = (base: string) =>
  `<article class="doc"><nav class="crumbs mono" aria-label="Breadcrumb"><a href="${base}" data-link data-cur="Back">${ARROW_BACK} Home</a></nav>` +
  `<h1 class="px st" id="pt">Privacy</h1><p class="plead">${esc(privacy.lead)}</p>` +
  privacy.blocks
    .map(([t, d]) => `<section><h2 class="mono">${esc(t)}</h2><p>${esc(d)}</p></section>`)
    .join('') +
  `<p class="mono">${esc(privacy.updated)}</p></article>`;

const notFound = (base: string) =>
  `<article class="doc"><h1 class="px st" id="pt">Not found</h1><p class="plead">That page does not exist.</p>` +
  `<p><a href="${base}" data-link data-cur="Home">Back to the home page</a></p></article>`;

/** The HTML that goes inside `<main id="top">` for a route. */
export function renderView(route: Route, base = '/'): string {
  switch (route.name) {
    case 'home':
      return home(base);
    case 'project':
      return findWork(route.slug) ? project(route.slug, base) : notFound(base);
    case 'privacy':
      return privacyView(base);
    default:
      return notFound(base);
  }
}
