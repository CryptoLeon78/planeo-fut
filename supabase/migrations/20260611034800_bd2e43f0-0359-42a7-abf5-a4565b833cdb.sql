
-- Enum for mesocycle type
DO $$ BEGIN
  CREATE TYPE public.mesocycle_type AS ENUM ('pretemporada', 'temporada');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.season_event_type AS ENUM ('partido_oficial', 'amistoso', 'test_fisico', 'descanso', 'evento', 'reunion');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Mesocycles
CREATE TABLE IF NOT EXISTS public.mesocycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  type public.mesocycle_type NOT NULL DEFAULT 'temporada',
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  goals text,
  phases jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mesocycles TO authenticated;
GRANT ALL ON public.mesocycles TO service_role;
ALTER TABLE public.mesocycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their mesocycles" ON public.mesocycles
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER trg_mesocycles_updated BEFORE UPDATE ON public.mesocycles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add mesocycle_id to microcycles
ALTER TABLE public.microcycles
  ADD COLUMN IF NOT EXISTS mesocycle_id uuid REFERENCES public.mesocycles(id) ON DELETE SET NULL;

-- Season events
CREATE TABLE IF NOT EXISTS public.season_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  event_date date NOT NULL,
  type public.season_event_type NOT NULL DEFAULT 'partido_oficial',
  title text NOT NULL,
  opponent text,
  location text,
  is_home boolean,
  result text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.season_events TO authenticated;
GRANT ALL ON public.season_events TO service_role;
ALTER TABLE public.season_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their season events" ON public.season_events
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER trg_season_events_updated BEFORE UPDATE ON public.season_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_mesocycles_owner ON public.mesocycles(owner_id);
CREATE INDEX IF NOT EXISTS idx_season_events_owner_date ON public.season_events(owner_id, event_date);
CREATE INDEX IF NOT EXISTS idx_microcycles_mesocycle ON public.microcycles(mesocycle_id);
