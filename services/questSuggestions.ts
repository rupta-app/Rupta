import { supabase } from '@/lib/supabase';

export async function submitQuestSuggestion(userId: string, title: string, description?: string) {
  const { error } = await supabase.from('quest_suggestions').insert({
    user_id: userId,
    title: title.trim(),
    description: description?.trim() || null,
  });
  if (error) throw error;
}
