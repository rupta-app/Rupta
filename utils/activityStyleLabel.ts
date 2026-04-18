import type { ActivityStyle } from '@/constants/categories';

const LABELS_EN: Record<ActivityStyle, string> = {
  solo: 'Solo',
  friends: 'With friends',
  outdoors: 'Outdoors',
  low_budget: 'Low budget',
  adrenaline: 'Adrenaline',
  creative: 'Creative',
  fitness: 'Fitness',
  travel: 'Travel',
};

const LABELS_ES: Record<ActivityStyle, string> = {
  solo: 'Solo',
  friends: 'Con amigos',
  outdoors: 'Aire libre',
  low_budget: 'Bajo presupuesto',
  adrenaline: 'Adrenalina',
  creative: 'Creativo',
  fitness: 'Fitness',
  travel: 'Viajes',
};

/** Human-readable activity style from DB slug */
export function formatActivityStyleLabel(style: string, lang: string): string {
  const lng = lang.startsWith('es') ? 'es' : 'en';
  const map = lng === 'es' ? LABELS_ES : LABELS_EN;
  if (style in map) return map[style as ActivityStyle];
  return style.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
