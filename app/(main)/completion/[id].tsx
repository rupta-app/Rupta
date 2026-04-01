import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { ChevronLeft, Flag } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RespectButton } from '@/components/social/RespectButton';
import { AppModal } from '@/components/ui/AppModal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  useAddComment,
  useComments,
  useCompletion,
  useCompletionSocial,
  useToggleRespect,
} from '@/hooks/useCompletion';
import type { Database } from '@/types/database';
import { buildCompletionShareMessage, shareCompletionGeneric, shareToWhatsApp } from '@/lib/shareLinks';
import { useAuth } from '@/providers/AuthProvider';
import { submitReport } from '@/services/reports';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { formatCompletionTime } from '@/utils/formatTime';
import { questTitle } from '@/utils/questCopy';

const REASONS: Database['public']['Tables']['reports']['Row']['reason'][] = [
  'fake_proof',
  'stolen_image',
  'harassment',
  'dangerous_content',
  'spam',
];

export default function CompletionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data, isLoading } = useCompletion(id);
  const { data: social } = useCompletionSocial(id, uid);
  const { data: comments = [] } = useComments(id);
  const toggleR = useToggleRespect(id, uid);
  const addC = useAddComment(id, uid);
  const [comment, setComment] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] =
    useState<Database['public']['Tables']['reports']['Row']['reason']>('spam');

  if (isLoading || !data?.profiles || (!data.quests && !data.group_quests)) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const media = data.quest_media?.[0]?.media_url;
  const gave = social?.gaveRespect ?? false;
  const counts = social?.counts ?? { respects: 0, comments: 0 };
  const qTitle = data.group_quests?.title
    ? data.group_quests.title
    : data.quests
      ? questTitle(data.quests, lang)
      : 'SideQuest';
  const shareMsg = buildCompletionShareMessage(qTitle, data.profiles.username);

  const openShare = () => {
    Alert.alert(t('completion.share'), undefined, [
      { text: t('feed.whatsapp'), onPress: () => void shareToWhatsApp(shareMsg) },
      {
        text: t('feed.instagramStory'),
        onPress: () => router.push(`/(main)/share-card/${id}`),
      },
      { text: t('feed.shareMore'), onPress: () => void shareCompletionGeneric(null, shareMsg) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const downloadPhoto = async () => {
    if (!media) return;
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') return;
    const ext = media.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const dest = `${FileSystem.cacheDirectory}rupta-${Date.now()}.${ext}`;
    const { uri } = await FileSystem.downloadAsync(media, dest);
    await MediaLibrary.createAssetAsync(uri);
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 48, flexGrow: 1 }}>
        {media ? <Image source={{ uri: media }} className="w-full h-72 bg-surfaceElevated" /> : null}
        <View className="p-4">
          <Text className="text-muted text-xs">{formatCompletionTime(data.completed_at, lang)}</Text>
          <View className="flex-row items-center gap-3 mt-3">
            <Pressable onPress={() => router.push(`/(main)/user/${data.user_id}`)}>
              <Avatar url={data.profiles.avatar_url} name={data.profiles.display_name} size={48} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-foreground font-bold text-lg">{data.profiles.display_name}</Text>
              <Text className="text-muted text-xs">@{data.profiles.username}</Text>
            </View>
            <Badge tone="primary">{`+${data.aura_earned}`}</Badge>
          </View>
          <Text className="text-foreground text-2xl font-black mt-4">{qTitle}</Text>
          <Text className="text-muted text-xs uppercase mt-2 tracking-wide">
            {data.quests
              ? formatCategoryLabel(data.quests.category, lang)
              : data.group_quests
                ? t('feed.groupQuest')
                : ''}
          </Text>
          {data.caption ? <Text className="text-muted mt-2">{data.caption}</Text> : null}
          <View className="flex-row items-center gap-3 mt-4 flex-wrap">
            <RespectButton
              active={gave}
              loading={toggleR.isPending}
              onPress={() => toggleR.mutate({ has: gave })}
            />
            <Text className="text-muted">
              {counts.respects} · {counts.comments}
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-5">
            <Button variant="secondary" className="flex-1 min-w-[140px]" onPress={openShare}>
              {t('completion.share')}
            </Button>
            {media ? (
              <Button variant="secondary" className="flex-1 min-w-[140px]" onPress={() => void downloadPhoto()}>
                {t('completion.downloadImage')}
              </Button>
            ) : null}
          </View>

          {uid && uid !== data.user_id ? (
            <Pressable
              onPress={() => setReportOpen(true)}
              className="mt-5 flex-row items-center gap-3 py-3 px-1 rounded-xl border border-danger/40 bg-danger/5"
            >
              <Flag color="#F87171" size={22} strokeWidth={2} />
              <Text className="text-danger font-semibold flex-1">{t('report.flagSuspicious')}</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="px-4 border-t border-border pt-4 mt-2">
          <Text className="text-foreground font-bold mb-2">{t('social.comments')}</Text>
          {comments.map(
            (c: {
              id: string;
              content: string;
              profiles?: { username: string; display_name: string };
            }) => (
              <Card key={c.id} className="mb-2 py-2">
                <Text className="text-foreground font-semibold">@{c.profiles?.username}</Text>
                <Text className="text-muted mt-1">{c.content}</Text>
              </Card>
            ),
          )}
          {uid ? (
            <View className="mt-2">
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={t('social.addComment')}
                placeholderTextColor="#64748B"
                className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground mb-2"
              />
              <Button
                variant="secondary"
                onPress={() => {
                  if (!comment.trim()) return;
                  addC.mutate(comment.trim(), { onSuccess: () => setComment('') });
                }}
              >
                {t('common.save')}
              </Button>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <AppModal visible={reportOpen} onClose={() => setReportOpen(false)} title={t('report.title')} footer={false}>
        {REASONS.map((item) => (
          <Pressable
            key={item}
            onPress={() => setReportReason(item)}
            className={`py-3 border-b border-border ${reportReason === item ? 'bg-primary/10' : ''}`}
          >
            <Text className="text-foreground">
              {item === 'fake_proof'
                ? t('report.fake')
                : item === 'stolen_image'
                  ? t('report.stolen')
                  : item === 'harassment'
                    ? t('report.harassment')
                    : item === 'dangerous_content'
                      ? t('report.dangerous')
                      : t('report.spam')}
            </Text>
          </Pressable>
        ))}
        <Button
          className="mt-4"
          variant="danger"
          onPress={async () => {
            if (!uid) return;
            await submitReport({
              reporterId: uid,
              completionId: id,
              reportedUserId: data.user_id,
              reason: reportReason,
            });
            setReportOpen(false);
          }}
        >
          {t('report.submit')}
        </Button>
      </AppModal>
    </View>
  );
}
