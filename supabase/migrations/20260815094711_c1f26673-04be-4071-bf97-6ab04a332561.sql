CREATE TABLE public.data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation text NOT NULL DEFAULT 'export',
  format text NOT NULL DEFAULT 'json',
  entities text[] NOT NULL DEFAULT '{}'::text[],
  record_count integer NOT NULL DEFAULT 0,
  byte_size integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.data_exports TO authenticated;
GRANT ALL ON public.data_exports TO service_role;

ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_exports_select_own ON public.data_exports
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY data_exports_insert_own ON public.data_exports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE INDEX idx_data_exports_owner_created ON public.data_exports (owner_id, created_at DESC);