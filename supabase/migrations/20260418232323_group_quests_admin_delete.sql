-- Allow group owners and admins to delete any quest in their group.
-- Needed for the in-group admin approval UI, which rejects draft quests by
-- deleting the row (hard reject — no "rejected" status).

DROP POLICY IF EXISTS gq_delete_admin ON public.group_quests;
CREATE POLICY gq_delete_admin ON public.group_quests FOR DELETE TO authenticated USING (
  public.is_group_admin(group_quests.group_id, auth.uid())
);
