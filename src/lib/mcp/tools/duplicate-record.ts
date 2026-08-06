import { z } from "zod";
import { defineAuthedTool, toolError, toolSuccess } from "../runtime";
import { supabaseForUser } from "../supabase";
import { entityEnum, isoDate, shortText, uuid } from "../schemas";
import { ENTITY_TABLE, fetchOwnedRow, snapshotEntity, stripProtectedFields } from "../versions";
import { addDays } from "./create-microcycle";

export default defineAuthedTool({
  name: "duplicate_record",
  title: "Duplicate exercise, session or microcycle",
  description: "Clone a practice, session or weekly microcycle owned by the coach, optionally renaming it or shifting its dates.",
  inputSchema: {
    entity: entityEnum.describe("What to duplicate: exercise, session or microcycle."),
    recordId: uuid.describe("Identifier of the record to duplicate."),
    newName: shortText(120).optional().describe("Name for the copy; defaults to the original plus a copy suffix."),
    shiftDays: z.number().int().min(-365).max(365).optional().describe("Shift every date in the copy by this number of days."),
    newDate: isoDate.optional().describe("Explicit date for the copy (sessions and microcycles)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx, userId) => {
    const supabase = supabaseForUser(ctx);
    const original = await fetchOwnedRow(supabase, input.entity, input.recordId, userId);
    if (!original) return toolError("not_found", "No record with that identifier belongs to you.");

    const copy = stripProtectedFields(original);
    copy.owner_id = userId;
    copy.name = input.newName ?? `${String(original.name ?? "Copia")} (copia)`;

    if (input.entity === "session") {
      const base = input.newDate ?? (original.session_date as string | null);
      copy.session_date = base && input.shiftDays ? addDays(base, input.shiftDays) : base;
    }
    if (input.entity === "microcycle") {
      const base = input.newDate ?? (original.week_start as string);
      copy.week_start = input.shiftDays ? addDays(base, input.shiftDays) : base;
    }

    const { data: created, error } = await supabase
      .from(ENTITY_TABLE[input.entity])
      .insert(copy as never)
      .select("*")
      .single();
    if (error) return toolError("backend_error", error.message);

    let slots: unknown = null;
    if (input.entity === "microcycle") {
      const { data: originalSlots } = await supabase
        .from("microcycle_slots")
        .select("slot_type,slot_date,notes,session_id")
        .eq("microcycle_id", input.recordId);
      const createdRow = created as unknown as Record<string, unknown>;
      const offset =
        new Date(`${createdRow.week_start as string}T12:00:00Z`).getTime() -
        new Date(`${original.week_start as string}T12:00:00Z`).getTime();
      const days = Math.round(offset / 86_400_000);
      if (originalSlots?.length) {
        const { data: insertedSlots, error: slotsError } = await supabase
          .from("microcycle_slots")
          .insert(originalSlots.map((slot) => ({
            microcycle_id: created.id,
            slot_type: slot.slot_type,
            slot_date: slot.slot_date ? addDays(slot.slot_date, days) : null,
            notes: slot.notes,
          })))
          .select("id,slot_type,slot_date");
        if (slotsError) return toolError("backend_error", slotsError.message);
        slots = insertedSlots;
      }
    }

    const version = await snapshotEntity(supabase, {
      ownerId: userId,
      entity: input.entity,
      entityId: created.id,
      row: created as unknown as Record<string, unknown>,
      label: `duplicated-from:${input.recordId}`,
    });

    return toolSuccess(`Duplicated ${input.entity} as “${String((created as unknown as Record<string, unknown>).name)}”.`, {
      record: created,
      slots,
      version,
      sourceId: input.recordId,
    });
  },
});
