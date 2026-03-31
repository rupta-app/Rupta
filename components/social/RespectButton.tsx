import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export function RespectButton({
  active,
  onPress,
  loading,
}: {
  active: boolean;
  onPress: () => void;
  loading?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className={`px-4 py-2 rounded-full border ${active ? 'bg-respect/20 border-respect' : 'border-border bg-surfaceElevated'}`}
    >
      <Text className={`font-bold ${active ? 'text-respect' : 'text-muted'}`}>
        {active ? t('social.removeRespect') : t('social.giveRespect')}
      </Text>
    </Pressable>
  );
}
