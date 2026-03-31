import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/providers/AuthProvider';
import { useQuest, useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { questDescription, questTitle } from '@/utils/questCopy';

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
  const { data: quest, isLoading } = useQuest(id);
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: saved = new Set<string>() } = useSavedQuestIds(uid);
  const toggle = useToggleSave(uid);

  if (isLoading || !quest) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const isSaved = saved.has(quest.id);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-2 py-2 border-b border-border">
        <Pressable onPress={() => router.back()} className="p-2">
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg ml-1">{t('quest.detail')}</Text>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.duration(450).springify().damping(16)}>
          <View className="bg-surface border border-primary/25 rounded-2xl p-5 mb-2">
            <Text className="text-foreground text-3xl font-black">{questTitle(quest, lang)}</Text>
            <View className="flex-row flex-wrap gap-2 mt-4">
              <Badge>{formatCategoryLabel(quest.category, lang)}</Badge>
              <Badge tone="secondary">{quest.difficulty}</Badge>
              <Badge tone="respect">+{quest.aura_reward} AURA</Badge>
            </View>
          </View>
          <Card className="mt-2 border-border">
            <Text className="text-muted leading-6">{questDescription(quest, lang)}</Text>
            <Text className="text-muted text-sm mt-4">
              Repeat: {quest.repeatability_type}
              {quest.repeat_interval ? ` · ${quest.repeat_interval}` : ''}
            </Text>
            <Text className="text-muted text-sm">Proof: {quest.proof_type}</Text>
          </Card>
          <Button className="mt-6" onPress={() => router.push(`/(main)/complete-quest/${quest.id}`)}>
            {t('quest.complete')}
          </Button>
          <Button
            variant="secondary"
            className="mt-3"
            onPress={() => uid && toggle.mutate({ questId: quest.id, currentlySaved: isSaved })}
          >
            {isSaved ? t('quest.unsaved') : `Save · ${t('common.lifeList')}`}
          </Button>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
