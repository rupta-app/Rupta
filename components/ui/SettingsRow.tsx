import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Children, Fragment, type ReactNode, isValidElement } from 'react';
import { Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { PressableScale } from '@/components/ui/PressableScale';

type Props = {
  icon: LucideIcon;
  label: string;
  subtitle?: string | null;
  value?: string | null;
  right?: ReactNode;
  onPress?: () => void;
  danger?: boolean;
  accentColor?: string;
  showChevron?: boolean;
};

export function SettingsRow({
  icon: Icon,
  label,
  subtitle,
  value,
  right,
  onPress,
  danger = false,
  accentColor,
  showChevron = true,
}: Props) {
  const iconColor = danger ? colors.dangerLight : (accentColor ?? colors.primary);
  const iconBg = danger
    ? 'rgba(239,68,68,0.14)'
    : accentColor
      ? `${accentColor}22`
      : colors.primaryGlow;

  const content = (
    <View className="flex-row items-center py-3.5 px-1">
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        <Icon color={iconColor} size={18} />
      </View>
      <View className="flex-1 ml-3">
        <Text
          className={`text-base ${danger ? 'text-dangerLight' : 'text-foreground'}`}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text className="text-muted text-xs mt-0.5" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text className="text-muted text-sm mr-1" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right}
      {onPress && showChevron ? (
        <ChevronRight color={colors.mutedForeground} size={18} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressableScale onPress={onPress} scaleValue={0.98} haptic={false}>
      {content}
    </PressableScale>
  );
}

export function SettingsGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <View className="mb-6">
      {title ? (
        <Text className="text-muted text-xs uppercase tracking-wider mb-2 px-1">
          {title}
        </Text>
      ) : null}
      <View className="bg-surface rounded-2xl px-3">
        {items.map((child, i) => (
          <Fragment key={i}>
            {child}
            {i < items.length - 1 ? <View className="h-px bg-border/50 ml-12" /> : null}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
