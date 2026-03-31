import { Text, TextInput, View } from 'react-native';

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  multiline,
  autoCapitalize = 'none',
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View className="mb-4">
      {label ? <Text className="text-muted text-sm mb-1.5 font-medium">{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        className={`bg-surface border border-border rounded-xl px-4 text-foreground text-base ${multiline ? 'py-3 min-h-[100px]' : 'py-3.5'} ${error ? 'border-danger' : ''}`}
      />
      {error ? <Text className="text-danger text-xs mt-1">{error}</Text> : null}
    </View>
  );
}
