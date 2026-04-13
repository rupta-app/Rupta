import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateGroup } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';
import { canCreateGroup, getUserPlan } from '@/services/entitlements';
import { countGroupsOwned } from '@/services/groups';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, profile } = useAuth();
  const uid = session?.user?.id!;
  const create = useCreateGroup();
  const { data: ownedCount = 0 } = useQuery({
    queryKey: ['groups-owned', uid],
    queryFn: () => countGroupsOwned(uid),
    enabled: Boolean(uid),
  });
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('groups.create')} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Description" value={desc} onChangeText={setDesc} multiline />
        <Button
          onPress={async () => {
            const plan = getUserPlan(profile);
            if (!canCreateGroup(plan, ownedCount)) {
              Alert.alert(t('groups.limitTitle'), t('groups.createLimitBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                { text: 'Pro', onPress: () => router.push('/(main)/upgrade') },
              ]);
              return;
            }
            const g = await create.mutateAsync({ ownerId: uid, name: name.trim(), description: desc.trim() });
            router.replace(`/(main)/group/${g.id}`);
          }}
          disabled={!name.trim()}
          loading={create.isPending}
        >
          {t('groups.create')}
        </Button>
      </ScrollView>
    </View>
  );
}
