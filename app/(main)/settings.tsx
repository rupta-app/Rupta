import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { setAppLanguage, type AppLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('settings.title')}</Text>
      </View>
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
