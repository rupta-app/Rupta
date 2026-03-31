import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema } from '@/schemas/auth';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    const parsed = registerSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? t('common.error'));
      return;
    }
    setLoading(true);
    const { error: e } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    router.replace('/(onboarding)/welcome');
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
          style={{ width: 200, height: 56, marginBottom: 16 }}
        />
        <Text className="text-foreground text-3xl font-bold">{t('auth.register')}</Text>
        <Text className="text-muted mt-2">{t('auth.registerHint')}</Text>
        <View className="mt-8">
          <Input label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" />
          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text className="text-danger mb-4">{error}</Text> : null}
          <Button onPress={onSubmit} loading={loading}>
            {t('auth.register')}
          </Button>
        </View>
        <Link href="/(auth)/login" className="text-muted mt-6">
          {t('auth.hasAccount')} {t('auth.login')}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
