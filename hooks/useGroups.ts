import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { LeaderboardPeriod } from '@/services/leaderboard';
import {
  createGroup,
  fetchGroupDetail,
  fetchGroupSettings,
  fetchMyGroups,
  fetchPendingGroupInvites,
  fetchPublicGroups,
  groupLeaderboard,
  inviteToGroup,
  joinPublicGroup,
  respondGroupInvite,
  updateGroup,
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

export function useGroupLeaderboard(groupId: string | undefined, period: LeaderboardPeriod = 'all') {
  return useQuery({
    queryKey: qk.groups.lb(groupId ?? '', period),
    queryFn: () => groupLeaderboard(groupId!, period),
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
  return useQuery({
    queryKey: qk.groups.public(search ?? ''),
    queryFn: () => fetchPublicGroups(search),
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
    },
  });
}
