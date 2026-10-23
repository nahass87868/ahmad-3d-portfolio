export interface ImageAsset {
  /** Source pixel size. Used for the `width`/`height` attributes (layout stability), not for display. */
  w: number;
  h: number;
}

export type VideoFormat = 'mp4' | 'webm';

export interface VideoAsset {
  w: number;
  h: number;
  /** Seconds. */
  dur: number;
  /** Formats present as `media/videos/<id>.<format>`. */
  full: VideoFormat[];
  /** Formats present as `media/videos/<id>.preview.<format>` (hover preview). Falls back to `full`. */
  preview: VideoFormat[];
}
