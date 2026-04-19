-- Extend transfer_group_ownership to write group_name and actor_username into
-- the notification payload so the client can render a fully localized message.

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
  v_group_name text;
  v_actor_username text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_new_owner_id = v_caller THEN
    RAISE EXCEPTION 'cannot_transfer_to_self';
  END IF;

  UPDATE public.groups
    SET owner_id = p_new_owner_id
    WHERE id = p_group_id AND owner_id = v_caller
    RETURNING name INTO v_group_name;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_owner';
  END IF;

  UPDATE public.group_members
    SET role = 'admin'
    WHERE group_id = p_group_id AND user_id = v_caller;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'caller_not_member';
  END IF;

  UPDATE public.group_members
    SET role = 'owner'
    WHERE group_id = p_group_id AND user_id = p_new_owner_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'target_not_member';
  END IF;

  SELECT username INTO v_actor_username FROM public.profiles WHERE id = v_caller;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    p_new_owner_id,
    'group_ownership_transferred',
    'Group ownership transferred',
    'You are now the owner of this group.',
    jsonb_build_object(
      'group_id', p_group_id,
      'group_name', v_group_name,
      'previous_owner_id', v_caller,
      'actor_username', v_actor_username
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_group_ownership(uuid, uuid) TO authenticated;
