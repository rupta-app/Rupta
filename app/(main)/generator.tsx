import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PillToggleGroup } from '@/components/ui/PillToggle';
import { QUEST_CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/providers/AuthProvider';
import { useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { pickQuestFromCatalog, type GeneratorInput } from '@/services/generator';
import { fetchQuests } from '@/services/quests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { appLang } from '@/utils/lang';
import { questTitle } from '@/utils/questCopy';
import { useQuery } from '@tanstack/react-query';

const COSTS = ['free', 'low', 'medium', 'high', 'any'] as const;
const ROLL_ANIMATION_MS = 1000;

export default function GeneratorScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const go = (path: string) => router.push(path as Href);
  const lang = appLang(i18n);
  const { session } = useAuth();
  const uid = session?.user?.id;
  const { data: quests = [] } = useQuery({ queryKey: ['quests-all-gen'], queryFn: () => fetchQuests({}) });
  const { data: saved = new Set<string>() } = useSavedQuestIds(uid);
  const toggle = useToggleSave(uid);
  const [cost, setCost] = useState<(typeof COSTS)[number]>('any');
  const [solo, setSolo] = useState(true);
  const [loc, setLoc] = useState<'indoor' | 'outdoor' | 'any'>('any');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high' | undefined>('medium');
  const [cat, setCat] = useState<string | undefined>();
  const [city, setCity] = useState('');
  const [picked, setPicked] = useState<ReturnType<typeof pickQuestFromCatalog>>(null);
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    const input: GeneratorInput = {
      cost_range: cost,
      solo,
      location_type: loc,
      energy,
      category: cat,
      cityHint: city.trim() || undefined,
    };
    setRolling(true);
    setPicked(null);
    setTimeout(() => {
      setPicked(pickQuestFromCatalog(quests, input));
      setRolling(false);
    }, ROLL_ANIMATION_MS);
  };

  const isSaved = picked ? saved.has(picked.id) : false;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('generator.title')} />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 12 }}>
        <Text className="text-muted">{t('generator.subtitle')}</Text>

        <Text className="text-muted text-xs uppercase mt-6 mb-2">{t('generator.budget')}</Text>
        <PillToggleGroup
          options={COSTS.map((c) => ({ value: c, label: c }))}
          selected={cost}
          onToggle={setCost}
        />

        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('generator.crew')}</Text>
        <PillToggleGroup
          options={[
            { value: 'solo' as const, label: t('generator.solo') },
            { value: 'friends' as const, label: t('generator.withFriends') },
          ]}
          selected={solo ? 'solo' : 'friends'}
          onToggle={(v) => setSolo(v === 'solo')}
          containerClassName="flex-row gap-2"
        />

        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('generator.place')}</Text>
        <PillToggleGroup
          options={[
            { value: 'indoor' as const, label: t('generator.indoor') },
            { value: 'outdoor' as const, label: t('generator.outdoor') },
            { value: 'any' as const, label: t('generator.any') },
          ]}
          selected={loc}
          onToggle={setLoc}
          containerClassName="flex-row gap-2"
        />

        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('generator.energy')}</Text>
        <PillToggleGroup
          options={(['low', 'medium', 'high'] as const).map((e) => ({ value: e, label: e }))}
          selected={energy ?? 'medium'}
          onToggle={setEnergy}
          containerClassName="flex-row gap-2"
        />

        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('generator.category')}</Text>
        <PillToggleGroup
          options={[
            { value: 'any', label: t('generator.any') },
            ...QUEST_CATEGORIES.map((c) => ({ value: c, label: formatCategoryLabel(c, lang) })),
          ]}
          selected={cat ?? 'any'}
          onToggle={(v) => setCat(v === 'any' ? undefined : v)}
        />

        <View className="mt-4">
          <Input value={city} onChangeText={setCity} placeholder={t('generator.city')} />
        </View>

        <Button className="mt-8" onPress={roll} loading={rolling} disabled={rolling || quests.length === 0}>
          {rolling ? t('generator.rolling') : t('generator.generate')}
        </Button>

        {picked ? (
          <Animated.View entering={FadeInDown.duration(420).springify()}>
            <View className="bg-surface rounded-3xl p-5 mt-6">
              <Text className="text-muted text-xs uppercase">{t('generator.resultTitle')}</Text>
              <Text className="text-foreground text-xl font-black mt-1">{questTitle(picked, lang)}</Text>
              <View className="flex-row flex-wrap gap-2 mt-3">
                <Badge>{formatCategoryLabel(picked.category, lang)}</Badge>
                <Badge tone="secondary">{picked.difficulty}</Badge>
                <Badge tone="respect">+{picked.aura_reward} AURA</Badge>
              </View>
              <View className="gap-2 mt-5">
                <Button
                  variant="secondary"
                  onPress={() => uid && toggle.mutate({ questId: picked.id, currentlySaved: isSaved })}
                >
                  {isSaved ? t('quest.unsaved') : t('generator.saveLife')}
                </Button>
                <Button variant="secondary" onPress={() => go('/(main)/messages')}>
                  {t('generator.sendFriends')}
                </Button>
                <Button onPress={() => router.push(`/(main)/complete-quest/${picked.id}`)}>{t('generator.doIt')}</Button>
                <Button variant="ghost" onPress={roll}>
                  {t('generator.rollAgain')}
                </Button>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
