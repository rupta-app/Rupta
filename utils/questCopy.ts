import type { QuestRow } from '@/services/quests';

export function questTitle(q: Pick<QuestRow, 'title_en' | 'title_es'>, lang: string) {
  return lang === 'es' ? q.title_es : q.title_en;
}

export function questDescription(q: Pick<QuestRow, 'description_en' | 'description_es'>, lang: string) {
  return lang === 'es' ? q.description_es : q.description_en;
}
