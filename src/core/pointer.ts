/** Shared pointer state, updated by window-level listeners (see `initPointer`). */
export const pointer = {
  x: innerWidth / 2,
  y: innerHeight / 2,
  /** True while a pointer is moving over the page (mouse) or touching it (touch/pen). */
  on: false,
};

export function initPointer(): void {
  addEventListener('pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.on = true;
  });
  addEventListener('pointerdown', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.on = true;
  });
  addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') pointer.on = false;
  });
}
