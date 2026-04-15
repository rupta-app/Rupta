import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const imageShareOptions = {
  mimeType: 'image/png' as const,
  dialogTitle: 'Share your SideQuest',
};

/**
 * Opens the system share sheet so the user can pick Instagram (Stories, feed, etc.).
 * Works in Expo Go. Direct Instagram Stories APIs require a dev build + react-native-share.
 */
export async function shareImageToInstagramStories(imageUri: string): Promise<boolean> {
  try {
    if (!(await Sharing.isAvailableAsync())) return false;
    await Sharing.shareAsync(imageUri, {
      ...imageShareOptions,
      dialogTitle: 'Share to Instagram',
    });
    return true;
  } catch {
    return false;
  }
}

export async function saveImageToCache(uri: string, name: string): Promise<string> {
  const source = new File(uri);
  const dest = new File(Paths.cache, name);
  source.copy(dest);
  return dest.uri;
}

export async function openShareSheet(fileUri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(fileUri, imageShareOptions);
}
