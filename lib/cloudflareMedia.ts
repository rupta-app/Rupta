import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

type ImagePurpose = 'avatar' | 'group-avatar' | 'completion-photo';

async function mintImageUploadUrl(purpose: ImagePurpose): Promise<{ id: string; uploadURL: string }> {
  const { data, error } = await supabase.functions.invoke<{ id: string; uploadURL: string }>(
    'mint-image-upload',
    { body: { purpose } },
  );
  if (error) throw error;
  if (!data?.id || !data?.uploadURL) throw new Error('mint-image-upload returned invalid payload');
  return data;
}

async function mintStreamUploadUrl(): Promise<{ uid: string; uploadURL: string }> {
  const { data, error } = await supabase.functions.invoke<{ uid: string; uploadURL: string }>(
    'mint-stream-upload',
    { body: {} },
  );
  if (error) throw error;
  if (!data?.uid || !data?.uploadURL) throw new Error('mint-stream-upload returned invalid payload');
  return data;
}

function fileNameFromUri(uri: string, fallbackExt: string): string {
  const last = uri.split('/').pop() ?? `upload.${fallbackExt}`;
  return last.split('?')[0];
}

export async function uploadImageToCloudflare(
  fileUri: string,
  mimeType: string,
  purpose: ImagePurpose,
): Promise<string> {
  const { id, uploadURL } = await mintImageUploadUrl(purpose);

  const file = new File(fileUri);
  const bytes = await file.arrayBuffer();
  const form = new FormData();
  const blob = new Blob([bytes], { type: mimeType });
  form.append('file', blob, fileNameFromUri(fileUri, 'jpg'));

  const res = await fetch(uploadURL, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudflare Images upload failed (${res.status}): ${text || res.statusText}`);
  }

  return id;
}

export async function uploadVideoToCloudflare(fileUri: string, mimeType: string): Promise<string> {
  const { uid, uploadURL } = await mintStreamUploadUrl();

  const file = new File(fileUri);
  const bytes = await file.arrayBuffer();
  const form = new FormData();
  const blob = new Blob([bytes], { type: mimeType });
  form.append('file', blob, fileNameFromUri(fileUri, 'mp4'));

  const res = await fetch(uploadURL, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudflare Stream upload failed (${res.status}): ${text || res.statusText}`);
  }

  return uid;
}
