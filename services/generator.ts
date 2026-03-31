import type { QuestRow } from '@/services/quests';

export type GeneratorInput = {
  cost_range: 'free' | 'low' | 'medium' | 'high' | 'any';
  solo: boolean;
  location_type: 'indoor' | 'outdoor' | 'any';
  energy?: 'low' | 'medium' | 'high';
  category?: string;
  cityHint?: string;
};

/** Deterministic pick from catalog — no LLM, no hallucinations */
export function pickQuestFromCatalog(quests: QuestRow[], input: GeneratorInput): QuestRow | null {
  const list = quests.filter((q) => {
    if (input.cost_range !== 'any' && q.cost_range !== input.cost_range) {
      const tiers = ['free', 'low', 'medium', 'high'];
      const want = tiers.indexOf(input.cost_range);
      const got = tiers.indexOf(q.cost_range);
      if (want >= 0 && got >= 0 && Math.abs(want - got) > 1) return false;
    }
    if (input.location_type !== 'any' && q.location_type !== 'any' && q.location_type !== input.location_type) {
      return false;
    }
    if (input.category && q.category !== input.category) return false;
    if (input.solo) {
      if (q.category === 'social' && q.difficulty === 'hard') return false;
    }
    if (input.energy === 'low' && (q.difficulty === 'hard' || q.difficulty === 'legendary')) return false;
    if (input.energy === 'high' && q.difficulty === 'easy') return false;
    return true;
  });

  if (list.length === 0) return quests[Math.floor(Math.random() * quests.length)] ?? null;
  return list[Math.floor(Math.random() * list.length)] ?? null;
}
