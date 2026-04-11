import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { GroupCard } from '@/components/social/GroupCard';
import { colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  useJoinPublicGroup,
  useMyGroups,
  usePendingGroupInvites,
  usePublicGroups,
  useRespondGroupInvite,
} from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

export default function GroupsTabScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: groups = [], isLoading } = useMyGroups(uid);
  const { data: invites = [] } = usePendingGroupInvites(uid);
  const respond = useRespondGroupInvite();
  const [searchPublic, setSearchPublic] = useState('');
  const [showPublic, setShowPublic] = useState(false);
  const { data: publicGroups = [], isLoading: loadingPublic } = usePublicGroups(
    searchPublic || undefined,
    showPublic,
  );
  const joinPublic = useJoinPublicGroup();

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="groups" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 pt-4 flex-row gap-2">
          <Button className="flex-1" onPress={() => router.push('/(main)/create-group')}>
            {t('groups.create')}
          </Button>
          <Button variant="secondary" className="flex-1" onPress={() => setShowPublic((s) => !s)}>
            {showPublic ? t('common.cancel') : t('groups.joinPublic')}
          </Button>
        </View>

        {showPublic ? (
          <View className="px-4 pt-4">
            <Input
              value={searchPublic}
              onChangeText={setSearchPublic}
              placeholder={t('groups.searchPublicPlaceholder')}
            />
            {loadingPublic ? (
              <ActivityIndicator color={colors.primary} className="mt-4" />
            ) : (
              <FlatList
                scrollEnabled={false}
                data={publicGroups}
                keyExtractor={(g: { id: string }) => g.id}
                ListEmptyComponent={
                  <Text className="text-muted text-center mt-4">{t('groups.noPublicGroups')}</Text>
                }
                renderItem={({
                  item,
                }: {
                  item: { id: string; name: string; description: string | null; avatar_url?: string | null };
                }) => (
                  <GroupCard
                    group={item}
                    right={
                      <Button
                        className="min-h-0 py-1 px-3"
                        loading={joinPublic.isPending}
                        onPress={() =>
                          uid &&
                          joinPublic.mutate(
                            { groupId: item.id, userId: uid },
                            { onSuccess: () => router.push(`/(main)/group/${item.id}`) },
                          )
                        }
                      >
                        {t('groups.join')}
                      </Button>
                    }
                  />
                )}
              />
            )}
          </View>
        ) : null}

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
          <Text className="text-foreground text-lg font-bold mb-3">{t('groups.myGroups')}</Text>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <FlatList
              scrollEnabled={false}
              data={groups}
              keyExtractor={(item: { id: string }) => item.id}
              ListEmptyComponent={<Text className="text-muted text-center mt-4">{t('groups.emptyMyGroups')}</Text>}
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
    </View>
  );
}
