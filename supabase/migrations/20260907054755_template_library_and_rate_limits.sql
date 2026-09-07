-- Curated, versioned template library and durable per-user rate limiting.
-- All client-facing tables are protected by RLS and explicit grants.

CREATE TABLE IF NOT EXISTS public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.template_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.template_categories(id) ON DELETE RESTRICT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('session', 'microcycle', 'exercise')),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  description TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_curated BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT template_library_scope CHECK (
    (is_curated AND owner_id IS NULL AND team_id IS NULL)
    OR (NOT is_curated AND owner_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_template_library_category ON public.template_library(category_id, kind, is_published);
CREATE INDEX IF NOT EXISTS idx_template_library_owner ON public.template_library(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_library_team ON public.template_library(team_id, updated_at DESC);

ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_library ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.template_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_library TO authenticated;
GRANT ALL ON public.template_categories, public.template_library TO service_role;

DROP POLICY IF EXISTS template_categories_read ON public.template_categories;
CREATE POLICY template_categories_read ON public.template_categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS template_library_read ON public.template_library;
CREATE POLICY template_library_read ON public.template_library FOR SELECT TO authenticated
USING (
  is_curated AND is_published
  OR owner_id = (select auth.uid())
  OR (team_id IS NOT NULL AND public.is_team_member(team_id, (select auth.uid())))
);

DROP POLICY IF EXISTS template_library_insert ON public.template_library;
CREATE POLICY template_library_insert ON public.template_library FOR INSERT TO authenticated
WITH CHECK (
  owner_id = (select auth.uid())
  AND NOT is_curated
  AND (team_id IS NULL OR public.can_edit_team(team_id, (select auth.uid())))
);

DROP POLICY IF EXISTS template_library_update ON public.template_library;
CREATE POLICY template_library_update ON public.template_library FOR UPDATE TO authenticated
USING (owner_id = (select auth.uid()) AND NOT is_curated)
WITH CHECK (owner_id = (select auth.uid()) AND NOT is_curated);

DROP POLICY IF EXISTS template_library_delete ON public.template_library;
CREATE POLICY template_library_delete ON public.template_library FOR DELETE TO authenticated
USING (owner_id = (select auth.uid()) AND NOT is_curated);

CREATE OR REPLACE FUNCTION public.touch_template_library_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_template_library_updated_at ON public.template_library;
CREATE TRIGGER trg_template_library_updated_at BEFORE UPDATE ON public.template_library
FOR EACH ROW EXECUTE FUNCTION public.touch_template_library_updated_at();

INSERT INTO public.template_categories (slug, name, description, sort_order)
VALUES
  ('activacion', 'Activación', 'Calentamientos y activación neuromuscular.', 10),
  ('fuerza', 'Fuerza', 'Fuerza aplicada al fútbol y prevención.', 20),
  ('tactica', 'Táctica', 'Principios tácticos por fase del juego.', 30),
  ('transiciones', 'Transiciones', 'Reacción tras pérdida y recuperación.', 40),
  ('recuperacion', 'Recuperación', 'Vuelta a la calma y regeneración.', 50)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

INSERT INTO public.template_library (category_id, kind, name, description, payload, is_curated, is_published)
SELECT c.id, v.kind, v.name, v.description, v.payload::jsonb, true, true
FROM public.template_categories c
JOIN (VALUES
  ('activacion', 'session', 'Activación MD-3', 'Activación técnica y movilidad para intensidad media.', '{"duration_min":20,"intensity":"media","blocks":[{"name":"Movilidad dinámica","duration_min":8},{"name":"Rondo progresivo","duration_min":12}]}'),
  ('fuerza', 'session', 'Fuerza preventiva', 'Trabajo de fuerza preventiva integrado en campo.', '{"duration_min":25,"intensity":"media","blocks":[{"name":"Core","duration_min":10},{"name":"Unilateral","duration_min":15}]}'),
  ('tactica', 'microcycle', 'Semana de control y progresión', 'Microciclo base con foco en salida de balón y control.', '{"match_day":"sabado","slots":["MD-4","MD-3","MD-2","MD-1","MD"]}'),
  ('transiciones', 'session', 'Transición tras pérdida', 'Juego reducido para reacción inmediata y presión.', '{"duration_min":70,"intensity":"alta","blocks":[{"name":"Juego condicionado","duration_min":30},{"name":"Transición 6v6","duration_min":40}]}'),
  ('recuperacion', 'session', 'Recuperación postpartido', 'Vuelta a la calma, movilidad y descarga.', '{"duration_min":35,"intensity":"baja","blocks":[{"name":"Movilidad","duration_min":15},{"name":"Carrera regenerativa","duration_min":20}]}')
) AS v(slug, kind, name, description, payload) ON v.slug = c.slug
WHERE NOT EXISTS (SELECT 1 FROM public.template_library t WHERE t.name = v.name AND t.is_curated);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL CHECK (char_length(bucket) BETWEEN 1 AND 80),
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (user_id, bucket)
);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM anon, authenticated;
GRANT ALL ON public.api_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket TEXT,
  p_window_seconds INTEGER DEFAULT 60,
  p_limit INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user UUID := (select auth.uid());
  v_now TIMESTAMPTZ := now();
  v_allowed BOOLEAN;
BEGIN
  IF v_user IS NULL OR p_window_seconds < 1 OR p_limit < 1 THEN
    RETURN false;
  END IF;
  INSERT INTO public.api_rate_limits(user_id, bucket, window_started_at, request_count)
  VALUES (v_user, p_bucket, v_now, 1)
  ON CONFLICT (user_id, bucket) DO UPDATE
  SET window_started_at = CASE
        WHEN v_now - api_rate_limits.window_started_at >= make_interval(secs => p_window_seconds) THEN v_now
        ELSE api_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN v_now - api_rate_limits.window_started_at >= make_interval(secs => p_window_seconds) THEN 1
        ELSE api_rate_limits.request_count + 1
      END;
  SELECT request_count <= p_limit INTO v_allowed
  FROM public.api_rate_limits
  WHERE user_id = v_user AND bucket = p_bucket;
  RETURN COALESCE(v_allowed, false);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated;
