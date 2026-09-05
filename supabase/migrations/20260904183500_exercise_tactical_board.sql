ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS tactical_board JSONB NOT NULL DEFAULT '{"version":1,"elements":[]}'::jsonb;

COMMENT ON COLUMN public.exercises.tactical_board IS 'Diseño táctico serializado: piezas, zonas y flechas en coordenadas porcentuales.';
