import { table, unwrap } from "./client";

export type SessionEvaluationRow = Record<string, any>;

export const sessionEvaluationsRepository = {
  async getBySession(sessionId: string): Promise<SessionEvaluationRow | null> {
    return unwrap(await table("session_evaluations").select("*").eq("session_id", sessionId).maybeSingle());
  },

  async save(payload: SessionEvaluationRow): Promise<void> {
    unwrap(await table("session_evaluations").upsert(payload, { onConflict: "session_id" }));
  },

  async removeBySession(sessionId: string): Promise<void> {
    unwrap(await table("session_evaluations").delete().eq("session_id", sessionId));
  },
};

export const teamsRepository = {
  async count(): Promise<number> {
    const res = await table("teams").select("id", { count: "exact", head: true });
    return res.count ?? 0;
  },
};
