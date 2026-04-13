import { adminClient } from '@/lib/supabaseAdmin';

export interface AdminSuggestion {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  user_id: string;
  user: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface FetchSuggestionsParams {
  page: number;
  pageSize: number;
}

export async function fetchSuggestions({ page, pageSize }: FetchSuggestionsParams) {
  const { data, error, count } = await adminClient
    .from('quest_suggestions')
    .select(
      `
      id, title, description, created_at, user_id,
      user:profiles(display_name, username, avatar_url)
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  const normalized = (data ?? []).map((s) => ({
    ...s,
    user: Array.isArray(s.user) ? s.user[0] ?? null : s.user,
  })) as AdminSuggestion[];

  return { data: normalized, total: count ?? 0 };
}

export async function deleteSuggestion(id: string) {
  const { error } = await adminClient.from('quest_suggestions').delete().eq('id', id);
  if (error) throw error;
}
