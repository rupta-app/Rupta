import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { isAppleSignInAvailable, signInWithApple, signInWithGoogle } from '@/lib/oauth';

export function useSocialSignIn() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [showApple, setShowApple] = useState(false);

  useEffect(() => {
    void isAppleSignInAvailable().then(setShowApple);
  }, []);

  const run = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(provider);
    const result = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
    setLoading(null);
    if (result.ok) {
      router.replace('/');
      return;
    }
    if ('cancelled' in result && result.cancelled) return;
    if ('error' in result) setError(result.error.message);
  };

  return {
    error,
    loading,
    showApple,
    signInWithGoogle: () => void run('google'),
    signInWithApple: () => void run('apple'),
  };
}
