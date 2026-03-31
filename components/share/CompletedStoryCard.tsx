import { Image, ImageBackground, Text, View } from 'react-native';

import { logoMark } from '@/constants/branding';
import type { QuestRow } from '@/services/quests';
import { questTitle } from '@/utils/questCopy';

/** 9:16 story template — capture with react-native-view-shot */
export function CompletedStoryCard({
  quest,
  auraEarned,
  username,
  displayName,
  category,
  lang,
  backgroundUri,
}: {
  quest: QuestRow;
  auraEarned: number;
  username: string;
  displayName: string;
  category: string;
  lang: string;
  backgroundUri?: string | null;
}) {
  const title = questTitle(quest, lang);
  const inner = (
    <View className="flex-1 p-5 justify-between bg-black/55">
      <View>
        <Image
          source={logoMark}
          accessibilityLabel="Rupta"
          resizeMode="contain"
          style={{ width: 88, height: 26 }}
        />
        <Text className="text-white/70 text-xs mt-1">SideQuest completed</Text>
        <Text className="text-white text-2xl font-bold mt-4 leading-8">{title}</Text>
        <Text className="text-primary text-sm font-semibold mt-2 uppercase">{category}</Text>
      </View>
      <View>
        <Text className="text-respect text-4xl font-black">+{auraEarned}</Text>
        <Text className="text-white/80 text-sm font-medium">{displayName}</Text>
        <Text className="text-white/50 text-xs">@{username}</Text>
      </View>
    </View>
  );

  return (
    <View className="w-[270px] h-[480px] bg-background rounded-3xl overflow-hidden border border-border">
      {backgroundUri ? (
        <ImageBackground
          source={{ uri: backgroundUri }}
          className="flex-1 w-full h-full"
          imageStyle={{ opacity: 0.4 }}
        >
          {inner}
        </ImageBackground>
      ) : (
        <View className="flex-1 w-full h-full bg-surfaceElevated">{inner}</View>
      )}
    </View>
  );
}
