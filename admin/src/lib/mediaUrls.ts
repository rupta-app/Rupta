const ACCOUNT_HASH = import.meta.env.VITE_CF_ACCOUNT_HASH ?? '';
const STREAM_SUBDOMAIN = (import.meta.env.VITE_CF_STREAM_SUBDOMAIN ?? '').replace(
  /\.cloudflarestream\.com\/?$/i,
  '',
);

export type ImageVariant = 'avatar' | 'public' | 'thumbnail';

const isLegacyUrl = (value: string) => /^(https?|file|data|blob):/i.test(value);

export function imageUrl(idOrUrl: string, variant?: ImageVariant): string;
export function imageUrl(idOrUrl: string | null | undefined, variant?: ImageVariant): string | null;
export function imageUrl(
  idOrUrl: string | null | undefined,
  variant: ImageVariant = 'public',
): string | null {
  if (!idOrUrl) return null;
  if (isLegacyUrl(idOrUrl)) return idOrUrl;
  if (!ACCOUNT_HASH) return idOrUrl;
  return `https://imagedelivery.net/${ACCOUNT_HASH}/${idOrUrl}/${variant}`;
}

export function videoHlsUrl(idOrUrl: string): string;
export function videoHlsUrl(idOrUrl: string | null | undefined): string | null;
export function videoHlsUrl(idOrUrl: string | null | undefined): string | null {
  if (!idOrUrl) return null;
  if (isLegacyUrl(idOrUrl)) return idOrUrl;
  if (!STREAM_SUBDOMAIN) return idOrUrl;
  return `https://${STREAM_SUBDOMAIN}.cloudflarestream.com/${idOrUrl}/manifest/video.m3u8`;
}

export function videoThumbUrl(
  idOrUrl: string | null | undefined,
  options: { timeSec?: number; height?: number } = {},
): string | null {
  if (!idOrUrl) return null;
  if (isLegacyUrl(idOrUrl)) return null;
  if (!STREAM_SUBDOMAIN) return null;
  const params = new URLSearchParams();
  params.set('time', `${options.timeSec ?? 1}s`);
  if (options.height) params.set('height', String(options.height));
  return `https://${STREAM_SUBDOMAIN}.cloudflarestream.com/${idOrUrl}/thumbnails/thumbnail.jpg?${params.toString()}`;
}
