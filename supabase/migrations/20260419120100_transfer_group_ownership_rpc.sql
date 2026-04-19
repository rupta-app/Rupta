-- Atomic ownership transfer. Only the current owner can call; target must be
-- an existing member (not caller). SECURITY DEFINER so it can write role='owner'
-- (client RLS blocks that path). Inserts a notification for the new owner.

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

  IF NOT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND owner_id = v_caller
  ) THEN
    RAISE EXCEPTION 'not_owner';
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

  UPDATE public.group_members
    SET role = 'admin'
    WHERE group_id = p_group_id AND user_id = v_caller;

  UPDATE public.group_members
    SET role = 'owner'
    WHERE group_id = p_group_id AND user_id = p_new_owner_id;

  UPDATE public.groups
    SET owner_id = p_new_owner_id
    WHERE id = p_group_id;

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
