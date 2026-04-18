import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingStepShell } from '@/components/onboarding/OnboardingStepShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { uploadImageToCloudflare } from '@/lib/cloudflareMedia';
import type { Database } from '@/types/database';
import { updateProfile } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';
import { useOnboardingStore } from '@/stores/onboardingStore';

const TOTAL = 6;

function isRlsError(message: string) {
  return /row-level security|violates row-level security|RLS/i.test(message);
}

export default function BioOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, profile, refreshProfile } = useAuth();
  const { draft, reset, setDraft } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const runFinish = async (tryAvatarUpload: boolean) => {
    if (!session?.user?.id || loading) return;
    setLoading(true);
    setErr('');
    try {
      let avatarUrl: string | null = profile?.avatar_url ?? null;
      const local = draft.avatarUrl;

      if (tryAvatarUpload && local?.startsWith('file')) {
        try {
          avatarUrl = await uploadImageToCloudflare(local, draft.avatarMime, 'avatar');
        } catch (uploadErr: unknown) {
          const um = uploadErr instanceof Error ? uploadErr.message : '';
          console.warn('[onboarding] avatar upload failed', uploadErr);
          setErr(um || t('errors.avatarUpload'));
          setLoading(false);
          return;
        }
      }

      const patch: Database['public']['Tables']['profiles']['Update'] = {
        username: draft.username.trim().toLowerCase(),
        display_name: draft.displayName.trim(),
        city: draft.city.trim() || null,
        date_of_birth: draft.dateOfBirth.trim() || null,
        preferred_language: draft.language,
        preferred_categories: draft.preferredCategories,
        activity_styles: draft.activityStyles,
        bio: draft.bio.trim() || null,
        onboarding_completed: true,
      };
      if (avatarUrl) {
        patch.avatar_url = avatarUrl;
      }

      await updateProfile(session.user.id, patch);
      reset();
      await refreshProfile();
      router.replace('/(main)/(tabs)/home');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      console.warn('[onboarding] finish failed', e);
      if (isRlsError(msg)) {
        setErr(t('errors.rlsOrStorage'));
      } else {
        setErr(msg || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const skipPhotoAndFinish = () => {
    setDraft({ avatarUrl: null });
    setErr('');
    void runFinish(false);
  };

  return (
    <OnboardingStepShell
      step={6}
      totalSteps={TOTAL}
      title={t('onboarding.bio')}
      subtitle={t('onboarding.bioPlaceholder')}
      footer={
        <View className="gap-2">
          <Button onPress={() => void runFinish(true)} loading={loading} disabled={loading}>
            {t('onboarding.done')}
          </Button>
          {draft.avatarUrl && err ? (
            <Button variant="ghost" onPress={skipPhotoAndFinish} disabled={loading}>
              {t('onboarding.continueWithoutPhoto')}
            </Button>
          ) : null}
        </View>
      }
    >
      <Input
        label={t('onboarding.bio')}
        value={draft.bio}
        onChangeText={(v) => setDraft({ bio: v })}
        multiline
        placeholder={t('onboarding.bioPlaceholder')}
      />
      {err ? <Text className="text-danger text-sm mt-2 leading-5">{err}</Text> : null}
    </OnboardingStepShell>
  );
}
