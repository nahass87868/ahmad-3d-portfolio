import { esc } from '../core/escape';
import { FULL_WIDTHS, THUMB_WIDTHS, images, videos } from '../media/manifest';
import type { VideoFormat } from '../media/types';

/** Join the site base ("/" or "/sub/") with a path, tolerating a leading slash on the path. */
export const resolveUrl = (base: string, path: string): string => base + path.replace(/^\//, '');

export type ImageKind = 'thumb' | 'full';

export interface PictureOptions {
  base: string;
  /** Id from `src/media/manifest.ts`. */
  id: string;
  alt?: string;
  sizes?: string;
  kind?: ImageKind;
  cls?: string;
  /** Above-the-fold image: eager + high fetch priority. */
  eager?: boolean;
}

/** Grid thumbnails are cropped 4:5 by CSS; the intrinsic size we declare matches that. */
const THUMB_ASPECT = 1.25;

export function picture(o: PictureOptions): string {
  const asset = images[o.id];
  if (!asset) throw new Error(`Unknown image id "${o.id}" — add it to src/media/manifest.ts`);

  const kind = o.kind ?? 'full';
  const widths = kind === 'thumb' ? THUMB_WIDTHS : FULL_WIDTHS;
  const file = (w: number) => resolveUrl(o.base, `media/images/${o.id}-${w}.webp`);
  const largest = widths[widths.length - 1] as number;

  const srcset = widths.map((w) => `${file(w)} ${w}w`).join(', ');
  const dims =
    kind === 'thumb'
      ? `width="${largest}" height="${Math.round(largest * THUMB_ASPECT)}"`
      : `width="${asset.w}" height="${asset.h}"`;
  const loading = o.eager
    ? 'loading="eager" decoding="async" fetchpriority="high"'
    : 'loading="lazy" decoding="async"';

  return (
    `<picture><source type="image/webp" srcset="${srcset}" sizes="${o.sizes ?? '100vw'}">` +
    `<img class="${o.cls ?? ''}" src="${file(largest)}" ${dims} alt="${esc(o.alt ?? '')}" ${loading}></picture>`
  );
}

export interface VideoSource {
  url: string;
  type: 'video/mp4' | 'video/webm';
}

export interface ResolvedVideo {
  poster: string;
  w: number;
  h: number;
  /** Sources for the project page player, best format first. */
  full: VideoSource[];
  /** Sources for the grid hover preview. Falls back to `full` when no dedicated preview exists. */
  preview: VideoSource[];
}

const MIME: Record<VideoFormat, VideoSource['type']> = { webm: 'video/webm', mp4: 'video/mp4' };
const PREFERENCE: VideoFormat[] = ['webm', 'mp4'];

const sources = (base: string, id: string, suffix: string, formats: VideoFormat[]): VideoSource[] =>
  PREFERENCE.filter((f) => formats.includes(f)).map((f) => ({
    url: resolveUrl(base, `media/videos/${id}${suffix}.${f}`),
    type: MIME[f],
  }));

export function resolveVideo(base: string, id: string): ResolvedVideo {
  const v = videos[id];
  if (!v) throw new Error(`Unknown video id "${id}" — add it to src/media/manifest.ts`);
  const full = sources(base, id, '', v.full);
  const preview = sources(base, id, '.preview', v.preview);
  return {
    poster: resolveUrl(base, `media/posters/${id}.webp`),
    w: v.w,
    h: v.h,
    full,
    preview: preview.length ? preview : full,
  };
}
