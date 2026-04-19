-- Replaces transfer_group_ownership with a race-safe version:
--   • Final UPDATE on groups asserts owner_id = caller (no prior SELECT dance).
--   • Each role swap asserts FOUND so silent RLS breakage surfaces loudly.
-- Also reorders: we update groups.owner_id first (the authoritative gate),
-- then swap the member rows. If the groups UPDATE matched 0 rows, we bail
-- before touching group_members.

CREATE OR REPLACE FUNCTION public.transfer_group_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_new_owner_id = v_caller THEN
    RAISE EXCEPTION 'cannot_transfer_to_self';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'target_not_member';
  END IF;

  -- Authoritative ownership gate: only the current owner's UPDATE will match.
  UPDATE public.groups
    SET owner_id = p_new_owner_id
    WHERE id = p_group_id AND owner_id = v_caller;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  -- Demote old owner.
  UPDATE public.group_members
    SET role = 'admin'
    WHERE group_id = p_group_id AND user_id = v_caller;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'caller_not_member';
  END IF;

  -- Promote new owner.
  UPDATE public.group_members
    SET role = 'owner'
    WHERE group_id = p_group_id AND user_id = p_new_owner_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'target_not_member';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    p_new_owner_id,
    'group_ownership_transferred',
    'Group ownership transferred',
    'You are now the owner of this group.',
    jsonb_build_object(
      'group_id', p_group_id,
      'previous_owner_id', v_caller
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_group_ownership(uuid, uuid) TO authenticated;
