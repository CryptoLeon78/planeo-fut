import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TEAM_TABLES = ['teams', 'players', 'sessions', 'microcycles', 'season_events', 'team_members'] as const;

export function useTeamRealtime(teamId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase.channel(`team-updates:${teamId}`);
    TEAM_TABLES.forEach((table) => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `team_id=eq.${teamId}` }, () => {
        queryClient.invalidateQueries({ queryKey: [table] });
        queryClient.invalidateQueries({ queryKey: ['calendar-sessions'] });
        queryClient.invalidateQueries({ queryKey: ['calendar-slots'] });
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      });
    });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient, teamId]);
}
