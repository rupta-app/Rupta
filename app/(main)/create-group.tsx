import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { colors } from '@/constants/theme';
import { qk } from '@/hooks/queryKeys';
import { useCreateGroup } from '@/hooks/useGroups';
import { uploadImageToCloudflare } from '@/lib/cloudflareMedia';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { useAuth } from '@/providers/AuthProvider';
import { canCreateGroup, getUserPlan } from '@/services/entitlements';
import { countGroupsOwned, updateGroup, updateGroupSettings } from '@/services/groups';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { session, profile } = useAuth();
  const uid = session?.user?.id!;
  const create = useCreateGroup();

  const { data: ownedCount = 0, isError, refetch } = useQuery({
    queryKey: qk.groups.owned(uid),
    queryFn: () => countGroupsOwned(uid),
    enabled: Boolean(uid),
  });

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [localAvatar, setLocalAvatar] = useState<{ uri: string; mime: string } | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: PICKER_IMAGES,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      const asset = res.assets[0];
      setLocalAvatar({ uri: asset.uri, mime: asset.mimeType ?? 'image/jpeg' });
    }
  };

  const onSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const plan = getUserPlan(profile);
    if (!canCreateGroup(plan, ownedCount)) {
      Alert.alert(t('groups.limitTitle'), t('groups.createLimitBody'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: 'Pro', onPress: () => router.push('/(main)/upgrade') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      const group = await create.mutateAsync({
        ownerId: uid,
        name: trimmed,
        description: desc.trim() || undefined,
      });

      // Call services directly: useUpdateGroup / useUpdateGroupSettings bind
      // groupId at render time, but group.id only exists after create resolves.
      const postCreateTasks: Promise<unknown>[] = [];

      if (localAvatar) {
        postCreateTasks.push(
          (async () => {
            const imageId = await uploadImageToCloudflare(localAvatar.uri, localAvatar.mime, 'group-avatar');
            await updateGroup(group.id, { avatar_url: imageId });
          })(),
        );
      }

      if (isPublic) {
        postCreateTasks.push(updateGroupSettings(group.id, { is_public: true }));
      }

      if (postCreateTasks.length > 0) {
        await Promise.all(postCreateTasks);
        void queryClient.invalidateQueries({ queryKey: qk.groups.all });
        void queryClient.invalidateQueries({ queryKey: qk.groups.publicAll });
        void queryClient.invalidateQueries({ queryKey: qk.groups.detail(group.id) });
      }

      router.replace(`/(main)/group/${group.id}`);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (isError) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('groups.create')} />
        <ErrorState
          title={t('common.error')}
          subtitle={t('common.errorSubtitle')}
          onRetry={() => void refetch()}
          retryLabel={t('common.retry')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('groups.create')} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-muted text-sm mb-5 px-1">{t('groups.createSubtitle')}</Text>

        <View className="items-center mb-6">
          <PressableScale onPress={() => void pickPhoto()} scaleValue={0.96} className="relative">
            {localAvatar ? (
              <Image
                source={{ uri: localAvatar.uri }}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 9999,
                  backgroundColor: colors.surfaceElevated,
                }}
              />
            ) : (
              <Avatar url={null} name={name} size={112} />
            )}
            <View
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center border-2"
              style={{ backgroundColor: colors.primary, borderColor: colors.background }}
            >
              <Camera color={colors.white} size={16} strokeWidth={2.4} />
            </View>
          </PressableScale>
          <Button variant="ghost" className="mt-2 min-h-0 py-2" onPress={() => void pickPhoto()}>
            {localAvatar ? t('groups.changeGroupPhoto') : t('groups.addPhoto')}
          </Button>
        </View>

        <Card className="mb-4 py-4">
          <Input
            label={t('groups.groupName')}
            value={name}
            onChangeText={setName}
            placeholder={t('groups.groupNamePlaceholder')}
            autoCapitalize="words"
          />
          <Input
            label={t('groups.groupDescription')}
            value={desc}
            onChangeText={setDesc}
            placeholder={t('groups.groupDescriptionPlaceholder')}
            multiline
            autoCapitalize="sentences"
          />
        </Card>

        <Card className="mb-6 flex-row items-center justify-between py-4">
          <View className="flex-1 pr-3">
            <Text className="text-foreground font-semibold">{t('groups.publicGroup')}</Text>
            <Text className="text-muted text-xs mt-1 leading-5">{t('groups.publicGroupHint')}</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.surfaceElevated, true: colors.primary }}
          />
        </Card>

        <Button onPress={() => void onSubmit()} disabled={!name.trim()} loading={submitting}>
          {t('groups.createCta')}
        </Button>
      </ScrollView>
    </View>
  );
}
