import { Crown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import type { GroupMemberWithProfile } from '@/services/groups';

type Props = {
  visible: boolean;
  onClose: () => void;
  members: GroupMemberWithProfile[]; // caller passes non-owner members only
  isSubmitting: boolean;
  onConfirm: (userId: string) => void;
};

export function TransferOwnershipSheet({
  visible,
  onClose,
  members,
  isSubmitting,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setSelectedId(null);
  }, [visible]);

  const selectionValid =
    selectedId !== null && members.some((m) => m.user_id === selectedId);

  const handleClose = () => {
    setSelectedId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable className="flex-1 bg-black/60" onPress={handleClose}>
        <Pressable
          className="mt-auto bg-surface rounded-t-3xl px-5 pt-4 pb-8"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="items-center mb-3">
            <View className="w-10 h-1 bg-muted/40 rounded-full" />
          </View>
          <Text className="text-foreground font-bold text-lg mb-1">
            {t('groups.transferOwnershipTitle')}
          </Text>
          <Text className="text-muted text-sm mb-4">
            {t('groups.transferOwnershipHint')}
          </Text>

          <ScrollView className="max-h-96">
            {members.length === 0 ? (
              <Text className="text-muted text-sm py-4">{t('groups.transferOwnershipEmpty')}</Text>
            ) : (
              members.map((m) => {
                const name = m.profiles?.display_name ?? m.profiles?.username ?? '';
                const isSelected = m.user_id === selectedId;
                return (
                  <Pressable
                    key={m.user_id}
                    onPress={() => setSelectedId(m.user_id)}
                    className={`flex-row items-center gap-3 py-3 px-2 rounded-xl mb-1 ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar url={m.profiles?.avatar_url} name={name} size={40} />
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="text-muted text-xs">
                        {m.role === 'admin' ? t('groups.memberAdmin') : t('groups.memberRoleMember')}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Crown color={colors.primary} size={20} />
                    ) : (
                      <View className="w-5 h-5 rounded-full border border-muted/40" />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Button variant="secondary" onPress={handleClose}>
                {t('common.cancel')}
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="danger"
                onPress={() => selectionValid && onConfirm(selectedId!)}
                disabled={!selectionValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  t('groups.transferOwnershipCta')
                )}
              </Button>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
