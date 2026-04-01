import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

export async function uploadCompletionPhoto(
  userId: string,
  fileUri: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });

  const { error } = await supabase.storage
    .from('completion-media')
    .upload(path, decode(base64), {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('completion-media').getPublicUrl(path);
  return data.publicUrl;
}

/** Stored under the uploader's folder so existing storage RLS (folder = user id) applies. */
export async function uploadGroupAvatar(
  uploaderUserId: string,
  groupId: string,
  fileUri: string,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${uploaderUserId}/group-${groupId}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });

  const { error } = await supabase.storage
    .from('completion-media')
    .upload(path, decode(base64), {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('completion-media').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export async function uploadAvatar(userId: string, fileUri: string, mimeType: string): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  });

  const { error } = await supabase.storage
    .from('completion-media')
    .upload(path, decode(base64), {
      contentType: mimeType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('completion-media').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
