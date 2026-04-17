export const MAX_MEDIA_PER_COMPLETION = 3;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_VIDEO_DURATION_S = 60;
export const PICKER_PHOTO_QUALITY = 0.85;
export const PICKER_VIDEO_QUALITY: 'Low' | 'Medium' | 'High' = 'Medium';

export type MediaKind = 'photo' | 'video';

export function mediaKindFromMime(mime: string): MediaKind {
  return mime.startsWith('video/') ? 'video' : 'photo';
}

export function mediaKindFromAsset(asset: {
  type?: string | null;
  mimeType?: string | null;
}): MediaKind {
  if (asset.type === 'video') return 'video';
  if (asset.mimeType?.startsWith('video/')) return 'video';
  return 'photo';
}

const VIDEO_EXT_RE = /\.(mp4|mov|m4v|webm)(\?|$)/i;

export function isVideoMedia(url: string, type?: string | null): boolean {
  if (type === 'video') return true;
  if (type === 'photo') return false;
  return VIDEO_EXT_RE.test(url);
}

export const MB = 1024 * 1024;
