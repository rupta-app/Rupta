import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { useRespondFriendRequest } from '@/hooks/useFriends';

type Props = {
  requestId: string;
  onAccepted?: () => void;
  onRejected?: () => void;
};

export function FriendRequestActions({ requestId, onAccepted, onRejected }: Props) {
  const { t } = useTranslation();
  const respond = useRespondFriendRequest();

  return (
    <View className="gap-2">
      <Button
        loading={respond.isPending}
        onPress={() =>
          respond.mutate(
            { requestId, accept: true },
            {
              onSuccess: () => {
                Alert.alert(t('friends.friendAddedTitle'), t('friends.friendAddedBody'));
                onAccepted?.();
              },
              onError: (e) =>
                Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e)),
            },
          )
        }
        className="py-2 px-3 min-h-0"
      >
        {t('friends.accept')}
      </Button>
      <Button
        variant="ghost"
        loading={respond.isPending}
        onPress={() =>
          respond.mutate(
            { requestId, accept: false },
            {
              onSuccess: () => onRejected?.(),
              onError: (e) =>
                Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e)),
            },
          )
        }
        className="py-2 px-3 min-h-0"
      >
        {t('friends.reject')}
      </Button>
    </View>
  );
}
