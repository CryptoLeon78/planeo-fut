-- Injury and availability tracking for squad management.
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available'
  CHECK (status IN ('available', 'injured', 'recovering', 'unavailable'));

CREATE TABLE IF NOT EXISTS public.player_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  injury_type TEXT NOT NULL CHECK (char_length(trim(injury_type)) BETWEEN 2 AND 120),
  description TEXT,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return DATE,
  recovered_on DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovering', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_player_injuries_team_status ON public.player_injuries(team_id, status, expected_return);
CREATE INDEX IF NOT EXISTS idx_player_injuries_player ON public.player_injuries(player_id, occurred_on DESC);
ALTER TABLE public.player_injuries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_injuries TO authenticated;
GRANT ALL ON public.player_injuries TO service_role;

CREATE POLICY player_injuries_select ON public.player_injuries FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_team_member(team_id));
CREATE POLICY player_injuries_insert ON public.player_injuries FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.players p WHERE p.id = player_id AND p.team_id = team_id));
CREATE POLICY player_injuries_update ON public.player_injuries FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.can_edit_team(team_id))
  WITH CHECK (owner_id = auth.uid() OR public.can_edit_team(team_id));
CREATE POLICY player_injuries_delete ON public.player_injuries FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.can_edit_team(team_id));

CREATE OR REPLACE FUNCTION public.touch_player_injury_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_player_injuries_updated_at ON public.player_injuries;
CREATE TRIGGER trg_player_injuries_updated_at BEFORE UPDATE ON public.player_injuries
FOR EACH ROW EXECUTE FUNCTION public.touch_player_injury_updated_at();
