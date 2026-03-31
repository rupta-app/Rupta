import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createGroup,
  fetchGroupDetail,
  fetchMyGroups,
  fetchPendingGroupInvites,
  groupLeaderboard,
  inviteToGroup,
  respondGroupInvite,
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

export function useGroupLeaderboard(groupId: string | undefined, mode: 'total' | 'yearly' = 'total') {
  return useQuery({
    queryKey: ['group-lb', groupId, mode],
    queryFn: () => groupLeaderboard(groupId!, mode),
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['groups'] });
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-invites'] });
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
