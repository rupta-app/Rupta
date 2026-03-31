import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { useFriendsLeaderboard, useGlobalLeaderboard } from '@/hooks/useLeaderboard';
import { useGroupLeaderboard, useMyGroups } from '@/hooks/useGroups';

type MainTab = 'friends' | 'groups' | 'global';

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const [mainTab, setMainTab] = useState<MainTab>('friends');
  const [mode, setMode] = useState<'total' | 'yearly'>('total');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const g = useGlobalLeaderboard(mode);
  const f = useFriendsLeaderboard(uid, mode);
  const { data: myGroups = [] } = useMyGroups(uid);
  const glb = useGroupLeaderboard(selectedGroupId ?? undefined, mode);

  const { data = [], isLoading } =
    mainTab === 'global' ? g : mainTab === 'friends' ? f : selectedGroupId ? glb : { data: [], isLoading: false };

  const aura = (row: { total_aura: number; yearly_aura: number }) =>
    mode === 'yearly' ? row.yearly_aura : row.total_aura;

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="ranks" />
      <View className="px-4 pt-3 pb-2">
        <Text className="text-foreground text-2xl font-bold">{t('tabs.leaderboard')}</Text>
        <View className="flex-row flex-wrap gap-2 mt-3">
          {(['friends', 'groups', 'global'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                setMainTab(tab);
                if (tab !== 'groups') setSelectedGroupId(null);
              }}
              className={`px-3 py-2 rounded-lg border ${mainTab === tab ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground">
                {tab === 'friends'
                  ? t('leaderboard.friends')
                  : tab === 'groups'
                    ? t('leaderboard.groups')
                    : t('leaderboard.global')}
              </Text>
            </Pressable>
          ))}
        </View>
        <View className="flex-row gap-2 mt-2">
          <Pressable
            onPress={() => setMode('total')}
            className={`px-3 py-2 rounded-lg border ${mode === 'total' ? 'border-secondary' : 'border-border'}`}
          >
            <Text className="text-foreground">{t('leaderboard.allTime')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('yearly')}
            className={`px-3 py-2 rounded-lg border ${mode === 'yearly' ? 'border-secondary' : 'border-border'}`}
          >
            <Text className="text-foreground">{t('leaderboard.yearly')}</Text>
          </Pressable>
        </View>

        <View className="flex-row justify-center gap-6 mt-4 pb-1">
          <Pressable onPress={() => router.push('/(main)/friends')}>
            <Text className="text-primary font-semibold text-sm">{t('friends.title')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(main)/groups')}>
            <Text className="text-primary font-semibold text-sm">{t('groups.title')}</Text>
          </Pressable>
        </View>
      </View>

      {mainTab === 'groups' && !selectedGroupId ? (
        <FlatList
          data={myGroups}
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted text-center px-4">{t('feed.empty')}</Text>}
          ListHeaderComponent={
            <Text className="text-muted text-sm mb-3">{t('leaderboard.pickGroup')}</Text>
          }
          renderItem={({ item }: { item: { id: string; name: string } }) => (
            <Pressable onPress={() => setSelectedGroupId(item.id)}>
              <Card className="mb-2 py-3">
                <Text className="text-foreground font-semibold">{item.name}</Text>
              </Card>
            </Pressable>
          )}
        />
      ) : mainTab === 'groups' && selectedGroupId ? (
        <View className="flex-1">
          <Pressable
            onPress={() => setSelectedGroupId(null)}
            className="flex-row items-center px-4 py-2"
          >
            <ChevronLeft color="#F8FAFC" size={24} />
            <Text className="text-primary ml-1">{t('common.back')}</Text>
          </Pressable>
          <FlatList
            data={data}
            keyExtractor={(item: { id: string }) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            ListEmptyComponent={
              isLoading ? null : <Text className="text-muted text-center">{t('feed.empty')}</Text>
            }
            renderItem={({ item, index }: { item: { id: string; display_name: string; username: string; avatar_url: string | null; total_aura: number; yearly_aura: number }; index: number }) => (
              <Pressable onPress={() => router.push(`/(main)/user/${item.id}`)}>
                <Card className="mb-2 flex-row items-center gap-3">
                  <Text className="text-muted w-6 text-lg font-bold">#{index + 1}</Text>
                  <Avatar url={item.avatar_url} name={item.display_name} size={40} />
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{item.display_name}</Text>
                    <Text className="text-muted text-xs">@{item.username}</Text>
                  </View>
                  <Text className="text-primary font-black">{aura(item)}</Text>
                </Card>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            isLoading ? null : <Text className="text-muted text-center">{t('feed.empty')}</Text>
          }
          renderItem={({ item, index }: { item: { id: string; display_name: string; username: string; avatar_url: string | null; total_aura: number; yearly_aura: number }; index: number }) => (
            <Pressable onPress={() => router.push(`/(main)/user/${item.id}`)}>
              <Card className="mb-2 flex-row items-center gap-3">
                <Text className="text-muted w-6 text-lg font-bold">#{index + 1}</Text>
                <Avatar url={item.avatar_url} name={item.display_name} size={40} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{item.display_name}</Text>
                  <Text className="text-muted text-xs">@{item.username}</Text>
                </View>
                <Text className="text-primary font-black">{aura(item)}</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
