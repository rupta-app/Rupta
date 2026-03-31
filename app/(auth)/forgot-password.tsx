import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setMsg('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg(t('auth.resetSent'));
  };

  return (
    <ScrollView contentContainerClassName="px-6 pt-16 pb-10 bg-background flex-grow">
      <Image
        source={logoMark}
        accessibilityLabel="Rupta"
        resizeMode="contain"
        style={{ width: 160, height: 44, marginBottom: 16 }}
      />
      <Text className="text-foreground text-2xl font-bold">{t('auth.forgotPassword')}</Text>
      <View className="mt-8">
        <Input label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" />
        {msg ? <Text className="text-secondary mb-4">{msg}</Text> : null}
        <Button onPress={onSubmit} loading={loading}>
          {t('common.continue')}
        </Button>
        <Button variant="ghost" onPress={() => router.back()}>
          {t('common.cancel')}
        </Button>
      </View>
    </ScrollView>
  );
}
