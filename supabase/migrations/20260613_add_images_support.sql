-- Add image_url column to exercises table
ALTER TABLE public.exercises ADD COLUMN image_url TEXT;

-- Add logo_url and shield_url columns to teams table
ALTER TABLE public.teams ADD COLUMN logo_url TEXT;
ALTER TABLE public.teams ADD COLUMN shield_url TEXT;

-- Create a new players table for team members
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number INTEGER,
  position TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_team ON public.players(team_id);
CREATE INDEX idx_players_owner ON public.players(owner_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_team_owner_all" ON public.players FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER trg_players_updated_at BEFORE UPDATE ON public.players FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for images if not exists
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-images', 'exercise-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('team-images', 'team-images', true) ON CONFLICT DO NOTHING;

-- Set up storage policies for exercise images
CREATE POLICY "exercise-images-select" ON storage.objects FOR SELECT USING (bucket_id = 'exercise-images');
CREATE POLICY "exercise-images-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');
CREATE POLICY "exercise-images-update" ON storage.objects FOR UPDATE USING (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');
CREATE POLICY "exercise-images-delete" ON storage.objects FOR DELETE USING (bucket_id = 'exercise-images' AND auth.role() = 'authenticated');

-- Set up storage policies for team images
CREATE POLICY "team-images-select" ON storage.objects FOR SELECT USING (bucket_id = 'team-images');
CREATE POLICY "team-images-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-images' AND auth.role() = 'authenticated');
CREATE POLICY "team-images-update" ON storage.objects FOR UPDATE USING (bucket_id = 'team-images' AND auth.role() = 'authenticated');
CREATE POLICY "team-images-delete" ON storage.objects FOR DELETE USING (bucket_id = 'team-images' AND auth.role() = 'authenticated');
