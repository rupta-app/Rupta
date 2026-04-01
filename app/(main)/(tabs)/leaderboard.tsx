import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
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

  const displayAura = (row: LbRow) => {
    if (showGroupBoard && row.total_group_aura !== undefined) return row.total_group_aura;
    return row.period_aura;
  };

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
        <View className="flex-row border-b border-border">
          {(['global', 'groups', 'friends'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setScope(tab);
                if (tab !== 'groups') setSelectedGroupId(null);
              }}
              className="flex-1 items-center pb-2"
            >
              <Text
                className={`text-sm font-semibold ${scope === tab ? 'text-foreground' : 'text-muted'}`}
                numberOfLines={1}
              >
                {tab === 'global' ? t('leaderboard.global') : tab === 'groups' ? t('leaderboard.groups') : t('leaderboard.friends')}
              </Text>
              {scope === tab ? <View className="h-0.5 w-full bg-primary mt-2 rounded-full" /> : <View className="h-0.5 mt-2" />}
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3" contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
          {(['week', 'month', 'year', 'all'] as const).map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className={`px-3 py-2 rounded-full border ${period === p ? 'border-primary bg-primary/10' : 'border-border'}`}
            >
              <Text className={`text-sm font-medium ${period === p ? 'text-primary' : 'text-foreground'}`}>
                {p === 'week'
                  ? t('leaderboard.thisWeek')
                  : p === 'month'
                    ? t('leaderboard.thisMonth')
                    : p === 'year'
                      ? t('leaderboard.thisYear')
                      : t('leaderboard.allTime')}
              </Text>
            </Pressable>
          ))}
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
          renderItem={({
            item,
          }: {
            item: { id: string; name: string; description?: string | null; avatar_url?: string | null };
          }) => (
            <Pressable onPress={() => setSelectedGroupId(item.id)}>
              <Card className="mb-3 flex-row items-center gap-3 py-4">
                <Avatar url={item.avatar_url ?? null} name={item.name} size={52} />
                <View className="flex-1 min-w-0">
                  <Text className="text-foreground font-bold text-lg">{item.name}</Text>
                  {item.description ? (
                    <Text className="text-muted text-sm mt-1" numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          )}
        />
      ) : showGroupBoard ? (
        <View className="flex-1">
          <Pressable onPress={() => setSelectedGroupId(null)} className="flex-row items-center px-4 py-2">
            <ChevronLeft color="#F8FAFC" size={24} />
            <Text className="text-primary ml-1">{t('common.back')}</Text>
          </Pressable>
          <FlatList
            data={data as LbRow[]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              isLoading ? null : <Text className="text-muted text-center">{t('feed.empty')}</Text>
            }
            renderItem={({ item, index }) => (
              <Pressable onPress={() => router.push(`/(main)/user/${item.id}`)}>
                <Card className="mb-2 flex-row items-center gap-3">
                  <Text className="text-muted w-6 text-lg font-bold">#{index + 1}</Text>
                  <Avatar url={item.avatar_url} name={item.display_name} size={40} />
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{item.display_name}</Text>
                    <Text className="text-muted text-xs">@{item.username}</Text>
                  </View>
                  <Text className="text-primary font-black">{displayAura(item)}</Text>
                </Card>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <FlatList
          data={data as LbRow[]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            isLoading ? null : <Text className="text-muted text-center">{t('feed.empty')}</Text>
          }
          renderItem={({ item, index }) => (
            <Pressable onPress={() => router.push(`/(main)/user/${item.id}`)}>
              <Card className="mb-2 flex-row items-center gap-3">
                <Text className="text-muted w-6 text-lg font-bold">#{index + 1}</Text>
                <Avatar url={item.avatar_url} name={item.display_name} size={40} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{item.display_name}</Text>
                  <Text className="text-muted text-xs">@{item.username}</Text>
                </View>
                <Text className="text-primary font-black">{displayAura(item)}</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
