
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'coach', 'physical_coach', 'analyst');
CREATE TYPE public.team_category AS ENUM ('futbol_base', 'amateur', 'cantera', 'alto_rendimiento', 'elite');
CREATE TYPE public.exercise_intensity AS ENUM ('baja', 'media', 'alta', 'muy_alta');
CREATE TYPE public.game_phase AS ENUM ('inicio', 'progresion', 'finalizacion', 'transicion_ad', 'transicion_da', 'abp', 'general');
CREATE TYPE public.task_type AS ENUM ('analitica', 'global', 'integrada', 'situacional', 'competitiva', 'rondo', 'juego_reducido', 'partido');
CREATE TYPE public.block_type AS ENUM ('calentamiento', 'parte_principal', 'juego_aplicacion', 'vuelta_calma');

-- =========================
-- updated_at helper
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- USER ROLES (separate table)
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================
-- handle_new_user trigger: profile + default coach role
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'coach')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- TEAMS
-- =========================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category public.team_category NOT NULL DEFAULT 'amateur',
  age_group TEXT,
  season TEXT,
  match_day TEXT NOT NULL DEFAULT 'sunday' CHECK (match_day IN ('saturday', 'sunday')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teams_owner ON public.teams(owner_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teams_owner_all" ON public.teams FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- EXERCISES
-- =========================
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  objective TEXT,
  category public.team_category,
  age_group TEXT,
  level TEXT,
  duration_min INTEGER CHECK (duration_min IS NULL OR duration_min > 0),
  space TEXT,
  materials TEXT,
  players_count INTEGER CHECK (players_count IS NULL OR players_count >= 0),
  intensity public.exercise_intensity DEFAULT 'media',
  game_phase public.game_phase DEFAULT 'general',
  task_type public.task_type DEFAULT 'global',
  variants TEXT,
  observations TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercises_owner ON public.exercises(owner_id);
CREATE INDEX idx_exercises_phase ON public.exercises(game_phase);
CREATE INDEX idx_exercises_tags ON public.exercises USING GIN(tags);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_owner_all" ON public.exercises FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- SESSIONS
-- =========================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  session_date DATE,
  objective TEXT,
  weekly_focus TEXT,
  intensity public.exercise_intensity DEFAULT 'media',
  duration_min INTEGER CHECK (duration_min IS NULL OR duration_min > 0),
  notes TEXT,
  evaluation TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_owner ON public.sessions(owner_id);
CREATE INDEX idx_sessions_team_date ON public.sessions(team_id, session_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_owner_all" ON public.sessions FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- SESSION BLOCKS
-- =========================
CREATE TABLE public.session_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  block_type public.block_type NOT NULL,
  name TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  duration_min INTEGER CHECK (duration_min IS NULL OR duration_min > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_blocks_session ON public.session_blocks(session_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_blocks TO authenticated;
GRANT ALL ON public.session_blocks TO service_role;
ALTER TABLE public.session_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_blocks_owner_all" ON public.session_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.owner_id = auth.uid()));

-- =========================
-- SESSION BLOCK EXERCISES
-- =========================
CREATE TABLE public.session_block_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.session_blocks(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  duration_override INTEGER CHECK (duration_override IS NULL OR duration_override > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sbe_block ON public.session_block_exercises(block_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_block_exercises TO authenticated;
GRANT ALL ON public.session_block_exercises TO service_role;
ALTER TABLE public.session_block_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sbe_owner_all" ON public.session_block_exercises FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.session_blocks b
    JOIN public.sessions s ON s.id = b.session_id
    WHERE b.id = block_id AND s.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.session_blocks b
    JOIN public.sessions s ON s.id = b.session_id
    WHERE b.id = block_id AND s.owner_id = auth.uid()
  ));

-- =========================
-- MICROCYCLES (Phase 2 ready)
-- =========================
CREATE TABLE public.microcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  week_start DATE NOT NULL,
  weekly_objective TEXT,
  match_day TEXT NOT NULL DEFAULT 'sunday' CHECK (match_day IN ('saturday', 'sunday')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_microcycles_owner_week ON public.microcycles(owner_id, week_start);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.microcycles TO authenticated;
GRANT ALL ON public.microcycles TO service_role;
ALTER TABLE public.microcycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "microcycles_owner_all" ON public.microcycles FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER trg_microcycles_updated_at BEFORE UPDATE ON public.microcycles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.microcycle_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  microcycle_id UUID NOT NULL REFERENCES public.microcycles(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('session_1', 'session_2', 'session_3', 'match', 'rest')),
  slot_date DATE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  notes TEXT,
  UNIQUE(microcycle_id, slot_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.microcycle_slots TO authenticated;
GRANT ALL ON public.microcycle_slots TO service_role;
ALTER TABLE public.microcycle_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "microcycle_slots_owner_all" ON public.microcycle_slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.microcycles m WHERE m.id = microcycle_id AND m.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.microcycles m WHERE m.id = microcycle_id AND m.owner_id = auth.uid()));
