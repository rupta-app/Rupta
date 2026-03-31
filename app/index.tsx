import { Redirect, useRootNavigationState } from 'expo-router';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export default function Index() {
  const { t } = useTranslation();
  const { session, profile, loading } = useAuth();
  const navState = useRootNavigationState();

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
  if (!profile?.onboarding_completed) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(main)/(tabs)/home" />;
}
