import type { LucideIcon } from 'lucide-react-native';
import {
  Dumbbell,
  Mountain,
  Users,
  Palette,
  Plane,
  UtensilsCrossed,
  BookOpen,
  Sparkles,
  Brain,
} from 'lucide-react-native';

export const CATEGORY_CONFIG: Record<string, { icon: LucideIcon; accent: string; bg: string }> = {
  fitness: { icon: Dumbbell, accent: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  outdoors: { icon: Mountain, accent: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  social: { icon: Users, accent: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  creativity: { icon: Palette, accent: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  travel: { icon: Plane, accent: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  food: { icon: UtensilsCrossed, accent: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  learning: { icon: BookOpen, accent: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  random: { icon: Sparkles, accent: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  personal_growth: { icon: Brain, accent: '#2DD4A0', bg: 'rgba(45,212,160,0.12)' },
};

export const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
  legendary: '#A78BFA',
};

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
