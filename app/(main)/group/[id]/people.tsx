import { useLocalSearchParams, useRouter } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { colors } from '@/constants/theme';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useFriendsList } from '@/hooks/useFriends';
import {
  useGroupDetail,
  useGroupMembers,
  useGroupPendingInviteeIds,
  useInviteToGroup,
  useMyGroupPermissions,
  useRemoveGroupMember,
  useUpdateGroupMemberRole,
} from '@/hooks/useGroups';
import { useInfiniteEndReached } from '@/hooks/useInfiniteEndReached';
import { useAuth } from '@/providers/AuthProvider';
import type { GroupMemberWithProfile } from '@/services/groups';

export default function GroupPeopleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data, isLoading, isError } = useGroupDetail(id);
  const { canAdmin } = useMyGroupPermissions(id, uid);
  const membersQuery = useGroupMembers(id);
  const { data: membersData, isFetchingNextPage } = membersQuery;
  const { data: friends = [] } = useFriendsList(uid);
  const { data: pendingInviteeIds = [] } = useGroupPendingInviteeIds(id, uid);
  const pendingInviteeSet = useMemo(() => new Set(pendingInviteeIds), [pendingInviteeIds]);
  const invite = useInviteToGroup();
  const removeMember = useRemoveGroupMember(id);
  const updateRole = useUpdateGroupMemberRole(id);

  const members = useMemo<GroupMemberWithProfile[]>(
    () => membersData?.pages.flatMap((p) => p.rows) ?? [],
    [membersData],
  );
  const memberCount = members.length;
  const memberIds = useMemo(() => new Set(members.map((m) => m.user_id)), [members]);

  const onEndReached = useInfiniteEndReached(membersQuery);

  const openMemberActions = useCallback(
    (member: GroupMemberWithProfile) => {
      if (!canAdmin || member.role === 'owner' || member.user_id === uid) return;
      const name = member.profiles?.display_name ?? member.profiles?.username ?? '';
      const toggleRoleLabel =
        member.role === 'admin' ? t('groups.demoteToMember') : t('groups.promoteToAdmin');
      Alert.alert(t('groups.memberActionsTitle'), name, [
        {
          text: toggleRoleLabel,
          onPress: () =>
            updateRole.mutate({
              userId: member.user_id,
              role: member.role === 'admin' ? 'member' : 'admin',
            }),
        },
        {
          text: t('groups.removeMember'),
          style: 'destructive',
          onPress: () =>
            Alert.alert(t('groups.removeMember'), t('groups.removeConfirmBody', { name }), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('groups.removeMember'),
                style: 'destructive',
                onPress: () => removeMember.mutate({ userId: member.user_id }),
              },
            ]),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    },
    [canAdmin, uid, t, updateRole, removeMember],
  );

  const renderMember = useCallback(
    ({ item: m }: { item: GroupMemberWithProfile }) => {
      const canActOn = canAdmin && m.role !== 'owner' && m.user_id !== uid;
      return (
        <View className="flex-row items-center gap-2">
          <Pressable className="flex-1" onPress={() => router.push(`/(main)/user/${m.user_id}`)}>
            <Card className="mb-3 flex-row items-center gap-3 py-3">
              <Avatar url={m.profiles?.avatar_url} name={m.profiles?.display_name ?? '?'} size={48} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">
                  {m.profiles?.display_name ?? m.profiles?.username ?? ''}
                </Text>
                <Text className="text-muted text-xs mt-1">
                  {m.role === 'owner'
                    ? t('groups.memberOwner')
                    : m.role === 'admin'
                      ? t('groups.memberAdmin')
                      : m.role}
                </Text>
              </View>
            </Card>
          </Pressable>
          {canActOn ? (
            <PressableScale
              onPress={() => openMemberActions(m)}
              className="p-2.5 mb-3"
              hitSlop={8}
              scaleValue={0.9}
              accessibilityLabel={t('groups.memberActionsTitle')}
            >
              <MoreHorizontal color={colors.muted} size={22} strokeWidth={2} />
            </PressableScale>
          ) : null}
        </View>
      );
    },
    [canAdmin, uid, router, t, openMemberActions],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('groups.people')} />
        <View className="p-4 gap-3">
          <Skeleton width="100%" height={64} rounded="lg" />
          <Skeleton width="100%" height={64} rounded="lg" />
          <Skeleton width="100%" height={64} rounded="lg" />
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('common.error')} />
        <ErrorState title={t('common.error')} subtitle={t('common.errorSubtitle')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('groups.people')} />

      <FlatList
        data={members}
        keyExtractor={(item) => item.user_id}
        renderItem={renderMember}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        ListHeaderComponent={
          <>
            <Text className="text-muted text-sm mb-4">
              {t('groups.peopleSubtitle', { count: memberCount })}
            </Text>

            <Text className="text-foreground font-bold text-base mb-2">{t('groups.invite')}</Text>
            <Text className="text-muted text-sm mb-3">{t('groups.invitePick')}</Text>
            {friends.length === 0 ? (
              <Text className="text-muted text-sm mb-8">{t('feed.empty')}</Text>
            ) : (
              friends.map((f) => {
                const isMember = memberIds.has(f.id);
                const isInvited = pendingInviteeSet.has(f.id);
                const isSending = invite.isPending && invite.variables?.inviteeId === f.id;
                const disabled = isMember || isInvited || isSending;
                return (
                  <Pressable
                    key={f.id}
                    disabled={disabled}
                    onPress={() =>
                      invite.mutate(
                        { groupId: id, inviterId: uid, inviteeId: f.id },
                        {
                          onError: (e) => {
                            const err = e as { message?: string; code?: string } | Error;
                            const msg =
                              (err as { message?: string }).message ??
                              (e instanceof Error ? e.message : String(e));
                            const code = (err as { code?: string }).code;
                            const duplicate =
                              code === '23505' ||
                              /duplicate key|group_invites_one_pending/i.test(msg);
                            if (duplicate) return;
                            Alert.alert(t('groups.inviteFailedTitle'), msg);
                          },
                        },
                      )
                    }
                  >
                    <Card className="mb-2 flex-row items-center gap-3 py-3">
                      <Avatar url={f.avatar_url} name={f.display_name} size={40} />
                      <View className="flex-1 min-w-0">
                        <Text
                          className={
                            disabled
                              ? 'text-muted font-semibold'
                              : 'text-foreground font-semibold'
                          }
                          numberOfLines={1}
                        >
                          {f.display_name}
                        </Text>
                        <Text className="text-muted text-xs" numberOfLines={1}>
                          @{f.username}
                        </Text>
                      </View>
                      {isMember ? (
                        <Text className="text-muted text-xs font-semibold">
                          {t('groups.alreadyMember')}
                        </Text>
                      ) : isInvited ? (
                        <View
                          className="rounded-full px-2.5 py-1"
                          style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}
                        >
                          <Text className="text-primary text-xs font-bold">
                            {t('groups.invited')}
                          </Text>
                        </View>
                      ) : isSending ? (
                        <ActivityIndicator color={colors.primary} size="small" />
                      ) : (
                        <Text className="text-primary text-xs font-bold">
                          {t('groups.invite').toUpperCase()}
                        </Text>
                      )}
                    </Card>
                  </Pressable>
                );
              })
            )}

            <Text className="text-foreground font-bold text-base mt-8 mb-3">
              {t('groups.members')} ({memberCount})
            </Text>
          </>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
      />
    </View>
  );
}
