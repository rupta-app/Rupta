import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStepShell } from '@/components/onboarding/OnboardingStepShell';
import { Button } from '@/components/ui/Button';
import { ACTIVITY_STYLES } from '@/constants/categories';
import { useOnboardingStore } from '@/stores/onboardingStore';

const TOTAL = 6;

export default function ActivityStyleOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();

  const toggle = (s: string) => {
    const has = draft.activityStyles.includes(s);
    setDraft({
      activityStyles: has ? draft.activityStyles.filter((x) => x !== s) : [...draft.activityStyles, s],
    });
  };

  return (
    <OnboardingStepShell
      step={5}
      totalSteps={TOTAL}
      title={t('onboarding.activityStyle')}
      subtitle={t('onboarding.activityHint')}
      footer={<Button onPress={() => router.push('/(onboarding)/bio')}>{t('common.continue')}</Button>}
    >
      <View className="flex-row flex-wrap gap-2.5">
        {ACTIVITY_STYLES.map((s) => (
          <Pressable
            key={s}
            onPress={() => toggle(s)}
            className={`px-4 py-3 rounded-full border ${
              draft.activityStyles.includes(s) ? 'border-secondary bg-secondary/15' : 'border-border bg-surface'
            }`}
          >
            <Text className="text-foreground text-sm font-medium">{s.replace(/_/g, ' ')}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingStepShell>
  );
}
