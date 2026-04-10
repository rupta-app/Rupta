import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AuthScreenShell } from '@/components/auth/AuthScreenShell';
import { SocialSignInButtons } from '@/components/auth/SocialSignInButtons';
import { useSocialSignIn } from '@/hooks/useSocialSignIn';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { error, loading, showApple, signInWithGoogle, signInWithApple } = useSocialSignIn();

  return (
    <View className="flex-1 bg-background">
      <AuthScreenShell
        title={t('auth.login')}
        subtitle={t('auth.oauthLoginSubtitle')}
        footer={
          <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={12}>
            <Text className="text-muted text-base text-center">
              {t('auth.noAccount')}{' '}
              <Text className="text-primary font-semibold">{t('auth.register')}</Text>
            </Text>
          </Pressable>
        }
      >
        <SocialSignInButtons
          onGoogle={signInWithGoogle}
          onApple={signInWithApple}
          loading={loading}
          showApple={showApple}
        />
        {error ? (
          <Text className="text-danger text-center text-sm mt-4 leading-5">{error}</Text>
        ) : null}
      </AuthScreenShell>
    </View>
  );
}
