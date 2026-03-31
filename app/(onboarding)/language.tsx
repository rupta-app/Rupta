import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStepShell } from '@/components/onboarding/OnboardingStepShell';
import { Button } from '@/components/ui/Button';
import { setAppLanguage, type AppLanguage } from '@/i18n';
import { useOnboardingStore } from '@/stores/onboardingStore';

const opts: { k: AppLanguage; label: string }[] = [
  { k: 'en', label: 'English' },
  { k: 'es', label: 'Español' },
];

const TOTAL = 6;

export default function LanguageOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();

  return (
    <OnboardingStepShell
      step={1}
      totalSteps={TOTAL}
      title={t('onboarding.language')}
      subtitle={t('onboarding.languageHint')}
      footer={
        <Button onPress={() => router.push('/(onboarding)/profile-setup')}>{t('common.continue')}</Button>
      }
    >
      <View className="flex-row flex-wrap gap-3">
        {opts.map((o) => (
          <Pressable
            key={o.k}
            onPress={() => {
              setDraft({ language: o.k });
              setAppLanguage(o.k);
            }}
            className={`flex-1 min-w-[44%] px-5 py-4 rounded-2xl border-2 ${
              draft.language === o.k ? 'border-primary bg-primary/15' : 'border-border bg-surface'
            }`}
          >
            <Text className="text-foreground font-semibold text-center text-base">{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </OnboardingStepShell>
  );
}
