import '../global.css';

import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { FullScreenLoader } from '@/components/ui/FullScreenLoader';
import { i18n } from '@/i18n';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { t } = useTranslation();
  const [loaded, err] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (err) throw err;
  }, [err]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) {
    return <FullScreenLoader label={t('common.loading')} />;
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </AuthProvider>
    </QueryProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <RootLayoutContent />
      </I18nextProvider>
    </SafeAreaProvider>
  );
}
