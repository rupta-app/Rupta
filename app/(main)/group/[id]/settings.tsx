import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TransferOwnershipSheet } from '@/components/group/TransferOwnershipSheet';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { colors } from '@/constants/theme';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import {
  useDeleteGroup,
  useGroupDetail,
  useGroupMembers,
  useGroupSettings,
  useLeaveGroup,
  useMyGroupPermissions,
  useTransferGroupOwnership,
  useUpdateGroup,
  useUpdateGroupSettings,
} from '@/hooks/useGroups';
import { uploadImageToCloudflare } from '@/lib/cloudflareMedia';
import { imageUrl } from '@/lib/mediaUrls';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { useAuth } from '@/providers/AuthProvider';
import type { QuestCreationRule } from '@/types/database';

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data, isLoading, isError } = useGroupDetail(id);
  const { canAdmin, isOwner } = useMyGroupPermissions(id, uid);
  const { data: settings } = useGroupSettings(id);
  const updateSettings = useUpdateGroupSettings(id);
  const updateGroup = useUpdateGroup(id);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);
  const transferOwnership = useTransferGroupOwnership(id);
  const membersQuery = useGroupMembers(id);
  const transferCandidates = useMemo(() => {
    const all = membersQuery.data?.pages.flatMap((p) => p.rows) ?? [];
    return all.filter((m) => m.role !== 'owner');
  }, [membersQuery.data]);

  const [nameDraft, setNameDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');

  useEffect(() => {
    if (data?.group) {
      setNameDraft(data.group.name);
      setDescDraft(data.group.description ?? '');
    }
  }, [data?.group]);

  const questRuleOptions = useMemo(
    () => [
      { value: 'anyone' as const, label: t('groups.questRuleAnyone') },
      { value: 'admin_only' as const, label: t('groups.questRuleAdminOnly') },
      { value: 'admin_approval' as const, label: t('groups.questRuleAdminApproval') },
    ],
    [t],
  );

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
      const imageId = await uploadImageToCloudflare(asset.uri, asset.mimeType ?? 'image/jpeg', 'group-avatar');
      await updateGroup.mutateAsync({ avatar_url: imageId });
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e));
    } finally {
      setPhotoBusy(false);
    }
  };

  const saveInfo = () => {
    const name = nameDraft.trim();
    if (!name) {
      Alert.alert(t('common.error'), t('groups.titleRequired'));
      return;
    }
    updateGroup.mutate({ name, description: descDraft.trim() || null });
  };

  const confirmLeave = () => {
    Alert.alert(t('groups.leaveConfirmTitle'), t('groups.leaveConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.leaveGroup'),
        style: 'destructive',
        onPress: () =>
          leaveGroup.mutate(
            { groupId: id, userId: uid },
            { onSuccess: () => router.replace('/(main)/(tabs)/groups') },
          ),
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(t('groups.deleteConfirmTitle'), t('groups.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.deleteGroup'),
        style: 'destructive',
        onPress: () =>
          deleteGroup.mutate(
            { groupId: id },
            { onSuccess: () => router.replace('/(main)/(tabs)/groups') },
          ),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('common.error')} />
        <ErrorState title={t('common.error')} subtitle={t('common.errorSubtitle')} />
      </View>
    );
  }

  const { group } = data;
  const infoDirty =
    nameDraft.trim() !== group.name || (descDraft.trim() || null) !== (group.description ?? null);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('groups.settings')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-muted text-sm mb-3">{group.name}</Text>

        {canAdmin ? (
          <>
            <Card className="mb-6 py-4 items-center">
              <Text className="text-foreground font-semibold mb-3 self-start w-full px-1">{t('groups.groupPhoto')}</Text>
              {group.avatar_url ? (
                <Image
                  source={{ uri: imageUrl(group.avatar_url, 'public') }}
                  style={{ width: 112, height: 112, borderRadius: 16, backgroundColor: colors.surfaceElevated, marginBottom: 16 }}
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

            <Card className="mb-6 py-4">
              <Text className="text-foreground font-semibold mb-3">{t('groups.editInfo')}</Text>
              <Text className="text-muted text-xs mb-1">{t('groups.groupName')}</Text>
              <Input value={nameDraft} onChangeText={setNameDraft} placeholder={t('groups.groupNamePlaceholder')} />
              <View className="h-3" />
              <Text className="text-muted text-xs mb-1">{t('groups.groupDescription')}</Text>
              <Input
                value={descDraft}
                onChangeText={setDescDraft}
                placeholder={t('groups.groupDescriptionPlaceholder')}
                multiline
              />
              <View className="h-3" />
              <Button onPress={saveInfo} disabled={!infoDirty} loading={updateGroup.isPending}>
                {t('groups.save')}
              </Button>
            </Card>

            {settings ? (
              <>
                <Card className="mb-3 flex-row items-center justify-between py-4">
                  <View className="flex-1 pr-2">
                    <Text className="text-foreground font-semibold">{t('groups.publicGroup')}</Text>
                    <Text className="text-muted text-xs mt-1">{t('groups.publicGroupHint')}</Text>
                  </View>
                  <Switch
                    value={settings.is_public}
                    onValueChange={(v) => updateSettings.mutate({ is_public: v })}
                  />
                </Card>

                <Card className="mb-6 py-4">
                  <Text className="text-foreground font-semibold mb-1">{t('groups.questRuleTitle')}</Text>
                  <Text className="text-muted text-xs mb-3">{t('groups.questRuleHint')}</Text>
                  <PillToggleGroup
                    options={questRuleOptions}
                    selected={settings.quest_creation_rule as QuestCreationRule}
                    onToggle={(v) => updateSettings.mutate({ quest_creation_rule: v })}
                    containerClassName="flex-row flex-wrap gap-2"
                  />
                </Card>
              </>
            ) : null}
          </>
        ) : null}

        {isOwner ? (
          <>
            <Card className="mb-3 py-4">
              <Text className="text-foreground font-semibold mb-1">
                {t('groups.transferOwnership')}
              </Text>
              <Text className="text-muted text-xs mb-3">
                {t('groups.transferOwnershipHint')}
              </Text>
              <Button
                variant="secondary"
                onPress={() => setTransferSheetOpen(true)}
                disabled={transferCandidates.length === 0}
              >
                {t('groups.transferOwnership')}
              </Button>
            </Card>

            <Card className="mb-3 py-4">
              <Text className="text-foreground font-semibold mb-1">
                {t('groups.deleteGroup')}
              </Text>
              <Text className="text-muted text-xs mb-3">{t('groups.deleteConfirmBody')}</Text>
              <Button variant="danger" onPress={confirmDelete} loading={deleteGroup.isPending}>
                {t('groups.deleteGroup')}
              </Button>
            </Card>

            <Card className="mb-3 py-4">
              <Text className="text-muted text-xs">{t('groups.ownerLeaveHint')}</Text>
            </Card>
          </>
        ) : (
          <Card className="mb-3 py-4">
            <Text className="text-foreground font-semibold mb-1">{t('groups.leaveGroup')}</Text>
            <Text className="text-muted text-xs mb-3">{t('groups.leaveConfirmBody')}</Text>
            <Button variant="danger" onPress={confirmLeave} loading={leaveGroup.isPending}>
              {t('groups.leaveGroup')}
            </Button>
          </Card>
        )}
      </ScrollView>

      <TransferOwnershipSheet
        visible={transferSheetOpen}
        onClose={() => setTransferSheetOpen(false)}
        members={transferCandidates}
        isSubmitting={transferOwnership.isPending}
        onConfirm={(newOwnerId) =>
          transferOwnership.mutate(
            { newOwnerId },
            {
              onSuccess: () => {
                setTransferSheetOpen(false);
              },
              onError: (e) =>
                Alert.alert(
                  t('groups.transferFailedTitle'),
                  e instanceof Error ? e.message : String(e),
                ),
            },
          )
        }
      />
    </View>
  );
}
