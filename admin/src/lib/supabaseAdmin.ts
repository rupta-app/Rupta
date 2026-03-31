import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ?? '';

export const isConfigured = Boolean(url && key);

export const adminClient = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
