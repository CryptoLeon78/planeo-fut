import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Data-access layer entry point.
 *
 * Repositories under `src/api/` are the ONLY place allowed to talk to the
 * database from browser code. Components and routes must go through
 * `src/services/` (business logic) or import repositories directly for plain
 * reads — never build Supabase queries inline in JSX files.
 */
export type Db = Database;

/** Loosely typed table accessor: the generated types are strict about inserts. */
export function table(name: string) {
  return supabase.from(name as never) as any;
}

export { supabase as db };

export class RepositoryError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "RepositoryError";
  }
}

/** Unwraps a Supabase `{ data, error }` result or throws a RepositoryError. */
export function unwrap<T = any>(result: { data: any; error: { message: string } | null }): T {
  if (result.error) throw new RepositoryError(result.error.message, result.error);
  return result.data as T;
}
