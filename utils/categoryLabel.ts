import type { QuestCategory } from '@/constants/categories';

const LABELS_EN: Record<QuestCategory, string> = {
  fitness: 'Fitness',
  outdoors: 'Outdoors',
  social: 'Social',
  creativity: 'Creativity',
  travel: 'Travel',
  food: 'Food',
  learning: 'Learning',
  random: 'Random / Fun',
  personal_growth: 'Personal Growth',
};

const LABELS_ES: Record<QuestCategory, string> = {
  fitness: 'Fitness',
  outdoors: 'Aire libre',
  social: 'Social',
  creativity: 'Creatividad',
  travel: 'Viajes',
  food: 'Comida',
  learning: 'Aprendizaje',
  random: 'Random / Diversión',
  personal_growth: 'Crecimiento personal',
};

/** Human-readable category from DB slug */
export function formatCategoryLabel(category: string, lang: string): string {
  const lng = lang.startsWith('es') ? 'es' : 'en';
  const map = lng === 'es' ? LABELS_ES : LABELS_EN;
  if (category in map) return map[category as QuestCategory];
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
