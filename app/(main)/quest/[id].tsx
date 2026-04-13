import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useOfficialCompletionCount, useQuest, useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { isAtCompletionCap, maxCompletionsAllowed } from '@/lib/questCompletionRules';
import { useAuth } from '@/providers/AuthProvider';
import type { QuestRow } from '@/services/quests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { appLang } from '@/utils/lang';
import { questDescription, questTitle } from '@/utils/questCopy';

function completionRuleLines(quest: QuestRow, t: (k: string, o?: Record<string, unknown>) => string) {
  const lines: string[] = [];
  const max = maxCompletionsAllowed(quest);
  if (quest.repeatability_type === 'once') {
    lines.push(t('quest.ruleOnce'));
  } else if (quest.repeatability_type === 'limited') {
    lines.push(t('quest.ruleLimited', { max: max ?? 1 }));
  } else {
    lines.push(t('quest.ruleRepeatable'));
    if (quest.repeat_interval === 'weekly') lines.push(t('quest.ruleCooldownWeekly'));
    else if (quest.repeat_interval === 'monthly') lines.push(t('quest.ruleCooldownMonthly'));
    else if (quest.repeat_interval === 'yearly') lines.push(t('quest.ruleCooldownYearly'));
  }
  return lines;
}

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const lang = appLang(i18n);
  const { data: quest, isLoading } = useQuest(id);
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: saved = new Set<string>() } = useSavedQuestIds(uid);
  const toggle = useToggleSave(uid);
  const { data: myCount = 0, isLoading: countLoading } = useOfficialCompletionCount(uid, id);

  const capped = quest ? isAtCompletionCap(quest, myCount) : false;
  const rules = useMemo(() => (quest ? completionRuleLines(quest, t) : []), [quest, t]);

  if (isLoading || !quest) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted">{t('common.loading')}</Text>
      </View>
    );
  }

  const isSaved = saved.has(quest.id);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('quest.detail')} />
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
            <Text className="text-muted text-xs uppercase font-semibold mb-2">{t('groups.repeatability')}</Text>
            {rules.map((line, i) => (
              <Text key={`${i}-${line}`} className="text-foreground text-sm leading-6">
                · {line}
              </Text>
            ))}
            {uid ? (
              <Text className="text-primary font-semibold text-sm mt-3">
                {t('quest.yourCompletions', { count: myCount })}
              </Text>
            ) : null}
          </Card>
          <Card className="mt-3 border-border">
            <Text className="text-muted leading-6">{questDescription(quest, lang)}</Text>
            <Text className="text-muted text-sm mt-3">
              {t('groups.proofType')}: {quest.proof_type}
            </Text>
          </Card>
          <Button
            className="mt-6"
            disabled={!uid || capped || countLoading}
            onPress={() => router.push(`/(main)/complete-quest/${quest.id}`)}
          >
            {capped ? t('quest.completed') : t('quest.complete')}
          </Button>
          {capped ? <Text className="text-muted text-sm text-center mt-2">{t('quest.completedHint')}</Text> : null}
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
