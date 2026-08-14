/** Centralised React Query keys so invalidations stay consistent app-wide. */
export const queryKeys = {
  exercises: (userId?: string) => ["exercises", userId] as const,
  exercise: (id: string) => ["exercise", id] as const,
  sessions: (userId?: string) => ["sessions", userId] as const,
  session: (id: string) => ["session", id] as const,
  microcycles: (userId?: string) => ["microcycles", userId] as const,
  microcycle: (id: string) => ["microcycle", id] as const,
  mesocycles: (type: string, userId?: string) => ["mesocycles", type, userId] as const,
  dashboardStats: (userId?: string) => ["dashboard-stats", userId] as const,
  recentSessions: (userId?: string) => ["recent-sessions", userId] as const,
  sessionEvaluation: (sessionId: string) => ["session-evaluation", sessionId] as const,
};
