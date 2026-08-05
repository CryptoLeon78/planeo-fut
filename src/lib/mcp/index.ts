import { auth, defineMcp } from "@lovable.dev/mcp-js";
import createExercise from "./tools/create-exercise";
import createMicrocycle from "./tools/create-microcycle";
import createSession from "./tools/create-session";
import listExercises from "./tools/list-exercises";
import listMicrocycles from "./tools/list-microcycles";
import listSessions from "./tools/list-sessions";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "planeofut",
  title: "PlaneoFUT",
  version: "0.1.0",
  instructions: "Manage the signed-in coach's private PlaneoFUT exercise library, training sessions and weekly football microcycles. Preserve coaching terminology, respect the user's existing records and ask before calling creation tools.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listExercises, createExercise, listSessions, createSession, listMicrocycles, createMicrocycle],
});