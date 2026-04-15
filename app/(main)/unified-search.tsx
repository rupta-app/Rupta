import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Share, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { colors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useSendFriendRequest } from '@/hooks/useFriends';
import { searchMyGroups } from '@/services/groups';
import { searchProfiles } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';

type Row =
  | { kind: 'header'; title: string }
  | { kind: 'hint'; text: string }
  | { kind: 'person'; id: string; username: string; display_name: string; avatar_url: string | null }
  | { kind: 'group'; id: string; name: string; description: string | null };

const SEARCH_GROUPS_LIMIT = 20;

export default function UnifiedSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const [q, setQ] = useState('');
  const send = useSendFriendRequest();

  const { data: people = [], refetch: refetchPeople, isError: peopleError } = useQuery({
    queryKey: ['unified-search-people', q, uid],
    queryFn: () => searchProfiles(q, uid),
    enabled: q.trim().length >= 2,
  });

  const { data: groups = [], refetch: refetchGroups, isError: groupsError } = useQuery({
    queryKey: ['unified-search-groups', q, uid],
    queryFn: () => searchMyGroups(uid, q),
    enabled: Boolean(uid),
  });

  const isError = peopleError || groupsError;

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    if (q.trim().length >= 2) {
      out.push({ kind: 'header', title: t('search.people') });
      if (people.length === 0) {
        out.push({ kind: 'hint', text: t('search.noPeople') });
      }
      people.forEach((p) =>
        out.push({
          kind: 'person',
          id: p.id,
          username: p.username,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        }),
      );
    }
    out.push({ kind: 'header', title: t('search.myGroups') });
    const gList = q.trim().length >= 1 ? groups : groups.slice(0, SEARCH_GROUPS_LIMIT);
    gList.forEach((g: { id: string; name: string; description: string | null }) =>
      out.push({ kind: 'group', id: g.id, name: g.name, description: g.description }),
    );
    return out;
  }, [people, groups, q, t]);

  const inviteShare = async () => {
    const msg = t('search.inviteMessage');
    await Share.share({ message: msg });
  };

  if (isError) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('search.title')} />
        <ErrorState
          title={t('common.error')}
          subtitle={t('common.errorSubtitle')}
          onRetry={() => {
            void refetchPeople();
            void refetchGroups();
          }}
          retryLabel={t('common.retry')}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('search.title')} />
      <View className="p-4">
        <Input
          value={q}
          onChangeText={setQ}
          placeholder={t('search.placeholder')}
          autoCapitalize="none"
        />
        {q.trim().length >= 2 ? (
          <Button variant="secondary" className="mt-2" onPress={() => void refetchPeople()}>
            {t('common.search')}
          </Button>
        ) : null}
        <Button variant="ghost" className="mt-2" onPress={() => void refetchGroups()}>
          {t('search.refreshGroups')}
        </Button>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item, i) =>
          item.kind === 'header'
            ? `h-${item.title}-${i}`
            : item.kind === 'hint'
              ? `hint-${i}`
              : item.kind === 'person'
                ? `p-${item.id}`
                : `g-${item.id}`
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 180 }}
        renderItem={useCallback(({ item }: { item: Row }) => {
          if (item.kind === 'header') {
            return (
              <Text className="text-muted text-xs uppercase tracking-wide mt-4 mb-2 first:mt-0">{item.title}</Text>
            );
          }
          if (item.kind === 'hint') {
            return <Text className="text-muted text-sm mb-2">{item.text}</Text>;
          }
          if (item.kind === 'person') {
            return (
              <Card className="mb-2 flex-row items-center gap-3">
                <Pressable className="flex-1 flex-row items-center gap-3" onPress={() => router.push(`/(main)/user/${item.id}`)}>
                  <Avatar url={item.avatar_url} name={item.display_name} />
                  <View>
                    <Text className="text-foreground font-semibold">{item.display_name}</Text>
                    <Text className="text-muted text-xs">@{item.username}</Text>
                  </View>
                </Pressable>
                <Button
                  variant="ghost"
                  className="min-h-0 py-2 px-3"
                  onPress={() => send.mutate({ senderId: uid, receiverId: item.id })}
                >
                  {t('friends.addFriend')}
                </Button>
              </Card>
            );
          }
          return (
            <Pressable onPress={() => router.push(`/(main)/group/${item.id}`)}>
              <Card className="mb-2">
                <Text className="text-foreground font-semibold">{item.name}</Text>
                {item.description ? <Text className="text-muted text-sm mt-1">{item.description}</Text> : null}
              </Card>
            </Pressable>
          );
        }, [router, send, uid, t])}
      />

      <View
        className="absolute bottom-0 left-0 right-0 bg-surface px-4 py-4 rounded-t-2xl"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <Users color={colors.primary} size={20} />
          <Text className="text-foreground font-semibold flex-1">{t('search.inviteTitle')}</Text>
        </View>
        <Text className="text-muted text-sm mb-3">{t('search.inviteSubtitle')}</Text>
        <Button variant="secondary" onPress={inviteShare}>
          {t('search.inviteCta')}
        </Button>
      </View>
    </View>
  );
}
