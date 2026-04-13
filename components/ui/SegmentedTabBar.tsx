import { Pressable, Text, View } from 'react-native';

type Tab<T extends string> = { key: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
};

export function SegmentedTabBar<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <View className="flex-row border-b border-border">
      {tabs.map(({ key, label }) => {
        const isActive = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            className="flex-1 items-center pb-2"
          >
            <Text
              className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-muted'}`}
              numberOfLines={1}
            >
              {label}
            </Text>
            {isActive ? (
              <View className="h-0.5 w-full bg-primary mt-2 rounded-full" />
            ) : (
              <View className="h-0.5 mt-2" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
