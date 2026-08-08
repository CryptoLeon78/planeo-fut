ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.microcycles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_exercises_owner_active ON public.exercises (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_owner_active ON public.sessions (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_microcycles_owner_active ON public.microcycles (owner_id) WHERE deleted_at IS NULL;