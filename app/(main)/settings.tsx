import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { setAppLanguage, type AppLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { session, refreshProfile } = useAuth();
  const uid = session?.user?.id;

  const setLang = async (lng: AppLanguage) => {
    setAppLanguage(lng);
    i18n.changeLanguage(lng);
    if (uid) {
      await updateProfile(uid, { preferred_language: lng });
      await refreshProfile();
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('settings.title')} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-muted text-xs uppercase mb-2">{t('settings.language')}</Text>
        <View className="flex-row gap-2 mb-8">
          <Pressable
            onPress={() => setLang('en')}
            className={`px-4 py-3 rounded-xl border ${i18n.language.startsWith('en') ? 'border-primary' : 'border-border'}`}
          >
            <Text className="text-foreground">English</Text>
          </Pressable>
          <Pressable
            onPress={() => setLang('es')}
            className={`px-4 py-3 rounded-xl border ${i18n.language.startsWith('es') ? 'border-primary' : 'border-border'}`}
          >
            <Text className="text-foreground">Español</Text>
          </Pressable>
        </View>
        <Text className="text-muted mb-4">{t('settings.notifications')}</Text>
        <Button
          variant="danger"
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          }}
        >
          {t('settings.signOut')}
        </Button>
        <Text className="text-muted text-xs mt-8">{t('admin.note')}</Text>
      </ScrollView>
    </View>
  );
}
