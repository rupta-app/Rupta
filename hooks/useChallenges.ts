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

export function useGroupChallengesList(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-challenges', groupId],
    queryFn: () => fetchGroupChallenges(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useChallenge(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => fetchChallengeById(challengeId!),
    enabled: Boolean(challengeId),
  });
}

export function useChallengeLeaderboard(challengeId: string | undefined) {
  return useQuery({
    queryKey: ['challenge-lb', challengeId],
    queryFn: () => fetchChallengeLeaderboard(challengeId!),
    enabled: Boolean(challengeId),
  });
}

export function useActiveChallengeCount(groupId: string | undefined) {
  return useQuery({
    queryKey: ['active-challenges-count', groupId],
    queryFn: () => countActiveChallengesInGroup(groupId!),
    enabled: Boolean(groupId),
  });
}

export function useCreateChallenge(groupId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ creatorId, input }: { creatorId: string; input: CreateChallengeInput }) =>
      createChallenge(groupId!, creatorId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-challenges', groupId] });
      void qc.invalidateQueries({ queryKey: ['active-challenges-count', groupId] });
    },
  });
}

export function useCompleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) => completeChallenge(challengeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-challenges'] });
      void qc.invalidateQueries({ queryKey: ['challenge'] });
    },
  });
}
