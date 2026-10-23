/**
 * Runs inline in <head>, before first paint (the build inlines the compiled output — see
 * tools/prerender.ts). It exists only to avoid a flash of the wrong theme and to make sure
 * the page never stays covered if the main bundle fails to load.
 *
 * Keep it tiny and dependency-light: everything here blocks rendering.
 */
import { MODE_KEY, SCHEMES, SCHEME_KEY, THEME_COLOR, isMode, type Mode } from './config/schemes';

const root = document.documentElement;

let saved: unknown = null;
let schemeIndex = 0;
try {
  saved = localStorage.getItem(MODE_KEY);
  schemeIndex = Number(localStorage.getItem(SCHEME_KEY)) || 0;
} catch {
  /* storage blocked — fall back to the system preference */
}

const mode: Mode = isMode(saved)
  ? saved
  : matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
const schemes = SCHEMES[mode];

root.dataset.theme = mode;
root.style.setProperty('--acc', (schemes[schemeIndex % schemes.length] ?? schemes[0]!).accent);
document.querySelector('meta[name=theme-color]')?.setAttribute('content', THEME_COLOR[mode]);

// `js`: content that is revealed by script is only hidden when script is running.
// `pre`: the intro curtain is up (page scroll locked).
root.classList.add('js', 'pre');

// Failsafe: if the main bundle never starts the intro (network error, blocked script), lift the curtain.
setTimeout(() => {
  if (!root.classList.contains('pre')) return;
  document.getElementById('pre')?.classList.add('out');
  root.classList.remove('pre');
}, 9000);
