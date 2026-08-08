import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Chainable Supabase query mock
export function createSupabaseMock(handlers: Record<string, any> = {}) {
  const make = (table: string) => {
    const state: any = { table, _filters: [] };
    const result = handlers[table] ?? { data: [], error: null };
    const single = handlers[`${table}.single`];
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(async () => result),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      upsert: vi.fn(async () => result),
      eq: vi.fn(() => builder),
      neq: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      lt: vi.fn(() => builder),
      in: vi.fn(() => builder),
      is: vi.fn(() => builder),
      not: vi.fn(() => builder),
      range: vi.fn(() => builder),
      or: vi.fn(() => builder),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      single: vi.fn(async () => single ?? { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: null }),
      maybeSingle: vi.fn(async () => single ?? { data: Array.isArray(result.data) ? result.data[0] ?? null : result.data, error: null }),
      then: (onFulfilled: any) => Promise.resolve(result).then(onFulfilled),
    };
    return builder;
  };
  return {
    from: vi.fn((table: string) => make(table)),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
      getUser: vi.fn(async () => ({ data: { user: null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  };
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: createSupabaseMock(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "test-user-id", email: "t@t.com" }, loading: false }),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");
  const makeRoute = () => (opts: any) => {
    const route: any = {
      ...opts,
      useParams: () => ({ id: "test-id" }),
      useLoaderData: () => ({}),
      useRouteContext: () => ({}),
      useSearch: () => ({}),
    };
    return route;
  };
  return {
    createFileRoute: () => makeRoute(),
    createRootRoute: () => makeRoute(),
    createRootRouteWithContext: () => makeRoute(),
    Link: ({ children, to, params, ...p }: any) => React.createElement("a", { href: to, ...p }, children),
    Outlet: () => null,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: "test-id" }),
    useRouter: () => ({ invalidate: vi.fn(), navigate: vi.fn() }),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
