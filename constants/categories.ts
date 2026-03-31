export const QUEST_CATEGORIES = [
  'fitness',
  'outdoors',
  'social',
  'creativity',
  'travel',
  'food',
  'learning',
  'random',
  'personal_growth',
] as const;

export type QuestCategory = (typeof QUEST_CATEGORIES)[number];

export const ACTIVITY_STYLES = [
  'solo',
  'friends',
  'outdoors',
  'low_budget',
  'adrenaline',
  'creative',
  'fitness',
  'travel',
] as const;

export type ActivityStyle = (typeof ACTIVITY_STYLES)[number];
