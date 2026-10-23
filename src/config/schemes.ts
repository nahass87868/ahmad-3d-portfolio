/**
 * Colour modes and accent schemes. Shared by the pre-paint boot script and the theme switcher,
 * so it must stay free of DOM access and heavy imports.
 */

export type Mode = 'dark' | 'light';

export interface Scheme {
  name: string;
  accent: string;
}

export const SCHEMES: Record<Mode, readonly Scheme[]> = {
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

/**
 * Browser-chrome colour (status bar / address bar) — must equal `--bg` in `styles/tokens.css`
 * so the chrome blends into the page instead of showing a different black/white band.
 */
export const THEME_COLOR: Record<Mode, string> = {
  dark: '#0C0C0B',
  light: '#F1EEE8',
};

export const MODE_KEY = 'mode';
export const SCHEME_KEY = 'scheme';

export const isMode = (v: unknown): v is Mode => v === 'dark' || v === 'light';
