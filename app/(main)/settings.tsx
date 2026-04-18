import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Check,
  ChevronRight,
  Globe,
  Info,
  LogOut,
  ShieldAlert,
  ShieldOff,
  Sparkles,
  Star,
  Trash2,
  User as UserIcon,
  Wand2,
} from 'lucide-react-native';

import { AppModal } from '@/components/ui/AppModal';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsRow';
import { colors } from '@/constants/theme';
import { deleteCurrentAccount } from '@/services/account';
import { setAppLanguage, type AppLanguage } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { updateProfile } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';

function formatMemberSince(iso: string | undefined, lang: 'en' | 'es'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'es' ? 'es' : 'en', {
    month: 'short',
    year: 'numeric',
  });
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { session, profile, refreshProfile } = useAuth();
  const uid = session?.user?.id;
  const email = session?.user?.email ?? '';
  const lang: AppLanguage = i18n.language.startsWith('es') ? 'es' : 'en';
  const version = Constants.expoConfig?.version ?? '0.0.0';

  const [langSheetOpen, setLangSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const setLang = async (lng: AppLanguage) => {
    setAppLanguage(lng);
    await i18n.changeLanguage(lng);
    setLangSheetOpen(false);
    if (uid) {
      await updateProfile(uid, { preferred_language: lng });
      await refreshProfile();
    }
  };

  const confirmSignOut = () => {
    Alert.alert(t('settings.signOutConfirmTitle'), t('settings.signOutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccountConfirmTitle'),
      t('settings.deleteAccountConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccountConfirm'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteCurrentAccount();
              router.replace('/(auth)/login');
            } catch (e) {
              Alert.alert(t('common.error'), t('settings.deleteAccountError'));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  const planLabel = profile?.plan === 'pro' ? t('settings.planPro') : t('settings.planFree');
  const languageLabel = lang === 'es' ? t('settings.languageEs') : t('settings.languageEn');

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('settings.title')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Profile summary card */}
        <PressableScale
          onPress={() => router.push('/(main)/edit-profile')}
          scaleValue={0.98}
          haptic={false}
        >
          <Card variant="elevated" className="flex-row items-center gap-3 mb-5">
            <Avatar
              url={profile?.avatar_url}
              name={profile?.display_name ?? '?'}
              size={56}
            />
            <View className="flex-1 min-w-0">
              <Text className="text-foreground font-semibold text-base" numberOfLines={1}>
                {profile?.display_name ?? '—'}
              </Text>
              <Text className="text-muted text-sm" numberOfLines={1}>
                @{profile?.username ?? '—'}
              </Text>
              {email ? (
                <Text className="text-mutedForeground text-xs mt-0.5" numberOfLines={1}>
                  {email}
                </Text>
              ) : null}
            </View>
            <ChevronRight color={colors.mutedForeground} size={20} />
          </Card>
        </PressableScale>

        {/* Account */}
        <SettingsGroup title={t('settings.account')}>
          <SettingsRow
            icon={UserIcon}
            label={t('settings.editProfile')}
            onPress={() => router.push('/(main)/edit-profile')}
          />
          <SettingsRow
            icon={Star}
            label={t('settings.plan')}
            value={planLabel}
            onPress={() => router.push('/(main)/upgrade')}
          />
          <SettingsRow
            icon={Sparkles}
            label={t('settings.memberSince')}
            value={formatMemberSince(profile?.created_at, lang)}
            showChevron={false}
          />
        </SettingsGroup>

        {/* Preferences */}
        <SettingsGroup title={t('settings.preferences')}>
          <SettingsRow
            icon={Globe}
            label={t('settings.language')}
            value={languageLabel}
            onPress={() => setLangSheetOpen(true)}
          />
          <SettingsRow
            icon={Wand2}
            label={t('settings.editPreferences')}
            onPress={() => router.push('/(main)/edit-preferences')}
          />
          <SettingsRow
            icon={Bell}
            label={t('settings.notifications')}
            showChevron={false}
          />
        </SettingsGroup>

        {/* Privacy */}
        <SettingsGroup title={t('settings.privacy')}>
          <SettingsRow
            icon={ShieldOff}
            label={t('settings.blockedUsers')}
            onPress={() => router.push('/(main)/blocked-users')}
          />
        </SettingsGroup>

        {/* About */}
        <SettingsGroup title={t('settings.about')}>
          <SettingsRow
            icon={Info}
            label={t('settings.appVersion')}
            value={version}
            showChevron={false}
          />
          {profile?.is_admin ? (
            <SettingsRow
              icon={ShieldAlert}
              label={t('settings.adminPanel')}
              subtitle={t('admin.note')}
              showChevron={false}
            />
          ) : null}
        </SettingsGroup>

        {/* Danger zone */}
        <SettingsGroup title={t('settings.dangerZone')}>
          <SettingsRow icon={LogOut} label={t('settings.signOut')} onPress={confirmSignOut} danger />
          <SettingsRow
            icon={Trash2}
            label={deleting ? t('common.loading') : t('settings.deleteAccount')}
            onPress={deleting ? undefined : confirmDeleteAccount}
            danger
          />
        </SettingsGroup>
      </ScrollView>

      {/* Language picker sheet */}
      <AppModal
        visible={langSheetOpen}
        onClose={() => setLangSheetOpen(false)}
        title={t('settings.languagePick')}
        footer={false}
      >
        <View className="mb-2">
          <LangOption
            label={t('settings.languageEn')}
            selected={lang === 'en'}
            onPress={() => setLang('en')}
          />
          <LangOption
            label={t('settings.languageEs')}
            selected={lang === 'es'}
            onPress={() => setLang('es')}
          />
        </View>
      </AppModal>
    </View>
  );
}

function LangOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} scaleValue={0.98} haptic={false}>
      <View className="flex-row items-center justify-between py-3.5 px-1">
        <Text className="text-foreground text-base">{label}</Text>
        {selected ? <Check color={colors.primary} size={20} /> : null}
      </View>
    </PressableScale>
  );
}
