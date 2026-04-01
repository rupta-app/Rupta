-- INSERT ... RETURNING runs before AFTER triggers, so owner membership / group_settings
-- rows do not exist yet when RLS checks visibility of the new group row.
-- Allow the owner to SELECT their own group so createGroup + .select() succeeds.

DROP POLICY IF EXISTS groups_select_visible ON public.groups;
CREATE POLICY groups_select_visible ON public.groups FOR SELECT TO authenticated USING (
  owner_id = auth.uid()
  OR public.is_group_member(groups.id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.group_settings s
    WHERE s.group_id = groups.id AND s.is_public = TRUE
  )
);
