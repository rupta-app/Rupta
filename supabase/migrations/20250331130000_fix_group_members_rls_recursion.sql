-- group_members SELECT policy referenced group_members again → infinite recursion.
-- SECURITY DEFINER helper reads membership without re-entering RLS.

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members m
    WHERE m.group_id = p_group_id
      AND m.user_id = p_user_id
  );
$$;
REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO service_role;
DROP POLICY IF EXISTS gm_select ON public.group_members;
CREATE POLICY gm_select ON public.group_members FOR SELECT TO authenticated USING (
  public.is_group_member(group_members.group_id, auth.uid())
);
