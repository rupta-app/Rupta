import { memo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { CATEGORY_CONFIG } from '@/constants/categories';
import type { GroupQuestStatus } from '@/types/database';
import { groupQuestStatusMeta } from '@/utils/groupQuestStatus';

type Props = {
  quest: {
    id: string;
    title: string;
    description?: string | null;
    aura_reward: number;
    status: string;
    category?: string | null;
  };
  onPress?: () => void;
};

export const GroupQuestCard = memo(function GroupQuestCard({ quest, onPress }: Props) {
  const { t } = useTranslation();
  const cat = CATEGORY_CONFIG[quest.category ?? ''] ?? CATEGORY_CONFIG.random;
  const CatIcon = cat.icon;
  const status = groupQuestStatusMeta(quest.status as GroupQuestStatus, t);

  const content = (
    <Card
      className="mb-3"
      variant="default"
    >
      <View
        className="flex-row items-center"
        style={{ borderLeftWidth: 3, borderLeftColor: cat.accent, paddingLeft: 10 }}
      >
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: cat.bg }}
        >
          <CatIcon color={cat.accent} size={20} strokeWidth={2.2} />
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-foreground font-bold text-base" numberOfLines={1}>
            {quest.title}
          </Text>
          {quest.description ? (
            <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
              {quest.description}
            </Text>
          ) : null}
        </View>
        <View className="items-end gap-1.5 ml-2">
          <View
            className="rounded-full px-2 py-0.5"
            style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}
          >
            <Text className="text-primary text-xs font-bold">+{quest.aura_reward}</Text>
          </View>
          <Badge tone={status.tone}>{status.label}</Badge>
        </View>
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleValue={0.98} haptic={false}>
        {content}
      </PressableScale>
    );
  }
  return content;
});
