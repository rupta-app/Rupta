import { create } from 'zustand';

import type { QuestCategory } from '@/constants/categories';
import type { AppLanguage } from '@/i18n';

export type OnboardingDraft = {
  language: AppLanguage;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string;
  dateOfBirth: string;
  preferredCategories: QuestCategory[];
  activityStyles: string[];
  bio: string;
};

const initial: OnboardingDraft = {
  language: 'en',
  username: '',
  displayName: '',
  avatarUrl: null,
  city: '',
  dateOfBirth: '',
  preferredCategories: [],
  activityStyles: [],
  bio: '',
};

export const useOnboardingStore = create<{
  draft: OnboardingDraft;
  setDraft: (p: Partial<OnboardingDraft>) => void;
  reset: () => void;
}>((set) => ({
  draft: initial,
  setDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
  reset: () => set({ draft: initial }),
}));
