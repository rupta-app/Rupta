-- Avatar (and completion) uploads use upsert: true → requires UPDATE on storage.objects, not only INSERT.
-- Path check uses split_part so the first segment must equal auth.uid() (e.g. "{uid}/avatar.jpg").

DROP POLICY IF EXISTS "completion_media_update_own" ON storage.objects;
CREATE POLICY "completion_media_update_own" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'completion-media'
  AND split_part(name, '/', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'completion-media'
  AND split_part(name, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS "completion_media_insert_own" ON storage.objects;
CREATE POLICY "completion_media_insert_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'completion-media'
  AND split_part(name, '/', 1) = auth.uid()::text
);

DROP POLICY IF EXISTS "completion_media_delete_own" ON storage.objects;
CREATE POLICY "completion_media_delete_own" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'completion-media'
  AND split_part(name, '/', 1) = auth.uid()::text
);

-- Explicit WITH CHECK on profile updates (avoids edge cases on Postgres RLS for UPDATE).
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
