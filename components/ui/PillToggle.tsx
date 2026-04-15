import { Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';

type PillToggleProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  activeClassName?: string;
  inactiveClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
};

export function PillToggle({
  label,
  active,
  onPress,
  activeClassName = 'bg-foreground',
  inactiveClassName = 'bg-surfaceElevated',
  activeTextClassName = 'text-background',
  inactiveTextClassName = 'text-mutedForeground',
}: PillToggleProps) {
  return (
    <PressableScale
      onPress={onPress}
      scaleValue={0.94}
      className={`px-4 py-2 rounded-full ${active ? activeClassName : inactiveClassName}`}
    >
      <Text className={`text-sm font-medium ${active ? activeTextClassName : inactiveTextClassName}`}>{label}</Text>
    </PressableScale>
  );
}

type PillToggleGroupProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T | T[] | Set<T>;
  onToggle: (value: T) => void;
  activeClassName?: string;
  inactiveClassName?: string;
  activeTextClassName?: string;
  inactiveTextClassName?: string;
  containerClassName?: string;
};

export function PillToggleGroup<T extends string>({
  options,
  selected,
  onToggle,
  activeClassName,
  inactiveClassName,
  activeTextClassName,
  inactiveTextClassName,
  containerClassName = 'flex-row flex-wrap gap-2',
}: PillToggleGroupProps<T>) {
  const isActive = (value: T) => {
    if (selected instanceof Set) return selected.has(value);
    if (Array.isArray(selected)) return selected.includes(value);
    return selected === value;
  };

  return (
    <View className={containerClassName}>
      {options.map((opt) => (
        <PillToggle
          key={opt.value}
          label={opt.label}
          active={isActive(opt.value)}
          onPress={() => onToggle(opt.value)}
          activeClassName={activeClassName}
          inactiveClassName={inactiveClassName}
          activeTextClassName={activeTextClassName}
          inactiveTextClassName={inactiveTextClassName}
        />
      ))}
    </View>
  );
}
