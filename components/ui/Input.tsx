import { useId } from 'react';
import {
  Keyboard,
  Platform,
  InputAccessoryView,
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  multiline,
  autoCapitalize = 'none',
  keyboardType,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: TextInputProps['keyboardType'];
}) {
  const { t } = useTranslation();
  const rid = useId();
  const accessoryId = Platform.OS === 'ios' && multiline ? `kbd-done-${rid.replace(/[^a-zA-Z0-9]/g, '')}` : undefined;

  return (
    <View className="mb-4">
      {label ? <Text className="text-muted text-sm mb-1.5 font-medium">{label}</Text> : null}
      {Platform.OS === 'ios' && multiline && accessoryId ? (
        <InputAccessoryView nativeID={accessoryId} backgroundColor="#14141F">
          <View className="flex-row justify-end border-t border-border px-3 py-2">
            <Pressable onPress={() => Keyboard.dismiss()} className="px-3 py-1" hitSlop={8}>
              <Text className="text-primary font-semibold">{t('common.keyboardDone')}</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        inputAccessoryViewID={accessoryId}
        returnKeyType={multiline ? 'default' : 'done'}
        blurOnSubmit={!multiline}
        onSubmitEditing={!multiline ? () => Keyboard.dismiss() : undefined}
        className={`bg-surface border border-border rounded-xl px-4 text-foreground text-base ${multiline ? 'py-3 min-h-[100px]' : 'py-3.5'} ${error ? 'border-danger' : ''}`}
      />
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
