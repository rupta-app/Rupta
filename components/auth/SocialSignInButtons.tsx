import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';

type Loading = 'google' | 'apple' | null;

export function SocialSignInButtons({
  onGoogle,
  onApple,
  loading,
  showApple,
}: {
  onGoogle: () => void;
  onApple: () => void;
  loading: Loading;
  showApple: boolean;
}) {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      <Pressable
        onPress={onGoogle}
        disabled={loading !== null}
        className={`rounded-2xl border border-border bg-surfaceElevated px-5 py-4 flex-row items-center justify-center gap-3 min-h-[54px] active:opacity-85 ${
          loading !== null ? 'opacity-50' : ''
        }`}
      >
        {loading === 'google' ? (
          <ActivityIndicator color={colors.muted} />
        ) : (
          <>
            <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
              <Text className="text-[15px] font-bold text-[#4285F4]">G</Text>
            </View>
            <Text className="text-foreground font-semibold text-base">
              {t('auth.continueWithGoogle')}
            </Text>
          </>
        )}
      </Pressable>

      {showApple ? (
        <Pressable
          onPress={onApple}
          disabled={loading !== null}
          className={`rounded-2xl bg-foreground px-5 py-4 flex-row items-center justify-center gap-3 min-h-[54px] active:opacity-90 ${
            loading !== null ? 'opacity-50' : ''
          }`}
        >
          {loading === 'apple' ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Text className="text-background text-lg"></Text>
              <Text className="text-background font-semibold text-base">
                {t('auth.continueWithApple')}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
