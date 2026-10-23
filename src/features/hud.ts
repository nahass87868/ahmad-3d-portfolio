import { forceFullMotion, headingEngine, reduced, storage } from '../core/env';
import { probe } from '../core/loop';
import { pointer } from '../core/pointer';
import { must, qs } from '../core/dom';
import { headingStats } from './headings';

/**
 * Performance HUD: frame times, JS and forced-layout cost per frame, Core Web Vitals, and a 6-second
 * synthetic "sweep" of the pointer across the hero. Developer tool — lazy-loaded (see hud-trigger.ts).
 * Buttons: switch heading engine A/B (reloads), sweep, reset, copy report, toggle full motion.
 */

interface Window6 {
  dt: number[];
  js: number[];
  lay: number[];
}

interface SweepResult {
  n: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  over18: number;
  over33: number;
  js: number;
  layAvg: number;
  layP95: number;
}

const CAP = 300;
const push = (arr: number[], v: number) => {
  arr.push(v);
  if (arr.length > CAP) arr.shift();
};
const pct = (arr: number[], q: number) => {
  if (!arr.length) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
};
const mean = (arr: number[]) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);
const f1 = (n: number) => n.toFixed(1);

const state = {
  on: false,
  dt: [] as number[],
  js: [] as number[],
  lay: [] as number[],
  writes: [] as number[],
  last: 0,
  vitals: {} as { lcp?: number; cls?: number; inp?: number; err?: boolean },
  sweep: null as (Window6 & { t0: number }) | null,
  result: null as SweepResult | null,
  out: null as HTMLElement | null,
};

function summarise(w: Window6): SweepResult {
  return {
    n: w.dt.length,
    p50: pct(w.dt, 0.5),
    p95: pct(w.dt, 0.95),
    p99: pct(w.dt, 0.99),
    max: Math.max(0, ...w.dt),
    over18: w.dt.filter((t) => t > 18).length,
    over33: w.dt.filter((t) => t > 33).length,
    js: mean(w.js),
    layAvg: mean(w.lay),
    layP95: pct(w.lay, 0.95),
  };
}

/** Drive the pointer along a Lissajous path over the hero heading while the sweep runs. */
function driveSweep(now: number): void {
  const sweep = state.sweep!;
  const t = (now - sweep.t0) / 1000;
  if (t > 6) {
    state.result = summarise(sweep);
    state.sweep = null;
    return;
  }
  const hero = qs('#heroName');
  const r = hero
    ? hero.getBoundingClientRect()
    : { left: 0, top: 0, width: innerWidth, height: innerHeight };
  pointer.on = true;
  pointer.x = r.left + r.width * (0.08 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.1)));
  pointer.y = r.top + r.height * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.3 + 1)));
}

function report(short = false): string {
  const stats = headingStats();
  const v = state.vitals;
  const r = state.result;
  const lines = [
    `engine ${headingEngine.toUpperCase()} (B active on ${stats.engineB} headings) | letters ${stats.letters} | motion ${reduced ? 'calm' : 'full'}`,
    `fps ${f1(1000 / (mean(state.dt) || 16.7))} | frame ms p50 ${f1(pct(state.dt, 0.5))} p95 ${f1(pct(state.dt, 0.95))} max ${f1(Math.max(0, ...state.dt))}`,
    `js ms avg ${f1(mean(state.js))} | style+layout ms (forced) avg ${f1(mean(state.lay))} p95 ${f1(pct(state.lay, 0.95))} | letters written/frame ${f1(mean(state.writes))}`,
    `LCP ${v.lcp ? Math.round(v.lcp) : '-'} ms | CLS ${v.cls != null ? v.cls.toFixed(3) : '-'} | INP ${v.inp ? Math.round(v.inp) : '-'} ms${v.err ? ' (web-vitals failed to load)' : ''}`,
  ];
  if (state.sweep) lines.push('sweep running...');
  if (r) {
    lines.push(
      `SWEEP 6s: frames ${r.n} p50 ${f1(r.p50)} p95 ${f1(r.p95)} p99 ${f1(r.p99)} max ${f1(r.max)} | >18ms: ${r.over18} >33ms: ${r.over33} | js ${f1(r.js)} layout avg ${f1(r.layAvg)} p95 ${f1(r.layP95)}`,
    );
  }
  if (!short) {
    lines.push(
      `route ${location.pathname} | viewport ${innerWidth}x${innerHeight} dpr ${devicePixelRatio} | ${navigator.userAgent}`,
    );
  }
  return lines.join('\n');
}

export function openHud(): void {
  if (state.on) return;
  state.on = true;

  const hud = document.createElement('div');
  hud.id = 'hud';
  hud.innerHTML =
    '<pre></pre>' +
    '<button type="button" data-a="a">Engine A</button><button type="button" data-a="b">Engine B</button>' +
    '<button type="button" data-a="sweep">Sweep 6s</button><button type="button" data-a="reset">Reset</button>' +
    '<button type="button" data-a="copy">Copy report</button><button type="button" data-a="motion">Motion</button>';
  document.body.appendChild(hud);
  state.out = must<HTMLElement>('pre', hud);

  hud.addEventListener('click', (e) => {
    const button = e.target as HTMLElement;
    const action = button.dataset?.a;
    if (!action) return;

    if (action === 'a' || action === 'b') {
      storage.set('pf_engine', action);
      location.reload();
    } else if (action === 'motion') {
      storage.set('pf_motion', forceFullMotion ? 'os' : 'full');
      location.reload();
    } else if (action === 'sweep') {
      scrollTo(0, 0);
      state.sweep = { t0: performance.now(), dt: [], js: [], lay: [] };
      state.result = null;
    } else if (action === 'reset') {
      state.dt = [];
      state.js = [];
      state.lay = [];
      state.writes = [];
      state.result = null;
    } else if (action === 'copy') {
      navigator.clipboard.writeText(report()).then(
        () => (button.textContent = 'Copied'),
        () => (button.textContent = 'Copy failed'),
      );
    }
  });

  // frame hooks (see core/loop.ts)
  probe.before = (now) => {
    if (state.last) {
      const dt = now - state.last;
      push(state.dt, dt);
      state.sweep?.dt.push(dt);
    }
    state.last = now;
    if (state.sweep) driveSweep(performance.now());
  };
  probe.after = (startedAt, writes) => {
    const js = performance.now() - startedAt;
    const t = performance.now();
    void document.documentElement.offsetWidth; // force style + layout so we can time it
    const layout = performance.now() - t;
    push(state.js, js);
    push(state.lay, layout);
    push(state.writes, writes);
    if (state.sweep) {
      state.sweep.js.push(js);
      state.sweep.lay.push(layout);
    }
  };

  // Core Web Vitals, fetched only now
  import('web-vitals').then(
    ({ onLCP, onCLS, onINP }) => {
      onLCP((m) => (state.vitals.lcp = m.value), { reportAllChanges: true });
      onCLS((m) => (state.vitals.cls = m.value), { reportAllChanges: true });
      onINP((m) => (state.vitals.inp = m.value), { reportAllChanges: true });
    },
    () => (state.vitals.err = true),
  );

  setInterval(() => {
    if (state.out) state.out.textContent = report(true);
  }, 500);
}
