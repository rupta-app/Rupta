import { Zap } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CATEGORY_CONFIG, DIFFICULTY_COLOR } from '@/constants/categories';
import { formatCategoryLabel } from '@/utils/categoryLabel';

const DIFFICULTY_I18N: Record<string, string> = {
  easy: 'quest.difficultyEasy',
  medium: 'quest.difficultyMedium',
  hard: 'quest.difficultyHard',
  legendary: 'quest.difficultyLegendary',
};

type Props = {
  category: string;
  difficulty: string;
  lang: string;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
};

export function QuestCardHeader({ category, difficulty, lang, size = 'md', children }: Props) {
  const { t } = useTranslation();
  const cat = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.random;
  const CatIcon = cat.icon;
  const diffColor = DIFFICULTY_COLOR[difficulty];
  const diffLabel = DIFFICULTY_I18N[difficulty]
    ? t(DIFFICULTY_I18N[difficulty])
    : difficulty;

  const iconBox = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 16 : 18;
  const zapSize = size === 'sm' ? 12 : 13;

  return (
    <View className="flex-row items-center">
      <View
        className={`${iconBox} rounded-lg items-center justify-center mr-2.5`}
        style={{ backgroundColor: cat.bg }}
      >
        <CatIcon color={cat.accent} size={iconSize} strokeWidth={2.5} />
      </View>
      <Text className="text-xs font-semibold" style={{ color: cat.accent }}>
        {formatCategoryLabel(category, lang)}
      </Text>
      <View className="flex-1" />
      <View className="flex-row items-center">
        <Zap color={diffColor} size={zapSize} strokeWidth={2.5} fill={diffColor} />
        <Text className="text-xs font-semibold ml-1" style={{ color: diffColor }}>
          {diffLabel}
        </Text>
      </View>
      {children}
    </View>
  );
}
