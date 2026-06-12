CREATE TYPE public.perceived_intensity AS ENUM ('baja','media','alta','muy_alta');

CREATE TABLE public.session_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  intensity_perceived public.perceived_intensity,
  objectives_met BOOLEAN,
  what_worked TEXT,
  what_to_improve TEXT,
  player_notes TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_evaluations TO authenticated;
GRANT ALL ON public.session_evaluations TO service_role;

ALTER TABLE public.session_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages own evaluations" ON public.session_evaluations
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER set_session_evaluations_updated_at
  BEFORE UPDATE ON public.session_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();