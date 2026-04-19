-- Add 'group_ownership_transferred' to the allowed notification types.

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'friend_request',
    'comment',
    'respect',
    'weekly_quest',
    'group_invite',
    'group_ownership_transferred'
  ));
