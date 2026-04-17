-- Include group display name in group_invite notification payload (invitee cannot SELECT groups until they join).

CREATE OR REPLACE FUNCTION public.notify_on_group_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gname text;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT name INTO gname FROM public.groups WHERE id = NEW.group_id;
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      NEW.invitee_id,
      'group_invite',
      'Group invite',
      'You were invited to a group.',
      jsonb_build_object(
        'group_id', NEW.group_id,
        'inviter_id', NEW.inviter_id,
        'invite_id', NEW.id,
        'group_name', gname
      )
    );
  END IF;
  RETURN NEW;
END;
$$;
