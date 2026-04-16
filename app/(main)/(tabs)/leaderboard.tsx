import { useRouter } from 'expo-router';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';

import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { SegmentedTabBar } from '@/components/ui/SegmentedTabBar';
import { GroupCard } from '@/components/social/GroupCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors } from '@/constants/theme';
import { useFriendsLeaderboard, useGlobalLeaderboard } from '@/hooks/useLeaderboard';
import { useGroupLeaderboard, useMyGroups } from '@/hooks/useGroups';
import type { LeaderboardPeriod } from '@/services/leaderboard';
import { useAuth } from '@/providers/AuthProvider';

type ScopeTab = 'global' | 'groups' | 'friends';

type LbRow = {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  total_aura: number;
  yearly_aura: number;
  total_group_aura?: number;
  period_aura: number;
};

const LIST_PAD = { paddingHorizontal: 16, paddingBottom: 120 } as const;

type LeaderboardFiltersHeaderProps = {
  scopeTabs: { key: ScopeTab; label: string }[];
  scope: ScopeTab;
  onScopeChange: (tab: ScopeTab) => void;
  periodOptions: { value: LeaderboardPeriod; label: string }[];
  period: LeaderboardPeriod;
  onPeriodChange: (p: LeaderboardPeriod) => void;
  periodTitle: string;
};

const LeaderboardFiltersHeader = memo(function LeaderboardFiltersHeader({
  scopeTabs,
  scope,
  onScopeChange,
  periodOptions,
  period,
  onPeriodChange,
  periodTitle,
}: LeaderboardFiltersHeaderProps) {
  return (
    <View className="bg-background pb-1">
      <SegmentedTabBar tabs={scopeTabs} active={scope} onChange={onScopeChange} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={{ flexGrow: 0 }}
        className="mt-3"
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        <PillToggleGroup
          options={periodOptions}
          selected={period}
          onToggle={onPeriodChange}
          containerClassName="flex-row gap-2"
        />
      </ScrollView>
      <Text className="text-foreground text-lg font-bold mt-4">{periodTitle}</Text>
    </View>
  );
});

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const [scope, setScope] = useState<ScopeTab>('global');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const g = useGlobalLeaderboard(period);
  const f = useFriendsLeaderboard(uid, period);
  const { data: myGroups = [] } = useMyGroups(uid);
  const glb = useGroupLeaderboard(selectedGroupId ?? undefined, period);

  const periodOptions = useMemo(
    () => [
      { value: 'week' as const, label: t('leaderboard.thisWeek') },
      { value: 'month' as const, label: t('leaderboard.thisMonth') },
      { value: 'year' as const, label: t('leaderboard.thisYear') },
      { value: 'all' as const, label: t('leaderboard.allTime') },
    ],
    [t],
  );

  const scopeTabs = useMemo(
    () =>
      [
        { key: 'global' as const, label: t('leaderboard.global') },
        { key: 'groups' as const, label: t('leaderboard.groups') },
        { key: 'friends' as const, label: t('leaderboard.friends') },
      ] satisfies { key: ScopeTab; label: string }[],
    [t],
  );

  const periodTitle = useMemo(() => {
    switch (period) {
      case 'week':
        return t('leaderboard.thisWeek');
      case 'month':
        return t('leaderboard.thisMonth');
      case 'year':
        return t('leaderboard.thisYear');
      default:
        return t('leaderboard.allTime');
    }
  }, [period, t]);

  const onScopeChange = useCallback((tab: ScopeTab) => {
    setScope(tab);
    if (tab !== 'groups') setSelectedGroupId(null);
  }, []);

  const showGroupPicker = scope === 'groups' && !selectedGroupId;
  const showGroupBoard = scope === 'groups' && selectedGroupId;

  const { data = [], isLoading } =
    scope === 'global' ? g : scope === 'friends' ? f : showGroupBoard ? glb : { data: [], isLoading: false };

  const renderLbItem = useCallback(({ item, index }: { item: LbRow; index: number }) => (
    <LeaderboardRow
      rank={index + 1}
      displayName={item.display_name}
      username={item.username}
      avatarUrl={item.avatar_url}
      aura={showGroupBoard && item.total_group_aura !== undefined ? item.total_group_aura : item.period_aura}
      onPress={() => router.push(`/(main)/user/${item.id}`)}
    />
  ), [router, showGroupBoard]);

  const renderGroupPicker = useCallback(({
    item,
  }: {
    item: { id: string; name: string; description?: string | null; avatar_url?: string | null };
  }) => (
    <GroupCard group={item} onPress={() => setSelectedGroupId(item.id)} />
  ), []);

  const filtersHeader = (
    <LeaderboardFiltersHeader
      scopeTabs={scopeTabs}
      scope={scope}
      onScopeChange={onScopeChange}
      periodOptions={periodOptions}
      period={period}
      onPeriodChange={setPeriod}
      periodTitle={periodTitle}
    />
  );

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="ranks" />

      {showGroupPicker ? (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1" key="picker">
          <FlatList
            data={myGroups}
            keyExtractor={(item: { id: string }) => item.id}
            contentContainerStyle={LIST_PAD}
            ListEmptyComponent={<EmptyState icon={Trophy} title={t('empty.noResults')} />}
            ListHeaderComponent={
              <View className="bg-background pt-2">
                {filtersHeader}
                <Text className="text-muted text-sm mb-4 mt-1">{t('leaderboard.pickGroup')}</Text>
              </View>
            }
            nestedScrollEnabled
            renderItem={renderGroupPicker}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
          />
        </Animated.View>
      ) : showGroupBoard ? (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1" key="group-board">
          <PressableScale onPress={() => setSelectedGroupId(null)} className="flex-row items-center px-4 py-2" scaleValue={0.95} hitSlop={12}>
            <ChevronLeft color={colors.foreground} size={24} />
            <Text className="text-primary ml-1">{t('common.back')}</Text>
          </PressableScale>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={LIST_PAD}
            ListHeaderComponent={<View className="bg-background pt-2">{filtersHeader}</View>}
            nestedScrollEnabled
            ListEmptyComponent={
              isLoading ? null : <EmptyState icon={Trophy} title={t('empty.noResults')} />
            }
            renderItem={renderLbItem}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1" key={`${scope}-${period}`}>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={LIST_PAD}
            ListHeaderComponent={<View className="bg-background pt-2">{filtersHeader}</View>}
            nestedScrollEnabled
            ListEmptyComponent={
              isLoading ? null : <EmptyState icon={Trophy} title={t('empty.noResults')} />
            }
            renderItem={renderLbItem}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
          />
        </Animated.View>
      )}
    </View>
  );
}
