import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { SegmentedTabBar } from '@/components/ui/SegmentedTabBar';
import { GroupCard } from '@/components/social/GroupCard';
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

  const periodLabel = () => {
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
  };

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="ranks" />
      <View className="px-4 pt-2 pb-1">
        <SegmentedTabBar
          tabs={[
            { key: 'global' as const, label: t('leaderboard.global') },
            { key: 'groups' as const, label: t('leaderboard.groups') },
            { key: 'friends' as const, label: t('leaderboard.friends') },
          ]}
          active={scope}
          onChange={(tab) => {
            setScope(tab);
            if (tab !== 'groups') setSelectedGroupId(null);
          }}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          <PillToggleGroup
            options={[
              { value: 'week' as const, label: t('leaderboard.thisWeek') },
              { value: 'month' as const, label: t('leaderboard.thisMonth') },
              { value: 'year' as const, label: t('leaderboard.thisYear') },
              { value: 'all' as const, label: t('leaderboard.allTime') },
            ]}
            selected={period}
            onToggle={setPeriod}
            containerClassName="flex-row gap-2"
          />
        </ScrollView>

        <Text className="text-foreground text-lg font-bold mt-4">{periodLabel()}</Text>
      </View>

      {showGroupPicker ? (
        <FlatList
          data={myGroups}
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted text-center px-4">{t('feed.empty')}</Text>}
          ListHeaderComponent={<Text className="text-muted text-sm mb-4">{t('leaderboard.pickGroup')}</Text>}
          renderItem={renderGroupPicker}
        />
      ) : showGroupBoard ? (
        <View className="flex-1">
          <Pressable onPress={() => setSelectedGroupId(null)} className="flex-row items-center px-4 py-2">
            <ChevronLeft color={colors.foreground} size={24} />
            <Text className="text-primary ml-1">{t('common.back')}</Text>
          </Pressable>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              isLoading ? null : <Text className="text-muted text-center">{t('feed.empty')}</Text>
            }
            renderItem={renderLbItem}
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            isLoading ? null : <Text className="text-muted text-center">{t('feed.empty')}</Text>
          }
          renderItem={renderLbItem}
        />
      )}
    </View>
  );
}
