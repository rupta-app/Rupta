import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

async function uploadFile(opts: {
  path: string;
  fileUri: string;
  mimeType: string;
  upsert: boolean;
  cacheBust: boolean;
}): Promise<string> {
  const file = new File(opts.fileUri);
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from('completion-media')
    .upload(opts.path, arrayBuffer, {
      contentType: opts.mimeType,
      upsert: opts.upsert,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('completion-media').getPublicUrl(opts.path);
  return opts.cacheBust ? `${data.publicUrl}?t=${Date.now()}` : data.publicUrl;
}

function mimeExt(mimeType: string): string {
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('quicktime')) return 'mov';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.startsWith('video/')) return 'mp4';
  return 'jpg';
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

export async function uploadCompletionMedia(
  userId: string,
  fileUri: string,
  mimeType: string,
): Promise<string> {
  return uploadFile({
    path: `${userId}/${Date.now()}-${randomSuffix()}.${mimeExt(mimeType)}`,
    fileUri,
    mimeType,
    upsert: false,
    cacheBust: false,
  });
}

/**
 * Best-effort deletion of completion media blobs. Used to clean up
 * orphaned uploads when the DB insert that references them fails.
 */
export async function deleteCompletionMedia(publicUrls: string[]): Promise<void> {
  if (publicUrls.length === 0) return;
  const prefix = supabase.storage.from('completion-media').getPublicUrl('').data.publicUrl;
  const paths = publicUrls
    .map((url) => {
      const stripped = url.startsWith(prefix) ? url.slice(prefix.length) : url;
      return stripped.split('?')[0];
    })
    .filter(Boolean);
  if (paths.length === 0) return;
  await supabase.storage.from('completion-media').remove(paths);
}

/** Stored under the uploader's folder so existing storage RLS (folder = user id) applies. */
export async function uploadGroupAvatar(
  uploaderUserId: string,
  groupId: string,
  fileUri: string,
  mimeType: string,
): Promise<string> {
  return uploadFile({
    path: `${uploaderUserId}/group-${groupId}.${mimeExt(mimeType)}`,
    fileUri,
    mimeType,
    upsert: true,
    cacheBust: true,
  });
}

export async function uploadAvatar(userId: string, fileUri: string, mimeType: string): Promise<string> {
  return uploadFile({
    path: `${userId}/avatar.${mimeExt(mimeType)}`,
    fileUri,
    mimeType,
    upsert: true,
    cacheBust: true,
  });
}
