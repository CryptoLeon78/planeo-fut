import { supabase } from '@/integrations/supabase/client';

export async function getDashboardStats() {
  const [exercises, sessions, teams] = await Promise.all([
    supabase.from('exercises').select('id', { count: 'exact', head: true }),
    supabase.from('sessions').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
  ]);
  return { exercises: exercises.count ?? 0, sessions: sessions.count ?? 0, teams: teams.count ?? 0 };
}

export async function listRecentSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id,name,objective,session_date,created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
}
