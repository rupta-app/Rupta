import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Pencil } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { MainAppHeader } from '@/components/navigation/MainAppHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { auraLevelFromTotal, auraProgressInCurrentLevel, auraToNextLevel } from '@/lib/aura';
import { useAuth } from '@/providers/AuthProvider';
import { fetchActivityChart, fetchProfileStats, fetchRecentCompletions } from '@/services/profile';
import { questTitle } from '@/utils/questCopy';

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { profile, session, refreshProfile } = useAuth();
  const uid = session?.user?.id;
  const [tab, setTab] = useState<'stats' | 'life'>('stats');

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', uid],
    queryFn: () => fetchProfileStats(uid!),
    enabled: Boolean(uid),
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['profile-recent', uid],
    queryFn: () => fetchRecentCompletions(uid!),
    enabled: Boolean(uid),
  });

  const { data: activity } = useQuery({
    queryKey: ['profile-activity', uid],
    queryFn: () => fetchActivityChart(uid!),
    enabled: Boolean(uid),
  });

  if (!profile) return null;

  const level = auraLevelFromTotal(profile.total_aura);
  const { progress } = auraProgressInCurrentLevel(profile.total_aura);
  const next = auraToNextLevel(profile.total_aura);
  const maxBar = Math.max(...(activity?.buckets ?? [0]), 1);

  return (
    <View className="flex-1 bg-background">
      <MainAppHeader variant="profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 12 }}>
        <View className="flex-row items-center gap-4">
          <View className="relative">
            <Avatar url={profile.avatar_url} name={profile.display_name} size={80} />
            <Pressable
              onPress={() => router.push('/(main)/edit-profile')}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-surface border border-border items-center justify-center"
            >
              <Pencil color="#A78BFA" size={16} />
            </Pressable>
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-2xl font-bold">{profile.display_name}</Text>
            <Text className="text-muted">@{profile.username}</Text>
          </View>
        </View>

        <View className="flex-row gap-2 mt-6">
          <Pressable
            onPress={() => setTab('stats')}
            className={`flex-1 py-2.5 rounded-xl border items-center ${tab === 'stats' ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <Text className="text-foreground font-semibold">{t('profile.tabStats')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('life')}
            className={`flex-1 py-2.5 rounded-xl border items-center ${tab === 'life' ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <Text className="text-foreground font-semibold">{t('profile.tabLife')}</Text>
          </Pressable>
        </View>

        {tab === 'stats' ? (
          <>
            <Card className="mt-4">
              <Text className="text-muted text-xs uppercase">{t('common.auraLevel')}</Text>
              <Text className="text-primary text-4xl font-black mt-1">{level}</Text>
              <Text className="text-foreground mt-2">
                {profile.total_aura} {t('common.aura')}
              </Text>
              <View className="h-2 bg-surfaceElevated rounded-full mt-3 overflow-hidden">
                <View className="h-full bg-primary rounded-full" style={{ width: `${progress * 100}%` }} />
              </View>
              <Text className="text-muted text-xs mt-1">
                {next} {t('profile.nextLevelSuffix')}
              </Text>
            </Card>

            <View className="flex-row flex-wrap gap-3 mt-4">
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.weekAura')}</Text>
                <Text className="text-secondary text-xl font-bold">{activity?.weekAura ?? 0}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.monthAura')}</Text>
                <Text className="text-foreground text-xl font-bold">{activity?.monthAura ?? 0}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.completionsThisWeek')}</Text>
                <Text className="text-foreground text-xl font-bold">{activity?.weekCompletions ?? 0}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.yearlyAura')}</Text>
                <Text className="text-foreground text-xl font-bold">{profile.yearly_aura}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.questsDone')}</Text>
                <Text className="text-foreground text-xl font-bold">{stats?.questsCompleted ?? '—'}</Text>
              </Card>
              <Card className="flex-1 min-w-[40%]">
                <Text className="text-muted text-xs">{t('profile.categoriesExplored')}</Text>
                <Text className="text-foreground text-xl font-bold">
                  {stats?.categoriesExplored ?? '—'} ({stats?.categoryCompletionPct ?? 0}%)
                </Text>
              </Card>
            </View>

            {activity?.buckets ? (
              <Card className="mt-4">
                <Text className="text-foreground font-bold mb-3">{t('profile.activityWeek')}</Text>
                <View className="flex-row items-end justify-between gap-1" style={{ height: 88 }}>
                  {activity.buckets.map((n, i) => (
                    <View key={i} className="flex-1 items-center justify-end">
                      <View
                        className="w-full bg-primary/80 rounded-t-md"
                        style={{ height: 8 + (n / maxBar) * 72 }}
                      />
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            <Text className="text-foreground font-bold mt-8 mb-2">{t('profile.recent')}</Text>
            {recent.map((row: { id: string; quests?: { title_en: string; title_es: string }; aura_earned: number }) => (
              <Pressable key={row.id} onPress={() => router.push(`/(main)/completion/${row.id}`)}>
                <Card className="mb-2 py-3">
                  <Text className="text-foreground font-semibold">
                    {row.quests ? questTitle(row.quests, lang) : 'Quest'}
                  </Text>
                  <Text className="text-primary text-sm">+{row.aura_earned} AURA</Text>
                </Card>
              </Pressable>
            ))}

            <Text className="text-muted text-sm mt-6 text-center">{t('profile.ranksFriends')}</Text>
          </>
        ) : (
          <Card className="mt-4">
            <Text className="text-foreground font-semibold">{t('common.lifeList')}</Text>
            <Text className="text-muted mt-2 leading-6">{t('profile.openLifeList')}</Text>
            <Button className="mt-4" variant="secondary" onPress={() => router.push('/(main)/life-list')}>
              {t('common.lifeList')}
            </Button>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
