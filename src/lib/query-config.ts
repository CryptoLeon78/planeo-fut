import { QueryClient, QueryClientConfig } from "@tanstack/react-query";

/**
 * Standardized caching policies:
 * - default: 3 minutes stale, 15 minutes GC
 * - static catalogs (exercises/categories): 10 minutes stale, 30 minutes GC
 * - real-time/frequent: 30 seconds stale
 */
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      retry: (failureCount, error: any) => {
        // Do not retry 401/403/404 errors
        const status = error?.status ?? error?.code;
        if (status === 401 || status === 403 || status === 404 || status === "PGRST116") {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
};

export function createConfiguredQueryClient(): QueryClient {
  return new QueryClient(queryClientConfig);
}

/**
 * Query Key Factory for type-safe and consistent caching keys
 */
export const queryKeys = {
  teams: (userId?: string) => ["teams", userId] as const,
  players: (teamId?: string) => ["players", teamId] as const,
  exercises: (userId?: string) => ["exercises", userId] as const,
  exercise: (id: string) => ["exercise", id] as const,
  sessions: (userId?: string) => ["sessions", userId] as const,
  session: (id: string) => ["session", id] as const,
  microcycles: (userId?: string) => ["microcycles", userId] as const,
  microcycle: (id: string) => ["microcycle", id] as const,
  microcycleSlots: (id: string) => ["microcycle-slots", id] as const,
  mesocycles: (userId?: string) => ["mesocycles", userId] as const,
  mesocycle: (id: string) => ["mesocycle", id] as const,
  seasonEvents: (mesoId?: string, start?: string, end?: string) => ["season-events", mesoId, start, end] as const,
  calendarSessions: (userId?: string, weekStart?: string) => ["calendar-sessions", userId, weekStart] as const,
  calendarEvents: (userId?: string, weekStart?: string) => ["calendar-events", userId, weekStart] as const,
  calendarSlots: (userId?: string, weekStart?: string) => ["calendar-slots", userId, weekStart] as const,
};

/**
 * Client-side and repository pagination helper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function paginateArray<T>(items: T[], page = 1, pageSize = 20): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const total = items.length;
  const totalPages = Math.ceil(total / safePageSize) || 1;
  const start = (safePage - 1) * safePageSize;
  const data = items.slice(start, start + safePageSize);

  return {
    data,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
