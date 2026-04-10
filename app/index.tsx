import { Redirect, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function Index() {
  const { t } = useTranslation();
  const { session, profile, loading, refreshProfile } = useAuth();
  const navState = useRootNavigationState();
  const profileRecoverAttempts = useRef(0);

  useEffect(() => {
    if (!session) profileRecoverAttempts.current = 0;
  }, [session]);

  useEffect(() => {
    if (!session || loading || profile) return;
    if (profileRecoverAttempts.current >= 3) return;
    profileRecoverAttempts.current += 1;
    void refreshProfile();
  }, [session, loading, profile, refreshProfile]);

  if (!isSupabaseConfigured) {
    return (
      <View className="flex-1 bg-background justify-center px-8">
        <Text className="text-foreground text-2xl font-bold">{t('notConfigured.title')}</Text>
        <Text className="text-muted mt-3">{t('notConfigured.body')}</Text>
      </View>
    );
  }

  if (!navState?.key || loading) {
    return <FullScreenLoader label={t('common.loading')} />;
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  // Require a loaded profile row before deciding onboarding vs home. `profile === null` during
  // SIGNED_IN used to pair with `loading === false` and incorrectly send everyone to onboarding.
  if (!profile) return <FullScreenLoader label={t('common.loading')} />;
  if (!profile.onboarding_completed) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(main)/(tabs)/home" />;
}
