-- Collaboration, atomic graph writes and audit trail.
-- All user-facing functions are SECURITY INVOKER and therefore remain subject to RLS.

DO $$ BEGIN
  CREATE TYPE public.team_member_role AS ENUM ('coach', 'physical_coach', 'analyst', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_member_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id, role);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_members_select ON public.team_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = invited_by);
CREATE POLICY team_members_insert ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = invited_by AND EXISTS (
    SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()
  ));
CREATE POLICY team_members_update ON public.team_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = invited_by)
  WITH CHECK (auth.uid() = invited_by);
CREATE POLICY team_members_delete ON public.team_members
  FOR DELETE TO authenticated
  USING (auth.uid() = invited_by OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT p_team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = p_team_id AND tm.user_id = p_user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.can_edit_team(p_team_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT p_team_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.teams t
    LEFT JOIN public.team_members tm ON tm.team_id = t.id AND tm.user_id = p_user_id
    WHERE t.id = p_team_id
      AND (t.owner_id = p_user_id OR tm.role IN ('coach', 'physical_coach', 'analyst'))
  )
$$;

CREATE OR REPLACE FUNCTION public.add_team_member(p_team_id UUID, p_user_id UUID, p_role public.team_member_role)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the team owner can manage members';
  END IF;
  INSERT INTO public.team_members(team_id, user_id, role, invited_by)
  VALUES (p_team_id, p_user_id, p_role, auth.uid())
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_team_member(UUID, UUID, public.team_member_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.add_team_member(UUID, UUID, public.team_member_role) FROM anon, PUBLIC;

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.team_member_role NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  UNIQUE (team_id, email)
);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(lower(email), expires_at);
GRANT SELECT, INSERT ON public.team_invitations TO authenticated;
GRANT ALL ON public.team_invitations TO service_role;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_invitations_select ON public.team_invitations FOR SELECT TO authenticated
  USING (invited_by = auth.uid() OR lower(email) = lower((auth.jwt() ->> 'email')));
CREATE POLICY team_invitations_insert ON public.team_invitations FOR INSERT TO authenticated
  WITH CHECK (invited_by = auth.uid() AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.invite_team_member_by_email(
  p_team_id UUID, p_email TEXT, p_role public.team_member_role
)
RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teams WHERE id = p_team_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Only the team owner can invite members';
  END IF;
  INSERT INTO public.team_invitations(team_id, email, role, invited_by)
  VALUES (p_team_id, lower(trim(p_email)), p_role, auth.uid())
  ON CONFLICT (team_id, email) DO UPDATE SET role = EXCLUDED.role, expires_at = now() + interval '7 days', accepted_at = NULL
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.invite_team_member_by_email(UUID, TEXT, public.team_member_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.invite_team_member_by_email(UUID, TEXT, public.team_member_role) FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.accept_team_invitation(p_invitation_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_inv public.team_invitations%ROWTYPE; v_member_id UUID; v_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  SELECT * INTO v_inv FROM public.team_invitations
  WHERE id = p_invitation_id AND accepted_at IS NULL AND expires_at > now() AND lower(email) = lower(v_email);
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation is invalid or expired'; END IF;
  INSERT INTO public.team_members(team_id, user_id, role, invited_by)
  VALUES (v_inv.team_id, auth.uid(), v_inv.role, v_inv.invited_by)
  ON CONFLICT (team_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING id INTO v_member_id;
  UPDATE public.team_invitations SET accepted_at = now() WHERE id = p_invitation_id;
  RETURN v_member_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.accept_team_invitation(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.accept_team_invitation(UUID) FROM anon, PUBLIC;

-- Keep existing clients compatible while accepting the MD naming used by the UI.
ALTER TABLE public.microcycles
  DROP CONSTRAINT IF EXISTS microcycles_match_day_check;
ALTER TABLE public.microcycles
  ADD CONSTRAINT microcycles_match_day_check CHECK (match_day IN ('saturday', 'sunday', 'sabado', 'domingo'));
ALTER TABLE public.microcycle_slots
  DROP CONSTRAINT IF EXISTS microcycle_slots_slot_type_check;
ALTER TABLE public.microcycle_slots
  ADD CONSTRAINT microcycle_slots_slot_type_check CHECK (
    slot_type IN ('session_1', 'session_2', 'session_3', 'match', 'rest', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD')
  );

CREATE OR REPLACE FUNCTION public.create_microcycle_with_slots(
  p_name TEXT,
  p_week_start DATE,
  p_match_day TEXT,
  p_weekly_objective TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  v_microcycle_id UUID;
  v_match_day TEXT := CASE lower(p_match_day) WHEN 'sabado' THEN 'sabado' WHEN 'sábado' THEN 'sabado' ELSE 'domingo' END;
  v_match_offset INTEGER := CASE lower(p_match_day) WHEN 'sabado' THEN 5 WHEN 'sábado' THEN 5 ELSE 6 END;
  v_types TEXT[] := ARRAY['MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD'];
  v_offsets INTEGER[] := ARRAY[1, 2, 3, CASE WHEN lower(p_match_day) IN ('sabado', 'sábado') THEN 4 ELSE 5 END, v_match_offset];
BEGIN
  IF lower(p_match_day) NOT IN ('sabado', 'sábado', 'domingo') THEN
    RAISE EXCEPTION 'match_day must be sabado or domingo';
  END IF;
  INSERT INTO public.microcycles(owner_id, name, week_start, match_day, weekly_objective)
  VALUES (auth.uid(), p_name, p_week_start, v_match_day, NULLIF(p_weekly_objective, ''))
  RETURNING id INTO v_microcycle_id;

  FOR i IN 1..array_length(v_types, 1) LOOP
    INSERT INTO public.microcycle_slots(microcycle_id, slot_type, slot_date)
    VALUES (v_microcycle_id, v_types[i], p_week_start + v_offsets[i]);
  END LOOP;
  RETURN v_microcycle_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_microcycle_with_slots(TEXT, DATE, TEXT, TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_microcycle_with_slots(TEXT, DATE, TEXT, TEXT) FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.assign_microcycle_session(p_slot_id UUID, p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE v_microcycle_id UUID; v_slot_type TEXT; v_team_id UUID;
BEGIN
  SELECT ms.microcycle_id, ms.slot_type, m.team_id INTO v_microcycle_id, v_slot_type, v_team_id
  FROM public.microcycle_slots ms JOIN public.microcycles m ON m.id = ms.microcycle_id
  WHERE ms.id = p_slot_id;
  IF NOT public.can_edit_team(v_team_id) AND NOT EXISTS (
    SELECT 1 FROM public.microcycles m WHERE m.id = v_microcycle_id AND m.owner_id = auth.uid()
  ) THEN RAISE EXCEPTION 'Not allowed to edit this microcycle'; END IF;
  IF v_slot_type = 'MD' THEN RAISE EXCEPTION 'Match day cannot receive a training session'; END IF;
  IF p_session_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.sessions s WHERE s.id = p_session_id AND (s.owner_id = auth.uid() OR public.is_team_member(s.team_id))
  ) THEN RAISE EXCEPTION 'Session is not accessible'; END IF;
  UPDATE public.microcycle_slots SET session_id = NULL WHERE microcycle_id = v_microcycle_id AND session_id = p_session_id;
  UPDATE public.microcycle_slots SET session_id = p_session_id WHERE id = p_slot_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_microcycle_session(UUID, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_microcycle_session(UUID, UUID) FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.save_session_graph(
  p_session_id UUID,
  p_name TEXT,
  p_objective TEXT,
  p_intensity public.exercise_intensity,
  p_session_date DATE,
  p_duration_min INTEGER,
  p_blocks JSONB
)
RETURNS UUID
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$
DECLARE
  v_session_id UUID := p_session_id;
  v_block_id UUID;
  v_team_id UUID;
  v_owner_id UUID;
  b RECORD;
  ex_id TEXT;
BEGIN
  IF v_session_id IS NULL THEN
    INSERT INTO public.sessions(owner_id, name, objective, intensity, session_date, duration_min)
    VALUES (auth.uid(), p_name, NULLIF(p_objective, ''), p_intensity, p_session_date, p_duration_min)
    RETURNING id INTO v_session_id;
  ELSE
    SELECT owner_id, team_id INTO v_owner_id, v_team_id FROM public.sessions WHERE id = v_session_id;
    IF v_owner_id IS NULL OR (v_owner_id <> auth.uid() AND NOT public.can_edit_team(v_team_id)) THEN
      RAISE EXCEPTION 'Session not found or not editable by caller';
    END IF;
    UPDATE public.sessions SET name = p_name, objective = NULLIF(p_objective, ''), intensity = p_intensity,
      session_date = p_session_date, duration_min = p_duration_min
    WHERE id = v_session_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Session not found or not owned by caller'; END IF;
    DELETE FROM public.session_blocks WHERE session_id = v_session_id;
  END IF;

  FOR b IN SELECT * FROM jsonb_to_recordset(COALESCE(p_blocks, '[]'::jsonb)) AS x(
    block_type TEXT, name TEXT, position INTEGER, duration_min INTEGER, notes TEXT, exercise_ids JSONB
  ) LOOP
    INSERT INTO public.session_blocks(session_id, block_type, name, position, duration_min, notes)
    VALUES (v_session_id, b.block_type::public.block_type, NULLIF(b.name, ''), b.position, b.duration_min, NULLIF(b.notes, ''))
    RETURNING id INTO v_block_id;
    FOR ex_id IN SELECT value FROM jsonb_array_elements_text(COALESCE(b.exercise_ids, '[]'::jsonb)) LOOP
      INSERT INTO public.session_block_exercises(block_id, exercise_id, position)
      VALUES (v_block_id, ex_id::UUID, (SELECT count(*) FROM public.session_block_exercises WHERE block_id = v_block_id));
    END LOOP;
  END LOOP;
  RETURN v_session_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.save_session_graph(UUID, TEXT, TEXT, public.exercise_intensity, DATE, INTEGER, JSONB) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.save_session_graph(UUID, TEXT, TEXT, public.exercise_intensity, DATE, INTEGER, JSONB) FROM anon, PUBLIC;

-- Prevent ownership reassignment even when a row is edited by a team collaborator.
CREATE OR REPLACE FUNCTION public.prevent_owner_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public
AS $$ BEGIN
  IF TG_OP = 'UPDATE' AND NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'owner_id is immutable';
  END IF;
  RETURN NEW;
END; $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams','exercises','sessions','microcycles','mesocycles','season_events','session_evaluations','players'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_prevent_owner_change ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_prevent_owner_change BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.prevent_owner_change()', t);
  END LOOP;
END $$;

-- Replace owner-only policies with team-aware policies. UPDATE includes WITH CHECK and ownership is trigger-protected.
DROP POLICY IF EXISTS teams_owner_all ON public.teams;
CREATE POLICY teams_select ON public.teams FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_team_member(id));
CREATE POLICY teams_insert ON public.teams FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY teams_update ON public.teams FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY teams_delete ON public.teams FOR DELETE TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS exercises_owner_all ON public.exercises;
CREATE POLICY exercises_select ON public.exercises FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_team_member(team_id));
CREATE POLICY exercises_insert ON public.exercises FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (team_id IS NULL OR public.can_edit_team(team_id)));
CREATE POLICY exercises_update ON public.exercises FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id)) WITH CHECK (owner_id = owner_id);
CREATE POLICY exercises_delete ON public.exercises FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id));

DROP POLICY IF EXISTS sessions_owner_all ON public.sessions;
CREATE POLICY sessions_select ON public.sessions FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_team_member(team_id));
CREATE POLICY sessions_insert ON public.sessions FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (team_id IS NULL OR public.can_edit_team(team_id)));
CREATE POLICY sessions_update ON public.sessions FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id)) WITH CHECK (owner_id = owner_id);
CREATE POLICY sessions_delete ON public.sessions FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id));

DROP POLICY IF EXISTS microcycles_owner_all ON public.microcycles;
CREATE POLICY microcycles_select ON public.microcycles FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_team_member(team_id));
CREATE POLICY microcycles_insert ON public.microcycles FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (team_id IS NULL OR public.can_edit_team(team_id)));
CREATE POLICY microcycles_update ON public.microcycles FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id)) WITH CHECK (owner_id = owner_id);
CREATE POLICY microcycles_delete ON public.microcycles FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id));

DROP POLICY IF EXISTS "Owners manage their mesocycles" ON public.mesocycles;
CREATE POLICY mesocycles_select ON public.mesocycles FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_team_member(team_id));
CREATE POLICY mesocycles_insert ON public.mesocycles FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (team_id IS NULL OR public.can_edit_team(team_id)));
CREATE POLICY mesocycles_update ON public.mesocycles FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id)) WITH CHECK (owner_id = owner_id);
CREATE POLICY mesocycles_delete ON public.mesocycles FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id));

DROP POLICY IF EXISTS "Owners manage their season events" ON public.season_events;
CREATE POLICY season_events_select ON public.season_events FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_team_member(team_id));
CREATE POLICY season_events_insert ON public.season_events FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND (team_id IS NULL OR public.can_edit_team(team_id)));
CREATE POLICY season_events_update ON public.season_events FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id)) WITH CHECK (owner_id = owner_id);
CREATE POLICY season_events_delete ON public.season_events FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id));

DROP POLICY IF EXISTS players_team_owner_all ON public.players;
CREATE POLICY players_select ON public.players FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_team_member(team_id));
CREATE POLICY players_insert ON public.players FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND public.can_edit_team(team_id));
CREATE POLICY players_update ON public.players FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id)) WITH CHECK (owner_id = owner_id);
CREATE POLICY players_delete ON public.players FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_team(team_id));

DROP POLICY IF EXISTS session_blocks_owner_all ON public.session_blocks;
CREATE POLICY session_blocks_access ON public.session_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND (s.owner_id = auth.uid() OR public.is_team_member(s.team_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND (s.owner_id = auth.uid() OR public.can_edit_team(s.team_id))));

DROP POLICY IF EXISTS sbe_owner_all ON public.session_block_exercises;
CREATE POLICY sbe_access ON public.session_block_exercises FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.session_blocks b JOIN public.sessions s ON s.id = b.session_id WHERE b.id = block_id AND (s.owner_id = auth.uid() OR public.is_team_member(s.team_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.session_blocks b JOIN public.sessions s ON s.id = b.session_id WHERE b.id = block_id AND (s.owner_id = auth.uid() OR public.can_edit_team(s.team_id))));

DROP POLICY IF EXISTS microcycle_slots_owner_all ON public.microcycle_slots;
CREATE POLICY microcycle_slots_access ON public.microcycle_slots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.microcycles m WHERE m.id = microcycle_id AND (m.owner_id = auth.uid() OR public.is_team_member(m.team_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.microcycles m WHERE m.id = microcycle_id AND (m.owner_id = auth.uid() OR public.can_edit_team(m.team_id))));

DROP POLICY IF EXISTS "owner manages own evaluations" ON public.session_evaluations;
CREATE POLICY session_evaluations_access ON public.session_evaluations FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.is_team_member(s.team_id)))
  WITH CHECK (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.can_edit_team(s.team_id)));

-- Immutable audit records; the trigger is the only writer.
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id UUID,
  team_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor_created ON public.audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_team_created ON public.audit_log(team_id, created_at DESC);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_select ON public.audit_log FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR public.is_team_member(team_id));

CREATE OR REPLACE FUNCTION public.audit_row_changes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old JSONB; v_new JSONB; v_record UUID; v_team UUID;
BEGIN
  v_old := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END;
  v_new := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  v_record := COALESCE((v_new->>'id')::UUID, (v_old->>'id')::UUID);
  v_team := COALESCE((v_new->>'team_id')::UUID, (v_old->>'team_id')::UUID);
  INSERT INTO public.audit_log(actor_id, action, table_name, record_id, team_id, old_data, new_data)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_record, v_team, v_old, v_new);
  RETURN COALESCE(NEW, OLD);
END; $$;
REVOKE EXECUTE ON FUNCTION public.audit_row_changes() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams','team_members','team_invitations','players','exercises','sessions','session_blocks','session_block_exercises','microcycles','microcycle_slots','mesocycles','season_events','session_evaluations'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_row_changes ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_audit_row_changes AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes()', t);
  END LOOP;
END $$;
