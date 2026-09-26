-- Permite reutilizar la tabla genérica template_library para guardar y reutilizar
-- diseños de pizarra táctica entre ejercicios (kind='tactical_board').
-- No se crea tabla nueva: la política RLS existente por owner_id/is_curated ya cubre este kind.

ALTER TABLE public.template_library DROP CONSTRAINT IF EXISTS template_library_kind_check;
ALTER TABLE public.template_library ADD CONSTRAINT template_library_kind_check
  CHECK (kind IN ('session', 'microcycle', 'exercise', 'tactical_board'));
