import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

import { CompletedStoryCard } from '@/components/share/CompletedStoryCard';
import { Button } from '@/components/ui/Button';
import { useCompletion } from '@/hooks/useCompletion';
import { openShareSheet, shareImageToInstagramStories } from '@/lib/share';

function normalizeRouteParam(value: string | string[] | undefined): string | undefined {
  if (value == null) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : undefined;
}

export default function ShareCardScreen() {
  const params = useLocalSearchParams<{ completionId?: string | string[] }>();
  const completionId = useMemo(() => normalizeRouteParam(params.completionId), [params.completionId]);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { data, isLoading } = useCompletion(completionId);
  const ref = useRef<ViewShot>(null);
  const [busy, setBusy] = useState(false);

  if (!completionId) {
    return (
      <View className="flex-1 bg-background justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-muted px-6 text-center">{t('common.error')}</Text>
      </View>
    );
  }

  const capture = async () => {
    if (!ref.current?.capture) return null;
    return ref.current.capture();
  };

  const onSave = async () => {
    setBusy(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission', 'Need photo library access');
        return;
      }
      const uri = await capture();
      if (uri) await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved', 'Story card saved to your library');
    } finally {
      setBusy(false);
    }
  };

  const onInstagram = async () => {
    setBusy(true);
    try {
      const uri = await capture();
      if (!uri) return;
      const ok = await shareImageToInstagramStories(uri);
      if (!ok) await openShareSheet(uri);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !data || !data.profiles || (!data.quests && !data.group_quests)) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const bg = data.quest_media?.[0]?.media_url;
  const simpleTitle = data.group_quests?.title;
  const simpleCategory = data.group_quests ? t('feed.groupQuest') : undefined;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40, alignItems: 'center' }}
    >
      <Text className="text-foreground text-xl font-bold px-4 text-center">{t('complete.shareStory')}</Text>
      <ViewShot ref={ref} options={{ format: 'png', quality: 1 }}>
        <View className="items-center py-8 bg-background">
          <CompletedStoryCard
            quest={data.quests ?? undefined}
            simpleTitle={simpleTitle}
            simpleCategory={simpleCategory}
            auraEarned={data.aura_earned}
            auraPending={data.quest_source_type === 'spontaneous' && data.aura_earned === 0}
            username={data.profiles.username}
            displayName={data.profiles.display_name}
            category={data.quests?.category}
            lang={lang}
            backgroundUri={bg}
          />
        </View>
      </ViewShot>
      <View className="px-6 w-full gap-3 mt-4">
        <Button onPress={onInstagram} loading={busy}>
          {t('complete.shareStory')}
        </Button>
        <Button variant="secondary" onPress={onSave} loading={busy}>
          {t('complete.saveCard')}
        </Button>
        <Button variant="ghost" onPress={() => router.replace('/(main)/(tabs)/home')}>
          {t('common.continue')}
        </Button>
      </View>
    </ScrollView>
  );
}
