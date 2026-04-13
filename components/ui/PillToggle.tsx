import { Pressable, Text, View } from 'react-native';

type PillToggleProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  activeClassName?: string;
};

export function PillToggle({
  label,
  active,
  onPress,
  activeClassName = 'border-primary bg-primary/15',
}: PillToggleProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2.5 rounded-full border ${active ? activeClassName : 'border-border bg-surface'}`}
    >
      <Text className="text-foreground text-sm font-medium">{label}</Text>
    </Pressable>
  );
}

type PillToggleGroupProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T | T[] | Set<T>;
  onToggle: (value: T) => void;
  activeClassName?: string;
};

export function PillToggleGroup<T extends string>({
  options,
  selected,
  onToggle,
  activeClassName,
}: PillToggleGroupProps<T>) {
  const isActive = (value: T) => {
    if (selected instanceof Set) return selected.has(value);
    if (Array.isArray(selected)) return selected.includes(value);
    return selected === value;
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => (
        <PillToggle
          key={opt.value}
          label={opt.label}
          active={isActive(opt.value)}
          onPress={() => onToggle(opt.value)}
          activeClassName={activeClassName}
        />
      ))}
    </View>
  );
}
