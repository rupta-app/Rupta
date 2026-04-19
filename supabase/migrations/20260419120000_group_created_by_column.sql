-- Adds an immutable "created_by" pointer on groups, so that after ownership
-- transfers land we still know who originally created the group.
-- Backfills existing rows from owner_id (historically equal to creator).
-- Extends the add_group_owner_member trigger to populate created_by on INSERT.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

UPDATE public.groups SET created_by = owner_id WHERE created_by IS NULL;

CREATE OR REPLACE FUNCTION public.add_group_owner_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');

  IF NEW.created_by IS NULL THEN
    UPDATE public.groups SET created_by = NEW.owner_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
