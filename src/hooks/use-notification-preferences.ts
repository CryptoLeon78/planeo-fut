import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Preferences = { session_reminders: boolean; injury_alerts: boolean; team_updates: boolean; reminder_minutes: number };
const defaults: Preferences = { session_reminders: true, injury_alerts: true, team_updates: true, reminder_minutes: 60 };

export function useNotificationPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const { data } = await (supabase as any).from('notification_preferences').select('session_reminders,injury_alerts,team_updates,reminder_minutes').eq('user_id', userId).maybeSingle();
      if (!cancelled && data) setPreferences({ ...defaults, ...data });
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported' as const;
    const next = await Notification.requestPermission();
    setPermission(next);
    return next;
  }, []);

  const save = useCallback(async (patch: Partial<Preferences>) => {
    if (!userId) return;
    const next = { ...preferences, ...patch };
    setPreferences(next);
    await (supabase as any).from('notification_preferences').upsert({ user_id: userId, ...next });
  }, [preferences, userId]);

  return { preferences, permission, requestPermission, save };
}
