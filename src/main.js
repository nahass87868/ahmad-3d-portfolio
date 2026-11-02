/*
 * The modern layer. New features are written here as ES modules (three, GSAP, Lenis ... imported from npm) and loaded
 * lazily, so the existing site's first load does not grow.
 *
 * Phase 1: intentionally empty. It only proves that the build, the deploy and the module tag in index.html work end to end.
 * Open the browser console on the live site and type  __BUILD__  to see which build you are looking at.
 */
window.__BUILD__ = { tool: 'vite', phase: 1 };
