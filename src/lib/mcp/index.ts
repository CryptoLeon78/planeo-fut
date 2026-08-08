import { auth, defineMcp } from "@lovable.dev/mcp-js";
import createExercise from "./tools/create-exercise";
import createMicrocycle from "./tools/create-microcycle";
import createSession from "./tools/create-session";
import deleteRecord from "./tools/delete-record";
import duplicateRecord from "./tools/duplicate-record";
import listExercises from "./tools/list-exercises";
import listMicrocycles from "./tools/list-microcycles";
import listSessions from "./tools/list-sessions";
import listVersions from "./tools/list-versions";
import restoreDeletedRecord from "./tools/restore-deleted-record";
import restoreVersion from "./tools/restore-version";
import updateExercise from "./tools/update-exercise";
import updateMicrocycle from "./tools/update-microcycle";
import updateSession from "./tools/update-session";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "planeofut",
  title: "PlaneoFUT",
  version: "0.3.0",
  instructions: "Manage the signed-in coach's private PlaneoFUT exercise library, training sessions and weekly football microcycles. Every write stores a version snapshot, so prefer update_*, delete_record (soft delete, recoverable with restore_deleted_record) and restore_version over recreating records. Ask before calling creation, update, duplication or restore tools.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listExercises,
    createExercise,
    updateExercise,
    listSessions,
    createSession,
    updateSession,
    listMicrocycles,
    createMicrocycle,
    updateMicrocycle,
    duplicateRecord,
    deleteRecord,
    restoreDeletedRecord,
    listVersions,
    restoreVersion,
  ],
});
