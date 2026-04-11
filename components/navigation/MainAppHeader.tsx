import { useRouter } from 'expo-router';
import { Bell, MessageCircle, Plus, Settings, Users } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';
import { colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';

export type MainHeaderVariant = 'home' | 'explore' | 'generator' | 'groups' | 'ranks' | 'profile';

export function MainAppHeader({ variant }: { variant: MainHeaderVariant }) {
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const uid = session?.user?.id;
  const { data: notifs = [] } = useNotifications(uid);
  const unread = notifs.filter((n: { is_read: boolean }) => !n.is_read).length;

  const showAvatar = variant !== 'ranks' && variant !== 'profile';
  const showSearch = true;
  const showMessages = variant === 'groups' || variant === 'ranks';
  const showSpontaneousShortcut = variant === 'home' || variant === 'explore';
  const showNotifications =
    variant === 'home' || variant === 'explore' || variant === 'groups' || variant === 'ranks';
  const showPlusOnly = variant === 'generator';
  const showProfileActions = variant === 'profile';

  return (
    <View
      className="border-b border-border bg-background px-2 pb-2"
      style={{ paddingTop: Math.max(insets.top, 8) }}
    >
      <View className="flex-row items-center min-h-[52px]">
        <View className="flex-row items-center flex-1 gap-1 min-w-0">
          {showAvatar && profile ? (
            <PressableScale
              onPress={() => go('/(main)/(tabs)/profile')}
              className="p-1 shrink-0"
              hitSlop={8}
              scaleValue={0.9}
            >
              <Avatar url={profile.avatar_url} name={profile.display_name} size={36} />
            </PressableScale>
          ) : null}
          {showSearch ? (
            <PressableScale
              onPress={() => go('/(main)/unified-search')}
              className="p-2.5 shrink-0"
              hitSlop={12}
              scaleValue={0.9}
              accessibilityLabel="Friends and groups search"
            >
              <Users color={colors.foreground} size={22} strokeWidth={2} />
            </PressableScale>
          ) : null}
        </View>

        <PressableScale
          onPress={() => go('/(main)/upgrade')}
          className="px-1"
          scaleValue={0.9}
          accessibilityLabel="Rupta Pro"
          accessibilityRole="button"
        >
          <View className="flex-row items-center gap-0.5 pl-1 pr-2 py-1 rounded-full border border-primary/50 bg-primary/10">
            <Image
              source={logoMark}
              contentFit="contain"
              style={{ width: 44, height: 16, marginLeft: -2 }}
            />
            <Text className="text-primary font-bold text-xs tracking-wide">Pro</Text>
          </View>
        </PressableScale>

        <View className="flex-row items-center justify-end flex-1 gap-0.5 min-w-0">
          {showProfileActions ? (
            <>
              <PressableScale onPress={() => go('/(main)/spontaneous-sidequest')} className="p-2.5" hitSlop={12} scaleValue={0.9}>
                <View className="w-8 h-8 rounded-full border-2 border-primary items-center justify-center">
                  <Plus color={colors.primary} size={20} strokeWidth={2.5} />
                </View>
              </PressableScale>
              <PressableScale onPress={() => go('/(main)/settings')} className="p-2.5" hitSlop={12} scaleValue={0.9}>
                <Settings color={colors.muted} size={22} strokeWidth={2} />
              </PressableScale>
            </>
          ) : null}
          {showPlusOnly ? (
            <PressableScale onPress={() => go('/(main)/spontaneous-sidequest')} className="p-2.5" hitSlop={12} scaleValue={0.9}>
              <View className="w-9 h-9 rounded-full border-2 border-primary items-center justify-center">
                <Plus color={colors.primary} size={22} strokeWidth={2.5} />
              </View>
            </PressableScale>
          ) : null}
          {showSpontaneousShortcut ? (
            <PressableScale onPress={() => go('/(main)/spontaneous-sidequest')} className="p-2.5" hitSlop={12} scaleValue={0.9}>
              <View className="w-8 h-8 rounded-full border-2 border-primary items-center justify-center">
                <Plus color={colors.primary} size={20} strokeWidth={2.5} />
              </View>
            </PressableScale>
          ) : null}
          {showMessages ? (
            <PressableScale onPress={() => go('/(main)/messages')} className="p-2.5" hitSlop={12} scaleValue={0.9}>
              <MessageCircle color={colors.foreground} size={22} strokeWidth={2} />
            </PressableScale>
          ) : null}
          {showNotifications ? (
            <PressableScale onPress={() => go('/(main)/notifications')} className="p-2.5 relative" hitSlop={12} scaleValue={0.9}>
              <Bell color={colors.foreground} size={22} strokeWidth={2} />
              {unread > 0 ? (
                <View className="absolute top-1 right-1 w-4 h-4 rounded-full bg-danger items-center justify-center">
                  <Text className="text-white font-bold" style={{ fontSize: 9 }}>
                    {unread > 9 ? '9+' : unread}
                  </Text>
                </View>
              ) : null}
            </PressableScale>
          ) : null}
        </View>
      </View>
    </View>
  );
}
