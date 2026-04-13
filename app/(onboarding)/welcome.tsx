import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ScrollView, Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';

export default function WelcomeOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom, 32),
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <View className="rounded-3xl border border-primary/25 bg-surfaceElevated/95 p-8 shadow-xl shadow-black/50">
            <Image
              source={logoMark}
              accessibilityLabel="Rupta"
              contentFit="contain"
              className="w-full max-w-[220px] h-[72px] self-start mb-6"
            />
            <Text className="text-foreground text-4xl font-black leading-tight tracking-tight">
              {t('onboarding.welcomeTitle')}
            </Text>
            <Text className="text-muted text-lg mt-5 leading-7">{t('onboarding.welcomeSubtitle')}</Text>
            <View className="mt-10">
              <Button onPress={() => router.push('/(onboarding)/language')}>{t('common.continue')}</Button>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
