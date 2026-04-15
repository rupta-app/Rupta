import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { QuestCardHeader } from '@/components/ui/QuestCardHeader';
import { CATEGORY_CONFIG } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { useOfficialCompletionCount, useQuest, useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { isAtCompletionCap, maxCompletionsAllowed } from '@/lib/questCompletionRules';
import { useAuth } from '@/providers/AuthProvider';
import type { QuestRow } from '@/services/quests';
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
  const cat = CATEGORY_CONFIG[quest.category] ?? CATEGORY_CONFIG.random;
  const desc = questDescription(quest, lang);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title=""
        right={
          <PressableScale
            onPress={() => uid && toggle.mutate({ questId: quest.id, currentlySaved: isSaved })}
            hitSlop={10}
            scaleValue={0.9}
            className="p-2"
          >
            <Bookmark
              color={isSaved ? colors.secondary : colors.muted}
              fill={isSaved ? colors.secondary : 'none'}
              size={24}
              strokeWidth={2}
            />
          </PressableScale>
        }
      />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.duration(300).damping(20)}>
          <View
            className="bg-surface rounded-2xl p-5"
            style={{ borderLeftWidth: 3, borderLeftColor: cat.accent }}
          >
            <View className="mb-4">
              <QuestCardHeader category={quest.category} difficulty={quest.difficulty} lang={lang} />
            </View>

            <Text className="text-foreground text-xl font-bold leading-7">
              {questTitle(quest, lang)}
            </Text>

            <View className="flex-row mt-4">
              <View
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: colors.primaryGlow }}
              >
                <Text className="text-primary text-sm font-bold">+{quest.aura_reward} AURA</Text>
              </View>
            </View>
          </View>

          {desc ? (
            <View className="bg-surface rounded-2xl p-4 mt-3">
              <Text className="text-muted text-xs uppercase font-semibold mb-2 tracking-wide">
                {t('quest.detail')}
              </Text>
              <Text className="text-foreground leading-6">{desc}</Text>
              <Text className="text-muted text-sm mt-3">
                {t('groups.proofType')}: {quest.proof_type}
              </Text>
            </View>
          ) : null}

          <View className="bg-surface rounded-2xl p-4 mt-3">
            <Text className="text-muted text-xs uppercase font-semibold mb-2 tracking-wide">
              {t('groups.repeatability')}
            </Text>
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
          </View>

          <Button
            className="mt-6"
            disabled={!uid || capped || countLoading}
            onPress={() => router.push(`/(main)/complete-quest/${quest.id}`)}
          >
            {capped ? t('quest.completed') : t('quest.complete')}
          </Button>
          {capped ? (
            <Text className="text-muted text-sm text-center mt-2">{t('quest.completedHint')}</Text>
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
