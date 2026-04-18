-- RPC that lets the authenticated user delete their own account.
-- Deletes the auth.users row, which cascades through profiles and all
-- user-owned data via existing ON DELETE CASCADE foreign keys.
--
-- SECURITY DEFINER is required because clients cannot touch auth.users
-- directly. The function uses auth.uid() so it can only delete the
-- caller — there is no way to target another user.

CREATE OR REPLACE FUNCTION public.delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = caller;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_current_user() TO authenticated;
