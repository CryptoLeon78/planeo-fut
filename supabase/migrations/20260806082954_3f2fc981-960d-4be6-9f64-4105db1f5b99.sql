ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'es-ES';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_language_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_language_check CHECK (language IN ('es-ES','en-GB'));

CREATE TABLE IF NOT EXISTS public.entity_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('exercise','session','microcycle')),
  entity_id uuid NOT NULL,
  version integer NOT NULL,
  label text,
  source text NOT NULL DEFAULT 'mcp',
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, version)
);
CREATE INDEX IF NOT EXISTS entity_versions_owner_idx ON public.entity_versions (owner_id, entity_type, entity_id, version DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entity_versions TO authenticated;
GRANT ALL ON public.entity_versions TO service_role;
ALTER TABLE public.entity_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_versions_owner_all" ON public.entity_versions FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.mcp_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL CHECK (status IN ('success','error')),
  error_code text,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mcp_audit_log_user_idx ON public.mcp_audit_log (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.mcp_audit_log TO authenticated;
GRANT ALL ON public.mcp_audit_log TO service_role;
ALTER TABLE public.mcp_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcp_audit_select_own" ON public.mcp_audit_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mcp_audit_insert_own" ON public.mcp_audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);