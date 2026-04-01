import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QUEST_CATEGORIES } from '@/constants/categories';
import { useAuth } from '@/providers/AuthProvider';
import { useSavedQuestIds, useToggleSave } from '@/hooks/useQuests';
import { pickQuestFromCatalog, type GeneratorInput } from '@/services/generator';
import { fetchQuests } from '@/services/quests';
import { formatCategoryLabel } from '@/utils/categoryLabel';
import { questTitle } from '@/utils/questCopy';
import { useQuery } from '@tanstack/react-query';

const COSTS = ['free', 'low', 'medium', 'high', 'any'] as const;

export default function GeneratorScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const go = (path: string) => (router as { push: (p: string) => void }).push(path);
  const lang = i18n.language.startsWith('es') ? 'es' : 'en';
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
    }, 1000);
  };

  const isSaved = picked ? saved.has(picked.id) : false;

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center border-b border-border px-1 min-h-[48px]"
        style={{ paddingTop: Math.max(insets.top, 8) }}
      >
        <Pressable onPress={() => router.back()} className="p-2" hitSlop={8}>
          <ChevronLeft color="#F8FAFC" size={28} />
        </Pressable>
        <Text className="text-foreground font-bold text-lg">{t('generator.title')}</Text>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 12 }}>
        <Text className="text-muted">{t('generator.subtitle')}</Text>

        <Text className="text-muted text-xs uppercase mt-6 mb-2">{t('generator.budget')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {COSTS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCost(c)}
              className={`px-3 py-2 rounded-lg border ${cost === c ? 'border-primary bg-primary/15' : 'border-border'}`}
            >
              <Text className="text-foreground capitalize">{c}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-muted text-xs uppercase mt-4 mb-2">Crew</Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setSolo(true)}
            className={`px-4 py-2 rounded-lg border ${solo ? 'border-primary' : 'border-border'}`}
          >
            <Text className="text-foreground">{t('generator.solo')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setSolo(false)}
            className={`px-4 py-2 rounded-lg border ${!solo ? 'border-primary' : 'border-border'}`}
          >
            <Text className="text-foreground">{t('generator.withFriends')}</Text>
          </Pressable>
        </View>

        <Text className="text-muted text-xs uppercase mt-4 mb-2">Place</Text>
        <View className="flex-row gap-2">
          {(['indoor', 'outdoor', 'any'] as const).map((l) => (
            <Pressable
              key={l}
              onPress={() => setLoc(l)}
              className={`px-3 py-2 rounded-lg border ${loc === l ? 'border-primary' : 'border-border'}`}
            >
              <Text className="text-foreground capitalize">
                {l === 'any' ? 'Any' : t(`generator.${l === 'indoor' ? 'indoor' : 'outdoor'}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('generator.energy')}</Text>
        <View className="flex-row gap-2">
          {(['low', 'medium', 'high'] as const).map((e) => (
            <Pressable
              key={e}
              onPress={() => setEnergy(e)}
              className={`px-3 py-2 rounded-lg border ${energy === e ? 'border-primary bg-primary/15' : 'border-border'}`}
            >
              <Text className="text-foreground capitalize">{e}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-muted text-xs uppercase mt-4 mb-2">{t('generator.category')}</Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setCat(undefined)}
            className={`px-3 py-2 rounded-full border ${!cat ? 'border-primary bg-primary/15' : 'border-border'}`}
          >
            <Text className="text-foreground text-sm font-medium">Any</Text>
          </Pressable>
          {QUEST_CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              className={`px-3 py-2 rounded-full border ${cat === c ? 'border-primary bg-primary/15' : 'border-border'}`}
            >
              <Text className="text-foreground text-sm font-medium">{formatCategoryLabel(c, lang)}</Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-4">
          <Input value={city} onChangeText={setCity} placeholder={t('generator.city')} />
        </View>

        <Button className="mt-8" onPress={roll} loading={rolling} disabled={rolling || quests.length === 0}>
          {rolling ? t('generator.rolling') : t('generator.generate')}
        </Button>

        {picked ? (
          <Animated.View entering={FadeInDown.duration(420).springify()}>
            <Card className="mt-6 border-primary/40 overflow-hidden">
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
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>
    </View>
  );
}
