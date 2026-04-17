import * as ImagePicker from 'expo-image-picker';
import type { MediaType } from 'expo-image-picker';
import { Video as VideoCompressor, getVideoMetaData } from 'react-native-compressor';

import {
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_S,
  PICKER_PHOTO_QUALITY,
  mediaKindFromAsset,
  type MediaKind,
} from '@/lib/mediaLimits';

export type PickedMedia = {
  uri: string;
  mime: string;
  kind: MediaKind;
  sizeBytes: number;
  durationMs?: number;
};

export type MediaLimitErrorKey = 'tooLargePhoto' | 'tooLargeVideo' | 'tooLongVideo';

export class MediaLimitError extends Error {
  constructor(public key: MediaLimitErrorKey) {
    super(key);
    this.name = 'MediaLimitError';
  }
}

export class MediaPermissionError extends Error {
  /** 'library' = photo library, 'camera' = camera capture */
  constructor(public source: 'library' | 'camera', public canAskAgain: boolean) {
    super('permission_denied');
    this.name = 'MediaPermissionError';
  }
}

type Allow = 'both' | 'photos' | 'videos';

function mediaTypesFor(allow: Allow): MediaType[] {
  if (allow === 'photos') return ['images'];
  if (allow === 'videos') return ['videos'];
  return ['images', 'videos'];
}

async function compressVideo(uri: string): Promise<{ uri: string; sizeBytes: number }> {
  try {
    const compressedUri = await VideoCompressor.compress(uri, {
      compressionMethod: 'auto',
      maxSize: 1280,
      minimumFileSizeForCompress: 2,
    });
    try {
      const meta = await getVideoMetaData(compressedUri);
      return { uri: compressedUri, sizeBytes: meta.size ?? 0 };
    } catch {
      return { uri: compressedUri, sizeBytes: 0 };
    }
  } catch {
    return { uri, sizeBytes: 0 };
  }
}

async function buildPicked(asset: ImagePicker.ImagePickerAsset): Promise<PickedMedia> {
  const kind = mediaKindFromAsset({ type: asset.type, mimeType: asset.mimeType });
  const mime = asset.mimeType ?? (kind === 'video' ? 'video/mp4' : 'image/jpeg');
  const durationMs = asset.duration ?? undefined;

  if (kind === 'video' && durationMs != null && durationMs > MAX_VIDEO_DURATION_S * 1000 + 500) {
    throw new MediaLimitError('tooLongVideo');
  }

  if (kind === 'photo') {
    const sizeBytes = asset.fileSize ?? 0;
    if (sizeBytes > MAX_PHOTO_BYTES) {
      throw new MediaLimitError('tooLargePhoto');
    }
    return { uri: asset.uri, mime, kind, sizeBytes, durationMs };
  }

  const compressed = await compressVideo(asset.uri);
  const sizeBytes = compressed.sizeBytes || asset.fileSize || 0;
  if (sizeBytes > MAX_VIDEO_BYTES) {
    throw new MediaLimitError('tooLargeVideo');
  }
  return { uri: compressed.uri, mime: 'video/mp4', kind, sizeBytes, durationMs };
}

/**
 * Opens the combined photo+video library in a single sheet.
 * Videos are compressed and faststart-rewritten before returning so the player
 * can start streaming while the file uploads / downloads.
 */
export async function pickCompletionMedia(
  opts: { allow?: Allow } = {},
): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new MediaPermissionError('library', perm.canAskAgain);
  }

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: mediaTypesFor(opts.allow ?? 'both'),
    quality: PICKER_PHOTO_QUALITY,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    videoMaxDuration: MAX_VIDEO_DURATION_S,
    selectionLimit: 1,
  });

  if (res.canceled || !res.assets[0]) return null;
  return buildPicked(res.assets[0]);
}

/**
 * Opens the native camera in photo or video capture mode.
 * Videos are compressed and faststart-rewritten before returning.
 */
export async function captureCompletionMedia(kind: MediaKind): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new MediaPermissionError('camera', perm.canAskAgain);
  }

  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    quality: PICKER_PHOTO_QUALITY,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    videoMaxDuration: MAX_VIDEO_DURATION_S,
  });

  if (res.canceled || !res.assets[0]) return null;
  return buildPicked(res.assets[0]);
}
