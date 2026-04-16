-- Paginated global leaderboard: every profile appears (0 period aura if none in window).
-- p_since NULL = all-time (period_aura = total_aura ordering).
CREATE OR REPLACE FUNCTION public.leaderboard_global_page(
  p_since timestamptz,
  p_limit integer,
  p_offset integer
)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  total_aura bigint,
  yearly_aura bigint,
  period_aura bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH scored AS (
    SELECT
      p.id,
      p.username,
      p.display_name::text AS display_name,
      p.avatar_url,
      p.total_aura,
      p.yearly_aura,
      CASE
        WHEN p_since IS NULL THEN p.total_aura
        ELSE COALESCE((
          SELECT SUM(qc.aura_earned)::bigint
          FROM public.quest_completions qc
          WHERE qc.user_id = p.id
            AND qc.quest_source_type = 'official'
            AND qc.status = 'active'
            AND qc.completed_at >= p_since
        ), 0)
      END AS period_aura
    FROM public.profiles p
  )
  SELECT s.id, s.username, s.display_name, s.avatar_url, s.total_aura, s.yearly_aura, s.period_aura
  FROM scored s
  ORDER BY s.period_aura DESC, s.total_aura DESC, s.username ASC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_global_page(timestamptz, integer, integer) TO authenticated;
