import { adminClient } from '@/lib/supabaseAdmin';

export interface AdminProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  date_of_birth: string | null;
  preferred_categories: string[] | null;
  activity_styles: string[] | null;
  status: string;
  is_admin: boolean;
  total_aura: number;
  yearly_aura: number;
  plan: string | null;
  created_at: string;
}

interface FetchUsersParams {
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export async function fetchUsers({ search, status, page, pageSize }: FetchUsersParams) {
  let query = adminClient
    .from('profiles')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return { data: (data ?? []) as AdminProfile[], total: count ?? 0 };
}

export async function updateUserStatus(userId: string, status: string) {
  const { error } = await adminClient
    .from('profiles')
    .update({ status })
    .eq('id', userId);
  if (error) throw error;
}

export async function updateUserAdmin(userId: string, isAdmin: boolean) {
  const { error } = await adminClient
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId);
  if (error) throw error;
}
