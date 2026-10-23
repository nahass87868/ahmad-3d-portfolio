import type { ImageAsset, VideoAsset } from './types';

/**
 * Media catalogue. Files live in `public/media/` and follow a naming convention:
 *
 *   images   media/images/<id>-480.webp  (grid thumbnail, 4:5 crop)
 *            media/images/<id>-900.webp  (project page)
 *   posters  media/posters/<id>.webp     (video poster)
 *   videos   media/videos/<id>.mp4|webm  (full)  and  <id>.preview.mp4|webm  (hover preview, optional)
 *
 * To add an image: drop both webp files in, then add `{ w, h }` (source pixel size) below.
 * To add a video:  drop the file(s) in, then list the formats you added in `full` / `preview`.
 * `npm run media:check` fails the build if anything listed here is missing.
 */

/** Widths (px) generated for each image role. Add a width here + the files to enable a larger srcset step. */
export const THUMB_WIDTHS = [480];
export const FULL_WIDTHS = [900];

export const images: Record<string, ImageAsset> = {
  'realistic-ice-image-1': { w: 1600, h: 1200 },
  'realistic-ice-image-2': { w: 1600, h: 1200 },
  'soap-image-1': { w: 1600, h: 1200 },
  'soap-image-2': { w: 1600, h: 1200 },
  'soap-image-3': { w: 1600, h: 900 },
  'soap-image-4': { w: 1600, h: 1200 },
  'yerba-mate-image-1': { w: 1600, h: 1200 },
  'yerba-mate-image-2': { w: 1600, h: 1200 },
  'asus-image': { w: 1600, h: 1200 },
  'real-water-glass-image-1': { w: 1600, h: 1200 },
  'real-water-glass-image-2': { w: 1600, h: 1200 },
  'smart-watch-image': { w: 1600, h: 1200 },
  'nike-shoe-image-1': { w: 1600, h: 1200 },
  'nike-shoe-image-2': { w: 1600, h: 1200 },
  'nike-shoe-image-3': { w: 1600, h: 900 },
  'nike-shoe-image-4': { w: 1600, h: 1200 },
  'nike-shoe-image-5': { w: 1600, h: 1200 },
  'nike-shoe-image-6': { w: 1600, h: 900 },
  'interior-image-1': { w: 1600, h: 1200 },
  'interior-image-2': { w: 1600, h: 1200 },
  'booth-01-image-01': { w: 1600, h: 1200 },
  'booth-01-image-02': { w: 1600, h: 1200 },
  'booth-01-image-03': { w: 1600, h: 900 },
  'booth-01-image-04': { w: 1600, h: 1200 },
  'booth-01-image-05': { w: 1600, h: 1200 },
  'booth-01-image-06': { w: 1600, h: 900 },
  'booth-01-image-07': { w: 1600, h: 1200 },
  'booth-01-image-08': { w: 1600, h: 1200 },
  'booth-01-image-09': { w: 1600, h: 900 },
  '2026-looks': { w: 1600, h: 1200 },
  '2026-look-1': { w: 1600, h: 1200 },
  '2026-look-2': { w: 1600, h: 900 },
  '2026-look-3': { w: 1600, h: 1200 },
  '2026-look-4': { w: 1600, h: 1200 },
  '2026-look-5': { w: 1600, h: 900 },
  '2026-look-6': { w: 1600, h: 1200 },
  'folder-image-1': { w: 1600, h: 1200 },
  'folder-image-2': { w: 1600, h: 1200 },
  'vellum-image': { w: 1600, h: 1200 },
  'dates-cookie-image': { w: 1600, h: 1200 },
  'blue-mall-image': { w: 1600, h: 1200 },
  'youth-affairs-image-1': { w: 1600, h: 1200 },
  'youth-affairs-image-2': { w: 1600, h: 1200 },
  'youth-affairs-image-3': { w: 1600, h: 900 },
};

/**
 * `full` and `preview` are empty on purpose: the uploaded build shipped posters only, no video files.
 * Until you add them, project pages show the poster and hover previews are skipped.
 */
export const videos: Record<string, VideoAsset> = {
  'soap-animation': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'yerba-mate-animation': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'asus-animation': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'watch-animation': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'folder-animation-1': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'vellum-animation-1': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'dates-cookie-animation-1': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'blue-mall-animation': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
  'youth-affairs-animation': { w: 1280, h: 720, dur: 8, full: ['mp4'], preview: [] },
};
