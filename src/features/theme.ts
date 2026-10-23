import { MODE_KEY, SCHEMES, SCHEME_KEY, THEME_COLOR, isMode, type Mode } from '../config/schemes';
import { must } from '../core/dom';
import { storage } from '../core/env';

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

/** Colour mode (dark/light) + accent scheme. Persisted; applied before paint by boot.ts, owned here afterwards. */
export function initTheme(): void {
  const root = document.documentElement;
  const saved = storage.get(MODE_KEY);

  let mode: Mode = isMode(saved)
    ? saved
    : matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  let index = Number(storage.get(SCHEME_KEY)) || 0;

  const apply = (announce: boolean) => {
    const list = SCHEMES[mode];
    index %= list.length;
    const scheme = list[index]!;
    const other: Mode = mode === 'dark' ? 'light' : 'dark';

    root.dataset.theme = mode;
    root.style.setProperty('--acc', scheme.accent);

    must('#swName').textContent = scheme.name;
    must('#mdName').textContent = cap(mode);
    must('#sw').setAttribute('aria-label', `${scheme.name} colour scheme. Switch to next scheme`);
    must('#md').setAttribute('aria-label', `${cap(mode)} mode. Switch to ${other} mode`);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', THEME_COLOR[mode]);
    if (announce) must('#live').textContent = `${cap(mode)} mode, ${scheme.name} scheme`;

    storage.set(MODE_KEY, mode);
    storage.set(SCHEME_KEY, String(index));
  };

  must('#sw').addEventListener('click', () => {
    index = (index + 1) % SCHEMES[mode].length;
    apply(true);
  });
  must('#md').addEventListener('click', () => {
    mode = mode === 'dark' ? 'light' : 'dark';
    apply(true);
  });

  apply(false);
}
