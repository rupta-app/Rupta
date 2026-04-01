import type { QuestRow } from '@/services/quests';

/** Max official completions allowed for this quest config; null = no hard cap (repeatable). */
export function maxCompletionsAllowed(quest: QuestRow): number | null {
  if (quest.repeatability_type === 'once') return 1;
  if (quest.repeatability_type === 'limited') return Math.max(1, quest.max_completions_per_user ?? 1);
  return null;
}

export function isAtCompletionCap(quest: QuestRow, officialCompletionCount: number): boolean {
  const max = maxCompletionsAllowed(quest);
  if (max === null) return false;
  return officialCompletionCount >= max;
}

/** For Life List %: row counts as “done” when user hit cap, or ≥1 for repeatable. */
export function isLifeListRowDone(quest: QuestRow, officialCompletionCount: number): boolean {
  if (quest.repeatability_type === 'repeatable') return officialCompletionCount >= 1;
  return isAtCompletionCap(quest, officialCompletionCount);
}

export function lifeListDoneCount(
  rows: { quest: QuestRow | undefined; quest_id: string; count: number }[],
): { done: number; total: number } {
  const total = rows.length;
  const done = rows.filter((r) => r.quest && isLifeListRowDone(r.quest, r.count)).length;
  return { done, total };
}
