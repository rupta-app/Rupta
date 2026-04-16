import { useRouter } from 'expo-router';
import { Bell, Plus, Settings, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';
import type { TranslationKeys } from '@/i18n/en';

export type MainHeaderVariant = 'home' | 'explore' | 'generator' | 'groups' | 'ranks' | 'profile';

type TabTranslationKey = {
  [K in keyof TranslationKeys['tabs']]: `tabs.${K & string}`;
}[keyof TranslationKeys['tabs']];

const HEADER_TITLE_KEY: Record<MainHeaderVariant, TabTranslationKey> = {
  home: 'tabs.home',
  explore: 'tabs.explore',
  generator: 'tabs.generator',
  groups: 'tabs.groups',
  ranks: 'tabs.ranks',
  profile: 'tabs.you',
};

export function MainAppHeader({ variant }: { variant: MainHeaderVariant }) {
  const { t } = useTranslation();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const uid = session?.user?.id;
  const { data: notifsData } = useNotifications(uid);
  const notifs = useMemo(() => notifsData?.pages.flat() ?? [], [notifsData]);
  const unread = notifs.filter((n: { is_read: boolean }) => !n.is_read).length;

  const showAvatar = variant !== 'profile';
  const showNotifications = variant !== 'profile' && variant !== 'generator';
  const showSearch = variant !== 'profile' && variant !== 'generator';
  const showProfileActions = variant === 'profile';
  const showPlusOnly = variant === 'generator';

  return (
    <View
      className="bg-background px-2 pb-2"
      style={{ paddingTop: Math.max(insets.top, 8) }}
    >
      <View className="relative flex-row items-center min-h-[52px]">
        <View className="min-w-0 flex-1 flex-row items-center gap-1">
          {variant === 'profile' ? (
            <PressableScale
              onPress={() => go('/(main)/spontaneous-sidequest')}
              className="p-1 shrink-0"
              hitSlop={12}
              scaleValue={0.9}
              accessibilityLabel={t('spontaneous.title')}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-primary">
                <Plus color={colors.primary} size={22} strokeWidth={2.5} />
              </View>
            </PressableScale>
          ) : showAvatar && profile ? (
            <PressableScale
              onPress={() => go('/(main)/(tabs)/profile')}
              className="p-1 shrink-0"
              hitSlop={8}
              scaleValue={0.9}
            >
              <Avatar url={profile.avatar_url} name={profile.display_name} size={36} />
            </PressableScale>
          ) : null}
          {variant !== 'profile' ? (
            <Text className="ml-1 min-w-0 flex-1 text-2xl font-bold text-foreground" numberOfLines={1}>
              {t(HEADER_TITLE_KEY[variant])}
            </Text>
          ) : (
            <View className="min-h-[36px] flex-1" />
          )}
        </View>

        <View className="min-w-0 flex-1 flex-row items-center justify-end gap-0.5">
          {showProfileActions ? (
            <PressableScale onPress={() => go('/(main)/settings')} className="p-2.5" hitSlop={12} scaleValue={0.9}>
              <Settings color={colors.muted} size={26} strokeWidth={2.25} />
            </PressableScale>
          ) : null}
          {showPlusOnly ? (
            <PressableScale onPress={() => go('/(main)/spontaneous-sidequest')} className="p-2.5" hitSlop={12} scaleValue={0.9}>
              <View className="w-9 h-9 rounded-full border-2 border-primary items-center justify-center">
                <Plus color={colors.primary} size={22} strokeWidth={2.5} />
              </View>
            </PressableScale>
          ) : null}
          {showSearch ? (
            <PressableScale
              onPress={() => go('/(main)/friends')}
              className="p-2.5 shrink-0"
              hitSlop={12}
              scaleValue={0.9}
              accessibilityLabel={t('friends.hubTitle')}
            >
              <Users color={colors.foreground} size={22} strokeWidth={2} />
            </PressableScale>
          ) : null}
          {showNotifications ? (
            <PressableScale onPress={() => go('/(main)/notifications')} className="p-2.5 relative" hitSlop={12} scaleValue={0.9}>
              <Bell color={colors.foreground} size={22} strokeWidth={2} />
              {unread > 0 ? (
                <View className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-danger items-center justify-center px-1">
                  <Text className="text-white font-bold" style={{ fontSize: 9 }}>
                    {unread > 9 ? '9+' : unread}
                  </Text>
                </View>
              ) : null}
            </PressableScale>
          ) : null}
        </View>

        {variant === 'profile' ? (
          <View className="absolute inset-0 items-center justify-center px-16" pointerEvents="none">
            <Text className="text-center text-2xl font-bold text-foreground" numberOfLines={1}>
              {t(HEADER_TITLE_KEY.profile)}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
