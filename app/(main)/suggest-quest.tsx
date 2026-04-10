import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { submitQuestSuggestion } from '@/services/questSuggestions';
import { useAuth } from '@/providers/AuthProvider';

export default function SuggestQuestScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const uid = session?.user?.id!;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!title.trim()) {
      setErr(t('suggestQuest.titleRequired'));
      return;
    }
    setErr('');
    setLoading(true);
    try {
      await submitQuestSuggestion(uid, title.trim(), description.trim() || undefined);
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('suggestQuest.title')} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {done ? (
          <Text className="text-foreground text-lg font-semibold">{t('suggestQuest.thanks')}</Text>
        ) : (
          <>
            <Text className="text-muted leading-6 mb-4">{t('suggestQuest.intro')}</Text>
            <Input label={t('suggestQuest.idea')} value={title} onChangeText={setTitle} />
            <Input
              label={t('suggestQuest.details')}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder={t('suggestQuest.detailsPlaceholder')}
            />
            {err ? <Text className="text-danger mt-2">{err}</Text> : null}
            <Button className="mt-6" onPress={submit} loading={loading}>
              {t('suggestQuest.submit')}
            </Button>
          </>
        )}
      </ScrollView>
    </View>
  );
}
