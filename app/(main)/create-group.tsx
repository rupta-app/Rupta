import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateGroup } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';

export default function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const create = useCreateGroup();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('groups.create')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Description" value={desc} onChangeText={setDesc} multiline />
        <Button
          onPress={async () => {
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
