import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { DiscoverGroupsPanel } from '@/components/social/DiscoverGroupsPanel';
import { GroupCard } from '@/components/social/GroupCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedTabBar } from '@/components/ui/SegmentedTabBar';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useMyGroups, usePendingGroupInvites, useRespondGroupInvite } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

type GroupsTab = 'mine' | 'discover';

export default function GroupsTabScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: groups = [], isLoading } = useMyGroups(uid);
  const { data: invites = [] } = usePendingGroupInvites(uid);
  const respond = useRespondGroupInvite();

  const [tab, setTab] = useState<GroupsTab>('mine');

  const tabs = useMemo(
    () =>
      [
        { key: 'mine' as const, label: t('groups.myGroups') },
        { key: 'discover' as const, label: t('groups.discover') },
      ] satisfies { key: GroupsTab; label: string }[],
    [t],
  );

  const onTabChange = useCallback((next: GroupsTab) => setTab(next), []);
  const goDiscover = useCallback(() => setTab('discover'), []);

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="groups" />
      <View className="bg-background pb-1">
        <SegmentedTabBar tabs={tabs} active={tab} onChange={onTabChange} />
      </View>

      {tab === 'mine' ? (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1" key="mine">
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
            <View className="px-4 pt-4">
              <Button onPress={() => router.push('/(main)/create-group')}>
                {t('groups.create')}
              </Button>
            </View>

            {invites.length > 0 ? (
              <View className="px-4 pt-6">
                <Text className="text-muted text-xs uppercase mb-2">{t('groups.invitesSection')}</Text>
                {invites.map(
                  (inv: { id: string; groups?: { name: string }; inviter?: { username: string } }) => (
                    <Card key={inv.id} className="mb-2 flex-row items-center justify-between">
                      <View className="flex-1 pr-2">
                        <Text className="text-foreground font-semibold">{inv.groups?.name}</Text>
                        <Text className="text-muted text-xs">from @{inv.inviter?.username}</Text>
                      </View>
                      <View className="gap-1">
                        <Button
                          className="py-1 px-2 min-h-0"
                          onPress={() => respond.mutate({ inviteId: inv.id, accept: true })}
                        >
                          {t('friends.accept')}
                        </Button>
                        <Button
                          variant="ghost"
                          className="py-1 px-2 min-h-0"
                          onPress={() => respond.mutate({ inviteId: inv.id, accept: false })}
                        >
                          {t('friends.reject')}
                        </Button>
                      </View>
                    </Card>
                  ),
                )}
              </View>
            ) : null}

            <View className="px-4 pt-6">
              {isLoading ? (
                <View className="gap-2">
                  <Skeleton width="100%" height={64} />
                  <Skeleton width="100%" height={64} />
                </View>
              ) : (
                <FlatList
                  scrollEnabled={false}
                  data={groups}
                  keyExtractor={(item: { id: string }) => item.id}
                  ListEmptyComponent={
                    <EmptyState
                      icon={Users}
                      title={t('empty.noGroups')}
                      subtitle={t('empty.noGroupsCta')}
                      action={{
                        label: t('groups.joinPublic'),
                        onPress: goDiscover,
                      }}
                    />
                  }
                  renderItem={({
                    item,
                  }: {
                    item: { id: string; name: string; description: string | null; avatar_url?: string | null };
                  }) => (
                    <GroupCard group={item} onPress={() => router.push(`/(main)/group/${item.id}`)} />
                  )}
                />
              )}
            </View>
          </ScrollView>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1" key="discover">
          <DiscoverGroupsPanel />
        </Animated.View>
      )}
    </View>
  );
}
