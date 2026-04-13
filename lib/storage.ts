import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

async function uploadFile(opts: {
  path: string;
  fileUri: string;
  mimeType: string;
  upsert: boolean;
  cacheBust: boolean;
}): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(opts.fileUri, {
    encoding: 'base64',
  });

  const { error } = await supabase.storage
    .from('completion-media')
    .upload(opts.path, decode(base64), {
      contentType: opts.mimeType,
      upsert: opts.upsert,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('completion-media').getPublicUrl(opts.path);
  return opts.cacheBust ? `${data.publicUrl}?t=${Date.now()}` : data.publicUrl;
}

function mimeExt(mimeType: string): string {
  return mimeType.includes('png') ? 'png' : 'jpg';
}

export async function uploadCompletionPhoto(
  userId: string,
  fileUri: string,
  mimeType: string,
): Promise<string> {
  return uploadFile({
    path: `${userId}/${Date.now()}.${mimeExt(mimeType)}`,
    fileUri,
    mimeType,
    upsert: false,
    cacheBust: false,
  });
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
