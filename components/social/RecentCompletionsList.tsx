import { Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { questTitle } from '@/utils/questCopy';
import { formatAuraDisplay, isSpontaneousAuraPending } from '@/utils/spontaneousAura';

type CompletionRow = {
  id: string;
  quests?: { title_en: string; title_es: string };
  aura_earned: number;
  quest_source_type?: string;
};

type Props = {
  completions: CompletionRow[];
  lang: string;
  onPress?: (id: string) => void;
};

export function RecentCompletionsList({ completions, lang, onPress }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <Text className="text-foreground font-bold mt-8 mb-2">{t('profile.recent')}</Text>
      {completions.map((row) => {
        const content = (
          <Card key={row.id} className="mb-2 py-3">
            <Text className="text-foreground font-semibold">
              {row.quests ? questTitle(row.quests, lang) : 'Quest'}
            </Text>
            <Text
              className={
                isSpontaneousAuraPending(row.quest_source_type, row.aura_earned)
                  ? 'text-muted text-sm'
                  : 'text-primary text-sm'
              }
            >
              {formatAuraDisplay(row.quest_source_type, row.aura_earned, t('feed.auraPendingReview'))}
            </Text>
          </Card>
        );
        if (onPress) {
          return (
            <Pressable key={row.id} onPress={() => onPress(row.id)}>
              {content}
            </Pressable>
          );
        }
        return content;
      })}
    </>
  );
}
