import { exercisesRepository } from "@/api/exercises.repository";
import { sessionsRepository } from "@/api/sessions.repository";
import { microcyclesRepository } from "@/api/microcycles.repository";
import { teamsRepository } from "@/api/session-evaluations.repository";

export type DashboardStats = {
  exercises: number;
  sessions: number;
  teams: number;
  microcycles: number;
};

export const dashboardService = {
  async stats(): Promise<DashboardStats> {
    const [exercises, sessions, teams, microcycles] = await Promise.all([
      exercisesRepository.count(),
      sessionsRepository.count(),
      teamsRepository.count(),
      microcyclesRepository.count(),
    ]);
    return { exercises, sessions, teams, microcycles };
  },
  recentSessions: (limit = 5) => sessionsRepository.listRecent(limit),
};
