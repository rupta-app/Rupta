import * as Linking from 'expo-linking';
import { Share } from 'react-native';

import { openShareSheet } from '@/lib/share';

export function buildCompletionShareMessage(questTitle: string, username: string): string {
  return `Check out this SideQuest on Rupta: "${questTitle}" by @${username}`;
}

export async function shareToWhatsApp(text: string): Promise<void> {
  const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
  else await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
}

export async function shareCompletionGeneric(fileUri: string | null, text: string): Promise<void> {
  if (fileUri) {
    await openShareSheet(fileUri);
    return;
  }
  await Share.share({ message: text, title: 'Rupta' });
}
