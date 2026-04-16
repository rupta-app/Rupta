-- Allow users to remove their own notification rows (e.g. clear inbox).
CREATE POLICY notif_delete_own ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
