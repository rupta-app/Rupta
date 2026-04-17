-- Restrict group_invite INSERT to group owners/admins; block self-invites and existing members.

DROP POLICY IF EXISTS gi_insert ON public.group_invites;
CREATE POLICY gi_insert ON public.group_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    inviter_id = auth.uid()
    AND invitee_id <> auth.uid()
    AND public.is_group_admin(group_id, auth.uid())
    AND NOT EXISTS (
      SELECT 1
      FROM public.group_members m
      WHERE m.group_id = group_invites.group_id
        AND m.user_id = group_invites.invitee_id
    )
  );
