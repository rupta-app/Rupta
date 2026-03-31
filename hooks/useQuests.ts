import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { QuestFilters } from '@/services/quests';
import {
  fetchLifeListQuests,
  fetchQuestById,
  fetchQuests,
  fetchSavedQuestIds,
  toggleSavedQuest,
} from '@/services/quests';

export function useQuests(filters: QuestFilters) {
  return useQuery({
    queryKey: ['quests', filters],
    queryFn: () => fetchQuests(filters),
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: ['quest', id],
    queryFn: () => fetchQuestById(id),
    enabled: Boolean(id),
  });
}

export function useSavedQuestIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved-quests', userId],
    queryFn: () => fetchSavedQuestIds(userId!),
    enabled: Boolean(userId),
  });
}

export function useToggleSave(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questId, currentlySaved }: { questId: string; currentlySaved: boolean }) => {
      if (!userId) throw new Error('No user');
      await toggleSavedQuest(userId, questId, currentlySaved);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['saved-quests', userId] });
      void qc.invalidateQueries({ queryKey: ['life-list', userId] });
    },
  });
}

export function useLifeList(userId: string | undefined) {
  return useQuery({
    queryKey: ['life-list', userId],
    queryFn: () => fetchLifeListQuests(userId!),
    enabled: Boolean(userId),
  });
}
