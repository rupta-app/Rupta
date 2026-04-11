import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { colors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PICKER_IMAGES } from '@/lib/pickImage';
import { uploadAvatar } from '@/lib/storage';
import { updateProfile } from '@/services/profile';
import { useAuth } from '@/providers/AuthProvider';

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { session, profile, refreshProfile } = useAuth();
  const uid = session?.user?.id!;
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setBio(profile.bio ?? '');
      setCity(profile.city ?? '');
      setLocalAvatarUri(null);
    }
  }, [profile]);

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
      setLocalAvatarUri(res.assets[0].uri);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={t('profile.edit')} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="items-center mb-6">
          <Pressable onPress={pickAvatar}>
            {localAvatarUri ? (
              <Image source={{ uri: localAvatarUri }} style={{ width: 112, height: 112, borderRadius: 9999, backgroundColor: colors.surfaceElevated }} />
            ) : (
              <Avatar url={profile?.avatar_url} name={(displayName || profile?.display_name) ?? '?'} size={112} />
            )}
          </Pressable>
          <Button variant="ghost" className="mt-2 min-h-0 py-2" onPress={pickAvatar}>
            {t('onboarding.changePhoto')}
          </Button>
        </View>
        <Input label={t('onboarding.displayName')} value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
        <Input label={t('onboarding.city')} value={city} onChangeText={setCity} />
        <Input label={t('onboarding.bio')} value={bio} onChangeText={setBio} multiline />
        <Button
          loading={loading}
          onPress={async () => {
            setLoading(true);
            try {
              let avatar_url: string | undefined;
              if (localAvatarUri) {
                const mime = localAvatarUri.toLowerCase().includes('png') ? 'image/png' : 'image/jpeg';
                avatar_url = await uploadAvatar(uid, localAvatarUri, mime);
              }
              await updateProfile(uid, {
                display_name: displayName.trim(),
                bio: bio.trim() || null,
                city: city.trim() || null,
                ...(avatar_url ? { avatar_url } : {}),
              });
              await refreshProfile();
              router.back();
            } finally {
              setLoading(false);
            }
          }}
        >
          {t('common.save')}
        </Button>
      </ScrollView>
    </View>
  );
}
