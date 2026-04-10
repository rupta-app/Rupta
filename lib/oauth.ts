import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

/**
 * Parse OAuth callback (query + hash). Query wins over hash for duplicate keys.
 * Avoids relying on `new URL(exp://…)` in some RN runtimes.
 */
function parseOAuthRedirectUrl(href: string): Record<string, string> {
  const result: Record<string, string> = {};
  const apply = (segment: string) => {
    try {
      new URLSearchParams(segment).forEach((value, key) => {
        result[key] = value;
      });
    } catch {
      /* ignore */
    }
  };
  const hashIdx = href.indexOf('#');
  const beforeHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  if (hashIdx >= 0) apply(href.slice(hashIdx + 1));
  const qIdx = beforeHash.indexOf('?');
  if (qIdx >= 0) apply(beforeHash.slice(qIdx + 1));
  return result;
}

/**
 * OAuth redirect after Supabase + Google. Must exactly match a row in Supabase:
 * Authentication → URL Configuration → Redirect URLs.
 *
 * - **Expo Go:** `preferLocalhost` on simulators → `exp://localhost:8081/...` (add that in Supabase).
 * - **Physical device + Expo Go:** LAN IP in the URL (add that line too, or rely on Metro’s host).
 * - **Dev / store builds:** `rupta://auth/callback`.
 */
function redirectUri() {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return AuthSession.makeRedirectUri({
      path: 'auth/callback',
      preferLocalhost: !Device.isDevice,
    });
  }
  return 'rupta://auth/callback';
}

/** Copy into Supabase Redirect URLs if Google still fails (must match exactly). */
export function getOAuthRedirectUriForSupabase() {
  return redirectUri();
}

export type SocialSignInResult =
  | { ok: true }
  | { ok: false; cancelled: true }
  | { ok: false; error: Error };

export async function signInWithGoogle(): Promise<SocialSignInResult> {
  try {
    const redirectTo = redirectUri();
    if (__DEV__) {
      console.log('[OAuth] Add this exact URL to Supabase Redirect URLs:', redirectTo);
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return { ok: false, error: error };
    if (!data.url) return { ok: false, error: new Error('No OAuth URL') };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo, {
      preferEphemeralSession: false,
    });

    if (result.type !== 'success' || !result.url) {
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { ok: false, cancelled: true };
      }
      return { ok: false, error: new Error('Sign in was not completed') };
    }

    const params = parseOAuthRedirectUrl(result.url);
    if (params.error) {
      return {
        ok: false,
        error: new Error(params.error_description ?? params.error),
      };
    }

    if (params.code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exchangeError) return { ok: false, error: exchangeError };
      return { ok: true };
    }

    if (params.access_token && params.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) return { ok: false, error: sessionError };
      return { ok: true };
    }

    if (__DEV__) {
      console.warn('[OAuth] No code or tokens in callback URL:', result.url);
    }
    return { ok: false, error: new Error('Could not complete sign in') };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

async function appleRawAndHashedNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  const raw = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashed = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    raw,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  return { raw, hashed };
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<SocialSignInResult> {
  if (Platform.OS !== 'ios') {
    return { ok: false, error: new Error('Apple Sign In is only available on iOS') };
  }
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    return { ok: false, error: new Error('Apple Sign In is not available on this device') };
  }

  try {
    const { raw, hashed } = await appleRawAndHashedNonce();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    });

    if (!credential.identityToken) {
      return { ok: false, error: new Error('Apple did not return an identity token') };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: raw,
    });
    if (error) return { ok: false, error: error };
    return { ok: true };
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as { code: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      return { ok: false, cancelled: true };
    }
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}
