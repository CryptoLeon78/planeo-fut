import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BACKUP_ENTITIES, sanitiseImportRow, type BackupEntity, type BackupPayload } from "@/lib/backup";

const ExportInput = z.object({
  entities: z.array(z.enum(BACKUP_ENTITIES)).min(1),
  format: z.enum(["json", "csv"]).default("json"),
});

const ImportInput = z.object({
  payload: z.object({
    version: z.number().optional(),
    generated_at: z.string().optional(),
    entities: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
  }),
});

type Rows = Record<string, unknown>[];

async function logOperation(
  supabase: any,
  ownerId: string,
  entry: {
    operation: "export" | "import";
    format: "json" | "csv";
    entities: string[];
    record_count: number;
    byte_size?: number;
    status?: string;
    error_message?: string | null;
  },
) {
  await supabase.from("data_exports").insert({
    owner_id: ownerId,
    operation: entry.operation,
    format: entry.format,
    entities: entry.entities,
    record_count: entry.record_count,
    byte_size: entry.byte_size ?? 0,
    status: entry.status ?? "success",
    error_message: entry.error_message ?? null,
  });
}

export const exportUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const wanted = data.entities as BackupEntity[];
    const entities: BackupPayload["entities"] = {};
    let total = 0;

    const fetchRows = async (table: string): Promise<Rows> => {
      const { data: rows, error } = await supabase.from(table).select("*").eq("owner_id", userId);
      if (error) throw new Error(error.message);
      return (rows ?? []) as Rows;
    };

    for (const entity of wanted) {
      const rows = await fetchRows(entity);

      if (entity === "sessions" && rows.length > 0) {
        const ids = rows.map((r) => r.id as string);
        const { data: blocks } = await supabase.from("session_blocks").select("*").in("session_id", ids);
        const blockList = (blocks ?? []) as Rows;
        const blockIds = blockList.map((b) => b.id as string);
        const { data: blockEx } = blockIds.length
          ? await supabase.from("session_block_exercises").select("*").in("block_id", blockIds)
          : { data: [] };
        const exList = (blockEx ?? []) as Rows;
        for (const row of rows) {
          row.blocks = blockList
            .filter((b) => b.session_id === row.id)
            .map((b) => ({ ...b, exercises: exList.filter((e) => e.block_id === b.id) }));
        }
      }

      if (entity === "microcycles" && rows.length > 0) {
        const ids = rows.map((r) => r.id as string);
        const { data: slots } = await supabase.from("microcycle_slots").select("*").in("microcycle_id", ids);
        const slotList = (slots ?? []) as Rows;
        for (const row of rows) row.slots = slotList.filter((s) => s.microcycle_id === row.id);
      }

      entities[entity] = rows;
      total += rows.length;
    }

    const payload: BackupPayload = { version: 1, generated_at: new Date().toISOString(), entities };
    const byteSize = JSON.stringify(payload).length;

    await logOperation(supabase, userId, {
      operation: "export",
      format: data.format,
      entities: wanted,
      record_count: total,
      byte_size: byteSize,
    });

    return { payload, recordCount: total };
  });

export const importUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ImportInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const source = data.payload.entities as Record<string, Rows>;
    const imported: Record<string, number> = {};
    const exerciseIdMap = new Map<string, string>();
    const sessionIdMap = new Map<string, string>();
    const mesocycleIdMap = new Map<string, string>();

    const insertRows = async (table: string, rows: Rows, map?: Map<string, string>) => {
      let count = 0;
      for (const row of rows) {
        const oldId = row.id as string | undefined;
        const clean = sanitiseImportRow(row);
        delete clean.blocks;
        delete clean.slots;
        const { data: inserted, error } = await supabase
          .from(table)
          .insert({ ...clean, owner_id: userId })
          .select("id")
          .single();
        if (error) throw new Error(`${table}: ${error.message}`);
        if (map && oldId) map.set(oldId, inserted.id as string);
        count += 1;
      }
      return count;
    };

    try {
      if (source.exercises?.length) {
        imported.exercises = await insertRows("exercises", source.exercises, exerciseIdMap);
      }
      if (source.mesocycles?.length) {
        imported.mesocycles = await insertRows("mesocycles", source.mesocycles, mesocycleIdMap);
      }
      if (source.season_events?.length) {
        imported.season_events = await insertRows("season_events", source.season_events);
      }

      if (source.sessions?.length) {
        let count = 0;
        for (const session of source.sessions) {
          const oldId = session.id as string | undefined;
          const blocks = (session.blocks as Rows | undefined) ?? [];
          const clean = sanitiseImportRow(session);
          delete clean.blocks;
          const { data: newSession, error } = await supabase
            .from("sessions")
            .insert({ ...clean, owner_id: userId })
            .select("id")
            .single();
          if (error) throw new Error(`sessions: ${error.message}`);
          if (oldId) sessionIdMap.set(oldId, newSession.id as string);

          for (const block of blocks) {
            const blockExercises = (block.exercises as Rows | undefined) ?? [];
            const cleanBlock = sanitiseImportRow(block);
            delete cleanBlock.exercises;
            delete cleanBlock.session_id;
            const { data: newBlock, error: blockError } = await supabase
              .from("session_blocks")
              .insert({ ...cleanBlock, session_id: newSession.id })
              .select("id")
              .single();
            if (blockError) throw new Error(`session_blocks: ${blockError.message}`);

            const links = blockExercises
              .map((link) => {
                const mapped = exerciseIdMap.get(link.exercise_id as string);
                if (!mapped) return null;
                const cleanLink = sanitiseImportRow(link);
                delete cleanLink.block_id;
                return { ...cleanLink, block_id: newBlock.id, exercise_id: mapped };
              })
              .filter(Boolean);
            if (links.length) {
              const { error: linkError } = await supabase.from("session_block_exercises").insert(links);
              if (linkError) throw new Error(`session_block_exercises: ${linkError.message}`);
            }
          }
          count += 1;
        }
        imported.sessions = count;
      }

      if (source.microcycles?.length) {
        let count = 0;
        for (const micro of source.microcycles) {
          const slots = (micro.slots as Rows | undefined) ?? [];
          const clean = sanitiseImportRow(micro);
          delete clean.slots;
          if (clean.mesocycle_id) {
            clean.mesocycle_id = mesocycleIdMap.get(clean.mesocycle_id as string) ?? null;
          }
          const { data: newMicro, error } = await supabase
            .from("microcycles")
            .insert({ ...clean, owner_id: userId })
            .select("id")
            .single();
          if (error) throw new Error(`microcycles: ${error.message}`);

          const slotRows = slots.map((slot) => {
            const cleanSlot = sanitiseImportRow(slot);
            delete cleanSlot.microcycle_id;
            return {
              ...cleanSlot,
              microcycle_id: newMicro.id,
              session_id: slot.session_id ? (sessionIdMap.get(slot.session_id as string) ?? null) : null,
            };
          });
          if (slotRows.length) {
            const { error: slotError } = await supabase.from("microcycle_slots").insert(slotRows);
            if (slotError) throw new Error(`microcycle_slots: ${slotError.message}`);
          }
          count += 1;
        }
        imported.microcycles = count;
      }
    } catch (error) {
      await logOperation(supabase, userId, {
        operation: "import",
        format: "json",
        entities: Object.keys(source),
        record_count: Object.values(imported).reduce((a, b) => a + b, 0),
        status: "error",
        error_message: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }

    const total = Object.values(imported).reduce((a, b) => a + b, 0);
    await logOperation(supabase, userId, {
      operation: "import",
      format: "json",
      entities: Object.keys(imported),
      record_count: total,
    });

    return { imported, total };
  });

export const listDataExports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const { data, error } = await supabase
      .from("data_exports")
      .select("id,operation,format,entities,record_count,byte_size,status,error_message,created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw new Error(error.message);
    return (data ?? []) as Record<string, unknown>[];
  });
