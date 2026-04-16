import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useChallenge, useChallengeLeaderboard } from '@/hooks/useChallenges';

export default function ChallengeDetailScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const { t } = useTranslation();
  const { data: ch, isLoading, isError } = useChallenge(challengeId);
  const { data: lb = [] } = useChallengeLeaderboard(challengeId);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  if (isError || !ch) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={t('common.error')} />
        <ErrorState title={t('common.error')} subtitle={t('common.errorSubtitle')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={ch.title} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text className="text-muted text-sm">{ch.description}</Text>
        <Text className="text-foreground mt-2">
          {t('groups.scoringMode')}: {ch.scoring_mode}
        </Text>
        {ch.prize_description ? (
          <Text className="text-primary mt-2 font-semibold">{ch.prize_description}</Text>
        ) : null}
        <Text className="text-muted text-xs mt-4">
          {new Date(ch.start_date).toLocaleString()} → {new Date(ch.end_date).toLocaleString()}
        </Text>
        <Text className="text-foreground text-lg font-bold mt-6 mb-2">{t('groups.challengeLeaderboard')}</Text>
        {lb.length === 0 ? (
          <EmptyState icon={Trophy} title={t('empty.noResults')} />
        ) : (
          lb.map(
            (
              row: {
                user_id: string;
                score: number;
                profiles?: { display_name: string; avatar_url: string | null; username: string };
              },
              i: number,
            ) => (
              <Card key={row.user_id} className="mb-2 flex-row items-center gap-3">
                <Text className="text-muted w-8 font-bold">#{i + 1}</Text>
                <Avatar url={row.profiles?.avatar_url} name={row.profiles?.display_name ?? '?'} size={40} />
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{row.profiles?.display_name}</Text>
                  <Text className="text-muted text-xs">@{row.profiles?.username}</Text>
                </View>
                <Text className="text-primary font-black">{row.score}</Text>
              </Card>
            ),
          )
        )}
      </ScrollView>
    </View>
  );
}
