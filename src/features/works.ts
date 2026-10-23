import { MOTION } from '../config/motion';
import { qs, qsa } from '../core/dom';
import { BASE } from '../core/base';
import { finePointer, reduced } from '../core/env';
import { resolveVideo, type VideoSource } from '../render/media';
import { layoutBento } from './cards';

/**
 * The works section: category filter chips + hover (mouse) / in-view (touch) video previews.
 * Returns a cleanup function for route changes.
 */
export function initWorks(root: ParentNode): () => void {
  const grid = qs('#grid', root);
  if (!grid) return () => {};

  const tiles = qsa('.tile', grid);
  const chips = qs('#chips', root);
  const count = qs('#count', root);

  layoutBento(tiles);

  // ── filter ──
  if (chips) {
    chips.hidden = false; // shipped hidden: without JS there is nothing to filter with
    chips.addEventListener('click', (e) => {
      const chip = (e.target as Element).closest<HTMLElement>('.chip');
      if (!chip) return;
      const category = chip.dataset.cat ?? '';

      let shown = 0;
      for (const tile of tiles) {
        const match = !category || tile.dataset.cat === category;
        tile.hidden = !match;
        if (match) shown++;
      }
      layoutBento(tiles); // re-pack the bento around what is left

      for (const c of qsa('.chip', chips))
        c.setAttribute('aria-pressed', String(c.dataset.cat === category));
      if (count)
        count.textContent =
          shown + (shown === 1 ? ' project' : ' projects') + (category ? ' in ' + category : '');
    });
  }

  // ── video previews ──
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    ?.saveData;
  const previews = new Map<HTMLElement, HTMLVideoElement>();

  const pickSource = (sources: VideoSource[]): VideoSource | undefined => {
    const probe = document.createElement('video');
    return (
      sources.find(
        (s) => s.type === 'video/webm' && probe.canPlayType('video/webm; codecs="vp9"'),
      ) ??
      sources.find((s) => s.type === 'video/mp4') ??
      sources[0]
    );
  };

  const stop = (tile: HTMLElement) => {
    const v = previews.get(tile);
    if (!v) return;
    v.pause();
    v.remove();
    previews.delete(tile);
  };

  const start = (tile: HTMLElement) => {
    const id = tile.dataset.video;
    if (!id || reduced || saveData || previews.has(tile)) return;
    const source = pickSource(resolveVideo(BASE, id).preview);
    if (!source) return; // no video file shipped for this project

    const video = document.createElement('video');
    video.className = 'pre';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.src = source.url;
    video.addEventListener('playing', () => video.classList.add('on'), { once: true });
    video.addEventListener('error', () => stop(tile), { once: true });
    previews.set(tile, video);
    tile.querySelector('.th')?.appendChild(video);
    video.play().catch(() => stop(tile));
  };

  const withVideo = tiles.filter((t) => t.dataset.video);
  let io: IntersectionObserver | null = null;

  if (finePointer) {
    for (const tile of withVideo) {
      tile.addEventListener('pointerenter', () => start(tile));
      tile.addEventListener('pointerleave', () => stop(tile));
      tile.addEventListener('focusin', () => start(tile));
      tile.addEventListener('focusout', () => stop(tile));
    }
  } else {
    // touch: play up to PREVIEW_MAX tiles that are mostly in view
    io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const tile = entry.target as HTMLElement;
          if (entry.intersectionRatio >= 0.6) {
            if (previews.size < MOTION.PREVIEW_MAX) start(tile);
          } else stop(tile);
        }
      },
      { threshold: [0, 0.6] },
    );
    withVideo.forEach((t) => io!.observe(t));
  }

  return () => {
    io?.disconnect();
    [...previews.keys()].forEach(stop);
  };
}

/** Project page: play the main video only while it is on screen. */
export function initProjectVideo(root: ParentNode): () => void {
  const video = qs<HTMLVideoElement>('.pv', root);
  if (!video || reduced) return () => {};
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      }
    },
    { threshold: 0.4 },
  );
  io.observe(video);
  return () => io.disconnect();
}
