export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);

export const qsa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

/** `qs` for elements the page shell guarantees; throws a readable error instead of a null deref. */
export function must<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(sel);
  if (!el) throw new Error(`Expected element "${sel}" in the page shell`);
  return el;
}

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Smoothstep on 0–1. */
export const smooth = (t: number) => t * t * (3 - 2 * t);

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
