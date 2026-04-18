-- Fills the RLS gaps that prevent leave / delete / kick / promote flows from
-- being safely client-side:
--   • groups: no DELETE policy → anyone or no one could delete.
--   • group_members: no DELETE/UPDATE policies → no one can leave, be kicked,
--     or have their role changed via authenticated client.
--
-- Rules encoded:
--   • Only the owner can delete a group.
--   • A member can delete their own membership row (leave), unless they are
--     the owner — owners must delete or transfer the group instead.
--   • An admin (owner or role='admin') can delete any non-owner member (kick).
--   • An admin can update a non-owner member's role, but cannot elevate a
--     member to 'owner' through a role change (transfer is a separate flow).

-- Groups: DELETE policy (owner only)
DROP POLICY IF EXISTS groups_delete_owner ON public.groups;
CREATE POLICY groups_delete_owner ON public.groups
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Group members: DELETE policy (self-leave unless owner, or admin kicks a non-owner)
DROP POLICY IF EXISTS group_members_delete_self_or_admin ON public.group_members;
CREATE POLICY group_members_delete_self_or_admin ON public.group_members
  FOR DELETE TO authenticated
  USING (
    (user_id = auth.uid() AND role <> 'owner')
    OR (public.is_group_admin(group_id, auth.uid()) AND role <> 'owner')
  );

-- Group members: UPDATE policy (admin changes a non-owner's role, never to owner)
DROP POLICY IF EXISTS group_members_update_role_admin ON public.group_members;
CREATE POLICY group_members_update_role_admin ON public.group_members
  FOR UPDATE TO authenticated
  USING (
    public.is_group_admin(group_id, auth.uid())
    AND role <> 'owner'
  )
  WITH CHECK (
    public.is_group_admin(group_id, auth.uid())
    AND role <> 'owner'
  );
