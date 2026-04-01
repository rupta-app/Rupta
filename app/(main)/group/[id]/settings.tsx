import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useGroupDetail, useGroupSettings, useUpdateGroup, useUpdateGroupSettings } from '@/hooks/useGroups';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { uploadGroupAvatar } from '@/lib/storage';
import { useAuth } from '@/providers/AuthProvider';

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data, isLoading } = useGroupDetail(id);
  const { data: settings } = useGroupSettings(id);
  const updateSettings = useUpdateGroupSettings(id);
  const updateGroup = useUpdateGroup(id);
  const [photoBusy, setPhotoBusy] = useState(false);

  const myMember = data?.members.find((m: { user_id: string }) => m.user_id === uid);
  const canAdmin = myMember?.role === 'owner' || myMember?.role === 'admin';

  const pickPhoto = async () => {
    if (!data?.group || !canAdmin) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: PICKER_IMAGES,
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    setPhotoBusy(true);
    try {
      const url = await uploadGroupAvatar(uid, id, asset.uri, asset.mimeType ?? 'image/jpeg');
      await updateGroup.mutateAsync({ avatar_url: url });
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
    } finally {
      setPhotoBusy(false);
    }
  };

  if (isLoading || !data) {
    return (
      <View className="flex-1 bg-background justify-center items-center" style={{ paddingTop: insets.top }}>
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const { group } = data;

  if (!canAdmin) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-2 py-2 border-b border-border">
          <Pressable onPress={() => router.back()} className="p-2">
            <ChevronLeft color="#F8FAFC" size={28} />
          </Pressable>
          <Text className="text-foreground font-bold text-lg ml-1">{t('groups.settings')}</Text>
        </View>
        <Text className="text-muted text-center mt-10 px-6">{t('groups.settingsMembersOnly')}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('groups.settings')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-muted text-sm mb-3">{group.name}</Text>

        <Card className="mb-6 py-4 items-center">
          <Text className="text-foreground font-semibold mb-3 self-start w-full px-1">{t('groups.groupPhoto')}</Text>
          {group.avatar_url ? (
            <Image
              source={{ uri: group.avatar_url }}
              className="w-28 h-28 rounded-2xl bg-surfaceElevated mb-4"
            />
          ) : (
            <View className="mb-4">
              <Avatar url={null} name={group.name} size={88} />
            </View>
          )}
          <Button variant="secondary" onPress={() => void pickPhoto()} loading={photoBusy}>
            {t('groups.changeGroupPhoto')}
          </Button>
          <Text className="text-muted text-xs mt-3 text-center px-2">{t('groups.groupPhotoHint')}</Text>
        </Card>

        {settings ? (
          <Card className="flex-row items-center justify-between py-4">
            <View className="flex-1 pr-2">
              <Text className="text-foreground font-semibold">{t('groups.publicGroup')}</Text>
              <Text className="text-muted text-xs mt-1">{t('groups.publicGroupHint')}</Text>
            </View>
            <Switch
              value={settings.is_public}
              onValueChange={(v) => updateSettings.mutate({ is_public: v })}
            />
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}
