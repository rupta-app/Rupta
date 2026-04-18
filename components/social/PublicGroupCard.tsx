import { Image } from 'expo-image';
import { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Users } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { imageUrl } from '@/lib/mediaUrls';
import type { PublicGroupRow } from '@/services/groups';

type Props = {
  group: PublicGroupRow;
  variant?: 'standard' | 'hero';
  onJoin: (group: PublicGroupRow) => void;
  joining?: boolean;
};

export const PublicGroupCard = memo(function PublicGroupCard({
  group,
  variant = 'standard',
  onJoin,
  joining = false,
}: Props) {
  const { t } = useTranslation();
  const ownerHandle = group.owner_username;
  const memberText =
    group.member_count === 1
      ? t('groups.memberOne')
      : t('groups.memberOther', { count: group.member_count });

  const handleJoin = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onJoin(group);
  }, [group, onJoin]);

  if (variant === 'hero') {
    const heroImage = imageUrl(group.avatar_url, 'public');
    return (
      <View className="bg-surface rounded-3xl overflow-hidden mb-3" style={{ width: 280 }}>
        <View style={{ height: 120 }} className="relative bg-surfaceElevated">
          {heroImage ? (
            <Image
              source={{ uri: heroImage }}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <View
              className="w-full h-full items-center justify-center"
              style={{ backgroundColor: colors.primaryGlow }}
            >
              <Users color={colors.primary} size={36} strokeWidth={1.8} />
            </View>
          )}
          <View
            pointerEvents="none"
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
          />
          <View className="absolute left-3 bottom-3 right-3 flex-row items-center">
            <Avatar url={group.avatar_url} name={group.name} size={36} />
            <View className="ml-2 flex-1 min-w-0">
              <Text className="text-white font-bold" numberOfLines={1}>
                {group.name}
              </Text>
              {ownerHandle ? (
                <Text className="text-white/70 text-xs" numberOfLines={1}>
                  {t('groups.byOwner', { handle: ownerHandle })}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        <View className="px-4 pt-3 pb-4">
          {group.description ? (
            <Text className="text-muted text-sm leading-5 mb-3" numberOfLines={2}>
              {group.description}
            </Text>
          ) : null}
          <View className="flex-row items-center mb-3">
            <Users color={colors.muted} size={14} strokeWidth={2} />
            <Text className="text-muted text-xs ml-1.5">{memberText}</Text>
          </View>
          <Button onPress={handleJoin} loading={joining} className="py-2.5 min-h-0">
            {t('groups.join')}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-2xl px-4 py-4 mb-3 flex-row items-center gap-3">
      <Avatar url={group.avatar_url} name={group.name} size={52} />
      <View className="flex-1 min-w-0">
        <Text className="text-foreground font-bold text-base" numberOfLines={1}>
          {group.name}
        </Text>
        {group.description ? (
          <Text className="text-muted text-sm mt-0.5 leading-5" numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}
        <View className="flex-row items-center mt-1.5">
          <Users color={colors.mutedForeground} size={12} strokeWidth={2} />
          <Text className="text-mutedForeground text-xs ml-1">{memberText}</Text>
          {ownerHandle ? (
            <Text className="text-mutedForeground text-xs ml-2" numberOfLines={1}>
              · {t('groups.byOwner', { handle: ownerHandle })}
            </Text>
          ) : null}
        </View>
      </View>
      <Button onPress={handleJoin} loading={joining} className="py-2 px-4 min-h-0">
        {t('groups.join')}
      </Button>
    </View>
  );
});
