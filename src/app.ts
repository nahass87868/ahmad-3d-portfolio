import { forceFullMotion } from './core/env';
import { initPointer } from './core/pointer';
import { startLoop } from './core/loop';
import { must } from './core/dom';
import { initCardPointer, stepCards } from './features/cards';
import { initCursor, updateCursor } from './features/cursor';
import { heroIntro, heroSnap, pageReady } from './features/hero';
import {
  bindHeadingMeasure,
  disposeHeadings,
  initHeadings,
  stepHeadings,
} from './features/headings';
import { initHudTriggers } from './features/hud-trigger';
import { bindMagnetRefresh, refreshMagnets, stepMagnets } from './features/magnetic';
import { initGlobalUi, initMissingImages, updateClock } from './features/page-ui';
import { initReveal } from './features/reveal';
import { initTheme } from './features/theme';
import { initViewport } from './features/viewport';
import { initProjectVideo, initWorks } from './features/works';
import { currentRoute, initRouter } from './router';
import type { Route } from './render/page';

let cleanups: Array<() => void> = [];

/** Attach behaviour to the freshly rendered (or prerendered) page inside <main>. */
function mount(route: Route, { first }: { first: boolean }): void {
  const main = must('#top');

  initHeadings(main);

  if (route.name === 'home') {
    cleanups.push(initWorks(main), initCardPointer(main));
    if (first) heroIntro();
    else heroSnap();
  } else {
    if (route.name === 'project') cleanups.push(initProjectVideo(main));
    pageReady();
  }

  initMissingImages(main);
  cleanups.push(initReveal(main));
  updateClock();
  refreshMagnets();
}

function unmount(): void {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  disposeHeadings();
}

/** Called once the intro curtain starts to lift. */
export function start(): void {
  if (forceFullMotion) document.documentElement.classList.add('mfull');

  initPointer();
  initViewport();
  initTheme();
  initCursor();
  bindHeadingMeasure();
  bindMagnetRefresh();
  initGlobalUi();
  initHudTriggers();

  initRouter({ mount, unmount });
  mount(currentRoute(), { first: true });

  startLoop((now) => {
    updateCursor();
    stepMagnets();
    stepCards();
    return stepHeadings(now);
  });
}
