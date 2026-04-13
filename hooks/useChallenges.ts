import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completeChallenge,
  countActiveChallengesInGroup,
  createChallenge,
  fetchChallengeById,
  fetchChallengeLeaderboard,
  fetchGroupChallenges,
  type CreateChallengeInput,
} from '@/services/challenges';
import { qk } from '@/hooks/queryKeys';

export function useGroupChallengesList(groupId: string | undefined) {
  return useQuery({
    queryKey: qk.groups.challenges(groupId ?? ''),
    queryFn: () => fetchGroupChallenges(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useChallenge(challengeId: string | undefined) {
  return useQuery({
    queryKey: qk.challenges.detail(challengeId ?? ''),
    queryFn: () => fetchChallengeById(challengeId!),
    enabled: Boolean(challengeId),
  });
}

export function useChallengeLeaderboard(challengeId: string | undefined) {
  return useQuery({
    queryKey: qk.challenges.lb(challengeId ?? ''),
    queryFn: () => fetchChallengeLeaderboard(challengeId!),
    enabled: Boolean(challengeId),
  });
}

export function useActiveChallengeCount(groupId: string | undefined) {
  return useQuery({
    queryKey: qk.challenges.activeCount(groupId ?? ''),
    queryFn: () => countActiveChallengesInGroup(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useCreateChallenge(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ creatorId, input }: { creatorId: string; input: CreateChallengeInput }) =>
      createChallenge(groupId!, creatorId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.challenges(groupId ?? '') });
      void queryClient.invalidateQueries({ queryKey: qk.challenges.activeCount(groupId ?? '') });
    },
  });
}

export function useCompleteChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => completeChallenge(challengeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.groups.challengesAll });
      void queryClient.invalidateQueries({ queryKey: qk.challenges.detailAll });
    },
  });
}
