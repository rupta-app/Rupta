import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStepShell } from '@/components/onboarding/OnboardingStepShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOnboardingStore } from '@/stores/onboardingStore';

const TOTAL = 6;

export default function PersonalInfoOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();

  return (
    <OnboardingStepShell
      step={3}
      totalSteps={TOTAL}
      title={t('onboarding.personalInfo')}
      subtitle={t('onboarding.personalHint')}
      footer={
        <Button onPress={() => router.push('/(onboarding)/categories')}>{t('common.continue')}</Button>
      }
    >
      <View>
        <Input label={t('onboarding.city')} value={draft.city} onChangeText={(v) => setDraft({ city: v })} />
        <Input
          label={t('onboarding.dob')}
          value={draft.dateOfBirth}
          onChangeText={(v) => setDraft({ dateOfBirth: v })}
          placeholder="YYYY-MM-DD"
        />
      </View>
    </OnboardingStepShell>
  );
}
