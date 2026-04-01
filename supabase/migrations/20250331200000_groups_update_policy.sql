-- Allow owners and admins to update group metadata (name, description, avatar_url).
CREATE POLICY groups_update_owner_admin ON public.groups FOR UPDATE TO authenticated USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.group_id = groups.id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  )
) WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.group_id = groups.id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  )
);
