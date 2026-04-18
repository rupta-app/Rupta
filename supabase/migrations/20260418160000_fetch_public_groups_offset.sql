-- Add offset-based pagination to fetch_public_groups so Discover can
-- infinite-scroll. Signature extended with p_offset (default 0).
-- Existing callers that pass (p_search, p_limit) keep working because
-- p_offset defaults to 0.

DROP FUNCTION IF EXISTS public.fetch_public_groups(text, integer);

CREATE OR REPLACE FUNCTION public.fetch_public_groups(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  avatar_url text,
  owner_id uuid,
  created_at timestamptz,
  owner_username text,
  owner_display_name text,
  owner_avatar_url text,
  member_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    g.description,
    g.avatar_url,
    g.owner_id,
    g.created_at,
    owner.username       AS owner_username,
    owner.display_name   AS owner_display_name,
    owner.avatar_url     AS owner_avatar_url,
    COALESCE(mc.member_count, 0) AS member_count
  FROM public.groups g
  JOIN public.group_settings gs ON gs.group_id = g.id AND gs.is_public = TRUE
  LEFT JOIN public.profiles owner ON owner.id = g.owner_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS member_count
    FROM public.group_members gm
    WHERE gm.group_id = g.id
  ) mc ON TRUE
  WHERE
    NOT EXISTS (
      SELECT 1
      FROM public.group_members gm_self
      WHERE gm_self.group_id = g.id
        AND gm_self.user_id = auth.uid()
    )
    AND (
      p_search IS NULL
      OR g.name ILIKE '%' || p_search || '%'
      OR COALESCE(g.description, '') ILIKE '%' || p_search || '%'
    )
  ORDER BY member_count DESC, g.created_at DESC, g.id
  LIMIT p_limit
  OFFSET p_offset;
$$;

REVOKE ALL ON FUNCTION public.fetch_public_groups(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_public_groups(text, integer, integer) TO authenticated;
