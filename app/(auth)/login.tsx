import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { loginSchema } from '@/schemas/auth';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? t('common.error'));
      return;
    }
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerClassName="px-6 pt-16 pb-10" keyboardShouldPersistTaps="handled">
        <Image
          source={logoMark}
          accessibilityLabel="Rupta"
          resizeMode="contain"
          style={{ width: 200, height: 56, marginBottom: 4 }}
        />
        <Text className="text-muted text-lg mt-2">{t('auth.login')}</Text>
        <View className="mt-10">
          <Input label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" />
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text className="text-danger mb-4">{error}</Text> : null}
          <Button onPress={onSubmit} loading={loading}>
            {t('auth.login')}
          </Button>
        </View>
        <Link href="/(auth)/forgot-password" className="text-primary mt-6">
          {t('auth.forgotPassword')}
        </Link>
        <Link href="/(auth)/register" className="text-muted mt-4">
          {t('auth.noAccount')} {t('auth.register')}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
