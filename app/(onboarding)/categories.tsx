import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStepShell } from '@/components/onboarding/OnboardingStepShell';
import { Button } from '@/components/ui/Button';
import { QUEST_CATEGORIES, type QuestCategory } from '@/constants/categories';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { useOnboardingStore } from '@/stores/onboardingStore';

const TOTAL = 6;

export default function CategoriesOnboarding() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();

  const toggle = (c: QuestCategory) => {
    const has = draft.preferredCategories.includes(c);
    setDraft({
      preferredCategories: has
        ? draft.preferredCategories.filter((x) => x !== c)
        : [...draft.preferredCategories, c],
    });
  };

  return (
    <OnboardingStepShell
      step={4}
      totalSteps={TOTAL}
      title={t('onboarding.categories')}
      subtitle={t('onboarding.categoriesHint')}
      footer={
        <Button onPress={() => router.push('/(onboarding)/activity-style')}>{t('common.continue')}</Button>
      }
    >
      <View className="flex-row flex-wrap gap-2.5">
        {QUEST_CATEGORIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => toggle(c)}
            className={`px-4 py-3 rounded-full border ${
              draft.preferredCategories.includes(c) ? 'border-primary bg-primary/20' : 'border-border bg-surface'
            }`}
          >
            <Text className="text-foreground text-sm font-medium">{formatCategoryLabel(c, lang)}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingStepShell>
  );
}
