import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserPlus, Users } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { UserListItem } from '@/components/social/UserListItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors } from '@/constants/theme';
import { useFriendsList } from '@/hooks/useFriends';
import { usePendingGroupInvites, useRespondGroupInvite } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

type HubTab = 'friends' | 'groups';

export default function FriendsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const [tab, setTab] = useState<HubTab>('friends');
  const { data: friends = [] } = useFriendsList(uid);
  const { data: invites = [], isLoading: invitesLoading } = usePendingGroupInvites(uid);
  const respond = useRespondGroupInvite();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={t('friends.hubTitle')}
        right={
          <Button
            variant="ghost"
            onPress={() =>
              router.push(tab === 'friends' ? '/(main)/find-people' : '/(main)/unified-search')
            }
          >
            {tab === 'friends' ? t('friends.searchUsers') : t('search.title')}
          </Button>
        }
      />

      <View className="px-4 pt-2 pb-3 flex-row gap-2">
        <PressableScale
          onPress={() => setTab('friends')}
          className={`flex-1 py-2.5 rounded-xl items-center ${tab === 'friends' ? 'bg-foreground' : 'bg-surfaceElevated'}`}
          scaleValue={0.96}
        >
          <Text className={`font-semibold ${tab === 'friends' ? 'text-background' : 'text-mutedForeground'}`}>
            {t('friends.title')}
          </Text>
        </PressableScale>
        <PressableScale
          onPress={() => setTab('groups')}
          className={`flex-1 py-2.5 rounded-xl items-center ${tab === 'groups' ? 'bg-foreground' : 'bg-surfaceElevated'}`}
          scaleValue={0.96}
        >
          <Text className={`font-semibold ${tab === 'groups' ? 'text-background' : 'text-mutedForeground'}`}>
            {t('tabs.groups')}
          </Text>
        </PressableScale>
      </View>

      {tab === 'friends' ? (
        <FlatList
          className="flex-1"
          data={friends}
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          ListHeaderComponent={
            <Button variant="secondary" className="mb-4" onPress={() => router.push('/(main)/friend-requests')}>
              {t('friends.requests')}
            </Button>
          }
          ListEmptyComponent={
            <EmptyState
              icon={UserPlus}
              title={t('empty.noFriends')}
              action={{ label: t('friends.searchUsers'), onPress: () => router.push('/(main)/find-people') }}
            />
          }
          renderItem={({ item }: { item: { id: string; display_name: string; username: string; avatar_url: string | null; total_aura: number } }) => (
            <UserListItem
              user={item}
              onPress={() => router.push(`/(main)/user/${item.id}`)}
              right={<Text className="text-primary font-bold">{item.total_aura}</Text>}
            />
          )}
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 48, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {invitesLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : invites.length > 0 ? (
            <>
              <Text className="text-muted text-xs uppercase tracking-wide mb-2">{t('groups.invitesSection')}</Text>
              {invites.map(
                (inv: { id: string; groups?: { name: string }; inviter?: { username: string } }) => (
                  <Card key={inv.id} className="mb-2 flex-row items-center justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-foreground font-semibold">{inv.groups?.name}</Text>
                      <Text className="text-muted text-xs">from @{inv.inviter?.username}</Text>
                    </View>
                    <View className="gap-1">
                      <Button className="py-1 px-2 min-h-0" onPress={() => respond.mutate({ inviteId: inv.id, accept: true })}>
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
            </>
          ) : (
            <EmptyState
              icon={Users}
              title={t('friends.noGroupInvitesTitle')}
              subtitle={t('friends.noGroupInvitesBody')}
            />
          )}

          <Button variant="secondary" className="mt-6" onPress={() => router.push('/(main)/(tabs)/groups')}>
            {t('friends.openGroupsTab')}
          </Button>
        </ScrollView>
      )}
    </View>
  );
}
