import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStepShell } from '@/components/onboarding/OnboardingStepShell';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { QUEST_CATEGORIES, type QuestCategory } from '@/constants/categories';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { appLang } from '@/utils/lang';
import { useOnboardingStore } from '@/stores/onboardingStore';

const TOTAL = 6;

export default function CategoriesOnboarding() {
  const { t, i18n } = useTranslation();
  const lang = appLang(i18n);
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
          <PressableScale
            key={c}
            onPress={() => toggle(c)}
            scaleValue={0.95}
            hitSlop={4}
            className={`px-4 py-3 rounded-full ${
              draft.preferredCategories.includes(c) ? 'bg-foreground' : 'bg-surfaceElevated'
            }`}
          >
            <Text className={`text-sm font-medium ${draft.preferredCategories.includes(c) ? 'text-background' : 'text-mutedForeground'}`}>{formatCategoryLabel(c, lang)}</Text>
          </PressableScale>
        ))}
      </View>
    </OnboardingStepShell>
  );
}
