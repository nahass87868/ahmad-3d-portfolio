/*
 * Ahmad Nahass — portfolio
 * One file, no build step, no dependencies. Upload next to index.html, style.css, images/ and videos/.
 *
 *   1. CONTENT        projects, text, contact details  ← the part you edit
 *   2. SETTINGS       colour schemes, motion tunables
 *   3. CORE           helpers, device checks, pointer, animation loop
 *   4. RENDER         builds the page HTML from the content
 *   5. FEATURES       intro, theme, cursor, magnetic controls, interactive headings, hero,
 *                     works grid, viewport shading (hold Z), performance HUD (Shift+D)
 *   6. PROJECT PANEL  in-page project / privacy panel + #hash navigation
 *   7. SCROLL MOTION  content slides in and out as you scroll
 *   8. START          boot order
 *
 * Desktop (mouse) gets the full interactive motion. Touch devices get the same look without the
 * custom cursor and without per-frame text animation.
 */
(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════════════════════════
   1. CONTENT  —  everything you would edit lives in this section.
   ════════════════════════════════════════════════════════════════════════════
   Media files (all paths are relative to this page):
     images/<name>.jpg              full image            (project pages)
     images/thumbs/<thumb>.webp     grid thumbnail        (one per project; falls back to the .jpg)
     videos/<name>.mp4              video
   A project needs: slug (used in the URL #work/<slug>), thumb, images[], optional videos[].
   ════════════════════════════════════════════════════════════════════════════ */

  const SITE = {
    name: 'Ahmad Nahass',
    role: '3D Artist',
    tagline: 'Ideas, shaped into visuals.',
    positioning: '3D artist creating product visualization, motion, environments, and simulations.',
    timezone: 'Asia/Damascus',
    timeLabel: 'Syria time',
    availability: 'Available for select projects',
    response: 'Usually reply within 2–3 days.',
    contacts: {
      email: 'nahass87868@gmail.com',
      instagram: {
        handle: '@nahass.3d.vision',
        url: 'https://www.instagram.com/nahass.3d.vision/',
      },
      telegram: {
        handle: 'nahass3dvision',
        url: 'https://t.me/nahass3dvision',
      },
      whatsapp: {
        url: 'https://wa.me/963957538870',
      },
    },
  };

  const ABOUT = {
    label: 'The artist',
    lead: 'Curiosity, craft, and a deep respect for the small decisions that make an image feel real.',
    pull: "I'm Ahmad. I make things feel.",
    paragraphs: [
      "I'm a 3D artist focused on environments, product visualization, materials, lighting, and motion.",
      'My work combines technical control with a strong sense of composition and atmosphere. I’m interested in the tension between precision and imperfection: surfaces that feel tactile, light that tells a story, and images that make you stop for a second look.',
      'I build stylized and realistic scenes, product-focused visuals, logo animations, and procedural experiments using Blender and related creative tools.',
    ],
    facts: [
      ['Based in', 'Syria / Remote'],
      ['Working with', 'Studios & independent teams'],
      ['Focus', 'Image, motion, atmosphere'],
    ],
    principles: [
      [
        'Clarity over noise.',
        'Every element earns its place. The image should communicate before the explanation arrives.',
      ],
      [
        'Feeling through detail.',
        "Material, lighting and composition are not decoration. They're how the work speaks.",
      ],
      [
        'Curiosity stays open.',
        'From polished product frames to strange procedural tests, experimentation keeps the practice alive.',
      ],
    ],
  };

  const SERVICES = [
    {
      id: 'image',
      title: 'Product visualization',
      summary:
        'Studio renders, macro details, material studies, campaign imagery and product scenes built to make form and finish feel tangible.',
      items: [
        'Product modeling & look development',
        'Materials, lighting & rendering',
        'Commercial stills & hero imagery',
      ],
    },
    {
      id: 'time',
      title: 'Motion design',
      summary:
        'Movement with a reason: camera choreography, product reveals, logo animation, and short-form visual storytelling.',
      items: ['Product & logo animation', 'Camera movement & timing', 'Compositing & final delivery'],
    },
    {
      id: 'space',
      title: 'Environments & simulation',
      summary: 'Designed spaces, atmospheric scenes and procedural experiments that build a world around an idea.',
      items: [
        'Environment & interior scenes',
        'Procedural effects & simulations',
        'Look development & visual exploration',
      ],
    },
  ];

  /** [title, description] */
  const PROCESS = [
    ['Discover', 'Align on the idea, audience, references and what the final work needs to achieve.'],
    ['Develop', 'Explore composition, materials and movement before committing to final production.'],
    ['Deliver', 'Polish, render and package final assets for the intended platform or campaign.'],
  ];

  const WORKS = [
    {
      slug: 'realistic-ice',
      title: 'Realistic Ice Render',
      category: 'Product Visualization',
      year: '2026',
      thumb: 'realistic-ice-image-thumb',
      images: ['realistic-ice-image-1', 'realistic-ice-image-2'],
      videos: [],
      description:
        'A realistic ice-focused 3D study built around materials, lighting, transparency, and detailed surface realism.',
      details:
        'A material and lighting study focused on believable ice, refraction, highlights, and controlled studio presentation.',
      tools: ['Blender', 'Cycles', 'Materials', 'Lighting'],
    },
    {
      slug: 'soap-animation',
      title: 'Soap Animation',
      category: 'Product Visualization',
      year: '2026',
      thumb: 'soap-image-thumb',
      images: ['soap-image-1', 'soap-image-2', 'soap-image-3', 'soap-image-4'],
      videos: ['soap-animation'],
      description: 'Glossy surfaces and rich material realism.',
      details:
        'A product animation focused on aloe vera soap, material response, lighting, camera movement, and compositing.',
      tools: ['Blender', 'Cycles', 'Compositing'],
    },
    {
      slug: 'yerba-mate-animation',
      title: 'Yerba Mate Animation',
      category: 'Product Visualization',
      year: '2026',
      thumb: 'yerba-mate-image-thumb',
      images: ['yerba-mate-image-1', 'yerba-mate-image-2'],
      videos: ['yerba-mate-animation'],
      description: 'Refreshing beverage hero shot with condensation and motion.',
      details: 'Product-focused beverage visualization with emphasis on materials, condensation, lighting, and motion.',
      tools: ['Blender', 'Cycles', 'Product Visualization'],
    },
    {
      slug: 'asus-product-animation',
      title: 'Asus Product Animation',
      category: 'Product Visualization',
      year: '2026',
      thumb: 'asus-image-thumb',
      images: ['asus-image'],
      videos: ['asus-animation'],
      description: 'A clean product-focused 3D presentation.',
      details: 'Product modeling, materials, lighting, camera work, and animation.',
      tools: ['Blender', 'Product Visualization', 'Motion'],
    },
    {
      slug: 'realistic-water-glass',
      title: 'Realistic Water Glass Render',
      category: 'Product Visualization',
      year: '2026',
      thumb: 'real-water-glass-image-thumb',
      images: ['real-water-glass-image-1', 'real-water-glass-image-2'],
      videos: [],
      description: 'A realistic study of transparent glass and water.',
      details: 'Focused on believable transparency, refraction, liquid shading, lighting, and studio composition.',
      tools: ['Blender', 'Cycles', 'Materials', 'Lighting'],
    },
    {
      slug: 'smartwatch-animation',
      title: 'Smartwatch Animation',
      category: 'Product Visualization',
      year: '2026',
      thumb: 'smart-watch-image-thumb',
      images: ['smart-watch-image'],
      videos: ['watch-animation'],
      description: 'Macro product showcase with crisp studio lighting.',
      details:
        'A close-up product animation emphasizing clean forms, controlled lighting, materials, and camera movement.',
      tools: ['Blender', 'Product Visualization', 'Motion'],
    },
    {
      slug: 'nike-shoe-modeling',
      title: 'Nike Shoe Modeling',
      category: '3D Modeling',
      year: '2026',
      thumb: 'nike-shoe-image-thumb',
      images: [
        'nike-shoe-image-1',
        'nike-shoe-image-2',
        'nike-shoe-image-3',
        'nike-shoe-image-4',
        'nike-shoe-image-5',
        'nike-shoe-image-6',
      ],
      videos: [],
      description: 'Detailed footwear modeling and presentation.',
      details: 'A modeling study focused on shape, construction, materials, and product presentation.',
      tools: ['Blender', 'Hard Surface', 'Product Modeling'],
    },
    {
      slug: 'real-estate-exhibition-booth',
      title: 'Real Estate Exhibition Booth',
      category: 'Interior design & architecture',
      year: '2026',
      thumb: 'boooth-02-image-thumb',
      images: [
        'boooth-02-image-01',
        'boooth-02-image-02',
        'boooth-02-image-03',
        'boooth-02-image-04',
        'boooth-02-image-05',
        'boooth-02-image-06',
        'boooth-02-image-07',
        'boooth-02-image-08',
      ],
      videos: [],
      description:
        'A showroom booth concept for a residential development, built around a scale model on a lit marble plinth.',
      details:
        'A black steel frame carries a wood slat roof with integrated LED strips. The layout includes a marble-and-wood reception desk, a lounge with a wooden sofa set, wall panels showing building elevations, and a glass-enclosed meeting room. Warm wood, stone and concealed lighting tie the space together. Modeled and rendered in Blender 5.2 LTS with Cycles.',
      tools: ['Blender', 'Cycles', 'Interior Design', 'Lighting'],
    },
    {
      slug: 'interior-room-design',
      title: 'Interior Room Design',
      category: 'Interior design & architecture',
      year: '2026',
      thumb: 'interior-image-thumb',
      images: ['interior-image-1', 'interior-image-2'],
      videos: [],
      description: 'Concrete & Comfort — an interior scene focused on atmosphere and composition.',
      details:
        'Interior environment work with attention to materials, lighting, composition, and realistic scene presentation.',
      tools: ['Blender', 'Cycles', 'Environment Design', 'Lighting'],
    },
    {
      slug: 'booth-design',
      title: 'Booth Design',
      category: 'Interior design & architecture',
      year: '2026',
      thumb: 'booth-01-image-thumb',
      images: [
        'booth-01-image-01',
        'booth-01-image-02',
        'booth-01-image-03',
        'booth-01-image-04',
        'booth-01-image-05',
        'booth-01-image-06',
        'booth-01-image-07',
        'booth-01-image-08',
        'booth-01-image-09',
      ],
      videos: [],
      description: 'A modern exhibition booth design with a warm wooden touch and a luxury feel.',
      details:
        'A booth design modeled and rendered in Blender using Cycles, focused on modern architectural form, warm wood materials, lighting, and premium presentation.',
      tools: ['Blender', 'Cycles', 'Interior Design', 'Lighting'],
    },
    {
      slug: '2026-modes-looks',
      title: '2026 Modes & Looks',
      category: '3D Art',
      year: '2026',
      thumb: '2026-looks-thumb',
      images: ['2026-looks', '2026-look-1', '2026-look-2', '2026-look-3', '2026-look-4', '2026-look-5', '2026-look-6'],
      videos: [],
      description: 'A visual exploration of different 3D moods, forms, and looks.',
      details: 'An experimental collection exploring visual direction, lighting, materials, composition, and style.',
      tools: ['Blender', 'Lighting', 'Materials', 'Look Development'],
    },
    {
      slug: 'folder-inflation',
      title: 'Folder Inflation',
      category: 'Simulation',
      year: '2026',
      thumb: 'folder-image-thumb',
      images: ['folder-image-1', 'folder-image-2'],
      videos: ['folder-animation-1', 'folder-animation-2'],
      description: 'A Windows folder icon transformed through soft-body and smoke effects.',
      details:
        'A procedural-style experiment combining soft body deformation, procedural shading, and volumetric smoke.',
      tools: ['Blender', 'Soft Body', 'Smoke', 'Procedural Shading'],
    },
    {
      slug: 'vellum-simulation',
      title: 'Vellum Simulation',
      category: 'Simulation',
      year: '2026',
      thumb: 'vellum-image-thumb',
      images: ['vellum-image'],
      videos: ['vellum-animation-1', 'vellum-animation-2'],
      description: 'A procedural growth-style simulation study.',
      details: 'A Houdini-inspired simulation experiment recreated with Blender techniques and procedural control.',
      tools: ['Blender', 'Geometry Nodes', 'Simulation', 'Procedural'],
    },
    {
      slug: 'date-cookies-animation',
      title: 'Date Cookies Animation',
      category: 'Product Visualization',
      year: '2026',
      thumb: 'dates-cookie-image-thumb',
      images: ['dates-cookie-image'],
      videos: ['dates-cookie-animation-1', 'dates-cookie-animation-2'],
      description: 'Food-focused product animation with controlled lighting and presentation.',
      details: 'A product visualization study focused on food form, materials, lighting, and camera movement.',
      tools: ['Blender', 'Cycles', 'Product Animation'],
    },
    {
      slug: 'blue-mall-logo-animation',
      title: 'Blue Mall Logo Animation',
      category: 'Motion Design',
      year: '2026',
      thumb: 'blue-mall-image-thumb',
      images: ['blue-mall-image'],
      videos: ['blue-mall-animation'],
      description: 'A premium 3D logo animation built around glass, light, and motion.',
      details:
        'Exploration of glass shaders, material alpha animation, camera movement, keyframes, and textured lighting.',
      tools: ['Blender', 'Logo Animation', 'Glass Shaders', 'Lighting'],
    },
    {
      slug: 'youth-affairs-logo-animation',
      title: 'Youth Affairs Logo Animation',
      category: 'Motion Design',
      year: '2026',
      thumb: 'youth-affairs-image-thumb',
      images: ['youth-affairs-image-1', 'youth-affairs-image-2', 'youth-affairs-image-3'],
      videos: ['youth-affairs-animation'],
      description: '3D logo animation with final renders and making-of material.',
      details: 'A logo motion project developed through modeling, materials, lighting, animation, and final rendering.',
      tools: ['Blender', 'Logo Animation', 'Motion Design'],
    },
  ];

  const PRIVACY = {
    lead: "A simple note on what this portfolio does and doesn't collect.",
    updated: 'Last updated: October 2026',
    blocks: [
      [
        'Personal information',
        'This portfolio is a personal showcase of 3D artwork and creative services. It does not provide an account system or collect information through a built-in contact form.',
      ],
      [
        'Contacting me',
        'If you contact me by email or through a linked social platform, the information you provide is handled by that service and used to respond to your message.',
      ],
      [
        'Local preferences',
        'This site stores your colour mode and colour scheme choice in your browser so it can remember it. The site does not use that preference to identify you.',
      ],
      [
        'Third-party services',
        'Fonts and media are served from this site. External links (Instagram, Telegram, WhatsApp) are subject to their own privacy policies.',
      ],
      ['Questions', 'For questions about this notice, email me at the address in the contact section.'],
    ],
  };

  /** Source pixel size of each full image [width, height] — reserves space so the gallery doesn't jump while loading. */
  const IMAGE_SIZES = {
    'realistic-ice-image-1': [1600, 1200],
    'realistic-ice-image-2': [1600, 1200],
    'soap-image-1': [1600, 1200],
    'soap-image-2': [1600, 1200],
    'soap-image-3': [1600, 900],
    'soap-image-4': [1600, 1200],
    'yerba-mate-image-1': [1600, 1200],
    'yerba-mate-image-2': [1600, 1200],
    'asus-image': [1600, 1200],
    'real-water-glass-image-1': [1600, 1200],
    'real-water-glass-image-2': [1600, 1200],
    'smart-watch-image': [1600, 1200],
    'nike-shoe-image-1': [1600, 1200],
    'nike-shoe-image-2': [1600, 1200],
    'nike-shoe-image-3': [1600, 900],
    'nike-shoe-image-4': [1600, 1200],
    'nike-shoe-image-5': [1600, 1200],
    'nike-shoe-image-6': [1600, 900],
    'interior-image-1': [1600, 1200],
    'interior-image-2': [1600, 1200],
    'booth-01-image-01': [1600, 1200],
    'booth-01-image-02': [1600, 1200],
    'booth-01-image-03': [1600, 900],
    'booth-01-image-04': [1600, 1200],
    'booth-01-image-05': [1600, 1200],
    'booth-01-image-06': [1600, 900],
    'booth-01-image-07': [1600, 1200],
    'booth-01-image-08': [1600, 1200],
    'booth-01-image-09': [1600, 900],
    'boooth-02-image-01': [1600, 1200],
    'boooth-02-image-02': [1600, 1200],
    'boooth-02-image-03': [1600, 1200],
    'boooth-02-image-04': [1600, 1200],
    'boooth-02-image-05': [1600, 1200],
    'boooth-02-image-06': [1600, 1200],
    'boooth-02-image-07': [1600, 1200],
    'boooth-02-image-08': [1600, 1200],
    '2026-looks': [1600, 1200],
    '2026-look-1': [1600, 1200],
    '2026-look-2': [1600, 900],
    '2026-look-3': [1600, 1200],
    '2026-look-4': [1600, 1200],
    '2026-look-5': [1600, 900],
    '2026-look-6': [1600, 1200],
    'folder-image-1': [1600, 1200],
    'folder-image-2': [1600, 1200],
    'vellum-image': [1600, 1200],
    'dates-cookie-image': [1600, 1200],
    'blue-mall-image': [1600, 1200],
    'youth-affairs-image-1': [1600, 1200],
    'youth-affairs-image-2': [1600, 1200],
    'youth-affairs-image-3': [1600, 900],
  };

  /* ════════════════════════════════════════════════════════════════════════════
     2. SETTINGS
     ════════════════════════════════════════════════════════════════════════════ */

  const SCHEMES = {
    dark: [
      { name: 'Copper', accent: '#D4663A' },
      { name: 'Sage', accent: '#9FB08A' },
      { name: 'Ice', accent: '#9DB4C4' },
    ],
    light: [
      { name: 'Copper', accent: '#B8501F' },
      { name: 'Sage', accent: '#5F7550' },
      { name: 'Ice', accent: '#4F6F86' },
    ],
  };
  /** Browser-chrome colour on phones. Must equal --bg in style.css. */
  const THEME_COLOR = { dark: '#0C0C0B', light: '#F1EEE8' };
  const MODE_KEY = 'mode';
  const SCHEME_KEY = 'scheme';

  const MOTION = {
    // interactive headings (variable-font axes)
    W_REST: 860,
    W_MIN: 160,
    D_REST: 68,
    D_MAX: 125,
    RADIUS: 1.15,
    EASE: 0.16,
    CALM_W_MIN: 480,
    // stroke → fill reveal
    STROKE_STAGGER: 40,
    FILL_STAGGER: 70,
    FILL_MS: 2600,
    INTRO_END_MS: 4400,
    HOLD_MS: 1200,
    TYPE_MS: 26,
    // magnetic controls
    MAG_REACH: 90,
    MAG_PULL: 0.28,
    MAG_MAX: 14,
    MAG_EASE: 0.18,
    MAG_MAX_W: 320,
    MAG_MAX_H: 96,
  };
  const INTRO = { COUNT_MS: 2600, COUNT_MS_REDUCED: 300, SETTLE_MS: 380, FAILSAFE_MS: 9000, CLEANUP_MS: 1900 };

  /* ════════════════════════════════════════════════════════════════════════════
     3. CORE
     ════════════════════════════════════════════════════════════════════════════ */

  const root = document.documentElement;
  /** @param {string} sel @param {ParentNode} [scope] @returns {HTMLElement | null} */
  const $ = (sel, scope = document) => scope.querySelector(sel);
  /** @param {string} sel @param {ParentNode} [scope] @returns {HTMLElement[]} */
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ESC[c]);

  /** localStorage that never throws (private mode, blocked storage, sandboxed previews). */
  const store = {
    get: function (k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {
        /* preferences just won't persist */
      }
    },
  };
  /** Debug flags: ?motion=full, ?engine=b, ?debug=1 (or the same keys saved as pf_<key>). */
  function param(key) {
    let q = null;
    try {
      q = new URLSearchParams(location.search).get(key);
    } catch (e) {
      /* ignore */
    }
    return q !== null ? q : store.get('pf_' + key);
  }

  const mq = (q) => matchMedia(q).matches;
  const PREFERS_REDUCED = mq('(prefers-reduced-motion: reduce)');
  const FORCE_FULL = param('motion') === 'full';
  /** Effective reduced-motion state. ?motion=full overrides the OS setting (testing only). */
  const REDUCED = PREFERS_REDUCED && !FORCE_FULL;
  /** A mouse / trackpad is the primary input: custom cursor, magnetic controls, hover previews, letter morphing. */
  const FINE = mq('(hover: hover) and (pointer: fine)');
  const ENGINE_B = param('engine') === 'b';
  const DEBUG = param('debug') === '1';

  /* ── pre-paint boot: theme + flags, so there is no flash of the wrong colours ── */
  (function boot() {
    const saved = store.get(MODE_KEY);
    const mode = saved === 'dark' || saved === 'light' ? saved : mq('(prefers-color-scheme: light)') ? 'light' : 'dark';
    const list = SCHEMES[mode];
    const index = (Number(store.get(SCHEME_KEY)) || 0) % list.length;
    root.dataset.theme = mode;
    root.style.setProperty('--acc', list[index].accent);
    const meta = $('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', THEME_COLOR[mode]);
    root.classList.add('js', 'pre'); // js: content hidden by script only when script runs · pre: intro curtain up
    // failsafe: never leave the page covered if the intro cannot run
    setTimeout(function () {
      if (!root.classList.contains('pre')) return;
      const pre = document.getElementById('pre');
      if (pre) pre.classList.add('out');
      root.classList.remove('pre');
    }, INTRO.FAILSAFE_MS);
  })();

  /** Shared pointer state (mouse only; touch devices never use it). */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, on: false };

  /*
   * One requestAnimationFrame loop that SLEEPS: it runs only while something is moving
   * (pointer moved, scrolling, letters easing back…) and stops when everything has settled.
   * wake() is called by the events that can change something.
   */
  const probe = {}; // filled by the performance HUD (before/after hooks, keepAlive)
  let rafId = 0;
  const tasks = []; // each: function(now) → { writes?: number, active: boolean }
  function wake() {
    if (!rafId) rafId = requestAnimationFrame(frame);
  }
  function frame(now) {
    rafId = 0;
    const startedAt = performance.now();
    if (probe.before) probe.before(now);
    let active = false;
    let writes = 0;
    for (let i = 0; i < tasks.length; i++) {
      const r = tasks[i](now);
      if (r) {
        active = active || r.active;
        writes += r.writes || 0;
      }
    }
    if (probe.after) probe.after(startedAt, writes);
    if (active || probe.keepAlive) wake();
  }

  /* ════════════════════════════════════════════════════════════════════════════
     4. RENDER  —  builds the page HTML from the content in section 1.
     data-sa marks blocks that slide in/out while scrolling (section 7).
     ════════════════════════════════════════════════════════════════════════════ */

  const ICON_OUT =
    '<svg class="ico" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
  const ICON_BACK =
    '<svg class="ico" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M10 6H2M5.5 2.5 2 6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

  const findWork = (slug) => WORKS.find((w) => w.slug === slug);
  const initials = (name) =>
    name
      .split(/\s+/)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase();
  const num = (i) => '0' + (i + 1);

  /** [category, count] in order of first appearance. */
  function categories() {
    const counts = new Map();
    WORKS.forEach((w) => counts.set(w.category, (counts.get(w.category) || 0) + 1));
    return Array.from(counts);
  }

  /** Most-used tools across all projects, most frequent first (ties alphabetical). */
  function topTools(limit) {
    const counts = new Map();
    WORKS.forEach((w) => w.tools.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'))
      .slice(0, limit)
      .map((e) => e[0]);
  }

  const fullImage = (id, alt, cls, eager) => {
    const size = IMAGE_SIZES[id];
    const dims = size ? ` width="${size[0]}" height="${size[1]}"` : '';
    const loading = eager ? 'loading="eager" decoding="async" fetchpriority="high"' : 'loading="lazy" decoding="async"';
    return `<img class="${cls}" src="images/${id}.jpg"${dims} alt="${esc(alt)}" ${loading}>`;
  };

  const video = (id, label) =>
    `<figure class="hero-media" data-sa><video class="pv" muted loop playsinline preload="metadata" controls aria-label="${esc(label)}">` +
    `<source src="videos/${id}.mp4#t=0.001" type="video/mp4"></video></figure>`;

  // ── shell ──
  function renderShellTop() {
    const ab = initials(SITE.name);
    const links = ['works', 'about', 'skills', 'contact']
      .map((id) => `<a href="#${id}" data-cur="Go">${id[0].toUpperCase() + id.slice(1)}</a>`)
      .join('');
    return (
      `<a class="skipnav" href="#top">Skip to content</a>` +
      `<button class="skip" id="skip" type="button">Skip intro</button>` +
      `<header class="nav"><a href="#top" class="mono" data-cur="Home" aria-label="${esc(SITE.name)}, home">${esc(ab)}</a>` +
      `<nav aria-label="Primary" class="mono">${links}</nav></header>`
    );
  }

  function renderShellBottom() {
    const c = SITE.contacts;
    const ext = (href, label) =>
      `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-cur="Go">${label}${ICON_OUT}</a>`;
    return (
      `<footer class="foot mono"><p>Independent 3D artist shaping ideas into images, motion and atmosphere.</p><div class="foot-links">` +
      `<a href="mailto:${esc(c.email)}" data-cur="Go">Email${ICON_OUT}</a>` +
      ext(c.instagram.url, 'Instagram') +
      ext(c.telegram.url, 'Telegram') +
      ext(c.whatsapp.url, 'WhatsApp') +
      `<a href="#privacy" data-panel data-cur="Go">Privacy</a></div><span>© 2026 ${esc(SITE.name)}</span></footer>` +
      `<div class="dock"><button class="md mono" id="md" type="button" data-cur="Mode"><i></i><span id="mdName">Dark</span></button>` +
      `<button class="sw mono" id="sw" type="button" data-cur="Scheme"><i></i><i></i><span id="swName">Copper</span></button></div>` +
      `<div class="sr" id="live" role="status" aria-live="polite"></div>` +
      // the custom cursor only exists on devices with a mouse
      (FINE
        ? `<div id="cl" aria-hidden="true"><i class="h"></i><i class="v"></i></div>` +
          `<div id="cur" aria-hidden="true"><b class="cs"></b><span id="cx" class="mono">X 0000 · Y 0000</span></div>`
        : '') +
      `<section class="panel" id="panel" aria-label="Project" aria-hidden="true" inert><div class="panel-body"></div></section>` +
      `<button class="panel-x mono" id="panelX" type="button" aria-hidden="true" tabindex="-1">✕ Close</button>`
    );
  }

  // ── home ──
  function tile(w) {
    const hasVideo = w.videos.length > 0;
    return (
      `<article class="tile" data-sa data-cat="${esc(w.category)}"${hasVideo ? ` data-video="${esc(w.videos[0])}"` : ''}>` +
      `<a href="#work/${w.slug}" data-panel data-cur="View"><div class="th">` +
      // grid thumbnail; if it is missing the full image is used instead (see initMediaFallback)
      `<img class="cov" src="images/thumbs/${w.thumb}.webp" data-full="images/${w.images[0]}.jpg" width="480" height="600" alt="" loading="lazy" decoding="async">` +
      `${hasVideo ? '<span class="mono mot">Motion</span>' : ''}<span class="mono miss">Media missing</span></div>` +
      `<h3>${esc(w.title)}</h3><p class="mono">${esc(w.category)} · ${esc(w.year)}</p></a></article>`
    );
  }

  const outbound = (href, label, text) =>
    `<li><span class="mono">${label}</span><a href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-cur="Go">${esc(text)}${ICON_OUT}</a></li>`;

  function renderHome() {
    const chips =
      `<div class="chips" id="chips" role="group" aria-label="Filter works by category" data-sa hidden>` +
      `<button type="button" class="chip" data-cat="" aria-pressed="true" data-cur="Filter">All <i>${WORKS.length}</i></button>` +
      categories()
        .map(
          ([cat, n]) =>
            `<button type="button" class="chip" data-cat="${esc(cat)}" aria-pressed="false" data-cur="Filter">${esc(cat)} <i>${n}</i></button>`,
        )
        .join('') +
      `</div>`;
    const facts = ABOUT.facts.map(([k, v]) => `<div><dt class="mono">${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    const principles = ABOUT.principles
      .map(([t, d], i) => `<li data-sa><span class="mono">${num(i)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`)
      .join('');
    const groups = SERVICES.map(
      (s, i) =>
        `<article class="grp" data-sa><span class="mono">${num(i)} / ${esc(s.id)}</span><h3>${esc(s.title)}</h3><p>${esc(s.summary)}</p>` +
        `<ul>${s.items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article>`,
    ).join('');
    const steps = PROCESS.map(
      ([t, d], i) => `<li data-sa><span class="mono">${num(i)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`,
    ).join('');
    const c = SITE.contacts;

    return (
      `<section class="hero" aria-label="Introduction"><h1 class="px st" id="heroName">${esc(SITE.name)}</h1>\n` +
      `<div class="hmeta mono"><div class="tagw" id="tag" data-text="${esc(SITE.tagline)}"><span class="sr">${esc(SITE.tagline)}</span><span class="ghost" aria-hidden="true">${esc(SITE.tagline)}</span><span class="typed" id="tagv" aria-hidden="true"></span></div>` +
      `<div>${esc(SITE.timeLabel)} <span id="clock" data-tz="${esc(SITE.timezone)}">--:--</span></div>` +
      `<div><span class="dot"></span> ${esc(SITE.availability)}</div></div></section>\n` +
      `<section class="s" id="works" aria-labelledby="wt"><div class="mono lab" data-sa>01 / Selected works · ${WORKS.length}</div><h2 class="px st" id="wt">Works</h2>${chips}<p class="sr" id="count" role="status"></p><div class="grid" id="grid">${WORKS.map(tile).join('')}</div></section>\n` +
      `<section class="s" id="about" aria-labelledby="at"><div class="mono lab" data-sa>02 / ${esc(ABOUT.label)}</div><h2 class="px st" id="at">About</h2>` +
      `<div class="cols"><p class="px st pull" data-w0="700" data-dmax="100">${esc(ABOUT.pull)}</p><div class="copy" data-sa><p class="lead">${esc(ABOUT.lead)}</p>${ABOUT.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}<dl class="facts">${facts}</dl></div></div>` +
      `<ol class="princ">${principles}</ol></section>\n` +
      `<section class="s" id="skills" aria-labelledby="kt"><div class="mono lab" data-sa>03 / Skills &amp; services</div><h2 class="px st" id="kt">Skills</h2><div class="groups">${groups}</div>` +
      `<div class="tools" data-sa><span class="mono">Tools &amp; techniques</span><ul>${topTools(14)
        .map((t) => `<li class="mono">${esc(t)}</li>`)
        .join('')}</ul></div>` +
      `<div class="proc"><span class="mono" data-sa>The process</span><ol>${steps}</ol></div></section>\n` +
      `<section class="s" id="contact" aria-labelledby="ct"><div class="mono lab" data-sa>04 / Contact</div><h2 class="px st" id="ct">Contact</h2>` +
      `<p class="lead" data-sa>Have a product, a scene, or a half-formed idea? Let's turn it into something with presence.</p>` +
      `<div class="cta" data-sa><a class="btn" href="mailto:${esc(c.email)}" data-cur="Email" data-mag>Email me${ICON_OUT}</a>` +
      `<button class="btn ghost" id="mail" type="button" data-cur="Copy" data-email="${esc(c.email)}">Copy address</button>` +
      `<span class="mono addr">${esc(c.email)}</span></div><span class="stat mono" id="stat" role="status"></span>` +
      `<ul class="clinks" data-sa>${outbound(c.instagram.url, 'Instagram', c.instagram.handle)}${outbound(c.telegram.url, 'Telegram', c.telegram.handle)}${outbound(c.whatsapp.url, 'WhatsApp', 'Message me')}</ul>` +
      `<p class="mono note" data-sa>${esc(SITE.response)} For a faster hello, find me on social.</p></section>`
    );
  }

  // ── project (shown in the panel) ──
  function renderProject(slug) {
    const index = WORKS.findIndex((w) => w.slug === slug);
    const work = WORKS[index];
    const prev = WORKS[(index - 1 + WORKS.length) % WORKS.length];
    const next = WORKS[(index + 1) % WORKS.length];
    const alt = (i, total) => `${work.title}: image ${i} of ${total}`;

    let hero = '';
    let gallery = work.images;
    if (work.videos.length) {
      hero = video(work.videos[0], `${work.title}, animation`);
    } else if (gallery[0]) {
      hero = `<figure class="hero-media" data-sa>${fullImage(gallery[0], alt(1, work.images.length), 'gi', true)}</figure>`;
      gallery = gallery.slice(1);
    }
    // A second video sits between the project text and the image gallery.
    const moreVideos = work.videos
      .slice(1)
      .map((id, i) => video(id, `${work.title}, animation ${i + 2}`))
      .join('');
    // Alt-text numbering: with a video every image is in the gallery (starts at 1); otherwise image 1 is the hero.
    const offset = work.videos.length ? 1 : 2;

    return (
      `<article class="project" aria-labelledby="pt"><nav class="crumbs mono" aria-label="Breadcrumb"><a href="#works" data-close data-cur="Back">${ICON_BACK} All works</a><span>${esc(work.category)}</span><span>${esc(work.year)}</span></nav>` +
      `<h1 class="px st" id="pt">${esc(work.title)}</h1><p class="plead" data-sa>${esc(work.description)}</p>${hero}` +
      `<dl class="pmeta" data-sa><div><dt class="mono">Discipline</dt><dd>${esc(work.category)}</dd></div><div><dt class="mono">Year</dt><dd>${esc(work.year)}</dd></div><div><dt class="mono">Tools</dt><dd>${work.tools.map(esc).join(' / ')}</dd></div></dl>` +
      `<section class="story" data-sa aria-label="About this project"><span class="mono">The idea</span><p>${esc(work.details)}</p></section>` +
      moreVideos +
      (gallery.length
        ? `<section class="gallery" aria-label="Project gallery">${gallery
            .map(
              (id, i) => `<figure data-sa>${fullImage(id, alt(i + offset, work.images.length), 'gi', false)}</figure>`,
            )
            .join('')}</section>`
        : '') +
      `<nav class="pn" aria-label="More projects" data-sa><a href="#work/${prev.slug}" data-swap data-cur="Prev"><span class="mono">Previous</span><b>${esc(prev.title)}</b></a>` +
      `<a href="#work/${next.slug}" data-swap data-cur="Next"><span class="mono">Next</span><b>${esc(next.title)}</b></a></nav></article>`
    );
  }

  const renderPrivacy = () =>
    `<article class="doc"><nav class="crumbs mono" aria-label="Breadcrumb"><a href="#top" data-close data-cur="Back">${ICON_BACK} Home</a></nav>` +
    `<h1 class="px st" id="pt">Privacy</h1><p class="plead">${esc(PRIVACY.lead)}</p>` +
    PRIVACY.blocks.map(([t, d]) => `<section><h2 class="mono">${esc(t)}</h2><p>${esc(d)}</p></section>`).join('') +
    `<p class="mono">${esc(PRIVACY.updated)}</p></article>`;

  const renderNotFound = () =>
    `<article class="doc"><nav class="crumbs mono"><a href="#top" data-close data-cur="Back">${ICON_BACK} Home</a></nav>` +
    `<h1 class="px st" id="pt">Not found</h1><p class="plead">That project does not exist.</p></article>`;

  /* ════════════════════════════════════════════════════════════════════════════
     5. FEATURES
     ════════════════════════════════════════════════════════════════════════════ */

  /* ── intro: a 000 → 100 counter on a curtain that lifts away ── */
  const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /** Resolves when the curtain starts to lift, which is when the rest of the page starts up. */
  function runIntro() {
    const curtain = $('#pre');
    const counter = $('#pn');
    const bar = $('#pb');
    return new Promise((resolve) => {
      if (!curtain || !counter || !bar) {
        root.classList.remove('pre');
        resolve();
        return;
      }
      root.classList.add('pre');
      const duration = PREFERS_REDUCED ? INTRO.COUNT_MS_REDUCED : INTRO.COUNT_MS;
      const startedAt = performance.now();
      let finished = false;

      const finish = () => {
        if (finished) return;
        finished = true;
        curtain.classList.add('out');
        root.classList.remove('pre');
        resolve();
        setTimeout(() => curtain.remove(), INTRO.CLEANUP_MS);
      };
      const tick = (now) => {
        const t = Math.min(1, (now - startedAt) / duration);
        const value = Math.round(easeInOutCubic(t) * 100);
        counter.textContent = String(value).padStart(3, '0');
        bar.style.transform = 'scaleX(' + value / 100 + ')';
        if (t < 1) requestAnimationFrame(tick);
        else setTimeout(finish, INTRO.SETTLE_MS);
      };
      requestAnimationFrame(tick);
      setTimeout(finish, INTRO.FAILSAFE_MS); // rAF is paused in background tabs
    });
  }

  /* ── colour mode + accent scheme (saved) ── */
  function initTheme() {
    const saved = store.get(MODE_KEY);
    let mode = saved === 'dark' || saved === 'light' ? saved : mq('(prefers-color-scheme: light)') ? 'light' : 'dark';
    let index = Number(store.get(SCHEME_KEY)) || 0;
    const cap = (s) => s[0].toUpperCase() + s.slice(1);

    const apply = (announce) => {
      const list = SCHEMES[mode];
      index %= list.length;
      const scheme = list[index];
      const other = mode === 'dark' ? 'light' : 'dark';
      root.dataset.theme = mode;
      root.style.setProperty('--acc', scheme.accent);
      $('#swName').textContent = scheme.name;
      $('#mdName').textContent = cap(mode);
      $('#sw').setAttribute('aria-label', scheme.name + ' colour scheme. Switch to next scheme');
      $('#md').setAttribute('aria-label', cap(mode) + ' mode. Switch to ' + other + ' mode');
      const meta = $('meta[name=theme-color]');
      if (meta) meta.setAttribute('content', THEME_COLOR[mode]);
      if (announce) $('#live').textContent = cap(mode) + ' mode, ' + scheme.name + ' scheme';
      store.set(MODE_KEY, mode);
      store.set(SCHEME_KEY, String(index));
    };
    $('#sw').addEventListener('click', () => {
      index = (index + 1) % SCHEMES[mode].length;
      apply(true);
    });
    $('#md').addEventListener('click', () => {
      mode = mode === 'dark' ? 'light' : 'dark';
      apply(true);
    });
    apply(false);
  }

  /* ── media fallbacks ──
     • a missing grid thumbnail falls back to the full .jpg
     • anything still missing shows the hatched "Media missing" tile and logs the file name */
  function initMedia(scope) {
    $$('img', scope).forEach((img) => {
      const holder = img.closest('.th, figure');
      const fail = () => {
        const full = img.dataset.full;
        if (full && !img.dataset.tried) {
          img.dataset.tried = '1';
          img.src = full;
          return;
        }
        if (holder) holder.classList.add('missing');
        console.warn('Missing image:', img.getAttribute('src'));
      };
      if (img.complete && img.naturalWidth === 0 && img.currentSrc) fail();
      else img.addEventListener('error', fail);
    });
    $$('video source', scope).forEach((source) => {
      source.addEventListener('error', () => {
        const holder = source.closest('figure');
        if (holder) holder.classList.add('missing');
        console.warn('Missing video:', source.getAttribute('src'));
      });
    });
  }

  /* ── small page-wide behaviour: clock + copy e-mail ── */
  function updateClock() {
    const el = $('#clock');
    if (!el) return;
    try {
      el.textContent = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: el.dataset.tz || undefined,
      }).format(new Date());
    } catch (e) {
      /* unknown time zone — keep the placeholder */
    }
  }

  function initGlobalUi() {
    setInterval(updateClock, 30000);
    let clearTimer;
    document.addEventListener('click', async (e) => {
      const button = e.target.closest('#mail');
      const status = $('#stat');
      if (!button || !status) return;
      const email = button.dataset.email || '';
      try {
        await navigator.clipboard.writeText(email);
        status.textContent = 'Copied to clipboard';
      } catch (err) {
        status.textContent = 'Copy failed. Email: ' + email;
      }
      clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        status.textContent = '';
      }, 2600);
    });
  }

  /* ── pointer tracking (mouse only) ── */
  function initPointer() {
    const update = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.on = true;
      wake();
    };
    addEventListener('pointermove', update, { passive: true });
    addEventListener('pointerdown', update, { passive: true });
    addEventListener('scroll', wake, { passive: true }); // content moving under a still pointer
    addEventListener('resize', wake);
  }

  /* ── custom cursor: crosshair + X/Y read-out (mouse only; the elements don't exist on touch) ── */
  const cursorState = { x: -1, y: -1, hover: '', shown: '' };
  let crossH, crossV, cursorEl, cursorLabel;

  function initCursor() {
    crossH = $('#cl .h');
    crossV = $('#cl .v');
    cursorEl = $('#cur');
    cursorLabel = $('#cx');
    addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'mouse') root.classList.add('cur-on', 'fine');
      },
      { passive: true },
    );
    root.addEventListener('mouseleave', () => root.classList.remove('cur-on'));
    document.addEventListener('pointerover', (e) => {
      const target = e.target.closest && e.target.closest('[data-cur],a,button');
      cursorState.hover = target ? target.dataset.cur || 'Go' : '';
      cursorEl.classList.toggle('hov', !!target);
      wake();
    });
  }

  const pad4 = (n) => String(Math.max(0, Math.round(n))).padStart(4, '0');

  function updateCursor() {
    if (!root.classList.contains('cur-on')) return null;
    const x = pointer.x;
    const y = pointer.y;
    const moved = x !== cursorState.x || y !== cursorState.y;
    cursorState.x = x;
    cursorState.y = y;
    crossH.style.transform = 'translate3d(0,' + y + 'px,0)';
    crossV.style.transform = 'translate3d(' + x + 'px,0,0)';
    cursorEl.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    const text = cursorState.hover || 'X ' + pad4(x) + ' · Y ' + pad4(y);
    if (text !== cursorState.shown) {
      cursorLabel.textContent = text;
      cursorState.shown = text;
    }
    // flip the read-out to the other side near the right / bottom edges
    cursorEl.classList.toggle('fx', x > innerWidth - 190);
    cursorEl.classList.toggle('fy', y > innerHeight - 50);
    return { active: moved };
  }

  /* ── magnetic controls: links / buttons lean toward the pointer within MAG_REACH px ── */
  let magnets = [];
  const scrollerOffset = (t) => (t.scroller ? [t.scroller.scrollLeft, t.scroller.scrollTop] : [scrollX, scrollY]);

  function refreshMagnets() {
    magnets.forEach((t) => {
      t.el.style.translate = '';
    });
    const panel = $('#panel');
    const panelOpen = panel && panel.classList.contains('open');
    magnets = $$('a[href],button,[data-mag]')
      .filter(
        (el) =>
          !el.closest('#hud') &&
          !el.classList.contains('skipnav') &&
          !el.classList.contains('gone') &&
          !el.closest('[inert]'),
      )
      .map((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || r.width > MOTION.MAG_MAX_W || r.height > MOTION.MAG_MAX_H) return null;
        const fixed = !!el.closest('.nav,.dock,.skip,.panel-x');
        const scroller = !fixed && panelOpen && panel.contains(el) ? panel : null;
        const t = { el, fixed, scroller, x: 0, y: 0, w: r.width, h: r.height, cx: 0, cy: 0, lx: 0, ly: 0 };
        const off = fixed ? [0, 0] : scrollerOffset(t);
        t.x = r.left + off[0];
        t.y = r.top + off[1];
        return t;
      })
      .filter(Boolean);
  }

  function bindMagnetRefresh() {
    let queued = false;
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        refreshMagnets();
      });
    };
    addEventListener('resize', queue);
    addEventListener('load', queue);
    if (window.ResizeObserver) new ResizeObserver(queue).observe($('#top'));
    if (document.fonts) document.fonts.ready.then(queue);
  }

  function stepMagnets() {
    if (!magnets.length) return null;
    const { MAG_REACH, MAG_PULL, MAG_MAX, MAG_EASE } = MOTION;
    let active = false;
    for (const t of magnets) {
      const off = t.fixed ? [0, 0] : scrollerOffset(t);
      const left = t.x - off[0];
      const top = t.y - off[1];
      const dx = Math.max(left - pointer.x, 0, pointer.x - (left + t.w));
      const dy = Math.max(top - pointer.y, 0, pointer.y - (top + t.h));
      const strength = pointer.on ? Math.max(0, 1 - Math.hypot(dx, dy) / MAG_REACH) : 0;
      const goalX = strength ? clamp((pointer.x - (left + t.w / 2)) * MAG_PULL * strength, -MAG_MAX, MAG_MAX) : 0;
      const goalY = strength ? clamp((pointer.y - (top + t.h / 2)) * MAG_PULL * strength, -MAG_MAX, MAG_MAX) : 0;
      t.cx += (goalX - t.cx) * MAG_EASE;
      t.cy += (goalY - t.cy) * MAG_EASE;
      if (Math.abs(t.cx - goalX) > 0.05 || Math.abs(t.cy - goalY) > 0.05) active = true;
      if (Math.abs(t.cx - t.lx) > 0.05 || Math.abs(t.cy - t.ly) > 0.05) {
        t.lx = t.cx;
        t.ly = t.cy;
        t.el.style.translate =
          Math.abs(t.cx) < 0.05 && Math.abs(t.cy) < 0.05 ? '' : t.cx.toFixed(2) + 'px ' + t.cy.toFixed(2) + 'px';
      }
    }
    return { active };
  }

  /* ── interactive display headings (.px) ──
     Every heading is split into per-letter spans. They reveal as stroke → fill (all devices, once), and on
     desktop the letters morph along the font's weight/width axes near the mouse. Touch devices skip the
     morphing entirely: no per-frame work, same look. */
  const headings = [];
  const SAMPLES = 9; // engine B: widths sampled along the morph

  function splitHeading(el) {
    const text = (el.textContent || '').trim();
    const words = text.split(' ');
    const w0 = Number(el.dataset.w0) || MOTION.W_REST;
    const dmax = Number(el.dataset.dmax) || MOTION.D_MAX;
    const d0 = MOTION.D_REST;

    el.dataset.split = '1';
    el.textContent = '';
    el.style.setProperty('--w0', String(w0));
    el.style.setProperty('--d0', String(d0));

    const sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = text;
    el.appendChild(sr);

    const letters = [];
    let n = 0;
    words.forEach((word, wi) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'w';
      wordEl.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const l = document.createElement('span');
        l.className = 'l';
        l.textContent = ch;
        l.style.setProperty('--d', (n * MOTION.STROKE_STAGGER) / 1000 + 's'); // stroke stagger
        l.style.setProperty('--f', (n * MOTION.FILL_STAGGER) / 1000 + 's'); // fill stagger
        n++;
        wordEl.appendChild(l);
        letters.push({
          el: l,
          ch,
          cw: w0,
          cd: d0,
          lw: w0,
          ld: d0,
          x: 0,
          y: 0,
          ck: 0,
          lk: -1,
          lx: 0,
          cx: 0,
          cy: 0,
          wpx: 0,
        });
      }
      el.appendChild(wordEl);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });

    const heading = {
      el,
      letters,
      index: headings.length,
      visible: false,
      fontSize: 100,
      busy: false,
      w0,
      d0,
      dmax,
      engineB: ENGINE_B && FINE && !REDUCED && (el.id === 'heroName' || el.tagName === 'H2'),
      table: null,
      lines: null,
      pageRect: { left: 0, top: 0, width: 1, height: 1 },
    };
    headings.push(heading);
    return heading;
  }

  const pageRectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height };
  };

  // which headings are on (or near) screen — desktop only
  const visibilityObserver = FINE
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const h = headings.find((x) => x.el === entry.target);
            if (h) h.visible = entry.isIntersecting;
          });
          wake();
        },
        { rootMargin: '120px' },
      )
    : null;

  // stroke → fill reveal the first time a heading scrolls into view
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('stroke');
        setTimeout(() => el.classList.add('on'), MOTION.HOLD_MS);
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.25 },
  );

  function measureHeadings() {
    if (!FINE) return;
    headings.forEach((h) => {
      h.fontSize = parseFloat(getComputedStyle(h.el).fontSize);
      h.pageRect = pageRectOf(h.el);
      if (h.engineB && h.table) {
        h.lines.forEach((line) => {
          line.rect = pageRectOf(line.word);
        });
        layoutLines(h, true);
      }
    });
  }

  function initHeadings(scope) {
    $$('.px', scope).forEach((el) => {
      if (el.dataset.split) return;
      splitHeading(el);
      if (visibilityObserver) visibilityObserver.observe(el);
      if (el.id !== 'heroName') {
        // the hero name is revealed by the hero sequence
        if (REDUCED) el.classList.add('stroke', 'on');
        else revealObserver.observe(el);
      }
    });
    measureHeadings();
    if (FINE) {
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
        // widths are only right once fonts are in
        headings.forEach((h) => {
          if (h.engineB && !h.table) enableEngineB(h);
        });
        measureHeadings();
        wake();
      });
    }
  }

  function disposeHeadings(scope) {
    for (let i = headings.length - 1; i >= 0; i--) {
      const h = headings[i];
      if (!scope.contains(h.el)) continue;
      if (visibilityObserver) visibilityObserver.unobserve(h.el);
      revealObserver.unobserve(h.el);
      headings.splice(i, 1);
    }
  }

  function bindHeadingMeasure() {
    if (!FINE) return;
    addEventListener('resize', measureHeadings);
    addEventListener('load', measureHeadings);
    if (window.ResizeObserver) {
      let queued = false;
      new ResizeObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          measureHeadings();
          wake();
        });
      }).observe($('#top'));
    }
  }

  // engine A (default): each letter's weight/width eases toward a target set by its distance from the pointer
  function stepEngineA(item) {
    const h = item.heading;
    const weightFloor = REDUCED ? MOTION.CALM_W_MIN : MOTION.W_MIN;
    let moving = false;
    let writes = 0;
    for (const letter of h.letters) {
      let influence = 0;
      if (item.near)
        influence = smooth(clamp(1 - Math.hypot(letter.x - item.px, letter.y - item.py) / item.radius, 0, 1));
      const targetW = h.w0 - (h.w0 - weightFloor) * influence;
      const targetD = REDUCED ? h.d0 : h.d0 + (h.dmax - h.d0) * influence;
      letter.cw += (targetW - letter.cw) * MOTION.EASE;
      letter.cd += (targetD - letter.cd) * MOTION.EASE;
      if (Math.abs(letter.cw - targetW) > 0.4 || Math.abs(letter.cd - targetD) > 0.2) moving = true;
      if (Math.abs(letter.cw - letter.lw) > 0.3 || Math.abs(letter.cd - letter.ld) > 0.15) {
        letter.lw = letter.cw;
        letter.ld = letter.cd;
        letter.el.style.fontVariationSettings = '"wght" ' + letter.cw.toFixed(1) + ',"wdth" ' + letter.cd.toFixed(1);
        writes++;
      }
    }
    h.busy = moving;
    return writes;
  }

  // engine B (opt-in, ?engine=b): glyph widths are sampled once; letters are positioned by arithmetic, no DOM reads per frame
  const variation = (h, t) =>
    '"wght" ' + (h.w0 - (h.w0 - MOTION.W_MIN) * t).toFixed(1) + ',"wdth" ' + (h.d0 + (h.dmax - h.d0) * t).toFixed(1);

  function buildWidthTable(h) {
    const style = getComputedStyle(h.el);
    const chars = Array.from(new Set(h.letters.map((l) => l.ch)));
    const probeEl = document.createElement('div');
    probeEl.setAttribute('aria-hidden', 'true');
    probeEl.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font-size:100px;letter-spacing:-.01em;font-family:' +
      style.fontFamily +
      ';text-transform:' +
      style.textTransform;
    const spans = chars.map((ch) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.display = 'inline-block';
      probeEl.appendChild(s);
      return s;
    });
    document.body.appendChild(probeEl);
    const table = {};
    chars.forEach((ch) => {
      table[ch] = [];
    });
    for (let i = 0; i < SAMPLES; i++) {
      const settings = variation(h, i / (SAMPLES - 1));
      spans.forEach((s) => {
        s.style.fontVariationSettings = settings;
      }); // all writes…
      spans.forEach((s, n) => table[chars[n]].push(s.getBoundingClientRect().width / 100)); // …then all reads
    }
    probeEl.remove();
    h.table = table;
  }

  function widthAt(h, ch, k) {
    const row = h.table[ch];
    const pos = k * (SAMPLES - 1);
    const i = Math.min(SAMPLES - 2, pos | 0);
    const f = pos - i;
    return row[i] * (1 - f) + row[i + 1] * f;
  }

  function layoutLines(h, force) {
    let writes = 0;
    for (const line of h.lines) {
      let total = 0;
      for (const l of line.letters) {
        l.wpx = widthAt(h, l.ch, l.ck) * h.fontSize;
        total += l.wpx;
      }
      let offset = line.rightAligned ? line.rect.width - total : 0;
      for (const l of line.letters) {
        l.cx = line.rect.left + offset + l.wpx / 2;
        l.cy = line.rect.top + line.rect.height / 2;
        if (force || Math.abs(l.ck - l.lk) > 0.002 || Math.abs(offset - l.lx) > 0.3) {
          l.lk = l.ck;
          l.lx = offset;
          l.el.style.fontVariationSettings = variation(h, l.ck);
          l.el.style.transform = 'translate3d(' + offset.toFixed(2) + 'px,0,0)';
          writes++;
        }
        offset += l.wpx;
      }
    }
    return writes;
  }

  function enableEngineB(h) {
    buildWidthTable(h);
    h.lines = $$('.w', h.el).map((word, i, all) => ({
      word,
      letters: h.letters.filter((l) => l.el.parentNode === word),
      rightAligned: h.el.id === 'heroName' && i === all.length - 1,
      rect: { left: 0, top: 0, width: 0, height: 0 },
    }));
    h.el.classList.add('bm');
  }

  function stepEngineB(h, px, py, radius, near) {
    let moving = false;
    for (const line of h.lines) {
      for (const l of line.letters) {
        let influence = 0;
        if (near) influence = smooth(clamp(1 - Math.hypot(l.cx - px, l.cy - py) / radius, 0, 1));
        l.ck += (influence - l.ck) * MOTION.EASE;
        if (Math.abs(l.ck - influence) > 0.004) moving = true;
      }
    }
    h.busy = moving;
    return layoutLines(h, false);
  }

  /** Per frame (mouse devices only). */
  function stepHeadings() {
    const queueA = [];
    let writes = 0;
    let active = false;

    for (const h of headings) {
      if (!h.visible) continue;
      const radius = Math.max(140, h.fontSize * MOTION.RADIUS);
      if (h.engineB && h.table) {
        const box = h.pageRect;
        const ox = pointer.x + scrollX;
        const oy = pointer.y + scrollY;
        const near =
          pointer.on &&
          ox > box.left - radius &&
          ox < box.left + box.width + radius &&
          oy > box.top - radius &&
          oy < box.top + box.height + radius;
        if (!near && !h.busy) continue;
        writes += stepEngineB(h, ox, oy, radius, near);
      } else {
        const box = h.el.getBoundingClientRect(); // live rect: correct inside the scrolling project panel too
        const near =
          pointer.on &&
          pointer.x > box.left - radius &&
          pointer.x < box.right + radius &&
          pointer.y > box.top - radius &&
          pointer.y < box.bottom + radius;
        if (!near && !h.busy) continue;
        queueA.push({ heading: h, px: pointer.x, py: pointer.y, radius, near });
      }
    }
    // engine A: read every letter centre first (one layout), then write
    queueA.forEach((item) => {
      item.heading.letters.forEach((l) => {
        const r = l.el.getBoundingClientRect();
        l.x = r.left + r.width / 2;
        l.y = r.top + r.height / 2;
      });
    });
    queueA.forEach((item) => {
      writes += stepEngineA(item);
    });
    headings.forEach((h) => {
      if (h.busy) active = true;
    });
    return { writes, active: active || writes > 0 };
  }

  /* ── hero sequence (home): name outline draws → ink wipes up → tagline types in → "Skip intro" fades ── */
  let typeToken = 0;
  let heroTimers = [];
  const later = (fn, ms) => {
    heroTimers.push(setTimeout(fn, ms));
  };
  const markReady = () => {
    root.dataset.ready = '1';
  }; // test hook: the hero sequence has finished
  const hideSkip = () => {
    const s = $('#skip');
    if (s) s.classList.add('gone');
  };

  function showTagline() {
    const typed = $('#tagv');
    const tag = $('#tag');
    if (!typed || !tag) return;
    typeToken++; // cancels a typing run in progress
    typed.textContent = tag.dataset.text || '';
  }
  function typeTagline() {
    const typed = $('#tagv');
    const tag = $('#tag');
    if (!typed || !tag) return;
    const token = ++typeToken;
    const text = tag.dataset.text || '';
    let n = 0;
    (function step() {
      if (token !== typeToken) return;
      typed.textContent = text.slice(0, ++n);
      if (n < text.length) setTimeout(step, MOTION.TYPE_MS);
    })();
  }
  function snapHero() {
    document.body.classList.add('go');
    const hero = $('#heroName');
    if (hero) hero.classList.add('snap', 'stroke', 'on');
    showTagline();
    hideSkip();
    markReady();
  }
  function heroIntro() {
    const hero = $('#heroName');
    if (REDUCED) {
      hero.classList.add('stroke', 'on');
      document.body.classList.add('go');
      showTagline();
      hideSkip();
      markReady();
      return;
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.body.classList.add('go');
        hero.classList.add('stroke');
      }),
    );
    later(() => hero.classList.add('on'), MOTION.FILL_MS);
    later(typeTagline, MOTION.FILL_MS + 300);
    later(hideSkip, MOTION.INTRO_END_MS);
    later(markReady, MOTION.INTRO_END_MS + 700);
    $('#skip').addEventListener('click', () => {
      heroTimers.forEach(clearTimeout); // otherwise the tagline would start typing again after the skip
      heroTimers = [];
      snapHero();
    });
  }

  /* ── works grid: bento layout, category filter, hover video previews ── */
  function layoutBento(tiles) {
    let i = 0;
    tiles.forEach((tile) => {
      if (tile.hidden) return;
      const slot = String(i++ % 10); // CSS maps data-b 0–9 to a grid slot
      if (tile.dataset.b !== slot) tile.dataset.b = slot;
    });
  }

  function initWorks() {
    const grid = $('#grid');
    const tiles = $$('.tile', grid);
    const chips = $('#chips');
    const count = $('#count');
    layoutBento(tiles);

    chips.hidden = false; // shipped hidden: nothing to filter with if the script fails
    chips.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const category = chip.dataset.cat || '';
      let shown = 0;
      tiles.forEach((tile) => {
        const match = !category || tile.dataset.cat === category;
        tile.hidden = !match;
        if (match) shown++;
      });
      layoutBento(tiles); // re-pack the bento around what is left
      $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', String((c.dataset.cat || '') === category)));
      count.textContent = shown + (shown === 1 ? ' project' : ' projects') + (category ? ' in ' + category : '');
    });

    // hover video preview — mouse only, and never when reduced motion or Data Saver is on
    const saveData = navigator.connection && navigator.connection.saveData;
    if (!FINE || REDUCED || saveData) return;
    const previews = new Map();
    const stop = (tile) => {
      const v = previews.get(tile);
      if (!v) return;
      v.pause();
      v.remove();
      previews.delete(tile);
    };
    const start = (tile) => {
      const id = tile.dataset.video;
      if (!id || previews.has(tile)) return;
      const v = document.createElement('video');
      v.className = 'pre';
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.setAttribute('aria-hidden', 'true');
      v.src = 'videos/' + id + '.mp4';
      v.addEventListener('playing', () => v.classList.add('on'), { once: true });
      v.addEventListener('error', () => stop(tile), { once: true });
      previews.set(tile, v);
      tile.querySelector('.th').appendChild(v);
      v.play().catch(() => stop(tile));
    };
    tiles
      .filter((t) => t.dataset.video)
      .forEach((tile) => {
        tile.addEventListener('pointerenter', () => start(tile));
        tile.addEventListener('pointerleave', () => stop(tile));
        tile.addEventListener('focusin', () => start(tile));
        tile.addEventListener('focusout', () => stop(tile));
      });
  }

  /* ── cards: tiles near the mouse drift toward it and an accent glow follows (mouse only) ──
     Pointer events only record a position; the work happens once per frame: read all rects, then write. */
  const REACH = 48; // px from a card's edge before it reacts
  const DRIFT = 10; // max drift in px
  const desktopMouse = matchMedia('(min-width:900px) and (hover:hover)');
  const cards = { tiles: [], active: new Set(), x: 0, y: 0, dirty: false };

  function releaseCard(tile) {
    cards.active.delete(tile);
    tile.style.removeProperty('--tx');
    tile.style.removeProperty('--ty');
  }

  function initCards() {
    cards.tiles = $$('.tile', $('#grid'));
    if (!FINE || REDUCED) return;
    document.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse' || !desktopMouse.matches) return;
        cards.x = e.clientX;
        cards.y = e.clientY;
        cards.dirty = true;
        wake();
      },
      { passive: true },
    );
    root.addEventListener('mouseleave', () => {
      cards.dirty = false;
      cards.tiles.forEach(releaseCard);
    });
  }

  function stepCards() {
    if (!cards.dirty || viewportOff() || $('#panel').classList.contains('open')) return null;
    cards.dirty = false;
    const rects = cards.tiles.map((t) => (t.hidden ? null : t.getBoundingClientRect())); // read…
    cards.tiles.forEach((tile, i) => {
      // …then write
      const r = rects[i];
      if (!r) {
        if (cards.active.has(tile)) releaseCard(tile);
        return;
      }
      const gapX = Math.max(r.left - cards.x, 0, cards.x - r.right);
      const gapY = Math.max(r.top - cards.y, 0, cards.y - r.bottom);
      const distance = Math.hypot(gapX, gapY);
      if (distance > REACH) {
        if (cards.active.has(tile)) releaseCard(tile);
        return;
      }
      const strength = 1 - distance / REACH;
      const dx = clamp((cards.x - r.left - r.width / 2) / (r.width / 2), -1, 1);
      const dy = clamp((cards.y - r.top - r.height / 2) / (r.height / 2), -1, 1);
      cards.active.add(tile);
      tile.style.setProperty('--tx', (dx * DRIFT * strength).toFixed(1) + 'px');
      tile.style.setProperty('--ty', (dy * DRIFT * strength).toFixed(1) + 'px');
      tile.style.setProperty('--mx', cards.x - r.left - 1 + 'px'); // glow centre, inside the 1px border
      tile.style.setProperty('--my', cards.y - r.top - 1 + 'px');
    });
    return { active: false };
  }

  /* ── viewport shading (Blender-style easter egg) ──
     Toolbar in the header + hold Z (or Ctrl/Cmd+Z) for a pie menu: ← Wireframe  → Solid  ↓ Material  ↑ Rendered.
     Any mode except "Rendered", or paused, switches the page's motion off (html.vp-off). */
  const SHADING = [
    { key: 'wire', name: 'Wireframe', hotkey: 4, slot: 'W' },
    { key: 'solid', name: 'Solid', hotkey: 6, slot: 'E' },
    { key: 'mat', name: 'Material Preview', hotkey: 2, slot: 'S' },
    { key: 'ren', name: 'Rendered', hotkey: 8, slot: 'N' },
  ];
  const HOTKEYS = {
    4: 'wire',
    6: 'solid',
    2: 'mat',
    8: 'ren',
    ArrowLeft: 'wire',
    ArrowRight: 'solid',
    ArrowDown: 'mat',
    ArrowUp: 'ren',
  };
  const svgIcon = (body) => '<svg viewBox="0 0 16 16" aria-hidden="true">' + body + '</svg>';
  const SHADING_ICONS = {
    wire: svgIcon('<circle cx="8" cy="8" r="6"/><ellipse cx="8" cy="8" rx="2.6" ry="6"/><path d="M2 8h12"/>'),
    solid: svgIcon('<circle cx="8" cy="8" r="6" fill="currentColor"/>'),
    mat: svgIcon('<circle cx="8" cy="8" r="6"/><path d="M8 2a6 6 0 0 0 0 12z" fill="currentColor"/>'),
    ren: svgIcon('<circle cx="8" cy="8" r="6"/><circle cx="6" cy="6" r="2" fill="currentColor"/>'),
  };
  const PIE_HOLD_MS = 220; // holding Z longer than this and releasing picks the highlighted entry
  const PIE_DEAD_ZONE = 28;

  let shadingMode = 'ren';
  let shadingPaused = false;
  /** True when the page should be still: any non-rendered mode, or paused. */
  function viewportOff() {
    return shadingMode !== 'ren' || shadingPaused;
  }

  function initViewport() {
    const toolbar = document.createElement('div');
    toolbar.className = 'vpt';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Viewport shading');
    toolbar.innerHTML =
      SHADING.map(
        (m) =>
          '<button type="button" data-k="' +
          m.key +
          '" title="' +
          m.name +
          ' (Z)" aria-label="' +
          m.name +
          '">' +
          SHADING_ICONS[m.key] +
          '</button>',
      ).join('') + '<button type="button" class="vpz" title="Pause motion" aria-label="Pause motion">||</button>';
    $('.nav').appendChild(toolbar);

    const hint = document.createElement('div'); // "User Perspective / … shading" text outside Rendered
    hint.className = 'vph mono';
    document.body.appendChild(hint);

    const pie = document.createElement('div');
    pie.id = 'vpie';
    pie.hidden = true;
    pie.setAttribute('role', 'menu');
    pie.innerHTML =
      '<div class="pc">' +
      SHADING.map(
        (m) =>
          '<button type="button" role="menuitem" class="pi ' +
          m.slot +
          '" data-k="' +
          m.key +
          '">' +
          SHADING_ICONS[m.key] +
          '<span>' +
          m.name +
          '</span><em>' +
          m.hotkey +
          '</em></button>',
      ).join('') +
      '<div class="pd"><b>Shading</b><i></i></div></div>';
    document.body.appendChild(pie);
    const pieCentre = pie.firstElementChild;

    let menuOpen = false;
    let selected = null;
    let openedAt = 0;
    let px = innerWidth / 2;
    let py = innerHeight / 2;
    let cx = 0;
    let cy = 0;

    function apply() {
      root.dataset.vp = shadingMode;
      root.classList.toggle('vp-off', viewportOff());
      if (viewportOff()) {
        $$('video').forEach((v) => v.pause());
        if (shadingMode !== 'ren') {
          const skip = $('#skip');
          if (skip) skip.click();
        } // finish the intro sequence at once
      }
      const current = SHADING.find((m) => m.key === shadingMode);
      $$('[data-k]', toolbar).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === shadingMode)));
      toolbar.querySelector('.vpz').setAttribute('aria-pressed', String(shadingPaused));
      $$('.pi', pie).forEach((b) => b.toggleAttribute('aria-current', b.dataset.k === shadingMode));
      hint.innerHTML = 'User Perspective<br>(1) Collection | Portfolio<br><b>' + current.name + ' shading</b>';
      const live = $('#live');
      if (live) live.textContent = current.name + ' viewport shading';
    }
    const setMode = (m) => {
      shadingMode = m;
      apply();
      wake();
    };

    toolbar.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      if (button.classList.contains('vpz')) {
        shadingPaused = !shadingPaused;
        apply();
      } else setMode(button.dataset.k);
    });

    const pick = (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      if (Math.hypot(dx, dy) < PIE_DEAD_ZONE) return null;
      return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'wire' : 'solid') : dy < 0 ? 'ren' : 'mat';
    };
    const highlight = () => {
      selected = pick(px, py);
      $$('.pi', pie).forEach((b) => b.classList.toggle('hv', b.dataset.k === selected));
    };
    const openMenu = () => {
      if (menuOpen) return;
      menuOpen = true;
      openedAt = Date.now();
      cx = clamp(px, 150, innerWidth - 150); // keep the whole menu on screen
      cy = clamp(py, 110, innerHeight - 110);
      pieCentre.style.left = cx + 'px';
      pieCentre.style.top = cy + 'px';
      pie.hidden = false;
      highlight();
    };
    const closeMenu = (choose) => {
      if (!menuOpen) return;
      menuOpen = false;
      pie.hidden = true;
      if (choose) setMode(choose);
    };

    /* Pointer tracking runs in the CAPTURE phase on window, ahead of every other listener. While the page is
       "off" (or the menu is open) it also stops the event, so the cursor, magnetic controls, heading morph and
       card drift receive nothing and the page goes still. */
    ['pointermove', 'mousemove'].forEach((type) => {
      addEventListener(
        type,
        (e) => {
          px = e.clientX;
          py = e.clientY;
          if (menuOpen) highlight();
          if (viewportOff() || menuOpen) e.stopImmediatePropagation();
        },
        true,
      );
    });
    pie.addEventListener('click', (e) => {
      const item = e.target.closest('.pi');
      closeMenu(item ? item.dataset.k : selected);
    });
    pie.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      closeMenu();
    });
    addEventListener(
      'keydown',
      (e) => {
        const t = e.target;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
        if (menuOpen) {
          if (e.key === 'Escape') {
            closeMenu();
            e.preventDefault();
          } else if (HOTKEYS[e.key]) {
            closeMenu(HOTKEYS[e.key]);
            e.preventDefault();
          }
          return;
        }
        if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          if (!e.repeat) openMenu();
        }
      },
      true,
    );
    addEventListener(
      'keyup',
      (e) => {
        if (menuOpen && ['z', 'Z', 'Control', 'Meta'].indexOf(e.key) !== -1 && Date.now() - openedAt > PIE_HOLD_MS)
          closeMenu(selected);
      },
      true,
    );
    addEventListener('blur', () => closeMenu());
    apply();
  }

  /* ── performance HUD ──
     Shift+D, five quick taps on the logo, or ?debug=1. Frame times, JS and forced-layout cost per frame,
     Core Web Vitals (web-vitals is fetched from a CDN only when the HUD opens) and a 6-second pointer sweep. */
  const hud = {
    on: false,
    dt: [],
    js: [],
    lay: [],
    writes: [],
    last: 0,
    vitals: {},
    sweep: null,
    result: null,
    out: null,
  };
  const HUD_CAP = 300;
  const pushCapped = (arr, v) => {
    arr.push(v);
    if (arr.length > HUD_CAP) arr.shift();
  };
  const percentile = (arr, q) => {
    if (!arr.length) return 0;
    const s = arr.slice().sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(q * s.length))];
  };
  const mean = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
  const f1 = (n) => n.toFixed(1);

  function hudReport(short) {
    const v = hud.vitals;
    const r = hud.result;
    const letters = headings.reduce((n, h) => n + h.letters.length, 0);
    const lines = [
      'engine ' +
        (ENGINE_B ? 'B' : 'A') +
        ' (B active on ' +
        headings.filter((h) => h.engineB && h.table).length +
        ' headings) | letters ' +
        letters +
        ' | motion ' +
        (REDUCED ? 'calm' : 'full'),
      'fps ' +
        f1(1000 / (mean(hud.dt) || 16.7)) +
        ' | frame ms p50 ' +
        f1(percentile(hud.dt, 0.5)) +
        ' p95 ' +
        f1(percentile(hud.dt, 0.95)) +
        ' max ' +
        f1(Math.max.apply(null, [0].concat(hud.dt))),
      'js ms avg ' +
        f1(mean(hud.js)) +
        ' | style+layout ms (forced) avg ' +
        f1(mean(hud.lay)) +
        ' p95 ' +
        f1(percentile(hud.lay, 0.95)) +
        ' | letters written/frame ' +
        f1(mean(hud.writes)),
      'LCP ' +
        (v.lcp ? Math.round(v.lcp) : '-') +
        ' ms | CLS ' +
        (v.cls != null ? v.cls.toFixed(3) : '-') +
        ' | INP ' +
        (v.inp ? Math.round(v.inp) : '-') +
        ' ms' +
        (v.err ? ' (web-vitals failed to load)' : ''),
    ];
    if (hud.sweep) lines.push('sweep running...');
    if (r)
      lines.push(
        'SWEEP 6s: frames ' +
          r.n +
          ' p50 ' +
          f1(r.p50) +
          ' p95 ' +
          f1(r.p95) +
          ' p99 ' +
          f1(r.p99) +
          ' max ' +
          f1(r.max) +
          ' | >18ms: ' +
          r.over18 +
          ' >33ms: ' +
          r.over33 +
          ' | js ' +
          f1(r.js) +
          ' layout avg ' +
          f1(r.layAvg) +
          ' p95 ' +
          f1(r.layP95),
      );
    if (!short)
      lines.push(
        'route ' +
          location.hash +
          ' | viewport ' +
          innerWidth +
          'x' +
          innerHeight +
          ' dpr ' +
          devicePixelRatio +
          ' | ' +
          navigator.userAgent,
      );
    return lines.join('\n');
  }

  function hudSweepStep(now) {
    const sw = hud.sweep;
    const t = (now - sw.t0) / 1000;
    if (t > 6) {
      hud.result = {
        n: sw.dt.length,
        p50: percentile(sw.dt, 0.5),
        p95: percentile(sw.dt, 0.95),
        p99: percentile(sw.dt, 0.99),
        max: Math.max.apply(null, [0].concat(sw.dt)),
        over18: sw.dt.filter((x) => x > 18).length,
        over33: sw.dt.filter((x) => x > 33).length,
        js: mean(sw.js),
        layAvg: mean(sw.lay),
        layP95: percentile(sw.lay, 0.95),
      };
      hud.sweep = null;
      return;
    }
    const hero = $('#heroName');
    const r = hero ? hero.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    pointer.on = true; // drive the pointer along a Lissajous path over the hero
    pointer.x = r.left + r.width * (0.08 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1)));
    pointer.y = r.top + r.height * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + 1)));
  }

  function openHud() {
    if (hud.on) return;
    hud.on = true;
    const el = document.createElement('div');
    el.id = 'hud';
    el.innerHTML =
      '<pre></pre><button type="button" data-a="a">Engine A</button><button type="button" data-a="b">Engine B</button>' +
      '<button type="button" data-a="sweep">Sweep 6s</button><button type="button" data-a="reset">Reset</button>' +
      '<button type="button" data-a="copy">Copy report</button><button type="button" data-a="motion">Motion</button>';
    document.body.appendChild(el);
    hud.out = $('pre', el);

    el.addEventListener('click', (e) => {
      const button = e.target;
      const action = button.dataset && button.dataset.a;
      if (!action) return;
      if (action === 'a' || action === 'b') {
        store.set('pf_engine', action);
        location.reload();
      } else if (action === 'motion') {
        store.set('pf_motion', FORCE_FULL ? 'os' : 'full');
        location.reload();
      } else if (action === 'sweep') {
        scrollTo(0, 0);
        hud.sweep = { t0: performance.now(), dt: [], js: [], lay: [] };
        hud.result = null;
        wake();
      } else if (action === 'reset') {
        hud.dt = [];
        hud.js = [];
        hud.lay = [];
        hud.writes = [];
        hud.result = null;
      } else if (action === 'copy') {
        navigator.clipboard.writeText(hudReport(false)).then(
          () => {
            button.textContent = 'Copied';
          },
          () => {
            button.textContent = 'Copy failed';
          },
        );
      }
    });

    probe.keepAlive = true; // frame stats need a running loop
    probe.before = (now) => {
      if (hud.last) {
        const dt = now - hud.last;
        pushCapped(hud.dt, dt);
        if (hud.sweep) hud.sweep.dt.push(dt);
      }
      hud.last = now;
      if (hud.sweep) hudSweepStep(performance.now());
    };
    probe.after = (startedAt, writes) => {
      const js = performance.now() - startedAt;
      const t = performance.now();
      void root.offsetWidth; // force style + layout so its cost can be timed
      const layout = performance.now() - t;
      pushCapped(hud.js, js);
      pushCapped(hud.lay, layout);
      pushCapped(hud.writes, writes);
      if (hud.sweep) {
        hud.sweep.js.push(js);
        hud.sweep.lay.push(layout);
      }
    };
    wake();

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/web-vitals@4.2.4/dist/web-vitals.iife.js';
    script.onload = () => {
      const wv = window.webVitals;
      if (!wv) return;
      wv.onLCP(
        (m) => {
          hud.vitals.lcp = m.value;
        },
        { reportAllChanges: true },
      );
      wv.onCLS(
        (m) => {
          hud.vitals.cls = m.value;
        },
        { reportAllChanges: true },
      );
      wv.onINP(
        (m) => {
          hud.vitals.inp = m.value;
        },
        { reportAllChanges: true },
      );
    };
    script.onerror = () => {
      hud.vitals.err = true;
    };
    document.head.appendChild(script);
    setInterval(() => {
      hud.out.textContent = hudReport(true);
    }, 500);
  }

  function initHudTriggers() {
    addEventListener('keydown', (e) => {
      if (e.shiftKey && e.key === 'D') openHud();
    });
    let taps = 0;
    let last = 0;
    $('.nav a').addEventListener('click', () => {
      const now = performance.now();
      taps = now - last < 1500 ? taps + 1 : 1;
      last = now;
      if (taps >= 5) {
        taps = 0;
        openHud();
      }
    });
    if (DEBUG) openHud();
  }

  /* ════════════════════════════════════════════════════════════════════════════
     6. PROJECT PANEL  —  projects and the privacy page open in a panel on the same page.
     The home page stays mounted underneath (scroll position kept). The URL is #work/<slug> or #privacy,
     so Back closes the panel and a link opens it directly.
     ════════════════════════════════════════════════════════════════════════════ */
  const panelState = {
    open: false,
    key: '',
    lastFocus: null,
    cleanups: [],
    hideTimer: 0,
    baseTitle: '',
    baseDescription: '',
  };

  function parseHash(hash) {
    const project = /^#work\/([a-z0-9-]+)\/?$/.exec(hash);
    if (project) return { name: 'project', slug: project[1] };
    if (hash === '#privacy') return { name: 'privacy' };
    return null;
  }

  /** Videos in the panel play while they are on screen and pause when they leave. */
  function initProjectVideos(scope) {
    const videos = $$('.pv', scope);
    if (!videos.length || REDUCED) return () => {};
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.play().catch(() => {});
          else entry.target.pause();
        });
      },
      { threshold: 0.4 },
    );
    videos.forEach((v) => io.observe(v));
    return () => {
      io.disconnect();
      videos.forEach((v) => v.pause());
    };
  }

  function mountPanelContent(body, panel) {
    initHeadings(body);
    initMedia(body);
    panelState.cleanups.push(initProjectVideos(body), initScrollMotion(body, panel));
    if (FINE) refreshMagnets();
  }
  function unmountPanelContent(body) {
    panelState.cleanups.forEach((fn) => fn());
    panelState.cleanups = [];
    disposeHeadings(body);
  }

  function setPageMeta(title, description) {
    document.title = title;
    const meta = $('meta[name=description]');
    if (meta) meta.setAttribute('content', description);
  }

  function openPanel(target, instant) {
    const panel = $('#panel');
    const body = $('.panel-body', panel);
    const work = target.name === 'project' ? findWork(target.slug) : null;
    const key = target.name + (target.slug || '');
    if (panelState.open && panelState.key === key) return;

    let html;
    let title;
    let description = SITE.positioning;
    if (target.name === 'project' && work) {
      html = renderProject(work.slug);
      title = work.title + ' — ' + SITE.name + ' / ' + SITE.role;
      description = work.description;
    } else if (target.name === 'privacy') {
      html = renderPrivacy();
      title = 'Privacy — ' + SITE.name + ' / ' + SITE.role;
    } else {
      html = renderNotFound();
      title = 'Not found — ' + SITE.name;
    }

    clearTimeout(panelState.hideTimer);
    const wasOpen = panelState.open;
    if (!wasOpen) panelState.lastFocus = document.activeElement;
    unmountPanelContent(body);
    body.innerHTML = html;
    panel.scrollTop = 0;
    mountPanelContent(body, panel);
    setPageMeta(title, description);

    if (!wasOpen) {
      if (instant) panel.classList.add('instant'); // deep link: appear without sliding
      panel.classList.add('open');
      panel.removeAttribute('inert');
      panel.setAttribute('aria-hidden', 'false');
      root.classList.add('panel-open');
      $('#top').inert = true;
      $('.foot').inert = true;
      const x = $('#panelX');
      x.setAttribute('aria-hidden', 'false');
      x.tabIndex = 0;
      x.classList.add('show');
      if (instant) requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove('instant')));
    }
    panelState.open = true;
    panelState.key = key;
    panel.focus({ preventScroll: true });
    $('#live').textContent = title;
    wake();
  }

  function closePanel() {
    if (!panelState.open) return;
    const panel = $('#panel');
    const body = $('.panel-body', panel);
    panelState.open = false;
    panelState.key = '';
    panel.classList.remove('open');
    panel.setAttribute('inert', '');
    panel.setAttribute('aria-hidden', 'true');
    root.classList.remove('panel-open');
    $('#top').inert = false;
    $('.foot').inert = false;
    const x = $('#panelX');
    x.setAttribute('aria-hidden', 'true');
    x.tabIndex = -1;
    x.classList.remove('show');
    setPageMeta(panelState.baseTitle, panelState.baseDescription);
    const back = panelState.lastFocus;
    if (back && document.contains(back) && back.focus) back.focus({ preventScroll: true });
    // empty the panel once it has slid away (players stop, observers go)
    panelState.hideTimer = setTimeout(() => {
      unmountPanelContent(body);
      body.innerHTML = '';
      if (FINE) refreshMagnets();
    }, 600);
    if (FINE) refreshMagnets();
    wake();
  }

  function scrollToSection(hash) {
    let el = null;
    try {
      el = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    } catch (e) {
      /* malformed hash */
    }
    if (el) el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  }

  /** Make the page match a hash. `initial`: first load (no slide, no scrolling). */
  function route(hash, initial) {
    const target = parseHash(hash);
    if (target) {
      openPanel(target, initial);
      return;
    }
    const wasOpen = panelState.open;
    closePanel();
    if (wasOpen && !initial) scrollToSection(hash); // e.g. a nav link clicked while a project is open
  }

  /** Change the hash (and history) from inside the page. replace: swap the current entry instead of adding one. */
  function go(hash, replace) {
    try {
      history[replace ? 'replaceState' : 'pushState']({ panel: 1 }, '', hash);
    } catch (e) {
      try {
        location.hash = hash;
        return;
      } catch (err) {
        /* history unavailable: fall through and just route */
      }
    }
    route(hash, false);
  }

  /** Close from the UI: step back if we pushed the entry, otherwise just drop the hash. */
  function closeFromUi() {
    if (history.state && history.state.panel) {
      history.back();
      return;
    }
    try {
      history.replaceState(null, '', location.pathname + location.search);
    } catch (e) {
      /* ignore */
    }
    route('', false);
  }

  function initPanel() {
    panelState.baseTitle = document.title;
    const meta = $('meta[name=description]');
    panelState.baseDescription = meta ? meta.getAttribute('content') : '';
    try {
      history.scrollRestoration = 'manual';
    } catch (e) {
      /* older browsers */
    }

    const panel = $('#panel');
    panel.addEventListener('scroll', wake, { passive: true });

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = e.target;
      const open = t.closest('a[data-panel]');
      if (open) {
        e.preventDefault();
        go(open.getAttribute('href'), false);
        return;
      }
      const swap = t.closest('a[data-swap]');
      if (swap) {
        e.preventDefault();
        go(swap.getAttribute('href'), true);
        return;
      }
      if (t.closest('[data-close]') || t.closest('#panelX')) {
        e.preventDefault();
        closeFromUi();
      }
    });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelState.open && !e.defaultPrevented) closeFromUi();
    });
    addEventListener('popstate', () => route(location.hash, false));
    addEventListener('hashchange', () => route(location.hash, false));
  }

  /* ════════════════════════════════════════════════════════════════════════════
     7. SCROLL MOTION  —  blocks marked data-sa slide in from below as they enter the screen, and slide up and
     out as they pass the top. Scrolling back up plays it in reverse. Only transform + opacity, driven by an
     IntersectionObserver (no scroll handler, no loop). Reduced motion: everything simply stays visible.
     ════════════════════════════════════════════════════════════════════════════ */
  function initScrollMotion(scope, scroller) {
    const items = $$('[data-sa]', scope);
    if (!items.length) return () => {};
    if (REDUCED) {
      items.forEach((el) => el.classList.add('sa-in'));
      return () => {};
    }

    const set = (el, state, order) => {
      if (el.dataset.saState === state) return;
      el.dataset.saState = state;
      el.classList.remove('sa-in', 'sa-above', 'sa-below');
      el.classList.add(state);
      // blocks entering together cascade a little (max 5 steps of 50 ms)
      el.style.transitionDelay = state === 'sa-in' ? Math.min(order, 5) * 50 + 'ms' : '0ms';
    };
    const io = new IntersectionObserver(
      (entries) => {
        let order = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            set(entry.target, 'sa-in', order++);
            return;
          }
          const rootTop = entry.rootBounds ? entry.rootBounds.top : 0;
          set(entry.target, entry.boundingClientRect.top < rootTop ? 'sa-above' : 'sa-below', 0);
        });
      },
      { root: scroller || null, rootMargin: '-3% 0px -3% 0px', threshold: 0 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }

  /* ════════════════════════════════════════════════════════════════════════════
     8. START
     ════════════════════════════════════════════════════════════════════════════ */
  function start() {
    if (FORCE_FULL) root.classList.add('mfull');
    initTheme();
    initViewport();
    if (FINE) {
      initPointer();
      initCursor();
      bindMagnetRefresh();
      bindHeadingMeasure();
      tasks.push(updateCursor, stepMagnets, stepCards, stepHeadings);
    }
    initGlobalUi();
    initHudTriggers();

    const main = $('#top');
    initHeadings(main);
    initWorks();
    initCards();
    initMedia(main);
    initScrollMotion(main, null);
    updateClock();
    initPanel();
    if (FINE) refreshMagnets();

    // a link to a project (#work/…) opens it straight away; otherwise play the hero sequence
    if (parseHash(location.hash)) {
      snapHero();
      route(location.hash, true);
    } else {
      heroIntro();
      if (location.hash.length > 1) scrollToSection(location.hash);
    }
    wake();
  }

  function render() {
    document.body.insertAdjacentHTML(
      'beforeend',
      renderShellTop() + '<main id="top" tabindex="-1">' + renderHome() + '</main>' + renderShellBottom(),
    );
  }

  function boot() {
    render();
    runIntro().then(start);
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', boot);
  else boot();
})();
