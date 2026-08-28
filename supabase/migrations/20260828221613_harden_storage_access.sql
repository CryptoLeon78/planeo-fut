-- PlaneoFUT-owned storage hardening.
-- Files are stored under <auth.uid()>/... by the current client upload flows.
-- Keep buckets private and scope every operation to the authenticated owner.

UPDATE storage.buckets
SET public = false
WHERE id IN ('exercise-images', 'team-images');

DROP POLICY IF EXISTS "exercise-images-select" ON storage.objects;
DROP POLICY IF EXISTS "exercise-images-insert" ON storage.objects;
DROP POLICY IF EXISTS "exercise-images-update" ON storage.objects;
DROP POLICY IF EXISTS "exercise-images-delete" ON storage.objects;
DROP POLICY IF EXISTS "team-images-select" ON storage.objects;
DROP POLICY IF EXISTS "team-images-insert" ON storage.objects;
DROP POLICY IF EXISTS "team-images-update" ON storage.objects;
DROP POLICY IF EXISTS "team-images-delete" ON storage.objects;

CREATE POLICY "exercise_images_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exercise-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "exercise_images_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exercise-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "exercise_images_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'exercise-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'exercise-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "exercise_images_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exercise-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "team_images_owner_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'team-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "team_images_owner_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'team-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "team_images_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'team-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'team-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "team_images_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'team-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );
