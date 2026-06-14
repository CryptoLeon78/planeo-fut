
-- Lock down user_roles: only service_role (and SECURITY DEFINER triggers) may write.
-- Authenticated users keep SELECT on their own rows; INSERT/UPDATE/DELETE are denied.
CREATE POLICY "user_roles_no_insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "user_roles_no_update" ON public.user_roles
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "user_roles_no_delete" ON public.user_roles
  FOR DELETE TO authenticated USING (false);

-- Trigger / utility SECURITY DEFINER functions must not be callable by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
