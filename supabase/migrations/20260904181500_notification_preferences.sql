CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_reminders BOOLEAN NOT NULL DEFAULT true,
  injury_alerts BOOLEAN NOT NULL DEFAULT true,
  team_updates BOOLEAN NOT NULL DEFAULT true,
  reminder_minutes INTEGER NOT NULL DEFAULT 60 CHECK (reminder_minutes BETWEEN 5 AND 10080),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
CREATE POLICY notification_preferences_own ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE OR REPLACE FUNCTION public.touch_notification_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER trg_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW EXECUTE FUNCTION public.touch_notification_preferences_updated_at();
