-- Enriched public-groups discovery: returns public groups with owner profile
-- and member count in one query. SECURITY DEFINER is required to count
-- group_members across groups the caller is not a member of (gm_select RLS
-- restricts reads to the caller's own groups).
--
-- Safety: the JOIN against group_settings with is_public = TRUE scopes the
-- function to groups that are explicitly marked public, so non-public
-- membership data cannot leak through this RPC.

CREATE OR REPLACE FUNCTION public.fetch_public_groups(
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 40
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
    p_search IS NULL
    OR g.name ILIKE '%' || p_search || '%'
    OR COALESCE(g.description, '') ILIKE '%' || p_search || '%'
  ORDER BY member_count DESC, g.created_at DESC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.fetch_public_groups(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_public_groups(text, integer) TO authenticated;
