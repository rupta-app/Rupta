import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import {
  ACTIVITY_STYLES,
  QUEST_CATEGORIES,
  type ActivityStyle,
  type QuestCategory,
} from '@/constants/categories';
import { formatActivityStyleLabel } from '@/utils/activityStyleLabel';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { appLang } from '@/utils/lang';
import { updateProfile } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';

export default function EditPreferencesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { session, profile, refreshProfile } = useAuth();
  const uid = session?.user?.id;
  const lang = appLang(i18n);

  const [categories, setCategories] = useState<QuestCategory[]>([]);
  const [styles, setStyles] = useState<ActivityStyle[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setCategories((profile.preferred_categories ?? []) as QuestCategory[]);
      setStyles((profile.activity_styles ?? []) as ActivityStyle[]);
    }
  }, [profile]);

  const toggleCategory = (c: QuestCategory) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const toggleStyle = (s: ActivityStyle) => {
    setStyles((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const save = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      await updateProfile(uid, {
        preferred_categories: categories,
        activity_styles: styles,
      });
      await refreshProfile();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = QUEST_CATEGORIES.map((c) => ({
    value: c,
    label: formatCategoryLabel(c, lang),
  }));
  const styleOptions = ACTIVITY_STYLES.map((s) => ({
    value: s,
    label: formatActivityStyleLabel(s, lang),
  }));

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('editPreferences.title')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Text className="text-foreground font-semibold text-lg mb-1">
          {t('onboarding.categories')}
        </Text>
        <Text className="text-muted text-sm mb-4">{t('onboarding.categoriesHint')}</Text>
        <PillToggleGroup
          options={categoryOptions}
          selected={categories}
          onToggle={toggleCategory}
          containerClassName="flex-row flex-wrap gap-2.5 mb-8"
        />

        <Text className="text-foreground font-semibold text-lg mb-1">
          {t('onboarding.activityStyle')}
        </Text>
        <Text className="text-muted text-sm mb-4">{t('onboarding.activityHint')}</Text>
        <PillToggleGroup
          options={styleOptions}
          selected={styles}
          onToggle={toggleStyle}
          containerClassName="flex-row flex-wrap gap-2.5 mb-10"
        />

        <Button onPress={save} loading={saving}>
          {t('common.save')}
        </Button>
      </ScrollView>
    </View>
  );
}
