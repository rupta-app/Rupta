import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { CATEGORY_CONFIG } from '@/constants/categories';
import {
  useActivateDraftQuest,
  useDeleteGroupQuest,
  useGroupQuest,
  useSubmitGroupQuestForReview,
} from '@/hooks/useGroupQuests';
import { useMyGroupPermissions } from '@/hooks/useGroups';
import { useAuth } from '@/providers/AuthProvider';
import type { GroupQuestStatus } from '@/types/database';
import { groupQuestStatusMeta } from '@/utils/groupQuestStatus';

export default function GroupQuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const { data: q, isLoading, isError } = useGroupQuest(id);
  const submit = useSubmitGroupQuestForReview();
  const approve = useActivateDraftQuest();
  const del = useDeleteGroupQuest();
  const { canAdmin } = useMyGroupPermissions(q?.group_id, uid);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title="" />
        <View className="p-4 gap-3">
          <Skeleton width="100%" height={160} rounded="lg" />
          <Skeleton width="70%" height={20} rounded="sm" />
          <Skeleton width="40%" height={14} rounded="sm" />
          <Skeleton width="100%" height={80} rounded="lg" />
        </View>
      </View>
    );
  }

  if (isError || !q) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('common.error')} />
        <ErrorState title={t('common.error')} subtitle={t('common.errorSubtitle')} />
      </View>
    );
  }

  const isCreator = q.creator_id === uid;
  const canComplete = q.status === 'active';
  const cat = CATEGORY_CONFIG[q.category ?? ''] ?? CATEGORY_CONFIG.random;
  const CatIcon = cat.icon;
  const status = groupQuestStatusMeta(q.status as GroupQuestStatus, t);
  const creatorName = q.creator?.display_name ?? q.creator?.username ?? '';

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.duration(300).damping(20)}>
          <View
            className="bg-surface rounded-2xl p-5"
            style={{ borderLeftWidth: 3, borderLeftColor: cat.accent }}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-2.5"
                style={{ backgroundColor: cat.bg }}
              >
                <CatIcon color={cat.accent} size={18} strokeWidth={2.5} />
              </View>
              <View className="flex-1" />
              <Badge tone={status.tone}>{status.label}</Badge>
            </View>

            <Text className="text-foreground text-xl font-bold leading-7">{q.title}</Text>

            <View className="flex-row items-center mt-4">
              <View
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}
              >
                <Text className="text-primary text-sm font-bold">+{q.aura_reward} AURA</Text>
              </View>
              <View className="flex-1" />
              <Badge tone="secondary">{q.visibility}</Badge>
            </View>
          </View>

          {q.creator ? (
            <View className="bg-surface rounded-2xl p-4 mt-3 flex-row items-center gap-3">
              <Avatar url={q.creator.avatar_url ?? null} name={creatorName} size={40} />
              <View className="flex-1">
                <Text className="text-muted text-xs uppercase font-semibold tracking-wide">
                  {t('groups.creator')}
                </Text>
                <Text className="text-foreground font-semibold">{creatorName}</Text>
                {q.creator.username ? (
                  <Text className="text-muted text-xs">@{q.creator.username}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {q.description ? (
            <View className="bg-surface rounded-2xl p-4 mt-3">
              <Text className="text-muted text-xs uppercase font-semibold mb-2 tracking-wide">
                {t('groups.groupQuestDetails')}
              </Text>
              <Text className="text-foreground leading-6">{q.description}</Text>
            </View>
          ) : null}

          {canComplete ? (
            <Button className="mt-6" onPress={() => go(`/(main)/complete-group-quest/${q.id}`)}>
              {t('groups.completeGroupQuest')}
            </Button>
          ) : null}

          {isCreator && q.status === 'active' ? (
            <Button
              variant="secondary"
              className="mt-3"
              loading={submit.isPending}
              onPress={() => submit.mutate({ questId: q.id, userId: uid })}
            >
              {t('groups.submitForReview')}
            </Button>
          ) : null}

          {canAdmin && q.status === 'draft' ? (
            <View className="mt-6 gap-3">
              <Button
                loading={approve.isPending}
                onPress={() =>
                  approve.mutate(
                    { questId: q.id, adminUserId: uid, groupId: q.group_id },
                    {
                      onSuccess: () =>
                        Alert.alert(t('groups.draftApprovedTitle'), t('groups.draftApprovedBody')),
                      onError: (e) =>
                        Alert.alert(t('common.error'), e instanceof Error ? e.message : String(e)),
                    },
                  )
                }
              >
                {t('groups.approveDraft')}
              </Button>
              <Button
                variant="danger"
                loading={del.isPending}
                onPress={() =>
                  Alert.alert(t('groups.rejectDraftTitle'), t('groups.rejectDraftConfirm'), [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('groups.rejectDraft'),
                      style: 'destructive',
                      onPress: () =>
                        del.mutate(
                          { questId: q.id, adminUserId: uid, groupId: q.group_id },
                          {
                            onSuccess: () => router.back(),
                            onError: (e) =>
                              Alert.alert(
                                t('common.error'),
                                e instanceof Error ? e.message : String(e),
                              ),
                          },
                        ),
                    },
                  ])
                }
              >
                {t('groups.rejectDraft')}
              </Button>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
