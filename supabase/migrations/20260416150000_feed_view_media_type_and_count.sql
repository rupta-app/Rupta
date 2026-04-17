-- Extends feed_completions_enriched with:
--   * media_url / media_type of the first item (backward-compat for single-media renderers)
--   * media_count — total count for a badge overlay on multi-media posts
--   * media — full ordered JSON array, so the feed can render a swipeable
--     carousel with dots without an extra query per post.

CREATE OR REPLACE VIEW public.feed_completions_enriched
WITH (security_invoker = true)
AS
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
  p.username       AS profile_username,
  p.display_name   AS profile_display_name,
  p.avatar_url     AS profile_avatar_url,
  q.title_en       AS quest_title_en,
  q.title_es       AS quest_title_es,
  q.category       AS quest_category,
  q.aura_reward    AS quest_aura_reward,
  q.difficulty     AS quest_difficulty,
  gq.title         AS group_quest_title,
  g.name           AS group_name,
  (SELECT qm.media_url
     FROM public.quest_media qm
     WHERE qm.completion_id = c.id
     ORDER BY qm.order_index
     LIMIT 1) AS media_url,
  (SELECT qm.media_type
     FROM public.quest_media qm
     WHERE qm.completion_id = c.id
     ORDER BY qm.order_index
     LIMIT 1) AS media_type,
  (SELECT COUNT(*)::int
     FROM public.quest_media qm
     WHERE qm.completion_id = c.id) AS media_count,
  (SELECT COALESCE(
     jsonb_agg(
       jsonb_build_object(
         'url', qm.media_url,
         'type', qm.media_type,
         'order_index', qm.order_index
       )
       ORDER BY qm.order_index
     ),
     '[]'::jsonb
   )
   FROM public.quest_media qm
   WHERE qm.completion_id = c.id) AS media
FROM public.quest_completions c
  JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.quests q ON q.id = c.quest_id
  LEFT JOIN public.group_quests gq ON gq.id = c.group_quest_id
  LEFT JOIN public.groups g ON g.id = c.group_id;

GRANT SELECT ON public.feed_completions_enriched TO authenticated;
GRANT SELECT ON public.feed_completions_enriched TO service_role;
