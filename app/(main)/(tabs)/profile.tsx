import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BookmarkMinus, Pencil } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { PressableScale } from '@/components/ui/PressableScale';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { colors, layout } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { auraLevelFromTotal, auraProgressInCurrentLevel, auraToNextLevel } from '@/lib/aura';
import { isLifeListRowDone, lifeListDoneCount, maxCompletionsAllowed } from '@/lib/questCompletionRules';
import { useAuth } from '@/providers/AuthProvider';
import { useLifeList, useLifeListCompletionCounts, useToggleSave } from '@/hooks/useQuests';
import { fetchActivityChart, fetchProfileStats, fetchRecentCompletions } from '@/services/profile';
import type { QuestRow } from '@/services/quests';
import { RecentCompletionsList } from '@/components/social/RecentCompletionsList';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';

const CHART_CONTAINER_HEIGHT = 88;
const CHART_BAR_MIN = 8;
const CHART_BAR_RANGE = 72;
const SCROLL_PADDING_BOTTOM = layout.tabScrollPadding;
const SCROLL_PADDING_TOP = 12;

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLang(i18n);
  const { profile, session, refreshProfile } = useAuth();
  const uid = session?.user?.id;
  const [tab, setTab] = useState<'stats' | 'life'>('stats');
  const { data: lifeRows = [] } = useLifeList(uid);
  const lifeQuestIds = useMemo(
    () => (lifeRows as { quest_id: string }[]).map((r) => r.quest_id),
    [lifeRows],
  );
  const { data: lifeCounts } = useLifeListCompletionCounts(uid, lifeQuestIds);
  const lifeProgress = useMemo(() => {
    const rows = (lifeRows as { quest_id: string; quests?: QuestRow }[]).map((item) => ({
      quest: item.quests,
      quest_id: item.quest_id,
      count: lifeCounts?.get(item.quest_id) ?? 0,
    }));
    return lifeListDoneCount(rows);
  }, [lifeRows, lifeCounts]);
  const toggle = useToggleSave(uid);

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', uid],
    queryFn: () => fetchProfileStats(uid!),
    enabled: Boolean(uid),
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['profile-recent', uid],
    queryFn: () => fetchRecentCompletions(uid!),
    enabled: Boolean(uid),
  });

  const { data: activity } = useQuery({
    queryKey: ['profile-activity', uid],
    queryFn: () => fetchActivityChart(uid!),
    enabled: Boolean(uid),
  });

  if (!profile) return null;

  const level = auraLevelFromTotal(profile.total_aura);
  const { progress } = auraProgressInCurrentLevel(profile.total_aura);
  const next = auraToNextLevel(profile.total_aura);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, { duration: 800 });
  }, [progress, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  const maxBar = Math.max(...(activity?.buckets ?? [0]), 1);

  const profileHeader = (
    <>
      <View className="flex-row items-center gap-4 pt-3">
        <View className="relative">
          <Avatar url={profile.avatar_url} name={profile.display_name} size={80} />
          <PressableScale
            onPress={() => router.push('/(main)/edit-profile')}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-surface border border-border items-center justify-center"
            scaleValue={0.9}
            hitSlop={8}
          >
            <Pencil color={colors.primaryLight} size={16} />
          </PressableScale>
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-2xl font-bold">{profile.display_name}</Text>
          <Text className="text-muted">@{profile.username}</Text>
        </View>
      </View>

      <View className="flex-row gap-2 mt-6">
        <PressableScale
          onPress={() => setTab('stats')}
          className={`flex-1 py-2.5 rounded-xl border items-center ${tab === 'stats' ? 'border-primary bg-primary/10' : 'border-border'}`}
          scaleValue={0.96}
        >
          <Text className={`font-semibold ${tab === 'stats' ? 'text-foreground' : 'text-muted'}`}>{t('profile.tabStats')}</Text>
        </PressableScale>
        <PressableScale
          onPress={() => setTab('life')}
          className={`flex-1 py-2.5 rounded-xl border items-center ${tab === 'life' ? 'border-primary bg-primary/10' : 'border-border'}`}
          scaleValue={0.96}
        >
          <Text className={`font-semibold ${tab === 'life' ? 'text-foreground' : 'text-muted'}`}>{t('profile.tabLife')}</Text>
        </PressableScale>
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="profile" />
      {tab === 'stats' ? (
        <Animated.ScrollView entering={FadeIn.duration(200)} key="stats" contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM, paddingTop: SCROLL_PADDING_TOP, paddingHorizontal: 16 }}>
          {profileHeader}
          <View>
            <Card className="mt-4" variant="glow">
              <View className="flex-row items-center gap-4">
                <View className="relative">
                  <LinearGradient
                    colors={[colors.primary + '30', 'transparent']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40 }}
                  />
                  <View className="w-20 h-20 rounded-full border-2 border-primary items-center justify-center shadow-lg shadow-primary/30">
                    <Text className="text-primary text-3xl font-black">{level}</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-xs uppercase">{t('common.auraLevel')}</Text>
                  <Text className="text-foreground text-lg font-bold mt-1">
                    {profile.total_aura} {t('common.aura')}
                  </Text>
                  <View className="h-2 bg-surfaceElevated rounded-full mt-2 overflow-hidden">
                    <Animated.View className="h-full bg-primary rounded-full" style={progressBarStyle} />
                  </View>
                  <Text className="text-muted text-xs mt-1">
                    {next} {t('profile.nextLevelSuffix')}
                  </Text>
                </View>
              </View>
            </Card>

            <View className="flex-row flex-wrap gap-3 mt-4">
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.weekAura')}</Text>
                <Text className="text-secondary text-xl font-bold">{activity?.weekAura ?? 0}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.monthAura')}</Text>
                <Text className="text-foreground text-xl font-bold">{activity?.monthAura ?? 0}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.completionsThisWeek')}</Text>
                <Text className="text-foreground text-xl font-bold">{activity?.weekCompletions ?? 0}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.yearlyAura')}</Text>
                <Text className="text-foreground text-xl font-bold">{profile.yearly_aura}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.questsDone')}</Text>
                <Text className="text-foreground text-xl font-bold">{stats?.questsCompleted ?? '—'}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.categoriesExplored')}</Text>
                <Text className="text-foreground text-xl font-bold">
                  {stats?.categoriesExplored ?? '—'} ({stats?.categoryCompletionPct ?? 0}%)
                </Text>
              </Card>
            </View>

            {activity?.buckets ? (
              <Card className="mt-4">
                <Text className="text-foreground font-bold mb-3">{t('profile.activityWeek')}</Text>
                <View className="flex-row items-end justify-between gap-1" style={{ height: CHART_CONTAINER_HEIGHT }}>
                  {activity.buckets.map((n, i) => (
                    <View key={i} className="flex-1 items-center justify-end">
                      <View
                        className="w-full bg-primary/80 rounded-t-md"
                        style={{ height: CHART_BAR_MIN + (n / maxBar) * CHART_BAR_RANGE }}
                      />
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <RecentCompletionsList
              completions={recent}
              lang={lang}
              onPress={(id) => router.push(`/(main)/completion/${id}`)}
            />

            <Text className="text-muted text-sm mt-6 text-center">{t('profile.ranksFriends')}</Text>
          </View>
        </Animated.ScrollView>
      ) : (
        <FlatList
          data={lifeRows as { quest_id: string; quests?: QuestRow }[]}
          keyExtractor={(item) => item.quest_id}
          ListHeaderComponent={
            <View>
              <View className="pb-2">{profileHeader}</View>
              {lifeProgress.total > 0 ? (
                <Card className="mb-4 py-3">
                  <Text className="text-muted text-xs uppercase">{t('profile.lifeListProgressLabel')}</Text>
                  <Text className="text-foreground text-3xl font-black mt-1">
                    {Math.round((lifeProgress.done / lifeProgress.total) * 100)}%
                  </Text>
                  <Text className="text-muted text-sm mt-1">
                    {t('profile.lifeListProgressDetail', {
                      done: lifeProgress.done,
                      total: lifeProgress.total,
                    })}
                  </Text>
                </Card>
              ) : null}
            </View>
          }
          contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM, paddingHorizontal: 16, paddingTop: SCROLL_PADDING_TOP }}
          ListEmptyComponent={<Text className="text-muted text-center mt-8 px-4">{t('profile.emptyLifeList')}</Text>}
          renderItem={useCallback(({ item }: { item: { quest_id: string; quests?: QuestRow } }) => {
            const q = item.quests;
            const cnt = lifeCounts?.get(item.quest_id) ?? 0;
            const max = q ? maxCompletionsAllowed(q) : null;
            const rowDone = q ? isLifeListRowDone(q, cnt) : false;
            return (
              <PressableScale onPress={() => router.push(`/(main)/quest/${item.quest_id}`)} scaleValue={0.98}>
                <Card className="mb-2 flex-row items-center gap-2 py-3">
                  <View className="flex-1 min-w-0">
                    <View className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-foreground font-bold flex-shrink">
                        {q ? questTitle(q, lang) : 'Quest'}
                      </Text>
                      {rowDone ? <Badge tone="secondary">{t('quest.lifeListRowDone')}</Badge> : null}
                    </View>
                    {q && (max != null || cnt > 0) ? (
                      <Text className="text-muted text-xs mt-1">
                        {max != null ? `${cnt}/${max}` : t('quest.yourCompletions', { count: cnt })}
                      </Text>
                    ) : null}
                  </View>
                  <PressableScale
                    onPress={() => uid && toggle.mutate({ questId: item.quest_id, currentlySaved: true })}
                    className="p-2 shrink-0"
                    hitSlop={8}
                    scaleValue={0.9}
                    accessibilityLabel={t('profile.removeFromLifeList')}
                  >
                    <BookmarkMinus color={colors.muted} size={22} />
                  </PressableScale>
                </Card>
              </PressableScale>
            );
          }, [lifeCounts, router, lang, t, uid, toggle])}
        />
      )}
    </View>
  );
}
