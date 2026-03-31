import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';

export function AppModal({
  visible,
  onClose,
  title,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Pass `false` to hide default OK button */
  footer?: ReactNode | false;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable className="flex-1 bg-black/70 justify-end" onPress={onClose}>
        <Pressable
          className="bg-surface rounded-t-3xl border border-border px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-foreground text-lg font-bold mb-3">{title}</Text>
          {children}
          {footer !== false && (footer ?? <Button onPress={onClose}>OK</Button>)}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
