import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LeaderboardPeriod } from '@/services/leaderboard';
import type { GroupRole } from '@/types/database';
import {
  createGroup,
  deleteGroup,
  fetchGroupDetail,
  fetchGroupLeaderboard,
  fetchGroupMembersPage,
  fetchGroupPendingInviteeIds,
  fetchGroupSettings,
  fetchMyGroupRole,
  fetchMyGroups,
  fetchPendingGroupInvites,
  fetchPublicGroupsPage,
  GROUP_MEMBERS_PAGE_SIZE,
  inviteToGroup,
  joinPublicGroup,
  leaveGroup,
  PUBLIC_GROUPS_PAGE_SIZE,
  removeGroupMember,
  respondGroupInvite,
  updateGroup,
  updateGroupMemberRole,
  updateGroupSettings,
} from '@/services/groups';
import { qk } from '@/hooks/queryKeys';

export function useMyGroups(userId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.mine(userId ?? ''),
    queryFn: () => fetchMyGroups(userId!),
    enabled: Boolean(userId),
  });
}

export function useGroupDetail(groupId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.detail(groupId ?? ''),
    queryFn: () => fetchGroupDetail(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useMyGroupRole(groupId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.myRole(groupId ?? '', userId ?? ''),
    queryFn: () => fetchMyGroupRole(groupId!, userId!),
    enabled: Boolean(groupId && userId),
  });
}

export function useMyGroupPermissions(groupId: string | undefined, userId: string | undefined) {
  const { data: role } = useMyGroupRole(groupId, userId);
  return {
    role: role ?? null,
    isOwner: role === 'owner',
    canAdmin: role === 'owner' || role === 'admin',
  };
}

export function useGroupMembers(groupId: string | undefined) {
  return useInfiniteQuery({
    queryKey: qk.groups.members(groupId ?? ''),
    queryFn: ({ pageParam = 0 }) => fetchGroupMembersPage(groupId!, pageParam, GROUP_MEMBERS_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + GROUP_MEMBERS_PAGE_SIZE : undefined,
    enabled: Boolean(groupId),
  });
}

export function useGroupLeaderboard(groupId: string | undefined, period: LeaderboardPeriod = 'all') {
  return useQuery({
    queryKey: qk.groups.lb(groupId ?? '', period),
    queryFn: () => fetchGroupLeaderboard(groupId!, period),
    enabled: Boolean(groupId),
  });
}

export function usePendingGroupInvites(userId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.invites(userId ?? ''),
    queryFn: () => fetchPendingGroupInvites(userId!),
    enabled: Boolean(userId),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerId, name, description }: { ownerId: string; name: string; description?: string }) =>
      createGroup(ownerId, name, description),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
      void queryClient.invalidateQueries({ queryKey: qk.groups.owned(vars.ownerId) });
    },
  });
}

export function useGroupPendingInviteeIds(
  groupId: string | undefined,
  inviterId: string | undefined,
) {
  return useQuery({
    queryKey: qk.groups.pendingInvitees(groupId ?? '', inviterId ?? ''),
    queryFn: () => fetchGroupPendingInviteeIds(groupId!, inviterId!),
    enabled: Boolean(groupId && inviterId),
  });
}

export function useInviteToGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      inviterId,
      inviteeId,
    }: {
      groupId: string;
      inviterId: string;
      inviteeId: string;
    }) => inviteToGroup(groupId, inviterId, inviteeId),
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.invitesAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(vars.groupId) });
      void queryClient.invalidateQueries({
        queryKey: qk.groups.pendingInvitees(vars.groupId, vars.inviterId),
      });
    },
  });
}

export function useRespondGroupInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inviteId, accept }: { inviteId: string; accept: boolean }) =>
      respondGroupInvite(inviteId, accept),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.invitesAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
      void queryClient.invalidateQueries({ queryKey: qk.groups.detailAll });
      void queryClient.invalidateQueries({ queryKey: qk.notifications.prefix });
    },
  });
}

export function useGroupSettings(groupId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.settings(groupId ?? ''),
    queryFn: () => fetchGroupSettings(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useUpdateGroup(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateGroup>[1]) => {
      if (!groupId) throw new Error('No group');
      return updateGroup(groupId, patch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.detail(groupId!) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
    },
  });
}

export function useUpdateGroupSettings(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateGroupSettings>[1]) => {
      if (!groupId) throw new Error('No group');
      return updateGroupSettings(groupId, patch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.settings(groupId!) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.publicAll });
    },
  });
}

export function usePublicGroups(search: string | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: qk.groups.public(search ?? ''),
    queryFn: ({ pageParam = 0 }) => fetchPublicGroupsPage(search, pageParam, PUBLIC_GROUPS_PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? lastPageParam + PUBLIC_GROUPS_PAGE_SIZE : undefined,
    enabled,
  });
}

export function useJoinPublicGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => joinPublicGroup(groupId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
      void queryClient.invalidateQueries({ queryKey: qk.groups.detailAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.lbAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.publicAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.membersAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.myRoleAll });
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => leaveGroup(groupId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
      void queryClient.invalidateQueries({ queryKey: qk.groups.detailAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.lbAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.publicAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.membersAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.myRoleAll });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) => deleteGroup(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.all });
      void queryClient.invalidateQueries({ queryKey: qk.groups.detailAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.publicAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.membersAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.myRoleAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.lbAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.questsAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.challengesAll });
      void queryClient.invalidateQueries({ queryKey: qk.feed.groupAll });
    },
  });
}

export function useRemoveGroupMember(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      if (!groupId) throw new Error('No group');
      return removeGroupMember(groupId, userId);
    },
    onSuccess: () => {
      if (!groupId) return;
      void queryClient.invalidateQueries({ queryKey: qk.groups.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.lbAll });
      void queryClient.invalidateQueries({ queryKey: qk.groups.myRoleAll });
    },
  });
}

export function useUpdateGroupMemberRole(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Exclude<GroupRole, 'owner'> }) => {
      if (!groupId) throw new Error('No group');
      return updateGroupMemberRole(groupId, userId, role);
    },
    onSuccess: () => {
      if (!groupId) return;
      void queryClient.invalidateQueries({ queryKey: qk.groups.members(groupId) });
      void queryClient.invalidateQueries({ queryKey: qk.groups.myRoleAll });
    },
  });
}
