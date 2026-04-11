import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { logoMark } from '@/constants/branding';

/** 9:16 weekly recap story template — capture with react-native-view-shot */
export function WeeklyRecapStoryCard({
  questsCompleted,
  auraEarned,
  respectReceived,
  topCategory,
  username,
  displayName,
  weekLabel,
  lang,
}: {
  questsCompleted: number;
  auraEarned: number;
  respectReceived: number;
  /** Localized label for the top category, or undefined if none */
  topCategory?: string;
  username: string;
  displayName: string;
  /** e.g. "Apr 5 – Apr 11" */
  weekLabel: string;
  lang: string;
}) {
  const { t } = useTranslation();

  return (
    <View className="w-[270px] h-[480px] bg-surfaceElevated rounded-3xl overflow-hidden border border-border">
      <View className="flex-1 p-5 justify-between">
        {/* Header */}
        <View>
          <Image
            source={logoMark}
            accessibilityLabel="Rupta"
            resizeMode="contain"
            style={{ width: 88, height: 26 }}
          />
          <Text className="text-white/70 text-xs mt-1">{t('weeklyRecap.subtitle')}</Text>
          <Text className="text-white text-2xl font-bold mt-3 leading-8">
            {t('weeklyRecap.title')}
          </Text>
          <Text className="text-primary text-sm font-semibold mt-1">{weekLabel}</Text>
        </View>

        {/* Stats */}
        <View className="gap-4">
          <StatRow label={t('weeklyRecap.questsDone')} value={String(questsCompleted)} accent="text-primary" />
          <StatRow label={t('weeklyRecap.auraEarned')} value={`+${auraEarned}`} accent="text-respect" />
          <StatRow label={t('weeklyRecap.respectReceived')} value={String(respectReceived)} accent="text-secondary" />
          {topCategory ? (
            <StatRow label={t('weeklyRecap.topCategory')} value={topCategory} accent="text-white" />
          ) : null}
        </View>

        {/* Footer */}
        <View>
          <Text className="text-white/80 text-sm font-medium">{displayName}</Text>
          <Text className="text-white/50 text-xs">@{username}</Text>
        </View>
      </View>
    </View>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <View>
      <Text className={`${accent} text-2xl font-black`}>{value}</Text>
      <Text className="text-white/60 text-xs">{label}</Text>
    </View>
  );
}
