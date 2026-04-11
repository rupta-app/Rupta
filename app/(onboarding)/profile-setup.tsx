import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '@/constants/theme';
import { OnboardingStepShell } from '@/components/onboarding/OnboardingStepShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { useOnboardingStore } from '@/stores/onboardingStore';

const USER_RE = /^[a-z0-9_]{3,24}$/i;
const TOTAL = 6;

export default function ProfileSetupOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { draft, setDraft } = useOnboardingStore();

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: PICKER_IMAGES,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      setDraft({ avatarUrl: res.assets[0].uri });
    }
  };

  const usernameOk = USER_RE.test(draft.username.trim());
  const canContinue = usernameOk && draft.displayName.trim().length >= 1;

  return (
    <OnboardingStepShell
      step={2}
      totalSteps={TOTAL}
      title={t('onboarding.profileSetup')}
      subtitle={t('onboarding.photoOptional')}
      footer={
        <Button onPress={() => router.push('/(onboarding)/personal-info')} disabled={!canContinue}>
          {t('common.continue')}
        </Button>
      }
    >
      <View className="items-center mb-2">
        <Pressable onPress={pickAvatar} className="relative">
          {draft.avatarUrl ? (
            <Image source={{ uri: draft.avatarUrl }} style={{ width: 112, height: 112, borderRadius: 9999, backgroundColor: colors.surface }} />
          ) : (
            <View className="w-28 h-28 rounded-full bg-primary/25 items-center justify-center border-2 border-dashed border-primary/50">
              <Text className="text-primary text-3xl font-light">+</Text>
            </View>
          )}
          <View className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-surface border border-border items-center justify-center">
            <Pencil color={colors.primaryLight} size={18} />
          </View>
        </Pressable>
        <Button variant="ghost" className="mt-3 min-h-0 py-2" onPress={pickAvatar}>
          {draft.avatarUrl ? t('onboarding.changePhoto') : t('onboarding.addPhoto')}
        </Button>
      </View>

      <Input
        label={t('onboarding.username')}
        value={draft.username}
        onChangeText={(v) => setDraft({ username: v.toLowerCase().replace(/\s/g, '') })}
        autoCapitalize="none"
      />
      <Input
        label={t('onboarding.displayName')}
        value={draft.displayName}
        onChangeText={(v) => setDraft({ displayName: v })}
        autoCapitalize="words"
      />
    </OnboardingStepShell>
  );
}
