-- Allow non-members to SELECT group_settings rows where is_public = TRUE.
-- Without this, fetchPublicGroups() returns empty because the initial
-- query against group_settings is blocked by RLS for non-members,
-- leaving public groups undiscoverable.

DROP POLICY IF EXISTS gs_select_member ON public.group_settings;
CREATE POLICY gs_select_member ON public.group_settings FOR SELECT TO authenticated USING (
  is_public = TRUE
  OR public.is_group_member(group_settings.group_id, auth.uid())
);
