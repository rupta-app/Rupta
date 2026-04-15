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
