import { Image } from 'expo-image';
import { ImageBackground, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { logoMark } from '@/constants/branding';
import type { QuestRow } from '@/services/quests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { questTitle } from '@/utils/questCopy';

/** 9:16 story template — capture with react-native-view-shot */
export function CompletedStoryCard({
  quest,
  auraEarned,
  username,
  displayName,
  category,
  lang,
  backgroundUri,
  simpleTitle,
  simpleCategory,
  auraPending,
}: {
  quest?: QuestRow | null;
  auraEarned: number;
  /** Spontaneous post before reviewers award AURA */
  auraPending?: boolean;
  username: string;
  displayName: string;
  category?: string;
  lang: string;
  backgroundUri?: string | null;
  /** When set (e.g. group quest), overrides quest-based title */
  simpleTitle?: string;
  simpleCategory?: string;
}) {
  const { t } = useTranslation();
  const title = simpleTitle ?? (quest ? questTitle(quest, lang) : t('common.sideQuest'));
  const inner = (
    <View className="flex-1 p-5 justify-between bg-black/55">
      <View>
        <Image
          source={logoMark}
          accessibilityLabel="Rupta"
          contentFit="contain"
          style={{ width: 88, height: 26 }}
        />
        <Text className="text-white/70 text-xs mt-1">{t('share.sideQuestCompleted')}</Text>
        <Text className="text-white text-2xl font-bold mt-4 leading-8">{title}</Text>
        <Text className="text-primary text-sm font-semibold mt-2 uppercase">
          {simpleCategory ??
            (quest && category ? formatCategoryLabel(category, lang) : category ?? t('common.sideQuest'))}
        </Text>
      </View>
      <View>
        {auraPending ? (
          <Text className="text-white text-xl font-bold leading-7">{t('complete.storyAuraPending')}</Text>
        ) : (
          <Text className="text-respect text-4xl font-black">+{auraEarned}</Text>
        )}
        <Text className="text-white/80 text-sm font-medium">{displayName}</Text>
        <Text className="text-white/50 text-xs">@{username}</Text>
      </View>
    </View>
  );

  return (
    <View className="w-[270px] h-[480px] bg-background rounded-3xl overflow-hidden border border-border">
      {backgroundUri ? (
        <ImageBackground
          source={{ uri: backgroundUri }}
          className="flex-1 w-full h-full"
          imageStyle={{ opacity: 0.4 }}
        >
          {inner}
        </ImageBackground>
      ) : (
        <View className="flex-1 w-full h-full bg-surfaceElevated">{inner}</View>
      )}
    </View>
  );
}
