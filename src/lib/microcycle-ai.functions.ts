import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import OpenAI from "openai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  weekStart: z.string().min(8).max(10),
  matchDay: z.enum(["sabado", "domingo"]),
  mesocycleId: z.string().uuid().nullable().optional(),
  context: z.string().max(2000).nullable().optional(),
});

const SuggestionSchema = z.object({
  weekly_objective: z.string(),
  slots: z.array(z.object({
    slot_type: z.enum(["MD-4", "MD-3", "MD-2", "MD-1", "MD"]),
    focus: z.string(),
    intensity: z.string(),
    recommended_exercise_ids: z.array(z.string()),
    notes: z.string(),
  })).length(5),
});

export type MicrocycleSuggestion = z.infer<typeof SuggestionSchema>;

export const suggestMicrocycle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("Missing OPENAI_API_KEY");

    const { supabase } = context;
    const { weekStart, matchDay, mesocycleId, context: extra } = data;

    let mesocycle: any = null;
    if (mesocycleId) {
      const { data: m } = await supabase.from("mesocycles").select("name,type,goals,phases").eq("id", mesocycleId).maybeSingle();
      mesocycle = m;
    } else {
      const { data: m } = await supabase.from("mesocycles").select("name,type,goals,phases")
        .lte("start_date", weekStart).gte("end_date", weekStart).limit(1);
      mesocycle = m?.[0] ?? null;
    }

    const { data: exercises } = await supabase
      .from("exercises")
      .select("id,name,objective,game_phase,intensity,task_type,duration_min")
      .order("created_at", { ascending: false })
      .limit(60);

    const catalog = (exercises ?? []).map((e: any) =>
      `- ${e.id} | ${e.name} | obj: ${e.objective ?? "-"} | fase: ${e.game_phase ?? "-"} | int: ${e.intensity ?? "-"} | tipo: ${e.task_type ?? "-"} | ${e.duration_min ?? "-"}min`
    ).join("\n");

    const system = `Eres un asistente experto en planificación de microciclos de fútbol (modelo MD-4, MD-3, MD-2, MD-1, MD).
Reglas de carga:
- MD-4: baja, recuperación/activación.
- MD-3: alta, fuerza y duelos.
- MD-2: media, táctico colectivo y resistencia.
- MD-1: baja, activación pre-partido y ABP.
- MD: día de partido (recommended_exercise_ids vacío).
Selecciona ejercicios SOLO del catálogo usando sus IDs exactos. 2-4 ejercicios por slot (excepto MD).`;

    const prompt = `Diseña un microciclo para la semana del ${weekStart} con partido en ${matchDay}.
${mesocycle ? `Mesociclo: ${mesocycle.name} (${mesocycle.type}). Objetivos: ${mesocycle.goals ?? "-"}.` : "Sin mesociclo asociado."}
${extra ? `Contexto extra: ${extra}` : ""}

Catálogo de ejercicios disponibles:
${catalog || "(catálogo vacío)"}`;

    const client = new OpenAI({ apiKey: key });
    const response = await client.responses.create({
      model: process.env.OPENAI_PLANNING_MODEL || "gpt-5-mini",
      instructions: system,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "microcycle_suggestion",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["weekly_objective", "slots"],
            properties: {
              weekly_objective: { type: "string" },
              slots: {
                type: "array",
                minItems: 5,
                maxItems: 5,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["slot_type", "focus", "intensity", "recommended_exercise_ids", "notes"],
                  properties: {
                    slot_type: { type: "string", enum: ["MD-4", "MD-3", "MD-2", "MD-1", "MD"] },
                    focus: { type: "string" },
                    intensity: { type: "string" },
                    recommended_exercise_ids: { type: "array", items: { type: "string" } },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!response.output_text) throw new Error("OpenAI returned an empty planning response");
    return SuggestionSchema.parse(JSON.parse(response.output_text)) as MicrocycleSuggestion;
  });
