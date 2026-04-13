import { useEffect, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function OnboardingStepShell({ step, totalSteps, title, subtitle, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const pct = Math.min(100, Math.round((step / totalSteps) * 100));

  const animatedPct = useSharedValue(0);

  useEffect(() => {
    animatedPct.value = withTiming(pct, { duration: 400 });
  }, [pct, animatedPct]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedPct.value}%`,
  }));

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: 100,
            justifyContent: 'center',
          }}
        >
          <Animated.View entering={FadeInDown.duration(420).springify().damping(18)}>
            <View className="mb-6">
              <View className="h-1.5 bg-border/70 rounded-full overflow-hidden">
                <Animated.View className="h-full bg-primary rounded-full shadow-sm shadow-primary/50" style={progressStyle} />
              </View>
              <Text className="text-muted text-xs mt-2.5 font-medium tracking-wide">
                {t('onboarding.stepOf', { current: step, total: totalSteps })}
              </Text>
            </View>

            <View className="rounded-3xl border border-primary/20 bg-surfaceElevated/95 p-6 shadow-xl shadow-black/40">
              <Text className="text-foreground text-2xl font-bold tracking-tight leading-8">{title}</Text>
              {subtitle ? (
                <Text className="text-muted text-base mt-3 leading-6">{subtitle}</Text>
              ) : null}
              <View className="mt-6">{children}</View>
            </View>
          </Animated.View>
        </ScrollView>

        <View
          className="absolute left-0 right-0 border-t border-border/70 bg-background/98 px-5 pt-3"
          style={{ bottom: 0, paddingBottom: Math.max(insets.bottom, 14) }}
        >
          {footer}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
