import { ShieldOff } from 'lucide-react-native';
import { ActivityIndicator, Alert, FlatList, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserListItem } from '@/components/social/UserListItem';
import { colors } from '@/constants/theme';
import { useBlockedUsers, useUnblockUser } from '@/hooks/useBlockedUsers';
import { useAuth } from '@/providers/AuthProvider';

export default function BlockedUsersScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: blocked = [], isLoading } = useBlockedUsers(uid);
  const unblock = useUnblockUser(uid);

  const confirmUnblock = (id: string, name: string) => {
    Alert.alert(
      t('blocked.unblockTitle'),
      t('blocked.unblockMessage', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('blocked.unblock'),
          onPress: () => unblock.mutate(id),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('blocked.title')} />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : blocked.length === 0 ? (
        <EmptyState
          icon={ShieldOff}
          title={t('blocked.emptyTitle')}
          subtitle={t('blocked.emptySubtitle')}
        />
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          ListHeaderComponent={
            <Text className="text-muted text-sm mb-3 leading-5">{t('blocked.hint')}</Text>
          }
          renderItem={({ item }) => (
            <UserListItem
              user={item}
              right={
                <Button
                  variant="secondary"
                  onPress={() => confirmUnblock(item.id, item.display_name)}
                >
                  {t('blocked.unblock')}
                </Button>
              }
            />
          )}
        />
      )}
    </View>
  );
}
