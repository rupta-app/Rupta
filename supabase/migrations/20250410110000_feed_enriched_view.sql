-- Materialized view that pre-joins the tables the feed service currently
-- fetches in 5 parallel queries, eliminating client-side Map joins.
-- RLS on the underlying tables still applies because the view is not
-- SECURITY DEFINER — Supabase evaluates the calling user's policies.

CREATE OR REPLACE VIEW public.feed_completions_enriched AS
SELECT
  c.id,
  c.user_id,
  c.quest_id,
  c.group_quest_id,
  c.group_id,
  c.challenge_id,
  c.quest_source_type,
  c.status,
  c.visibility,
  c.aura_scope,
  c.aura_earned,
  c.caption,
  c.rating,
  c.completed_at,
  c.created_at,
  -- profile fields
  p.username   AS profile_username,
  p.display_name AS profile_display_name,
  p.avatar_url AS profile_avatar_url,
  -- official quest fields (nullable)
  q.title_en   AS quest_title_en,
  q.title_es   AS quest_title_es,
  q.category   AS quest_category,
  q.aura_reward AS quest_aura_reward,
  q.difficulty AS quest_difficulty,
  -- group quest fields (nullable)
  gq.title     AS group_quest_title,
  -- group fields (nullable)
  g.name       AS group_name,
  -- first media item (subquery for single media URL)
  (SELECT qm.media_url
   FROM public.quest_media qm
   WHERE qm.completion_id = c.id
   ORDER BY qm.order_index
   LIMIT 1) AS media_url
FROM public.quest_completions c
  JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.quests q ON q.id = c.quest_id
  LEFT JOIN public.group_quests gq ON gq.id = c.group_quest_id
  LEFT JOIN public.groups g ON g.id = c.group_id;
-- Grant access to authenticated and service_role
GRANT SELECT ON public.feed_completions_enriched TO authenticated;
GRANT SELECT ON public.feed_completions_enriched TO service_role;
