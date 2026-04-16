import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BookmarkMinus, Pencil } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { PressableScale } from '@/components/ui/PressableScale';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { auraLevelFromTotal, auraProgressInCurrentLevel, auraToNextLevel } from '@/lib/aura';
import { isLifeListRowDone, lifeListDoneCount } from '@/lib/questCompletionRules';
import { useAuth } from '@/providers/AuthProvider';
import { useLifeList, useLifeListCompletionCounts, useToggleSave } from '@/hooks/useQuests';
import { fetchActivityChart, fetchProfileStats, fetchRecentCompletions } from '@/services/profile';
import type { QuestRow } from '@/services/quests';
import { RecentCompletionsList } from '@/components/social/RecentCompletionsList';
import { appLang } from '@/utils/lang';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { questTitle } from '@/utils/questCopy';

const CHART_CONTAINER_HEIGHT = 88;
const CHART_BAR_MIN = 8;
const CHART_BAR_RANGE = 72;
const SCROLL_PADDING_BOTTOM = 120;
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

  const totalAura = profile?.total_aura ?? 0;
  const { progress } = auraProgressInCurrentLevel(totalAura);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progress * 100, { duration: 800 });
  }, [progress, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const lifePct =
    lifeProgress.total > 0 ? Math.round((lifeProgress.done / lifeProgress.total) * 100) : 0;

  const lifeListHero = useMemo(() => {
    const ring = (
      <View className="relative">
        <LinearGradient
          colors={[colors.primary + '30', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40 }}
        />
        <View className="w-20 h-20 rounded-full border-2 border-primary items-center justify-center">
          <Text className="text-primary text-3xl font-black">{lifeProgress.total > 0 ? `${lifePct}%` : '0'}</Text>
        </View>
      </View>
    );
    const right = (
      <View className="flex-1 min-w-0">
        <Text className="text-muted text-xs uppercase">{t('profile.lifeListProgressLabel')}</Text>
        {lifeProgress.total > 0 ? (
          <>
            <Text className="text-foreground text-lg font-bold mt-1">
              {t('profile.lifeListProgressDetail', {
                done: lifeProgress.done,
                total: lifeProgress.total,
              })}
            </Text>
            <View className="h-2 bg-surfaceElevated rounded-full mt-2 overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${lifePct}%` }} />
            </View>
          </>
        ) : (
          <Text className="text-muted text-sm mt-2 leading-5">{t('profile.emptyLifeList')}</Text>
        )}
      </View>
    );
    return (
      <Card className="mt-4" variant="glow">
        <View className="flex-row items-center gap-4">
          {ring}
          {right}
        </View>
      </Card>
    );
  }, [lifeProgress, lifePct, t]);

  const renderLifeListRow = useCallback(
    (item: { quest_id: string; quests?: QuestRow }) => {
      const q = item.quests;
      const cnt = lifeCounts?.get(item.quest_id) ?? 0;
      const rowDone = q ? isLifeListRowDone(q, cnt) : false;
      const category = q?.category ?? 'random';
      const cat = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.random;
      const CatIcon = cat.icon;
      const title = q ? questTitle(q, lang) : 'Quest';
      return (
        <PressableScale
          key={item.quest_id}
          onPress={() => router.push(`/(main)/quest/${item.quest_id}`)}
          className="mb-2.5"
          scaleValue={0.97}
        >
          <View className="bg-surface rounded-2xl p-3 min-h-[92px]" style={{ borderLeftWidth: 3, borderLeftColor: cat.accent }}>
            <View className="flex-row items-stretch">
              <View className="flex-1 min-w-0 pr-2">
                <View className="flex-row items-center mb-1.5">
                  <View
                    className="w-7 h-7 rounded-md items-center justify-center mr-2"
                    style={{ backgroundColor: cat.bg }}
                  >
                    <CatIcon color={cat.accent} size={14} strokeWidth={2.5} />
                  </View>
                  <Text className="text-xs font-semibold flex-1 min-w-0" style={{ color: cat.accent }} numberOfLines={1}>
                    {formatCategoryLabel(category, lang)}
                  </Text>
                </View>
                <Text
                  className="text-foreground text-base font-bold leading-5 min-h-[40px]"
                  numberOfLines={2}
                >
                  {title}
                </Text>
              </View>
              <View className="items-end justify-between self-stretch min-w-[76px]">
                <PressableScale
                  onPress={() => uid && toggle.mutate({ questId: item.quest_id, currentlySaved: true })}
                  hitSlop={10}
                  scaleValue={0.9}
                  accessibilityLabel={t('profile.removeFromLifeList')}
                >
                  <BookmarkMinus color={colors.muted} size={20} strokeWidth={2} />
                </PressableScale>
                <View className="min-h-[26px] items-end justify-end">
                  {rowDone ? <Badge tone="secondary">{t('quest.lifeListRowDone')}</Badge> : <View className="h-[26px]" />}
                </View>
              </View>
            </View>
          </View>
        </PressableScale>
      );
    },
    [lifeCounts, router, lang, t, uid, toggle],
  );

  if (!profile) return null;

  const level = auraLevelFromTotal(profile.total_aura);
  const next = auraToNextLevel(profile.total_aura);
  const maxBar = Math.max(...(activity?.buckets ?? [0]), 1);

  const lifeRowsTyped = lifeRows as { quest_id: string; quests?: QuestRow }[];

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="profile" />
      <ScrollView
        key={tab}
        stickyHeaderIndices={[1]}
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: SCROLL_PADDING_BOTTOM,
          paddingTop: SCROLL_PADDING_TOP,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-3 pb-4">
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <Avatar url={profile.avatar_url} name={profile.display_name} size={80} />
              <PressableScale
                onPress={() => router.push('/(main)/edit-profile')}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-surfaceElevated items-center justify-center"
                scaleValue={0.9}
                hitSlop={8}
              >
                <Pencil color={colors.primaryLight} size={16} />
              </PressableScale>
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-foreground text-2xl font-bold" numberOfLines={1}>
                {profile.display_name}
              </Text>
              <Text className="text-muted" numberOfLines={1}>
                @{profile.username}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-background pb-2 pt-1 -mx-4 px-4 border-b border-border/30">
          <View className="flex-row gap-2">
            <PressableScale
              onPress={() => setTab('stats')}
              className={`flex-1 py-2.5 rounded-xl items-center ${tab === 'stats' ? 'bg-foreground' : 'bg-surfaceElevated'}`}
              scaleValue={0.96}
            >
              <Text className={`font-semibold ${tab === 'stats' ? 'text-background' : 'text-mutedForeground'}`}>
                {t('profile.tabStats')}
              </Text>
            </PressableScale>
            <PressableScale
              onPress={() => setTab('life')}
              className={`flex-1 py-2.5 rounded-xl items-center ${tab === 'life' ? 'bg-foreground' : 'bg-surfaceElevated'}`}
              scaleValue={0.96}
            >
              <Text className={`font-semibold ${tab === 'life' ? 'text-background' : 'text-mutedForeground'}`}>
                {t('profile.tabLife')}
              </Text>
            </PressableScale>
          </View>
        </View>

        <View className="pt-2">
          {tab === 'stats' ? (
            <Animated.View entering={FadeIn.duration(160)}>
              <Card className="mt-4" variant="glow">
                <View className="flex-row items-center gap-4">
                  <View className="relative">
                    <LinearGradient
                      colors={[colors.primary + '30', 'transparent']}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={{ position: 'absolute', width: 80, height: 80, borderRadius: 40 }}
                    />
                    <View className="w-20 h-20 rounded-full border-2 border-primary items-center justify-center">
                      <Text className="text-primary text-3xl font-black">{level}</Text>
                    </View>
                  </View>
                  <View className="flex-1 min-w-0">
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
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(160)}>
              {lifeListHero}
              <View className="mt-4">{lifeRowsTyped.map((item) => renderLifeListRow(item))}</View>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
