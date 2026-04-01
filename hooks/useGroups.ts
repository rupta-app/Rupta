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

export function useMyGroups(userId: string | undefined) {
  return useQuery({
    queryKey: ['groups', userId],
    queryFn: () => fetchMyGroups(userId!),
    enabled: Boolean(userId),
  });
}

export function useGroupDetail(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroupDetail(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useGroupLeaderboard(groupId: string | undefined, period: LeaderboardPeriod = 'all') {
  return useQuery({
    queryKey: ['group-lb', groupId, period],
    queryFn: () => groupLeaderboard(groupId!, period),
    enabled: Boolean(groupId),
  });
}

export function usePendingGroupInvites(userId: string | undefined) {
  return useQuery({
    queryKey: ['group-invites', userId],
    queryFn: () => fetchPendingGroupInvites(userId!),
    enabled: Boolean(userId),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ownerId, name, description }: { ownerId: string; name: string; description?: string }) =>
      createGroup(ownerId, name, description),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['groups'] });
      void qc.invalidateQueries({ queryKey: ['groups-owned', vars.ownerId] });
    },
  });
}

export function useInviteToGroup() {
  const qc = useQueryClient();
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
      void qc.invalidateQueries({ queryKey: ['group-invites'] });
      void qc.invalidateQueries({ queryKey: ['group', vars.groupId] });
    },
  });
}

export function useRespondGroupInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ inviteId, accept }: { inviteId: string; accept: boolean }) =>
      respondGroupInvite(inviteId, accept),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-invites'] });
      void qc.invalidateQueries({ queryKey: ['groups'] });
      void qc.invalidateQueries({ queryKey: ['group'] });
    },
  });
}

export function useGroupSettings(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-settings', groupId],
    queryFn: () => fetchGroupSettings(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useUpdateGroup(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateGroup>[1]) => {
      if (!groupId) throw new Error('No group');
      return updateGroup(groupId, patch);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group', groupId] });
      void qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroupSettings(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateGroupSettings>[1]) => {
      if (!groupId) throw new Error('No group');
      return updateGroupSettings(groupId, patch);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-settings', groupId] });
      void qc.invalidateQueries({ queryKey: ['public-groups'] });
    },
  });
}

export function usePublicGroups(search: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['public-groups', search ?? ''],
    queryFn: () => fetchPublicGroups(search),
    enabled,
  });
}

export function useJoinPublicGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) => joinPublicGroup(groupId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['groups'] });
      void qc.invalidateQueries({ queryKey: ['group'] });
      void qc.invalidateQueries({ queryKey: ['group-lb'] });
    },
  });
}
