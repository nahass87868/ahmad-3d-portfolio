/**
 * The single requestAnimationFrame loop. Everything that animates per frame (cursor, magnetic
 * controls, card tilt, heading morph) is called from `run`, so there is one rAF callback and
 * all DOM reads/writes for a frame happen together.
 */
export interface FrameProbe {
  /** Called first each frame with the rAF timestamp (used by the HUD for frame times). */
  before?: (now: number) => void;
  /** Called last with the time the frame's work started and how many letters were written. */
  after?: (startedAt: number, writes: number) => void;
}

/** Filled in by the performance HUD when it is opened; empty (free) otherwise. */
export const probe: FrameProbe = {};

export function startLoop(run: (now: number) => number): void {
  const frame = (now: number) => {
    const startedAt = performance.now();
    probe.before?.(now);
    const writes = run(now);
    probe.after?.(startedAt, writes);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
