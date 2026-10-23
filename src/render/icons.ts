const icon = (path: string) =>
  `<svg class="ico" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`;

/** Arrow pointing up-right (external / outbound link). */
export const ARROW_OUT = icon('M3 9 9 3M4 3h5v5');
/** Arrow pointing left (back). */
export const ARROW_BACK = icon('M10 6H2M5.5 2.5 2 6l3.5 3.5');
